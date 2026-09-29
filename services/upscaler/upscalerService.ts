import {
  MediaMetadata,
  JobProgress,
  ProcessingJob,
  UpscalerProvider,
} from './types.js';
import { probeVideo, upscaleVideoWithFFmpeg } from './ffmpegEngine.js';
import { probeImage, upscaleImageWithSharp } from './sharpEngine.js';
import { providerManager } from '../ai/ProviderManager.js';
import fs from 'fs';
import path from 'path';

export class LocalNeuralUpscalerProvider implements UpscalerProvider {
  name = 'ANO Neural Super-Resolution Engine v5.5';

  async analyzeMedia(filePath: string, mediaType: 'image' | 'video'): Promise<MediaMetadata> {
    if (mediaType === 'video') {
      return await probeVideo(filePath);
    } else {
      return await probeImage(filePath);
    }
  }

  async processImage(
    sourcePath: string,
    outputPath: string,
    metadata: MediaMetadata,
    onProgress?: (progress: JobProgress) => void
  ): Promise<{ outputPath: string; width: number; height: number; fileSize: number }> {
    return await upscaleImageWithSharp(sourcePath, outputPath, metadata, onProgress);
  }

  async processVideo(
    sourcePath: string,
    outputPath: string,
    metadata: MediaMetadata,
    onProgress?: (progress: JobProgress) => void
  ): Promise<{ outputPath: string; width: number; height: number; fileSize: number; duration: number }> {
    return await upscaleVideoWithFFmpeg(sourcePath, outputPath, metadata, onProgress);
  }
}

export class UpscalerService {
  private activeProvider: UpscalerProvider;
  private jobs = new Map<string, ProcessingJob>();
  private progressListeners = new Map<string, (job: ProcessingJob) => void>();

  constructor(provider?: UpscalerProvider) {
    this.activeProvider = provider || new LocalNeuralUpscalerProvider();
  }

  getProviderName(): string {
    return this.activeProvider.name;
  }

  async analyzeMedia(filePath: string, mediaType: 'image' | 'video'): Promise<MediaMetadata> {
    return await this.activeProvider.analyzeMedia(filePath, mediaType);
  }

  registerJob(job: ProcessingJob) {
    this.jobs.set(job.id, job);
  }

  getJobStatus(jobId: string): ProcessingJob | undefined {
    return this.jobs.get(jobId);
  }

  updateJob(jobId: string, updates: Partial<ProcessingJob>) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    Object.assign(job, updates);
    const listener = this.progressListeners.get(jobId);
    if (listener) {
      listener(job);
    }
  }

  onJobUpdate(jobId: string, callback: (job: ProcessingJob) => void) {
    this.progressListeners.set(jobId, callback);
  }

  removeJobListener(jobId: string) {
    this.progressListeners.delete(jobId);
  }

  async executeJob(jobId: string, outputDir: string): Promise<ProcessingJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found.`);
    }

    const startTime = Date.now();

    try {
      this.updateJob(jobId, {
        status: 'analyzing',
        realStage: 'ANALYZING',
        progress: 10,
        stage: 'Analyzing Media Matrix',
        stageDescription: `Inspecting ${job.mediaType} geometry, frame dynamics, and color space...`,
      });

      const ext = path.extname(job.sourceFilePath) || (job.mediaType === 'video' ? '.mp4' : '.png');
      const outputPath = path.join(outputDir, `${jobId}_output${ext}`);

      if (job.mediaType === 'image') {
        this.updateJob(jobId, {
          status: 'analyzing',
          realStage: 'ANALYZING',
          progress: 15,
          stage: 'Analyzing Image Matrix',
          stageDescription: 'Evaluating frequency spectrum, sub-pixel edges, and noise profiles...',
        });

        const result = await providerManager.processImageWithAno31V2(
          job.sourceFilePath,
          outputPath,
          job.sourceMeta,
          (prog) => {
            let status: ProcessingJob['status'] = 'processing';
            if (prog.stage === 'ANALYZING') status = 'analyzing';
            else if (prog.stage === 'ENCODING') status = 'encoding';
            else if (prog.stage === 'VALIDATING') status = 'validating';
            else if (prog.stage === 'COMPLETED') status = 'completed';

            this.updateJob(jobId, {
              status,
              realStage: prog.stage,
              progress: prog.progress ?? (prog.stage === 'COMPLETED' ? 100 : 65),
              stage: prog.stageLabel,
              stageDescription: prog.stageDescription,
            });
          }
        );

        this.updateJob(jobId, {
          outputFilePath: result.outputPath,
          status: 'completed',
          realStage: 'COMPLETED',
          progress: 100,
          stage: '4K Ultra HD Ready',
          stageDescription: 'ANO 3.1 V2 image enhancement successfully verified at 4K resolution.',
          outputStats: {
            fileSize: result.fileSize,
            width: result.width,
            height: result.height,
            format: job.sourceMeta.format,
            processingTimeMs: Date.now() - startTime,
          },
        });
      } else {
        // Video processing with ANO 5.5 Flash
        this.updateJob(jobId, {
          status: 'analyzing',
          realStage: 'ANALYZING',
          progress: 15,
          stage: 'Analyzing Video Matrix',
          stageDescription: 'ANO 5.5 Flash inspecting frame structure, motion vectors, and audio stream...',
        });

        const result = await providerManager.processVideoWithAno55Flash(
          job.sourceFilePath,
          outputPath,
          job.sourceMeta,
          (prog) => {
            let status: ProcessingJob['status'] = 'processing';
            if (prog.stage === 'ANALYZING') status = 'analyzing';
            else if (prog.stage === 'ENCODING') status = 'encoding';
            else if (prog.stage === 'VALIDATING') status = 'validating';
            else if (prog.stage === 'COMPLETED') status = 'completed';

            this.updateJob(jobId, {
              status,
              realStage: prog.stage,
              progress: prog.progress ?? (prog.stage === 'COMPLETED' ? 100 : 70),
              stage: prog.stageLabel,
              stageDescription: prog.stageDescription,
            });
          }
        );

        this.updateJob(jobId, {
          outputFilePath: result.outputPath,
          status: 'completed',
          realStage: 'COMPLETED',
          progress: 100,
          stage: '4K Ultra HD Ready',
          stageDescription: 'ANO 5.5 Flash video enhancement successfully verified at 4K resolution.',
          outputStats: {
            fileSize: result.fileSize,
            width: result.width,
            height: result.height,
            format: job.sourceMeta.format,
            duration: result.duration,
            fps: job.sourceMeta.fps,
            processingTimeMs: Date.now() - startTime,
          },
        });
      }

      return this.jobs.get(jobId)!;
    } catch (err: any) {
      console.error(`Job ${jobId} failed:`, err);
      this.updateJob(jobId, {
        status: 'failed',
        realStage: 'FAILED',
        error: err.message || 'ANO 4K could not complete the enhancement. Your original file has not been modified.',
        stage: 'Processing Failed',
        stageDescription: err.message || 'The pipeline encountered an error during super-resolution.',
      });
      throw err;
    }
  }

  downloadResult(jobId: string): { filePath: string; originalFilename: string } | null {
    const job = this.jobs.get(jobId);
    if (!job || !job.outputFilePath || !fs.existsSync(job.outputFilePath)) {
      return null;
    }
    const ext = path.extname(job.outputFilePath);
    const downloadName = `ANO_4K_${path.parse(job.originalFilename).name}${ext}`;
    return {
      filePath: job.outputFilePath,
      originalFilename: downloadName,
    };
  }

  cleanupJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (job) {
      try {
        if (job.sourceFilePath && fs.existsSync(job.sourceFilePath)) {
          fs.unlinkSync(job.sourceFilePath);
        }
        if (job.outputFilePath && fs.existsSync(job.outputFilePath)) {
          fs.unlinkSync(job.outputFilePath);
        }
      } catch (e) {
        console.warn('Error cleaning up files for job', jobId, e);
      }
      this.jobs.delete(jobId);
      this.progressListeners.delete(jobId);
    }
  }
}

export const upscalerService = new UpscalerService();

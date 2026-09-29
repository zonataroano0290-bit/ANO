import { AnoModelId, RealProcessingStage } from '../ai/types.js';

export interface MediaMetadata {
  mediaType: 'image' | 'video';
  format: string;
  width: number;
  height: number;
  aspectRatio: string;
  aspectRatioValue: number;
  duration?: number; // In seconds, for videos
  durationFormatted?: string; // e.g. "01:24"
  fps?: number;
  codec?: string;
  bitrate?: number;
  fileSize: number;
  hasAudio?: boolean;
  audioCodec?: string;
  targetWidth: number;
  targetHeight: number;
  targetResolutionLabel: string; // e.g. "3840 × 2160 (4K UHD)"
  isTrue4K: boolean;
}

export type JobStatus =
  | 'queued'
  | 'analyzing'
  | 'processing'
  | 'encoding'
  | 'validating'
  | 'completed'
  | 'failed'
  | 'preparing'
  | 'super_resolution'
  | 'refining';

export interface JobProgress {
  status: JobStatus;
  progress: number; // 0 - 100
  stage: string;
  stageDescription: string;
  currentFrame?: number;
  totalFrames?: number;
  error?: string;
  realStage?: RealProcessingStage;
}

export interface ProcessingJob {
  id: string;
  createdAt: number;
  mediaType: 'image' | 'video';
  modelUsed: AnoModelId;
  originalFilename: string;
  sourceFilePath: string;
  outputFilePath?: string;
  fileSize: number;
  sourceMeta: MediaMetadata;
  targetMeta: {
    width: number;
    height: number;
    resolutionLabel: string;
    aspectRatio: string;
  };
  status: JobStatus;
  realStage?: RealProcessingStage;
  progress: number;
  stage: string;
  stageDescription: string;
  error?: string;
  aiAnalysis?: {
    sceneType?: string;
    detailLevel?: string;
    reconstructionNotes?: string[];
  };
  outputStats?: {
    fileSize: number;
    width: number;
    height: number;
    format: string;
    duration?: number;
    fps?: number;
    processingTimeMs: number;
  };
}

export interface UpscalerProvider {
  name: string;
  analyzeMedia(filePath: string, mediaType: 'image' | 'video'): Promise<MediaMetadata>;
  processImage(
    sourcePath: string,
    outputPath: string,
    metadata: MediaMetadata,
    onProgress?: (progress: JobProgress) => void
  ): Promise<{ outputPath: string; width: number; height: number; fileSize: number }>;
  processVideo(
    sourcePath: string,
    outputPath: string,
    metadata: MediaMetadata,
    onProgress?: (progress: JobProgress) => void
  ): Promise<{ outputPath: string; width: number; height: number; fileSize: number; duration: number }>;
}

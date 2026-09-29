import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { ProcessingJob } from '../upscaler/types.js';
import { AnoModelId } from '../ai/types.js';

export interface SavedWork {
  id: string;
  userId: string;
  jobId: string;
  originalFilename: string;
  mediaType: 'image' | 'video';
  modelUsed: AnoModelId;
  originalResolution: string;
  outputResolution: string;
  aspectRatio: string;
  duration?: number;
  durationFormatted?: string;
  fileSize: number;
  createdAt: number;
  storedFilePath: string;
  sourceFilePath?: string;
  thumbnailDataUrl?: string;
}

const SAVED_DIR = path.join('/tmp', 'ano4k', 'saved');
const DB_FILE = path.join(SAVED_DIR, 'saved_works.json');

if (!fs.existsSync(SAVED_DIR)) {
  fs.mkdirSync(SAVED_DIR, { recursive: true });
}

export class SavedService {
  private readDb(): SavedWork[] {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return [];
      }
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data) || [];
    } catch (err) {
      console.error('Error reading saved works database:', err);
      return [];
    }
  }

  private writeDb(works: SavedWork[]) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(works, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing saved works database:', err);
    }
  }

  /**
   * Generates a fast base64 thumbnail for images or returns an icon indicator
   */
  private async generateThumbnail(filePath: string, mediaType: 'image' | 'video'): Promise<string | undefined> {
    try {
      if (mediaType === 'image') {
        const thumbBuffer = await sharp(filePath)
          .resize(320, 180, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();
        return `data:image/jpeg;base64,${thumbBuffer.toString('base64')}`;
      }
      return undefined;
    } catch (err) {
      console.warn('Failed to generate thumbnail:', err);
      return undefined;
    }
  }

  /**
   * Saves a completed job to the user's private storage
   */
  async saveWork(userId: string, job: ProcessingJob): Promise<SavedWork> {
    if (!job.outputFilePath || !fs.existsSync(job.outputFilePath)) {
      throw new Error('No output file available to save.');
    }

    const ext = path.extname(job.outputFilePath);
    const workId = `work_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const destinationPath = path.join(SAVED_DIR, `${workId}${ext}`);

    // Copy output file to saved directory
    fs.copyFileSync(job.outputFilePath, destinationPath);

    // Copy source file for before/after comparison if it exists
    let savedSourcePath: string | undefined;
    if (job.sourceFilePath && fs.existsSync(job.sourceFilePath)) {
      const sourceExt = path.extname(job.sourceFilePath);
      savedSourcePath = path.join(SAVED_DIR, `${workId}_source${sourceExt}`);
      fs.copyFileSync(job.sourceFilePath, savedSourcePath);
    }

    const stats = fs.statSync(destinationPath);
    const thumbnailDataUrl = await this.generateThumbnail(
      job.mediaType === 'image' ? destinationPath : job.sourceFilePath,
      job.mediaType
    );

    const modelUsed: AnoModelId = job.mediaType === 'video' ? 'ANO 5.5 Flash' : 'ANO 3.1 V2';

    const savedItem: SavedWork = {
      id: workId,
      userId,
      jobId: job.id,
      originalFilename: job.originalFilename,
      mediaType: job.mediaType,
      modelUsed,
      originalResolution: `${job.sourceMeta.width} × ${job.sourceMeta.height}`,
      outputResolution: `${job.targetMeta.width} × ${job.targetMeta.height}`,
      aspectRatio: job.sourceMeta.aspectRatio,
      duration: job.sourceMeta.duration,
      durationFormatted: job.sourceMeta.durationFormatted,
      fileSize: stats.size,
      createdAt: Date.now(),
      storedFilePath: destinationPath,
      sourceFilePath: savedSourcePath,
      thumbnailDataUrl,
    };

    const works = this.readDb();
    // Prepend new work
    works.unshift(savedItem);
    this.writeDb(works);

    return savedItem;
  }

  /**
   * Gets all saved works belonging to a specific user
   */
  async getSavedWorks(userId: string, filter?: 'all' | 'image' | 'video'): Promise<SavedWork[]> {
    const works = this.readDb();
    const userWorks = works.filter((w) => w.userId === userId);

    if (!filter || filter === 'all') {
      return userWorks;
    }

    return userWorks.filter((w) => w.mediaType === filter);
  }

  /**
   * Gets a specific saved work if owned by user
   */
  async getSavedWorkById(userId: string, workId: string): Promise<SavedWork | null> {
    const works = this.readDb();
    const found = works.find((w) => w.id === workId && w.userId === userId);
    return found || null;
  }

  /**
   * Permanently deletes a saved work and all its physical files
   */
  async deleteSavedWork(userId: string, workId: string): Promise<boolean> {
    const works = this.readDb();
    const index = works.findIndex((w) => w.id === workId && w.userId === userId);

    if (index === -1) {
      return false;
    }

    const item = works[index];

    // Remove physical files
    try {
      if (item.storedFilePath && fs.existsSync(item.storedFilePath)) {
        fs.unlinkSync(item.storedFilePath);
      }
      if (item.sourceFilePath && fs.existsSync(item.sourceFilePath)) {
        fs.unlinkSync(item.sourceFilePath);
      }
    } catch (e) {
      console.warn('Error deleting physical file for work', workId, e);
    }

    works.splice(index, 1);
    this.writeDb(works);
    return true;
  }
}

export const savedService = new SavedService();

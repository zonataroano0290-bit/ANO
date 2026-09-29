export type AnoModelId = 'ANO 5.5 Flash' | 'ANO 3.1 V2';

export interface MediaMetadata {
  mediaType: 'image' | 'video';
  format: string;
  width: number;
  height: number;
  aspectRatio: string;
  aspectRatioValue: number;
  duration?: number;
  durationFormatted?: string;
  fps?: number;
  codec?: string;
  bitrate?: number;
  fileSize: number;
  hasAudio?: boolean;
  audioCodec?: string;
  targetWidth: number;
  targetHeight: number;
  targetResolutionLabel: string;
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

export type RealProcessingStage =
  | 'QUEUED'
  | 'ANALYZING'
  | 'UPLOADING'
  | 'AI ENHANCEMENT'
  | '4K PROCESSING'
  | 'ENCODING'
  | 'VALIDATING'
  | 'SAVING'
  | 'COMPLETED'
  | 'FAILED';

export interface ProcessingJob {
  id: string;
  createdAt: number;
  mediaType: 'image' | 'video';
  modelUsed: AnoModelId;
  originalFilename: string;
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
  thumbnailDataUrl?: string;
}

export type AnoModelId = 'ANO 5.5 Flash' | 'ANO 3.1 V2';

export interface AnoModelInfo {
  id: AnoModelId;
  name: string;
  category: 'Video Super Resolution' | 'Image Super Resolution';
  supportedMediaType: 'video' | 'image';
  description: string;
  targetResolution: string;
  badge: string;
}

export const ANO_MODELS: Record<AnoModelId, AnoModelInfo> = {
  'ANO 5.5 Flash': {
    id: 'ANO 5.5 Flash',
    name: 'ANO 5.5 Flash',
    category: 'Video Super Resolution',
    supportedMediaType: 'video',
    description: 'Neural temporal frame consistency and sub-pixel edge synthesis for video.',
    targetResolution: '3840 × 2160 UHD',
    badge: 'Video Model',
  },
  'ANO 3.1 V2': {
    id: 'ANO 3.1 V2',
    name: 'ANO 3.1 V2',
    category: 'Image Super Resolution',
    supportedMediaType: 'image',
    description: 'High-frequency detail reconstruction and micro-contrast refinement for images.',
    targetResolution: '3840 × 2160 UHD',
    badge: 'Image Model',
  },
};

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

export interface OutputValidationResult {
  isValid: boolean;
  error?: string;
  width: number;
  height: number;
  isTrue4K: boolean;
  duration?: number;
  fps?: number;
  hasAudio?: boolean;
  codec?: string;
  fileSize: number;
}

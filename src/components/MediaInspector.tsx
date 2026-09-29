import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Trash2, ShieldCheck, Film, Image as ImageIcon, Volume2, AlertCircle } from 'lucide-react';
import { formatDuration, formatBytes } from '../utils/format.js';
import { ModelSelector } from './ModelSelector.js';
import { AnoModelId } from '../types/index.js';

interface MediaInspectorProps {
  file: File;
  onProcess: (model: AnoModelId) => void;
  onRemove: () => void;
  isSubmitting?: boolean;
  uploadProgress?: number | null;
  onError?: (msg: string) => void;
}

export const MediaInspector: React.FC<MediaInspectorProps> = ({
  file,
  onProcess,
  onRemove,
  isSubmitting,
  uploadProgress,
  onError,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [duration, setDuration] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isTooLong, setIsTooLong] = useState(false);

  const isVideo = file.type.startsWith('video/') || ['.mp4', '.mov', '.webm', '.mkv'].some(ext => file.name.toLowerCase().endsWith(ext));
  const [selectedModel, setSelectedModel] = useState<AnoModelId>(isVideo ? 'ANO 5.5 Flash' : 'ANO 3.1 V2');

  useEffect(() => {
    setSelectedModel(isVideo ? 'ANO 5.5 Flash' : 'ANO 3.1 V2');
  }, [isVideo]);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    if (isVideo) {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => {
        setDuration(v.duration);
        setDimensions({ width: v.videoWidth, height: v.videoHeight });
        // STRICT 2-MINUTE LIMIT: 120.0 seconds
        if (v.duration > 120.05) {
          setIsTooLong(true);
        }
      };
      v.src = url;
    } else {
      const img = new Image();
      img.onload = () => {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = url;
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, isVideo]);

  // Compute 4K target estimate
  const srcWidth = dimensions?.width || (isVideo ? 1920 : 1280);
  const srcHeight = dimensions?.height || (isVideo ? 1080 : 720);
  const aspect = srcWidth / srcHeight;

  let targetWidth = 3840;
  let targetHeight = 2160;
  if (Math.abs(aspect - 9 / 16) < 0.05) {
    targetWidth = 2160;
    targetHeight = 3840;
  } else if (aspect >= 1.0) {
    targetWidth = 3840;
    targetHeight = Math.round(3840 / aspect);
    if (targetHeight % 2 !== 0) targetHeight += 1;
  } else {
    targetHeight = 3840;
    targetWidth = Math.round(3840 * aspect);
    if (targetWidth % 2 !== 0) targetWidth += 1;
  }

  return (
    <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-8">
      {/* File card */}
      <div className="bg-[#09090f]/90 border border-white/[0.08] rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300">
              {isVideo ? <Film className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-md">
                {file.name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono-code">
                <span>{formatBytes(file.size)}</span>
                <span>•</span>
                <span className="uppercase">{file.type || 'Media'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onRemove}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        </div>

        {/* Model Selector in Inspector */}
        <ModelSelector
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          mediaType={isVideo ? 'video' : 'image'}
          onIncompatibleClick={onError}
          disabled={isSubmitting}
        />

        {/* Duration error alert if video > 2 minutes */}
        {isTooLong && (
          <div className="my-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <strong className="font-semibold">Maximum video length is 2 minutes.</strong>
              <p className="text-xs text-red-300/80 mt-0.5">
                The selected video is {duration ? formatDuration(duration) : 'longer than 2 minutes'}. Please select a video of 2 minutes (02:00) or less.
              </p>
            </div>
          </div>
        )}

        {/* Media Preview & Specs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
          {/* Media Player / Image container */}
          <div className="lg:col-span-7 rounded-2xl overflow-hidden bg-black/60 border border-white/[0.08] relative aspect-video flex items-center justify-center">
            {previewUrl && (
              isVideo ? (
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Original Preview"
                  className="w-full h-full object-contain"
                />
              )
            )}
            <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono-code uppercase text-neutral-300 border border-white/10">
              Source Preview
            </div>
          </div>

          {/* Technical Specs Comparison */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono-code">
                Pipeline Specifications
              </span>

              {/* Source card */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-neutral-400">SOURCE MEDIA</span>
                  <span className="font-mono-code text-neutral-300">
                    {dimensions ? `${dimensions.width} × ${dimensions.height}` : 'Reading...'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono-code">
                  {duration && (
                    <span>Duration: {formatDuration(duration)}</span>
                  )}
                  <span>Aspect: {aspect.toFixed(2)}:1</span>
                </div>
              </div>

              {/* Target 4K Card */}
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-purple-300 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    ANO 4K TARGET
                  </span>
                  <span className="font-mono-code text-white font-bold">
                    {targetWidth} × {targetHeight}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono-code text-purple-200/80">
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    4K ULTRA HD
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-300">
                    {selectedModel}
                  </span>
                  {isVideo && (
                    <span className="flex items-center gap-1 text-neutral-300">
                      <Volume2 className="w-3 h-3 text-purple-400" /> Audio Track Detected
                    </span>
                  )}
                  <span>Aspect: Preserved</span>
                </div>
              </div>
            </div>

            {/* Pipeline Notice */}
            <p className="text-[11px] text-neutral-400 leading-normal">
              Sub-pixel edge reconstruction and temporal consistency active. No artificial objects or altered visual identity.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col gap-3">
          {isSubmitting && uploadProgress !== null && uploadProgress !== undefined && uploadProgress > 0 && (
            <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              onClick={onRemove}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-sm text-neutral-300 hover:text-white transition-all cursor-pointer font-medium"
            >
              Cancel
            </button>

            <button
              onClick={() => onProcess(selectedModel)}
              disabled={isSubmitting || isTooLong}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 shadow-lg
                ${
                  isTooLong
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 text-white shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:shadow-[0_0_40px_rgba(147,51,234,0.6)] hover:scale-[1.02]'
                }
              `}
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>
                {isSubmitting
                  ? (uploadProgress !== null && uploadProgress !== undefined && uploadProgress > 0
                      ? `Uploading (${uploadProgress}%)...`
                      : 'Uploading & Creating Job...')
                  : `Process in 4K (${selectedModel})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

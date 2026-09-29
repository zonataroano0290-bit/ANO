import React, { useState } from 'react';
import { X, Download, Trash2, ZoomIn, ZoomOut, Sparkles, Layers, ShieldCheck } from 'lucide-react';
import { SavedWork } from '../types/index.js';
import { formatBytes } from '../utils/format.js';

interface FullScreenImageViewerProps {
  work: SavedWork;
  onClose: () => void;
  onDeleteRequest: (work: SavedWork) => void;
}

export const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  work,
  onClose,
  onDeleteRequest,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);

  const previewUrl = `/api/saved/${work.id}/preview`;
  const sourceUrl = `/api/saved/${work.id}/source`;
  const downloadUrl = `/api/saved/${work.id}/download`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-2xl animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="h-16 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#08080e]/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white text-base truncate max-w-xs sm:max-w-md">
              {work.originalFilename}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono-code font-semibold">
              {work.modelUsed}
            </span>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono-code">
              {work.outputResolution}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
              className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono-code text-[11px] px-2 text-neutral-400">{zoomLevel}x</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(4, z + 0.5))}
              className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Before / After toggle */}
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showOriginal
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/[0.05] border-white/10 text-neutral-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showOriginal ? 'Showing Original' : 'Toggle Original'}</span>
          </button>

          {/* Download */}
          <a
            href={downloadUrl}
            download
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download 4K</span>
          </a>

          {/* Delete */}
          <button
            onClick={() => onDeleteRequest(work)}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-red-500/20 text-neutral-400 hover:text-red-400 border border-white/5 transition-colors cursor-pointer"
            title="Delete media"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Close viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image View Canvas */}
      <div className="flex-1 relative overflow-auto flex items-center justify-center p-4 sm:p-8">
        <div
          className="relative max-w-full max-h-full transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={showOriginal ? sourceUrl : previewUrl}
            alt={work.originalFilename}
            className="max-h-[82vh] max-w-[92vw] object-contain rounded-xl shadow-2xl border border-white/10"
            onError={(e) => {
              // fallback to preview if source is unavailable
              if (showOriginal) {
                (e.target as HTMLImageElement).src = previewUrl;
              }
            }}
          />
          <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-mono-code text-white border border-white/10">
            {showOriginal ? (
              <span className="text-amber-300">SOURCE ORIGINAL • {work.originalResolution}</span>
            ) : (
              <span className="text-cyan-300 font-bold">
                {work.modelUsed} 4K MASTER • {work.outputResolution}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="h-12 px-6 border-t border-white/[0.06] bg-[#08080e]/90 flex items-center justify-between text-xs text-neutral-400 font-mono-code">
        <div className="flex items-center gap-3">
          <span>Source: {work.originalResolution}</span>
          <span>→</span>
          <span className="text-purple-300 font-bold">Output: {work.outputResolution} UHD</span>
        </div>
        <div>
          <span>Size: {formatBytes(work.fileSize)}</span>
        </div>
      </div>
    </div>
  );
};

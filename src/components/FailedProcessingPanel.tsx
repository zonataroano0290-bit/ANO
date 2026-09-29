import React from 'react';
import { AlertTriangle, RotateCcw, Sparkles, Server, Terminal, ShieldAlert } from 'lucide-react';
import { ProcessingJob } from '../types/index.js';

interface FailedProcessingPanelProps {
  job: ProcessingJob;
  onTryAgain: () => void;
  onReset: () => void;
}

export const FailedProcessingPanel: React.FC<FailedProcessingPanelProps> = ({
  job,
  onTryAgain,
  onReset,
}) => {
  const isVideo = job.mediaType === 'video';

  return (
    <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-12">
      <div className="bg-[#0e0a12]/95 border border-red-500/30 rounded-3xl p-8 sm:p-10 backdrop-blur-2xl shadow-[0_0_60px_rgba(239,68,68,0.2)]">
        {/* Error Badge */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white text-lg">ANO 4K</span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 font-mono-code font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              PROCESSING FAILED
            </span>
          </div>

          <span className="text-[10px] text-neutral-400 font-mono-code">
            Job: {job.id}
          </span>
        </div>

        {/* Warning Icon & Heading */}
        <div className="flex flex-col items-center text-center my-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-[0_0_25px_rgba(239,68,68,0.3)]">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="font-display text-2xl font-extrabold text-white tracking-tight mb-2">
            Processing Failed
          </h2>

          <div className="w-full bg-black/60 border border-red-500/20 rounded-2xl p-4 my-3 text-left">
            <span className="text-[10px] uppercase font-mono-code tracking-wider text-red-400 font-bold block mb-1">
              Reason:
            </span>
            <p className="text-sm text-red-200 font-mono-code leading-relaxed">
              {job.error || 'The super-resolution pipeline encountered an error during execution.'}
            </p>
          </div>

          <p className="text-xs text-neutral-400 max-w-md font-light leading-relaxed mt-2">
            Your original source media ({job.originalFilename}) has not been modified.
          </p>
        </div>

        {/* Technical Details */}
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono-code text-neutral-400 space-y-1 mb-8">
          <div className="flex justify-between">
            <span>Model:</span>
            <span className="text-white font-medium">{job.modelUsed}</span>
          </div>
          <div className="flex justify-between">
            <span>Media:</span>
            <span>{job.sourceMeta.width}×{job.sourceMeta.height} ({job.mediaType})</span>
          </div>
          <div className="flex justify-between">
            <span>Stage:</span>
            <span className="text-red-400">{job.realStage || 'FAILED'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
          <button
            onClick={onReset}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            Upload New Media
          </button>

          <button
            onClick={onTryAgain}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};

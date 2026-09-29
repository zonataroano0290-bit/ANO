import React from 'react';
import { Loader2, Sparkles, CheckCircle2, Film, Image as ImageIcon, XCircle, ShieldCheck } from 'lucide-react';
import { ProcessingJob, RealProcessingStage } from '../types/index.js';

interface ProcessingViewProps {
  job: ProcessingJob;
  onCancel: () => void;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({ job, onCancel }) => {
  const isVideo = job.mediaType === 'video';

  const stages = [
    { key: 'queued', label: 'Queued' },
    { key: 'analyzing', label: 'Analyzing' },
    { key: 'processing', label: 'Processing' },
    { key: 'encoding', label: 'Encoding' },
    { key: 'validating', label: 'Validating' },
    { key: 'completed', label: 'Completed' },
  ];

  const getStageIndex = (): number => {
    const s = job.status?.toLowerCase() || '';
    const rs = job.realStage?.toUpperCase() || '';
    if (s === 'completed' || rs === 'COMPLETED') return 5;
    if (s === 'validating' || rs === 'VALIDATING') return 4;
    if (s === 'encoding' || rs === 'ENCODING') return 3;
    if (s === 'processing' || s === 'super_resolution' || rs === '4K PROCESSING' || rs === 'AI ENHANCEMENT') return 2;
    if (s === 'analyzing' || rs === 'ANALYZING') return 1;
    return 0; // queued
  };

  const currentStageIndex = getStageIndex();
  const currentStageLabel = stages[currentStageIndex]?.label.toUpperCase() || 'PROCESSING';

  return (
    <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-10">
      <div className="bg-[#09090f]/90 border border-purple-500/20 rounded-3xl p-8 sm:p-12 backdrop-blur-2xl shadow-[0_0_60px_rgba(147,51,234,0.15)] relative overflow-hidden">
        {/* Glowing atmospheric background ripple */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Model header tag */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white text-lg">ANO 4K</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-200 border border-purple-500/30 font-mono-code font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-400" />
              {job.modelUsed || (isVideo ? 'ANO 5.5 Flash' : 'ANO 3.1 V2')}
            </span>
          </div>

          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        </div>

        {/* Center Progress Ring / Shimmer */}
        <div className="flex flex-col items-center justify-center my-6 text-center">
          <div className="relative mb-6">
            {/* Spinning gradient ring */}
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 p-[3px] animate-[spin_6s_linear_infinite] shadow-[0_0_35px_rgba(147,51,234,0.45)]">
              <div className="w-full h-full bg-[#08080f] rounded-full flex flex-col items-center justify-center">
                {job.progress !== undefined && job.progress > 0 ? (
                  <span className="font-display font-extrabold text-2xl text-white">
                    {job.progress}%
                  </span>
                ) : (
                  <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
                )}
                <span className="text-[9px] uppercase tracking-wider text-purple-300 font-mono-code">
                  {currentStageLabel}
                </span>
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-purple-400 absolute -top-2 -right-2 animate-bounce" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white font-display mb-2">
            {job.stage || 'Processing in 4K...'}
          </h2>
          <p className="text-sm text-neutral-400 max-w-md font-light leading-relaxed">
            {job.stageDescription || 'Reconstructing fine sub-pixel details and temporal consistency.'}
          </p>
        </div>

        {/* Progress Bar (reflects real progress if known) */}
        <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden mb-8 p-[1px] relative">
          <div
            className="bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-400 h-full rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.8)]"
            style={{ width: `${Math.max(8, job.progress || 12)}%` }}
          />
        </div>

        {/* Pipeline Stage Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-8">
          {stages.map((stage, idx) => {
            const isDone = currentStageIndex > idx;
            const isCurrent = currentStageIndex === idx;
            return (
              <div
                key={stage.key}
                className={`p-2 rounded-xl border text-[11px] flex flex-col gap-1 transition-all ${
                  isCurrent
                    ? 'bg-purple-950/40 border-purple-500/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : isDone
                    ? 'bg-white/[0.03] border-emerald-500/20 text-neutral-300'
                    : 'bg-white/[0.01] border-white/[0.04] text-neutral-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium truncate">
                  {isDone ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3 h-3 text-purple-400 animate-spin shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-neutral-600 shrink-0" />
                  )}
                  <span className="truncate">{stage.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Media Context Box */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs text-neutral-400 font-mono-code">
          <div className="flex items-center gap-2 truncate">
            {isVideo ? <Film className="w-4 h-4 text-purple-400 shrink-0" /> : <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />}
            <span className="text-white truncate max-w-[200px]">{job.originalFilename}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span>
              {job.sourceMeta.width}×{job.sourceMeta.height}
            </span>
            <span className="text-purple-400 font-bold">
              → {job.targetMeta.width}×{job.targetMeta.height} UHD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

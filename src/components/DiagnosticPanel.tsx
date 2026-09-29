import React, { useState, useEffect } from 'react';
import { Terminal, ChevronUp, ChevronDown, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { ProcessingJob, AnoModelId } from '../types/index.js';

interface DiagnosticPanelProps {
  job: ProcessingJob | null;
  selectedModel: AnoModelId;
  lastApiStatus?: string;
  lastError?: string | null;
}

interface ProviderHealth {
  video: { configured: boolean; provider: string; model: string; reachable: boolean; details: string } | null;
  image: { configured: boolean; provider: string; model: string; reachable: boolean; details: string } | null;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({
  job,
  selectedModel,
  lastApiStatus,
  lastError,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [health, setHealth] = useState<ProviderHealth>({ video: null, image: null });
  const [isChecking, setIsChecking] = useState(false);

  const fetchHealth = async () => {
    setIsChecking(true);
    try {
      const [vRes, iRes] = await Promise.all([
        fetch('/api/ai/video/health').then((r) => r.json()),
        fetch('/api/ai/image/health').then((r) => r.json()),
      ]);
      setHealth({ video: vRes, image: iRes });
    } catch (e) {
      console.warn('Could not fetch provider health:', e);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const activeProviderHealth = selectedModel === 'ANO 5.5 Flash' ? health.video : health.image;

  return (
    <div className="fixed bottom-3 left-4 z-40 max-w-sm sm:max-w-md w-full font-mono-code text-[11px] select-none">
      {/* Collapsed Bar / Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#0b0b14]/90 border border-white/10 hover:border-purple-500/40 rounded-xl px-3 py-1.5 flex items-center justify-between cursor-pointer backdrop-blur-md shadow-lg transition-all"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-bold text-neutral-300">DIAGNOSTICS</span>
          <span className="text-white/20">|</span>
          <span className="text-neutral-400">
            {job ? `Job: ${job.id.substring(0, 14)}...` : 'Idle'}
          </span>
          {activeProviderHealth?.configured ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" title="Provider Connected" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" title="Provider Unconfigured" />
          )}
        </div>

        <div className="flex items-center gap-1.5 text-neutral-400">
          <span className="text-[10px] text-purple-300 uppercase">{job?.realStage || 'IDLE'}</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Expanded Diagnostic Box */}
      {isOpen && (
        <div className="mt-2 bg-[#090912]/95 border border-purple-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl text-neutral-300 space-y-2 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <span className="text-[10px] uppercase font-bold text-purple-300">Pipeline Diagnostics</span>
            <button
              onClick={fetchHealth}
              disabled={isChecking}
              className="p-1 rounded bg-white/[0.04] hover:bg-white/10 text-neutral-300"
              title="Refresh provider health"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-neutral-500 block">Job ID:</span>
              <span className="text-white font-mono truncate block">{job?.id || 'None (No active job)'}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Selected Model:</span>
              <span className="text-purple-300 block">{selectedModel}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Active Status:</span>
              <span className={`block font-bold ${job?.status === 'failed' ? 'text-red-400' : job?.status === 'completed' ? 'text-emerald-400' : 'text-neutral-300'}`}>
                {job?.status || 'idle'}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block">Processing Stage:</span>
              <span className="text-cyan-300 block">{job?.realStage || 'IDLE'}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Last API Status:</span>
              <span className="text-white block">{lastApiStatus || 'HTTP 200 OK'}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Provider Configured:</span>
              <span className={activeProviderHealth?.configured ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {activeProviderHealth?.configured ? 'YES (Connected)' : 'NO (Unconfigured)'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06] text-[10px]">
            <span className="text-neutral-500 block mb-0.5">Provider Details ({selectedModel}):</span>
            <span className="text-neutral-300 block">
              {activeProviderHealth?.details || 'Querying backend provider health...'}
            </span>
          </div>

          {(lastError || job?.error) && (
            <div className="pt-2 border-t border-red-500/20 text-[10px] text-red-300 bg-red-950/30 p-2 rounded-lg">
              <span className="text-red-400 font-bold block mb-0.5">Last Error:</span>
              <span className="break-words">{job?.error || lastError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

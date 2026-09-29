import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Bookmark,
  Check,
  Layers,
  Film,
  Image as ImageIcon,
} from 'lucide-react';
import { ProcessingJob } from '../types/index.js';
import { formatBytes } from '../utils/format.js';

interface ResultViewProps {
  job: ProcessingJob;
  onReset: () => void;
  onSave?: (jobId: string) => Promise<boolean>;
  isSaved?: boolean;
}

export const ResultView: React.FC<ResultViewProps> = ({
  job,
  onReset,
  onSave,
  isSaved = false,
}) => {
  const isVideo = job.mediaType === 'video';

  // State for image slider comparison
  const [sliderPosition, setSliderPosition] = useState(50); // 0 - 100%
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // State for video playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeVideoView, setActiveVideoView] = useState<'enhanced' | 'original' | 'split'>('enhanced');
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>(isSaved ? 'saved' : 'idle');

  const enhancedVideoRef = useRef<HTMLVideoElement>(null);
  const originalVideoRef = useRef<HTMLVideoElement>(null);

  const sourceUrl = `/api/jobs/${job.id}/source`;
  const previewUrl = `/api/jobs/${job.id}/preview`;
  const downloadUrl = `/api/jobs/${job.id}/download`;

  // Synchronize videos when playing in split mode or switching
  useEffect(() => {
    if (!isVideo) return;

    const enh = enhancedVideoRef.current;
    const orig = originalVideoRef.current;
    if (!enh || !orig) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    enh.addEventListener('play', handlePlay);
    enh.addEventListener('pause', handlePause);

    return () => {
      enh.removeEventListener('play', handlePlay);
      enh.removeEventListener('pause', handlePause);
    };
  }, [isVideo]);

  const togglePlay = () => {
    const enh = enhancedVideoRef.current;
    const orig = originalVideoRef.current;
    if (!enh) return;

    if (enh.paused) {
      enh.play();
      if (orig && !orig.paused) orig.play();
      setIsPlaying(true);
    } else {
      enh.pause();
      if (orig) orig.pause();
      setIsPlaying(false);
    }
  };

  // Slider drag handlers
  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleMouseDown = () => {
    setIsDraggingSlider(true);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDraggingSlider(false);
    const handleMouseMoveDoc = (e: MouseEvent) => {
      if (isDraggingSlider) {
        handleSliderMove(e.clientX);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMoveDoc);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMoveDoc);
    };
  }, [isDraggingSlider]);

  const handleSaveClick = async () => {
    if (!onSave || savingState === 'saved' || savingState === 'saving') return;
    setSavingState('saving');
    try {
      const ok = await onSave(job.id);
      if (ok) {
        setSavingState('saved');
      } else {
        setSavingState('idle');
      }
    } catch (e) {
      setSavingState('idle');
    }
  };

  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono-code">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>4K ULTRA HD VERIFIED</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-mono-code">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>MODEL: {job.modelUsed || (isVideo ? 'ANO 5.5 Flash' : 'ANO 3.1 V2')}</span>
            </div>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Your 4K file is ready.
          </h1>
        </div>

        {/* Primary Action Buttons: SAVE, DOWNLOAD, PROCESS ANOTHER */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* SAVE BUTTON */}
          <button
            onClick={handleSaveClick}
            disabled={savingState === 'saved' || savingState === 'saving'}
            className={`px-4 py-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              savingState === 'saved'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-white hover:border-purple-500/40'
            }`}
          >
            {savingState === 'saved' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Saved to My Works</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-purple-300" />
                <span>{savingState === 'saving' ? 'Saving...' : 'Save'}</span>
              </>
            )}
          </button>

          {/* PROCESS ANOTHER */}
          <button
            onClick={onReset}
            className="px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Process Another</span>
          </button>

          {/* DOWNLOAD 4K */}
          <a
            href={downloadUrl}
            download
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 text-white text-sm font-bold tracking-wide transition-all shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:shadow-[0_0_40px_rgba(147,51,234,0.6)] cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-purple-200" />
            <span>Download 4K</span>
          </a>
        </div>
      </div>

      {/* Main Media Comparison Canvas */}
      <div className="bg-[#09090f]/95 border border-white/[0.08] rounded-3xl p-4 sm:p-6 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] mb-6">
        {/* Controls bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-white/[0.06]">
          {/* Mode switch */}
          {isVideo ? (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <button
                onClick={() => setActiveVideoView('enhanced')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeVideoView === 'enhanced'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ANO 4K Enhanced
              </button>
              <button
                onClick={() => setActiveVideoView('original')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeVideoView === 'original'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Source Original
              </button>
              <button
                onClick={() => setActiveVideoView('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeVideoView === 'split'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Side-by-Side
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 font-mono-code flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Drag slider to compare sub-pixel reconstruction
              </span>
              <div className="hidden sm:flex items-center gap-1 bg-white/[0.04] rounded-lg p-1 border border-white/5 text-xs text-neutral-400">
                <button
                  onClick={() => setZoomLevel(1)}
                  className={`px-2 py-1 rounded cursor-pointer ${zoomLevel === 1 ? 'bg-purple-600 text-white' : 'hover:text-white'}`}
                >
                  1x
                </button>
                <button
                  onClick={() => setZoomLevel(2)}
                  className={`px-2 py-1 rounded cursor-pointer ${zoomLevel === 2 ? 'bg-purple-600 text-white' : 'hover:text-white'}`}
                >
                  2x Zoom
                </button>
              </div>
            </div>
          )}

          {/* Video controls */}
          {isVideo && (
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-white cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play Both'}</span>
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Media Canvas View */}
        <div
          ref={containerRef}
          className="relative w-full rounded-2xl overflow-hidden bg-black/90 border border-white/10 select-none aspect-video flex items-center justify-center"
        >
          {isVideo ? (
            activeVideoView === 'split' ? (
              <div className="grid grid-cols-2 w-full h-full">
                <div className="relative border-r border-white/20 bg-black flex items-center justify-center overflow-hidden">
                  <video
                    ref={originalVideoRef}
                    src={sourceUrl}
                    controls
                    muted={isMuted}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono-code text-neutral-300 border border-white/10">
                    Source: {job.sourceMeta.width}×{job.sourceMeta.height}
                  </div>
                </div>

                <div className="relative bg-black flex items-center justify-center overflow-hidden">
                  <video
                    ref={enhancedVideoRef}
                    src={previewUrl}
                    controls
                    muted={isMuted}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 px-2 py-1 rounded bg-purple-950/80 backdrop-blur-md text-[10px] font-mono-code text-purple-200 border border-purple-500/30">
                    {job.modelUsed}: {job.targetMeta.width}×{job.targetMeta.height} (UHD)
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full bg-black flex items-center justify-center">
                <video
                  ref={enhancedVideoRef}
                  src={activeVideoView === 'enhanced' ? previewUrl : sourceUrl}
                  controls
                  autoPlay
                  muted={isMuted}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md text-[11px] font-mono-code border border-white/10">
                  {activeVideoView === 'enhanced' ? (
                    <span className="text-purple-300 font-bold">
                      {job.modelUsed} ENHANCED • {job.targetMeta.width}×{job.targetMeta.height} UHD
                    </span>
                  ) : (
                    <span className="text-neutral-400">
                      SOURCE ORIGINAL • {job.sourceMeta.width}×{job.sourceMeta.height}
                    </span>
                  )}
                </div>
              </div>
            )
          ) : (
            <div
              className="relative w-full h-full overflow-hidden flex items-center justify-center cursor-ew-resize"
              onMouseDown={handleMouseDown}
              onTouchMove={handleTouchMove}
            >
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease',
                }}
              >
                <img
                  src={previewUrl}
                  alt="ANO 4K Enhanced"
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>

              <div
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                style={{
                  clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease',
                }}
              >
                <img
                  src={sourceUrl}
                  alt="Source Original"
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>

              <div
                className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_#ffffff] z-20 pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg font-bold text-xs">
                  ↔
                </div>
              </div>

              <div className="absolute bottom-4 left-4 z-20 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-mono-code text-neutral-300 border border-white/10 pointer-events-none">
                SOURCE: {job.sourceMeta.width} × {job.sourceMeta.height}
              </div>

              <div className="absolute bottom-4 right-4 z-20 px-2.5 py-1 rounded-lg bg-purple-950/80 backdrop-blur-md text-[10px] font-mono-code text-purple-200 border border-purple-500/30 pointer-events-none">
                {job.modelUsed}: {job.targetMeta.width} × {job.targetMeta.height} (UHD)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Technical Master Specs Table */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#09090f]/80 border border-white/[0.06]">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono-code">
            Output Resolution
          </span>
          <p className="text-lg font-bold text-white font-mono-code mt-1">
            {job.targetMeta.width} × {job.targetMeta.height}
          </p>
          <span className="text-[11px] text-purple-400">4K Ultra HD</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#09090f]/80 border border-white/[0.06]">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono-code">
            Master Format
          </span>
          <p className="text-lg font-bold text-white font-mono-code mt-1 uppercase">
            {job.outputStats?.format || job.sourceMeta.format}
          </p>
          <span className="text-[11px] text-neutral-400 font-mono-code">
            {formatBytes(job.outputStats?.fileSize)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#09090f]/80 border border-white/[0.06]">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono-code">
            {isVideo ? 'Audio Soundtrack' : 'Color Space'}
          </span>
          <p className="text-lg font-bold text-emerald-400 font-mono-code mt-1">
            {isVideo ? 'Bit-Exact' : 'True 24-bit'}
          </p>
          <span className="text-[11px] text-neutral-400">
            {isVideo ? 'Original Audio Preserved' : 'Chroma 4:4:4'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#09090f]/80 border border-white/[0.06]">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono-code">
            Super-Resolution Model
          </span>
          <p className="text-lg font-bold text-white font-mono-code mt-1">
            {job.modelUsed}
          </p>
          <span className="text-[11px] text-neutral-400">
            {job.outputStats?.processingTimeMs
              ? `${(job.outputStats.processingTimeMs / 1000).toFixed(1)}s render time`
              : 'Neural Enhanced'}
          </span>
        </div>
      </div>
    </div>
  );
};

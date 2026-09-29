import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  Trash2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { SavedWork } from '../types/index.js';
import { formatDuration, formatBytes } from '../utils/format.js';

interface FullScreenVideoViewerProps {
  work: SavedWork;
  onClose: () => void;
  onDeleteRequest: (work: SavedWork) => void;
}

export const FullScreenVideoViewer: React.FC<FullScreenVideoViewerProps> = ({
  work,
  onClose,
  onDeleteRequest,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(work.duration || 0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = `/api/saved/${work.id}/preview`;
  const downloadUrl = `/api/saved/${work.id}/download`;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-2xl animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="h-16 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#08080e]/80">
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-white text-base truncate max-w-xs sm:max-w-md">
            {work.originalFilename}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-mono-code font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {work.modelUsed}
          </span>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono-code">
            {work.outputResolution} UHD
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Download */}
          <a
            href={downloadUrl}
            download
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download 4K Video</span>
          </a>

          {/* Delete */}
          <button
            onClick={() => onDeleteRequest(work)}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-red-500/20 text-neutral-400 hover:text-red-400 border border-white/5 transition-colors cursor-pointer"
            title="Delete video"
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

      {/* Main Video Stage */}
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-6 bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          muted={isMuted}
          className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-white/10"
          onClick={togglePlay}
        />
      </div>

      {/* Video Control Bar */}
      <div className="p-4 px-6 border-t border-white/[0.08] bg-[#090910] flex flex-col gap-2">
        {/* Scrub Bar */}
        <div className="flex items-center gap-3">
          <span className="font-mono-code text-[11px] text-neutral-400 min-w-[40px]">
            {formatDuration(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <span className="font-mono-code text-[11px] text-neutral-400 min-w-[40px]">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Buttons & Indicators */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-neutral-400 font-mono-code">
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Bit-Exact Audio Preserved
            </span>
            <span>{work.outputResolution}</span>
            <span>{formatBytes(work.fileSize)}</span>
            <button
              onClick={handleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

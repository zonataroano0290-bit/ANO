import React, { useState, useRef } from 'react';
import { Upload, Video, Image as ImageIcon, AlertCircle, Sparkles, Clock, ShieldCheck, Film } from 'lucide-react';
import { ModelSelector } from './ModelSelector.js';
import { AnoModelId } from '../types/index.js';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onError: (msg: string) => void;
  isLoading?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, onError, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preSelectedModel, setPreSelectedModel] = useState<AnoModelId>('ANO 5.5 Flash');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file before passing up
  const validateAndHandleFile = (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const validVideoExts = ['.mp4', '.mov', '.webm', '.mkv'];
    const validImageExts = ['.jpg', '.jpeg', '.png', '.webp'];

    const isVideo = validVideoExts.includes(ext) || file.type.startsWith('video/');
    const isImage = validImageExts.includes(ext) || file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      onError('ANO 4K could not process this file format. Please upload MP4, MOV, WebM, MKV, JPG, PNG, or WebP.');
      return;
    }

    // Client-side strict 2-minute video duration check
    if (isVideo) {
      const url = URL.createObjectURL(file);
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';

      tempVideo.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        if (tempVideo.duration > 120.05) {
          onError('Maximum video length is 2 minutes.');
          return;
        }
        onFileSelect(file);
      };

      tempVideo.onerror = () => {
        URL.revokeObjectURL(url);
        // If browser fails to load metadata, still send to backend for robust ffprobe validation
        onFileSelect(file);
      };

      tempVideo.src = url;
    } else {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndHandleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndHandleFile(e.target.files[0]);
    }
  };

  // Quick sample test generator: creates a crisp canvas test clip or image
  const loadSample = async (type: 'image' | 'video') => {
    if (type === 'image') {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw sleek tech gradient & details
        const grad = ctx.createLinearGradient(0, 0, 1280, 720);
        grad.addColorStop(0, '#0a0a14');
        grad.addColorStop(0.5, '#1e1035');
        grad.addColorStop(1, '#080d1a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1280, 720);

        // Futuristic grid
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 1280; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 720);
          ctx.stroke();
        }
        for (let y = 0; y < 720; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(1280, y);
          ctx.stroke();
        }

        // Circular orb
        const radial = ctx.createRadialGradient(640, 360, 20, 640, 360, 260);
        radial.addColorStop(0, 'rgba(168, 85, 247, 0.9)');
        radial.addColorStop(0.4, 'rgba(56, 189, 248, 0.6)');
        radial.addColorStop(1, 'rgba(236, 72, 153, 0)');
        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(640, 360, 260, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ANO 4K BENCHMARK SAMPLE', 640, 350);
        ctx.font = '20px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('SOURCE: 1280 × 720 (720p HD) → TARGET: 3840 × 2160 (4K UHD)', 640, 390);

        canvas.toBlob((blob) => {
          if (blob) {
            const sampleFile = new File([blob], 'ano_sample_720p.png', { type: 'image/png' });
            onFileSelect(sampleFile);
          }
        }, 'image/png');
      }
    } else {
      // Create sample video stream using Canvas + Web Audio recorded with MediaRecorder
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const stream = canvas.captureStream(30);

        // Add audio track to test audio preservation!
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        gain.gain.value = 0.05;
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.connect(gain);
        const dest = audioCtx.createMediaStreamDestination();
        gain.connect(dest);
        osc.start();

        const combinedStream = new MediaStream([
          ...stream.getVideoTracks(),
          ...dest.stream.getAudioTracks(),
        ]);

        const mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm',
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          osc.stop();
          audioCtx.close();
          const blob = new Blob(chunks, { type: 'video/webm' });
          const file = new File([blob], 'sample_1080p_clip.webm', { type: 'video/webm' });
          onFileSelect(file);
        };

        mediaRecorder.start();

        let frame = 0;
        const totalFrames = 60; // 2 second sample
        const interval = setInterval(() => {
          frame++;
          ctx.fillStyle = '#06060c';
          ctx.fillRect(0, 0, 1280, 720);

          // Moving fluid particles
          ctx.fillStyle = '#9333ea';
          ctx.beginPath();
          ctx.arc(640 + Math.sin(frame * 0.1) * 200, 360 + Math.cos(frame * 0.1) * 100, 90, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(640 - Math.sin(frame * 0.1) * 150, 360 - Math.cos(frame * 0.1) * 80, 70, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 32px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('ANO 4K VIDEO MOTION TEST', 640, 340);
          ctx.font = '18px monospace';
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(`Frame ${frame} / ${totalFrames} • 720p HD → 4K UHD`, 640, 380);

          if (frame >= totalFrames) {
            clearInterval(interval);
            mediaRecorder.stop();
          }
        }, 1000 / 30);
      } catch (e) {
        console.error('Failed to create sample video:', e);
      }
    }
  };

  return (
    <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-8 sm:py-14 flex flex-col items-center">
      {/* Hero Typography */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-mono-code mb-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>REAL AI SUPER RESOLUTION</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-3">
          ANO{' '}
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(168,85,247,0.4)]">
            4K
          </span>
        </h1>

        <p className="text-base sm:text-lg text-neutral-400 max-w-xl mx-auto font-light leading-relaxed">
          AI-powered super-resolution pipeline for video and images. Reconstructs sub-pixel details to genuine 3840×2160 Ultra HD.
        </p>
      </div>

      {/* Model Selector Preview */}
      <ModelSelector
        selectedModel={preSelectedModel}
        onSelectModel={setPreSelectedModel}
        onIncompatibleClick={onError}
      />

      {/* Main Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative w-full rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 group mt-4
          ${
            isDragging
              ? 'bg-purple-950/30 border-purple-400 scale-[1.01] shadow-[0_0_50px_rgba(168,85,247,0.35)]'
              : 'bg-[#09090f]/75 hover:bg-[#0c0c16]/85 border-white/[0.08] hover:border-purple-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.6)]'
          }
          border backdrop-blur-xl`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-matroska,image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Ambient glow accent behind icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-600/25 transition-all duration-500" />

        {/* Upload Icon with Glowing Liquid Ring */}
        <div className="relative mx-auto mb-6 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-[1px] shadow-[0_0_30px_rgba(147,51,234,0.4)] group-hover:scale-105 transition-transform duration-300">
          <div className="w-full h-full bg-[#08080f] rounded-[15px] flex items-center justify-center">
            <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-purple-300 group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* Call to action */}
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 font-display">
          Upload your video or image
        </h2>
        <p className="text-sm text-neutral-400 mb-6 font-light">
          Drag and drop your file here, or click to browse
        </p>

        {/* Rules & Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium text-neutral-300">Maximum video length: 2 minutes</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target: 3840 × 2160 4K UHD</span>
          </div>
        </div>

        <div className="mt-4 text-[11px] text-neutral-400 font-mono-code">
          Supported: MP4, MOV, WebM, MKV • JPG, PNG, WebP
        </div>
      </div>

      {/* Quick Test Demo Samples */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-neutral-400">
        <span className="text-neutral-400 font-medium">Or test with a benchmark sample:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadSample('video')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-purple-600/20 border border-white/[0.08] hover:border-purple-500/40 text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            <Film className="w-3.5 h-3.5 text-purple-400" />
            <span>ANO 5.5 Flash Sample (Video + Audio)</span>
          </button>
          <button
            onClick={() => loadSample('image')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-cyan-600/20 border border-white/[0.08] hover:border-cyan-500/40 text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>ANO 3.1 V2 Sample (Image 720p)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Film,
  Image as ImageIcon,
  Download,
  Trash2,
  Eye,
  Sparkles,
  Calendar,
  Clock,
  HardDrive,
  FolderOpen,
} from 'lucide-react';
import { SavedWork } from '../types/index.js';
import { formatBytes } from '../utils/format.js';

interface MyWorksViewProps {
  works: SavedWork[];
  onOpenItem: (work: SavedWork) => void;
  onDeleteItem: (work: SavedWork) => void;
  onNewMedia: () => void;
}

export const MyWorksView: React.FC<MyWorksViewProps> = ({
  works,
  onOpenItem,
  onDeleteItem,
  onNewMedia,
}) => {
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');

  const filteredWorks = works.filter((w) => {
    if (filter === 'all') return true;
    return w.mediaType === filter;
  });

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider text-purple-400 font-mono-code font-bold flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" />
              PRIVATE STORAGE
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            My Works
          </h1>
          <p className="text-sm text-neutral-400 font-light mt-1">
            Your saved 4K super-resolution masters ({works.length} items)
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#090912]/80 p-1 rounded-2xl border border-white/[0.08] backdrop-blur-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All ({works.length})
          </button>
          <button
            onClick={() => setFilter('image')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'image'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>Images ({works.filter((w) => w.mediaType === 'image').length})</span>
          </button>
          <button
            onClick={() => setFilter('video')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'video'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Film className="w-3 h-3" />
            <span>Videos ({works.filter((w) => w.mediaType === 'video').length})</span>
          </button>
        </div>
      </div>

      {/* Grid or Empty state */}
      {filteredWorks.length === 0 ? (
        <div className="bg-[#090912]/60 border border-white/[0.06] rounded-3xl p-12 text-center backdrop-blur-xl my-6">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 mx-auto mb-4">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-lg text-white mb-1">
            No saved works in this view
          </h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mb-6 font-light">
            Enhance a video or image in 4K using ANO models and click <strong className="text-white">Save</strong> to store it here.
          </p>
          <button
            onClick={onNewMedia}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] cursor-pointer"
          >
            Process New Media
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorks.map((work) => {
            const isVid = work.mediaType === 'video';
            const downloadUrl = `/api/saved/${work.id}/download`;

            return (
              <div
                key={work.id}
                className="bg-[#090912]/90 border border-white/[0.08] hover:border-purple-500/30 rounded-3xl overflow-hidden backdrop-blur-xl transition-all duration-300 group hover:shadow-[0_10px_35px_rgba(0,0,0,0.6)] flex flex-col justify-between"
              >
                {/* Media Preview Box */}
                <div
                  onClick={() => onOpenItem(work)}
                  className="relative aspect-video bg-black/60 cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  {work.thumbnailDataUrl ? (
                    <img
                      src={work.thumbnailDataUrl}
                      alt={work.originalFilename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-neutral-500 gap-2">
                      {isVid ? <Film className="w-10 h-10 text-purple-400/60" /> : <ImageIcon className="w-10 h-10 text-cyan-400/60" />}
                      <span className="text-[11px] font-mono-code">4K Master Stream</span>
                    </div>
                  )}

                  {/* Badges on top */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-mono-code font-semibold text-purple-200 border border-purple-500/30">
                      {work.modelUsed}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 backdrop-blur-md text-[9px] font-mono-code font-bold text-emerald-300 border border-emerald-500/30">
                      4K UHD
                    </span>
                  </div>

                  {/* Duration pill for videos */}
                  {isVid && work.durationFormatted && (
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono-code text-white border border-white/10 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-400" />
                      <span>{work.durationFormatted}</span>
                    </div>
                  )}

                  {/* Hover View Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-4 py-2 rounded-xl bg-purple-600/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Master</span>
                    </span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => onOpenItem(work)}
                      className="font-display font-bold text-white text-sm truncate cursor-pointer hover:text-purple-300 transition-colors mb-2"
                      title={work.originalFilename}
                    >
                      {work.originalFilename}
                    </h3>

                    {/* Technical details row */}
                    <div className="space-y-1 text-xs text-neutral-400 font-mono-code mb-4">
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Source:</span>
                        <span className="text-neutral-300">{work.originalResolution}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-purple-400">4K Master:</span>
                        <span className="text-white font-bold">{work.outputResolution}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-white/[0.04]">
                        <span>{formatDate(work.createdAt)}</span>
                        <span>{formatBytes(work.fileSize)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                    <button
                      onClick={() => onOpenItem(work)}
                      className="text-xs text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      <span>Open</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={downloadUrl}
                        download
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                        title="Download 4K"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => onDeleteItem(work)}
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete from Library"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

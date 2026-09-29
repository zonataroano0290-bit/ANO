import React from 'react';
import { Sparkles, FolderOpen, Wand2, RotateCcw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'studio' | 'my-works';
  onTabChange: (tab: 'studio' | 'my-works') => void;
  savedCount: number;
  onReset?: () => void;
  hasActiveJob?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  savedCount,
  onReset,
  hasActiveJob,
}) => {
  return (
    <header className="relative z-10 w-full pt-6 pb-4 px-6 max-w-7xl mx-auto flex items-center justify-between border-b border-white/[0.06]">
      {/* Brand */}
      <div
        onClick={() => {
          onTabChange('studio');
          if (hasActiveJob && onReset) onReset();
        }}
        className="flex items-center gap-3 select-none cursor-pointer group"
      >
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 p-[1px] shadow-[0_0_20px_rgba(147,51,234,0.35)]">
          <div className="w-full h-full bg-[#07070b] rounded-[11px] flex items-center justify-center backdrop-blur-md">
            <span className="font-display font-extrabold text-sm tracking-wider bg-gradient-to-r from-purple-300 via-violet-200 to-cyan-300 bg-clip-text text-transparent">
              4K
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold tracking-tight text-white group-hover:text-purple-300 transition-colors">
              ANO 4K
            </span>
            <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded">
              Ultra HD
            </span>
          </div>
          <p className="text-[10px] tracking-widest uppercase text-neutral-400 font-mono-code">
            AI Super Resolution
          </p>
        </div>
      </div>

      {/* Center Navigation Tabs: Studio vs My Works */}
      <nav className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#090912]/80 border border-white/[0.08] backdrop-blur-xl">
        <button
          onClick={() => onTabChange('studio')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'studio'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Studio</span>
        </button>

        <button
          onClick={() => onTabChange('my-works')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'my-works'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>My Works</span>
          {savedCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono-code ${
                activeTab === 'my-works'
                  ? 'bg-white/20 text-white'
                  : 'bg-purple-500/20 text-purple-300'
              }`}
            >
              {savedCount}
            </span>
          )}
        </button>
      </nav>

      {/* Tech indicators / Reset */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
          <span className="font-mono-code text-[11px]">3840×2160 Target</span>
          <span className="text-white/20">•</span>
          <span className="text-[11px] text-neutral-400">Max 2 Min Video</span>
        </div>

        {hasActiveJob && onReset && activeTab === 'studio' && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-neutral-300 hover:text-white transition-all duration-200 cursor-pointer"
            title="Upload new media"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Media</span>
          </button>
        )}
      </div>
    </header>
  );
};

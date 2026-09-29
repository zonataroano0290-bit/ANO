import React from 'react';
import { Film, Image as ImageIcon, Sparkles, Check, AlertCircle } from 'lucide-react';
import { AnoModelId } from '../types/index.js';

interface ModelSelectorProps {
  selectedModel: AnoModelId;
  onSelectModel: (model: AnoModelId) => void;
  mediaType?: 'image' | 'video';
  onIncompatibleClick?: (message: string) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
  mediaType,
  onIncompatibleClick,
  disabled,
}) => {
  const models = [
    {
      id: 'ANO 5.5 Flash' as AnoModelId,
      name: 'ANO 5.5 Flash',
      category: 'Video Super Resolution',
      forType: 'video',
      icon: Film,
      badge: 'Video 4K',
      accent: 'from-purple-600 to-indigo-600',
      activeBorder: 'border-purple-500/80 shadow-[0_0_25px_rgba(168,85,247,0.35)]',
      desc: 'Neural temporal frame consistency and sub-pixel edge synthesis for video.',
    },
    {
      id: 'ANO 3.1 V2' as AnoModelId,
      name: 'ANO 3.1 V2',
      category: 'Image Super Resolution',
      forType: 'image',
      icon: ImageIcon,
      badge: 'Image 4K',
      accent: 'from-cyan-500 to-blue-600',
      activeBorder: 'border-cyan-500/80 shadow-[0_0_25px_rgba(56,189,248,0.35)]',
      desc: 'High-frequency detail reconstruction and micro-contrast refinement for images.',
    },
  ];

  const handleModelClick = (modelId: AnoModelId, forType: string) => {
    if (disabled) return;

    if (mediaType && mediaType !== forType) {
      if (forType === 'video' && mediaType === 'image') {
        onIncompatibleClick?.('This model is designed for video enhancement.');
        return;
      }
      if (forType === 'image' && mediaType === 'video') {
        onIncompatibleClick?.('This model is designed for image enhancement.');
        return;
      }
    }

    onSelectModel(modelId);
  };

  return (
    <div className="w-full max-w-xl mx-auto my-4 select-none">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono-code flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          AI MODEL ARCHITECTURE
        </span>
        {mediaType && (
          <span className="text-[10px] text-neutral-400 font-mono-code">
            Auto-selected for {mediaType === 'video' ? 'video stream' : 'image format'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {models.map((m) => {
          const isSelected = selectedModel === m.id;
          const isIncompatible = mediaType && mediaType !== m.forType;
          const Icon = m.icon;

          return (
            <div
              key={m.id}
              onClick={() => handleModelClick(m.id, m.forType)}
              className={`relative p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden
                ${
                  isSelected
                    ? `bg-[#0e0e1a]/95 ${m.activeBorder} text-white`
                    : isIncompatible
                    ? 'bg-[#08080c]/60 border-white/[0.04] text-neutral-400 opacity-60 hover:opacity-80'
                    : 'bg-[#08080d]/80 border-white/[0.08] hover:border-white/20 text-neutral-300 hover:text-white'
                }
                backdrop-blur-xl group
              `}
            >
              {isSelected && (
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${m.accent}`} />
              )}

              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-white/[0.04] text-neutral-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm leading-tight text-white flex items-center gap-1.5">
                      {m.name}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-purple-400" />
                      )}
                    </h3>
                    <p className="text-[10px] text-neutral-400 font-mono-code">
                      {m.category}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-mono-code uppercase font-semibold ${
                    isSelected
                      ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                      : 'bg-white/[0.04] text-neutral-400 border border-white/5'
                  }`}
                >
                  {m.badge}
                </span>
              </div>

              <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2 mt-1">
                {m.desc}
              </p>

              {isIncompatible && (
                <div className="mt-2 pt-1.5 border-t border-white/[0.04] flex items-center gap-1 text-[10px] text-amber-400/90 font-mono-code">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Designed for {m.forType}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

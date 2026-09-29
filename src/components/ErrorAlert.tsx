import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onClose: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#12070e] border border-red-500/40 rounded-2xl p-4 shadow-[0_10px_40px_rgba(239,68,68,0.25)] flex items-start gap-3 backdrop-blur-xl">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-200 leading-snug">
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-red-400 hover:text-white transition-colors cursor-pointer p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

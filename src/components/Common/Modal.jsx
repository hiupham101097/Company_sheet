import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-soft-lg border border-pastel-200 overflow-hidden z-10 transition-all transform animate-scale-in`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pastel-100 bg-gradient-to-r from-pastel-50/90 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-5 rounded-full bg-pastel-500" />
            <h3 className="text-base font-bold text-slate-800 tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[82vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

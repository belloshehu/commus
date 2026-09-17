import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  position?: 'left' | 'right';
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  position = 'right',
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionStyles = {
    left: 'left-0 animate-slide-right',
    right: 'right-0 animate-slide-left',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Side panel'}
        className={`fixed top-0 bottom-0 w-full max-w-md bg-slate-900 border-x border-slate-800 shadow-2xl p-6 flex flex-col gap-4 ${positionStyles[position]}`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          {title && <h3 className="text-base font-bold text-slate-100">{title}</h3>}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

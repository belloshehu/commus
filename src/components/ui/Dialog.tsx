import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

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

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        aria-describedby={description ? 'dialog-desc' : undefined}
        className={`w-full ${maxWidthStyles[maxWidth]} bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && (
              <h3 id="dialog-title" className="text-lg font-bold text-slate-100">
                {title}
              </h3>
            )}
            {description && (
              <p id="dialog-desc" className="text-xs text-slate-400 mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-2 flex-1">{children}</div>
      </div>
    </div>
  );
};

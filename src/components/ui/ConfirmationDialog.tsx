import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isHighGravity?: boolean;
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isHighGravity = false,
  isLoading = false,
}) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className={`p-3.5 rounded-full ${isHighGravity ? 'bg-red-950/80 text-red-400 border border-red-800 animate-pulse' : 'bg-amber-950/80 text-amber-400 border border-amber-800'}`}>
          {isHighGravity ? <ShieldAlert className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-100">{title}</h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">{message}</p>
        </div>

        {isHighGravity && (
          <div className="p-3 bg-red-950/50 border border-red-900 rounded-lg text-[11px] text-red-200 text-left font-mono">
            ⚠️ <strong>Audited Operation</strong>: This action creates an immutable, hash-signed audit entry in the escalation system.
          </div>
        )}

        <div className="flex items-center gap-3 w-full mt-2">
          <Button variant="outline" fullWidth onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={isHighGravity ? 'danger' : 'primary'}
            fullWidth
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

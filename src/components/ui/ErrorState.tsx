import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Realtime Synchronization Error',
  message = 'Unable to establish live link with Realtime Database. Please check your network connection.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 border border-red-900/60 rounded-2xl bg-red-950/20 my-4 max-w-md mx-auto">
      <div className="p-3 bg-red-950 border border-red-800 rounded-full text-red-400 mb-3">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-red-200 mb-1">{title}</h3>
      <p className="text-xs text-red-300/80 max-w-sm mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onRetry}>
          Retry Connection
        </Button>
      )}
    </div>
  );
};

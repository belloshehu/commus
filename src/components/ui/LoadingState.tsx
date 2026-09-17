import React from 'react';

export interface LoadingStateProps {
  label?: string;
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Loading real-time safety data...',
  count = 3,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full" aria-busy="true" aria-label={label}>
      <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
        <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <span>{label}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-3 animate-pulse">
            <div className="h-4 bg-slate-800 rounded w-1/3" />
            <div className="h-6 bg-slate-800 rounded w-3/4" />
            <div className="h-12 bg-slate-800/60 rounded w-full" />
            <div className="h-8 bg-slate-800/40 rounded w-1/2 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
};

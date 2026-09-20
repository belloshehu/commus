import React from 'react';
import { ThumbsUp, ThumbsDown, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';

export interface VoteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  voteType: 'UP' | 'DOWN' | null;
  incidentTitle?: string;
  isLoading?: boolean;
}

export const VoteConfirmationModal: React.FC<VoteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  voteType,
  incidentTitle,
  isLoading = false,
}) => {
  if (!voteType) return null;

  const isUp = voteType === 'UP';

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        {/* Header Icon Badge */}
        <div
          className={`p-3.5 rounded-full border ${
            isUp
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
              : 'bg-rose-950/80 text-rose-400 border-rose-800'
          }`}
        >
          {isUp ? <ThumbsUp className="w-7 h-7" /> : <ThumbsDown className="w-7 h-7" />}
        </div>

        {/* Modal Title & Incident Context */}
        <div>
          <h3 className="text-base font-bold text-slate-100">
            {isUp ? 'Confirm Authenticity Upvote' : 'Question Report Authenticity'}
          </h3>
          {incidentTitle && (
            <p className="text-xs text-sky-400 font-mono mt-1 line-clamp-1">
              &quot;{incidentTitle}&quot;
            </p>
          )}
        </div>

        {/* Detailed Explanation */}
        <div className="text-xs text-slate-300 leading-relaxed text-left space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800 w-full">
          <p>
            {isUp
              ? 'By upvoting this safety report, you confirm to the community that this incident appears genuine, accurate, and helpful.'
              : 'By downvoting this safety report, you indicate to the community that this report may be inaccurate, misleading, or unverified.'}
          </p>

          <div
            className={`p-2.5 rounded-lg border text-[11px] font-medium flex items-start gap-2 ${
              isUp
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-900/60'
                : 'bg-rose-950/50 text-rose-300 border-rose-900/60'
            }`}
          >
            {isUp ? (
              <>
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>
                  <strong>Community Approval:</strong> Upvotes help verify authentic safety alerts and build trust across your safety zone.
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>
                  <strong>Authenticity Safeguard:</strong> If downvotes exceed <strong>20%</strong> of total community votes, this report will automatically display a <strong>&quot;Questionable Authenticity&quot;</strong> warning to alert members.
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons: Cancel or Confirm */}
        <div className="flex items-center gap-3 w-full mt-2">
          <Button variant="outline" fullWidth onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={isUp ? 'primary' : 'danger'}
            fullWidth
            onClick={onConfirm}
            isLoading={isLoading}
            icon={isUp ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
          >
            {isUp ? 'Confirm Upvote' : 'Confirm Downvote'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

import React from 'react';
import { User, Shield, MapPin, Key, Lock, LogOut } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  communityName?: string;
  pseudonymId?: string;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  isOpen,
  onClose,
  userRole = 'CITIZEN_MEMBER',
  communityName = 'Downtown Safety Zone',
  pseudonymId = 'pseudo_8f99a4c12',
}) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Citizen Member Security Profile" maxWidth="sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-sky-950 border border-sky-600 flex items-center justify-center text-sky-300 font-bold text-sm">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-100">Verified Member</span>
              <Badge variant="success" size="sm">ACTIVE</Badge>
            </div>
            <p className="text-xs text-slate-400">Authenticated via Firebase Auth</p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span>Assigned RBAC Role</span>
            </span>
            <span className="font-mono text-slate-200 font-bold">{userRole}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
            <span className="text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Community Boundary</span>
            </span>
            <span className="text-slate-200 font-semibold">{communityName}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>Public Pseudonym Token</span>
            </span>
            <span className="font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {pseudonymId}
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Privacy Guarantee</strong>: Your real email and identity are strictly isolated in a private database node inaccessible to public community members.
          </span>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="outline" size="sm" icon={<LogOut className="w-3.5 h-3.5" />} onClick={onClose}>
            Close Profile
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

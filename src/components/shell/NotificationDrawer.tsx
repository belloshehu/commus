import React from 'react';
import { Drawer } from '../ui/Drawer';
import { DangerLevelIndicator } from '../ui/DangerLevelIndicator';
import { Button } from '../ui/Button';

export interface AlertNotification {
  alertId: string;
  incidentId: string;
  title: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  message: string;
  safetyDisclaimer: string;
  issuedAt: number;
}

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertNotification[];
  onClearAlerts?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onClearAlerts,
}) => {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Realtime Community Safety Alerts" position="right">
      <div className="flex flex-col gap-4">
        {alerts.length > 0 && onClearAlerts && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onClearAlerts}>
              Clear All Alerts
            </Button>
          </div>
        )}

        {alerts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No active community safety alerts.
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.alertId} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <DangerLevelIndicator level={alert.riskLevel} compact />
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(alert.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-100">{alert.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>

              {alert.safetyDisclaimer && (
                <div className="p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-lg text-[11px] text-amber-200 font-medium">
                  ⚠️ {alert.safetyDisclaimer}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Drawer>
  );
};

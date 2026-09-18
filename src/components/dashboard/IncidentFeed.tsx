'use client';

import React from 'react';
import { IncidentCard, IncidentCardData } from '@/components/ui/IncidentCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterState } from './IncidentFilterBar';
import { Alert } from '@/components/ui/Alert';
import { DangerLevel } from '@/components/ui/DangerLevelIndicator';

interface IncidentFeedProps {
  incidents: IncidentCardData[];
  filters: FilterState;
  onViewDetails?: (id: string) => void;
  onEscalate?: (id: string) => void;
}

export const filterIncidents = (
  incidents: IncidentCardData[],
  filters: FilterState
): IncidentCardData[] => {
  const now = Date.now();

  return incidents.filter((incident) => {
    // 1. Community ID check
    if (filters.communityId && incident.communityId !== filters.communityId) {
      return false;
    }

    // 2. Danger level filter
    if (filters.dangerLevel !== 'ALL' && incident.severity !== filters.dangerLevel) {
      return false;
    }

    // 3. Status filter
    if (filters.statusFilter !== 'ALL' && incident.status !== filters.statusFilter) {
      return false;
    }

    // 4. Time filter
    if (filters.timeFilter === 'PAST_24_HOURS') {
      const past24h = now - 24 * 60 * 60 * 1000;
      if (incident.createdAt < past24h) return false;
    } else if (filters.timeFilter === 'PAST_7_DAYS') {
      const past7d = now - 7 * 24 * 60 * 60 * 1000;
      if (incident.createdAt < past7d) return false;
    } else if (filters.timeFilter === 'PAST_30_DAYS') {
      const past30d = now - 30 * 24 * 60 * 60 * 1000;
      if (incident.createdAt < past30d) return false;
    }

    // 5. Search query (title & description)
    if (filters.searchQuery.trim() !== '') {
      const query = filters.searchQuery.toLowerCase();
      const titleMatch = incident.title.toLowerCase().includes(query);
      const descMatch = incident.description.toLowerCase().includes(query);
      if (!titleMatch && !descMatch) return false;
    }

    return true;
  });
};

export const IncidentFeed: React.FC<IncidentFeedProps> = ({
  incidents,
  filters,
  onViewDetails,
  onEscalate,
}) => {
  const filtered = filterIncidents(incidents, filters);

  const highRiskCount = filtered.filter(
    (inc) => inc.severity === 'HIGH' || inc.severity === 'CRITICAL'
  ).length;

  if (filtered.length === 0) {
    return (
      <EmptyState
        title="No matching safety incidents found"
        description="Try adjusting your danger level, time range, or keyword search query filters."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual Prominence for High-Risk Alerts Banner (without sensationalizing) */}
      {highRiskCount > 0 && filters.dangerLevel !== 'LOW' && (
        <Alert type="safety">
          <strong>HIGH-RISK ALERT ZONE:</strong> {highRiskCount} high-gravity incident report(s) actively flagged in this community zone. Exercise appropriate caution and do NOT approach conflict areas.
        </Alert>
      )}

      {/* Incident Cards Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((incident) => {
          const isHighDanger = incident.severity === 'HIGH' || incident.severity === 'CRITICAL';

          return (
            <div
              key={incident.id}
              className={`rounded-2xl transition-all duration-300 ${
                isHighDanger
                  ? 'ring-2 ring-red-500/70 shadow-lg shadow-red-950/30'
                  : ''
              }`}
            >
              <IncidentCard
                incident={{
                  ...incident,
                  // Reporter Identity Guarantee
                  reporterLabel: 'Reported by a verified community member',
                }}
                onViewDetails={onViewDetails}
                onEscalate={onEscalate}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Filter, ShieldAlert, Clock, Building2, Layers } from 'lucide-react';

export type TimeFilter = 'ALL' | 'PAST_24_HOURS' | 'PAST_7_DAYS' | 'PAST_30_DAYS';
export type DangerLevelFilter = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type StatusFilter = 'ALL' | 'SUBMITTED' | 'VERIFIED' | 'ESCALATED' | 'RESOLVED' | 'DISMISSED';

export interface FilterState {
  searchQuery: string;
  dangerLevel: DangerLevelFilter;
  communityId: string;
  timeFilter: TimeFilter;
  statusFilter: StatusFilter;
  categoryFilter?: string;
}

export interface CommunityOption {
  id: string;
  name: string;
  isPrivate: boolean;
}

interface IncidentFilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  availableCommunities: CommunityOption[];
  totalResultsCount: number;
}

export const IncidentFilterBar: React.FC<IncidentFilterBarProps> = ({
  filters,
  onFilterChange,
  availableCommunities,
  totalResultsCount,
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
      {/* Top Search & Filter Summary Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="w-full md:w-80">
          <Input
            placeholder="Search title, description, or landmark..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            icon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Results Counter & Quick Reset */}
        <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            Active Incidents: <strong className="text-slate-100">{totalResultsCount}</strong>
          </span>

          {(filters.dangerLevel !== 'ALL' ||
            filters.timeFilter !== 'ALL' ||
            filters.statusFilter !== 'ALL' ||
            (filters.categoryFilter && filters.categoryFilter !== 'ALL') ||
            filters.searchQuery !== '') && (
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filters,
                  dangerLevel: 'ALL',
                  timeFilter: 'ALL',
                  statusFilter: 'ALL',
                  categoryFilter: 'ALL',
                  searchQuery: '',
                })
              }
              className="text-sky-400 hover:underline text-[11px] font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Multi-Criteria Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 border-t border-slate-800/80 pt-4">
        {/* 1. Community Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Building2 className="w-3 h-3 text-sky-400" /> Community Zone
          </label>
          <select
            value={filters.communityId}
            onChange={(e) => onFilterChange({ ...filters, communityId: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
          >
            {availableCommunities.map((comm) => (
              <option key={comm.id} value={comm.id}>
                {comm.name} {comm.isPrivate ? '(Private)' : '(Public)'}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Category Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-400" /> Category
          </label>
          <select
            value={filters.categoryFilter || 'ALL'}
            onChange={(e) => onFilterChange({ ...filters, categoryFilter: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="CROWD_SAFETY_ALERT">👥 Crowd Safety Alert</option>
            <option value="TRAFFIC_HAZARD">🚗 Traffic Hazard</option>
            <option value="INFRASTRUCTURE_FAILURE">⚡ Infrastructure Failure</option>
            <option value="DISTURBANCE">📢 Disturbance</option>
            <option value="EMERGENCY_OTHER">🛡️ Emergency Other</option>
          </select>
        </div>

        {/* 3. Danger Level Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-red-400" /> Danger Assessment
          </label>
          <select
            value={filters.dangerLevel}
            onChange={(e) => onFilterChange({ ...filters, dangerLevel: e.target.value as DangerLevelFilter })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
          >
            <option value="ALL">All Danger Levels</option>
            <option value="HIGH">🚨 HIGH Danger (Immediate Threat)</option>
            <option value="MEDIUM">⚠️ MEDIUM Danger (Caution Required)</option>
            <option value="LOW">ℹ️ LOW Danger (Informational)</option>
          </select>
        </div>

        {/* 4. Time Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" /> Time Window
          </label>
          <select
            value={filters.timeFilter}
            onChange={(e) => onFilterChange({ ...filters, timeFilter: e.target.value as TimeFilter })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
          >
            <option value="ALL">All Time History</option>
            <option value="PAST_24_HOURS">Past 24 Hours</option>
            <option value="PAST_7_DAYS">Past 7 Days</option>
            <option value="PAST_30_DAYS">Past 30 Days</option>
          </select>
        </div>

        {/* 5. Status Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" /> Status Lifecycle
          </label>
          <select
            value={filters.statusFilter}
            onChange={(e) => onFilterChange({ ...filters, statusFilter: e.target.value as StatusFilter })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
          >
            <option value="ALL">All Lifecycle</option>
            <option value="SUBMITTED">SUBMITTED (Newly Reported)</option>
            <option value="VERIFIED">VERIFIED (Confirmed)</option>
            <option value="ESCALATED">ESCALATED (Alerted)</option>
            <option value="RESOLVED">RESOLVED (Closed)</option>
            <option value="DISMISSED">DISMISSED (Invalid)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

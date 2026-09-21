export type GuidanceCategory =
  | 'fire'
  | 'traffic_accident'
  | 'gas_leakage'
  | 'theft'
  | 'mob_justice'
  | 'vandalization';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type MediaType = 'image' | 'video' | 'audio';

export interface GuidanceMedia {
  id: string;
  type: MediaType;
  url: string;
  title: string;
  caption?: string;
  thumbnailUrl?: string;
  duration?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  roleOrAgency?: string;
}

export interface SafetyGuide {
  id: string;
  title: string;
  category: GuidanceCategory;
  summary: string;
  description: string;
  urgencyLevel: UrgencyLevel;
  doList: string[];
  dontList: string[];
  emergencyContacts: EmergencyContact[];
  media: GuidanceMedia[];
  author: {
    uid: string;
    name: string;
    role: string;
    organization?: string;
  };
  createdAt: number;
  updatedAt?: number;
  isOfficial: boolean;
}

export interface GuidanceCategoryMeta {
  id: GuidanceCategory;
  label: string;
  shortLabel: string;
  iconName: string;
  description: string;
  badgeColor: string;
  borderColor: string;
  accentBg: string;
}

export const GUIDANCE_CATEGORIES: GuidanceCategoryMeta[] = [
  {
    id: 'fire',
    label: 'Fire Outbreaks & Emergency Response',
    shortLabel: 'Fire Outbreak',
    iconName: 'Flame',
    description: 'Protocols for domestic fires, electrical infernos, and rapid evacuation.',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
    borderColor: 'border-red-500/40',
    accentBg: 'bg-red-950/30',
  },
  {
    id: 'traffic_accident',
    label: 'Road & Traffic Accidents',
    shortLabel: 'Traffic Accident',
    iconName: 'Car',
    description: 'Highway collision response, victim stabilization, and traffic warning procedures.',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    borderColor: 'border-amber-500/40',
    accentBg: 'bg-amber-950/30',
  },
  {
    id: 'gas_leakage',
    label: 'Gas Leakage & Chemical Hazards',
    shortLabel: 'Gas Leakage',
    iconName: 'Wind',
    description: 'LPG cylinder safety, pipeline leaks, asphyxiation prevention, and ventilation.',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    borderColor: 'border-cyan-500/40',
    accentBg: 'bg-cyan-950/30',
  },
  {
    id: 'theft',
    label: 'Theft, Burglary & Robbery Defense',
    shortLabel: 'Theft & Burglary',
    iconName: 'ShieldAlert',
    description: 'Residential security, robbery survival, evidence preservation, and neighborhood alerts.',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    borderColor: 'border-purple-500/40',
    accentBg: 'bg-purple-950/30',
  },
  {
    id: 'mob_justice',
    label: 'Mob Violence & Anti-Vigilantism',
    shortLabel: 'Mob Justice',
    iconName: 'Users',
    description: 'De-escalation tactics, crowd avoidance, non-confrontation protocols, and law enforcement dispatch.',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    borderColor: 'border-rose-500/40',
    accentBg: 'bg-rose-950/30',
  },
  {
    id: 'vandalization',
    label: 'Vandalism & Infrastructure Protection',
    shortLabel: 'Vandalization',
    iconName: 'AlertTriangle',
    description: 'Reporting public asset destruction, power cable theft, and community vigilance.',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    borderColor: 'border-emerald-500/40',
    accentBg: 'bg-emerald-950/30',
  },
];

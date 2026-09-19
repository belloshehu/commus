export type AuthorityCategory =
  | 'ALL'
  | 'POLICE_SECURITY'
  | 'RESCUE_FIRE'
  | 'ROAD_SAFETY'
  | 'DISASTER_RELIEF';

export interface AuthorityOrganization {
  id: string;
  title: string;
  acronym: string;
  category: AuthorityCategory;
  categoryLabel: string;
  description: string;
  primaryPhone: string;
  secondaryPhone?: string;
  tollFree?: string;
  brandGradient: string;
  borderColor: string;
  iconType: 'police' | 'fire' | 'road' | 'nema' | 'nscdc' | 'sema';
  dispatchEndpoint: string;
}

export const COMMON_AUTHORITIES: AuthorityOrganization[] = [
  {
    id: 'org_police_npf',
    title: 'Nigeria Police Force',
    acronym: 'NPF',
    category: 'POLICE_SECURITY',
    categoryLabel: 'Law Enforcement',
    description: 'Primary national law enforcement agency responsible for public safety, criminal investigation, crime prevention, and emergency threat response.',
    primaryPhone: '112',
    secondaryPhone: '0803-301-1037',
    tollFree: '112',
    brandGradient: 'from-blue-950 via-slate-900 to-indigo-950',
    borderColor: 'border-blue-600/80',
    iconType: 'police',
    dispatchEndpoint: 'https://mock.authority-gateway.local/v1/police',
  },
  {
    id: 'org_disaster_nema',
    title: 'National Emergency Management Agency',
    acronym: 'NEMA',
    category: 'DISASTER_RELIEF',
    categoryLabel: 'Disaster & Relief',
    description: 'Federal emergency management agency coordinating disaster prevention, flood relief, search & rescue operations, and humanitarian emergency aid.',
    primaryPhone: '0800-2255-6362',
    secondaryPhone: '0803-200-3557',
    tollFree: '0800-CALL-NEMA',
    brandGradient: 'from-teal-950 via-slate-900 to-emerald-950',
    borderColor: 'border-teal-600/80',
    iconType: 'nema',
    dispatchEndpoint: 'https://mock.authority-gateway.local/v1/nema',
  },
  {
    id: 'org_fire_ffs',
    title: 'Federal Fire Service',
    acronym: 'FFS',
    category: 'RESCUE_FIRE',
    categoryLabel: 'Fire & Structural Rescue',
    description: 'National fire suppression and rescue authority for structural fires, industrial hazards, chemical spills, and life-saving rescue operations.',
    primaryPhone: '0803-200-3557',
    secondaryPhone: '112',
    tollFree: '112',
    brandGradient: 'from-red-950 via-slate-900 to-amber-950',
    borderColor: 'border-red-600/80',
    iconType: 'fire',
    dispatchEndpoint: 'https://mock.authority-gateway.local/v1/fire',
  },
  {
    id: 'org_road_frsc',
    title: 'Federal Road Safety Corps',
    acronym: 'FRSC',
    category: 'ROAD_SAFETY',
    categoryLabel: 'Highway & Traffic Safety',
    description: 'Federal highway traffic management agency responsible for road safety enforcement, highway crash rescue, and clearing dangerous transit obstructions.',
    primaryPhone: '122',
    secondaryPhone: '0700-2255-3772',
    tollFree: '122',
    brandGradient: 'from-emerald-950 via-slate-900 to-green-950',
    borderColor: 'border-emerald-600/80',
    iconType: 'road',
    dispatchEndpoint: 'https://mock.authority-gateway.local/v1/frsc',
  },
  {
    id: 'org_civil_nscdc',
    title: 'Nigeria Security and Civil Defence Corps',
    acronym: 'NSCDC',
    category: 'POLICE_SECURITY',
    categoryLabel: 'Civil Protection',
    description: 'Paramilitary security agency protecting critical national infrastructure, oil pipelines, public assets, and assisting in civilian threat mitigation.',
    primaryPhone: '0800-4663-7222',
    secondaryPhone: '0802-321-1234',
    tollFree: '0800-NSCDC',
    brandGradient: 'from-indigo-950 via-slate-900 to-slate-950',
    borderColor: 'border-indigo-600/80',
    iconType: 'nscdc',
    dispatchEndpoint: 'https://mock.authority-gateway.local/v1/nscdc',
  },
  {
    id: 'org_state_sema',
    title: 'State Emergency Response Agency',
    acronym: 'SEMA',
    category: 'DISASTER_RELIEF',
    categoryLabel: 'State Medical & Rescue',
    description: 'State-level emergency first-responder agency providing rapid medical evacuation, urban disaster response, and heavy rescue equipment.',
    primaryPhone: '767',
    secondaryPhone: '112',
    tollFree: '767',
    brandGradient: 'from-sky-950 via-slate-900 to-cyan-950',
    borderColor: 'border-sky-600/80',
    iconType: 'sema',
    dispatchEndpoint: 'https://mock.authority-gateway.local/v1/sema',
  },
];

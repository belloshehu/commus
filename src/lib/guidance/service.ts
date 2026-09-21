import { ref, get, set, push, onValue, Unsubscribe } from 'firebase/database';
import { rtdb } from '../firebase/client';
import { UserSession } from '../auth';
import { can } from '../authorization';
import { SafetyGuide, GuidanceCategory, UrgencyLevel, GuidanceMedia, EmergencyContact } from './types';
import { INITIAL_SAFETY_GUIDES } from './mockData';

const GUIDANCE_REF_PATH = '/safetyGuidance';

export async function fetchSafetyGuides(): Promise<SafetyGuide[]> {
  try {
    const dbRef = ref(rtdb, GUIDANCE_REF_PATH);
    const snapshot = await get(dbRef);

    if (!snapshot.exists()) {
      return INITIAL_SAFETY_GUIDES;
    }

    const data = snapshot.val();
    const guides: SafetyGuide[] = Object.keys(data).map((key) => ({
      ...data[key],
      id: data[key].id || key,
    }));

    // Combine RTDB guides with mock guides (avoiding duplicates)
    const existingIds = new Set(guides.map((g) => g.id));
    const combined = [...guides];

    for (const mockGuide of INITIAL_SAFETY_GUIDES) {
      if (!existingIds.has(mockGuide.id)) {
        combined.push(mockGuide);
      }
    }

    return combined.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.warn('[Safety Guidance Service] Failed to fetch from RTDB, falling back to initial data:', err);
    return INITIAL_SAFETY_GUIDES;
  }
}

export function subscribeSafetyGuides(callback: (guides: SafetyGuide[]) => void): Unsubscribe {
  try {
    const dbRef = ref(rtdb, GUIDANCE_REF_PATH);
    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          callback(INITIAL_SAFETY_GUIDES);
          return;
        }

        const data = snapshot.val();
        const guides: SafetyGuide[] = Object.keys(data).map((key) => ({
          ...data[key],
          id: data[key].id || key,
        }));

        const existingIds = new Set(guides.map((g) => g.id));
        const combined = [...guides];

        for (const mockGuide of INITIAL_SAFETY_GUIDES) {
          if (!existingIds.has(mockGuide.id)) {
            combined.push(mockGuide);
          }
        }

        callback(combined.sort((a, b) => b.createdAt - a.createdAt));
      },
      (error) => {
        console.warn('[Safety Guidance Service] RTDB subscription error:', error);
        callback(INITIAL_SAFETY_GUIDES);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('[Safety Guidance Service] RTDB subscription setup failed:', err);
    callback(INITIAL_SAFETY_GUIDES);
    return () => {};
  }
}

export interface CreateGuideInput {
  title: string;
  category: GuidanceCategory;
  summary: string;
  description: string;
  urgencyLevel: UrgencyLevel;
  doList: string[];
  dontList: string[];
  emergencyContacts: EmergencyContact[];
  media?: GuidanceMedia[];
}

export async function createSafetyGuide(
  session: UserSession | null,
  input: CreateGuideInput
): Promise<SafetyGuide> {
  if (!session || !can(session, 'guidance:create')) {
    throw new Error('UNAUTHORIZED: Only verified authorities and system administrators can post Safety Guidance.');
  }

  const newGuideRef = push(ref(rtdb, GUIDANCE_REF_PATH));
  const newId = newGuideRef.key || `guide_${Date.now()}`;

  const guide: SafetyGuide = {
    id: newId,
    title: input.title.trim(),
    category: input.category,
    summary: input.summary.trim(),
    description: input.description.trim(),
    urgencyLevel: input.urgencyLevel,
    doList: input.doList.filter((item) => item.trim().length > 0),
    dontList: input.dontList.filter((item) => item.trim().length > 0),
    emergencyContacts: input.emergencyContacts || [],
    media: input.media || [],
    author: {
      uid: session.userId || 'system_authority',
      name: session.userId ? `Safety Officer (${session.userId.slice(0, 6)})` : 'Verified Safety Officer',
      role: String(session.role),
      organization: 'Community Safety Directorate',
    },
    createdAt: Date.now(),
    isOfficial: true,
  };

  await set(newGuideRef, guide);
  return guide;
}

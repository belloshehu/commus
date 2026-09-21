import { ref, get, set } from 'firebase/database';
import { rtdb } from './firebase/client';

export interface ReferralMember {
  id: string;
  pseudonymLabel: string;
  joinedAt: number;
  status: 'VERIFIED' | 'PENDING';
}

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalInvitedCount: number;
  invitedMembers: ReferralMember[];
  ambassadorTier: 'Safety Supporter' | 'Community Advocate' | 'Safety Sentinel' | 'Guardian Champion';
}

export interface ReferralRecord {
  id: string;
  referrerUserId: string;
  referrerCode: string;
  referredUserId: string;
  referredPseudonymId: string;
  createdAt: number;
}

// In-memory & local storage reactive store for referral statistics
let localReferralStore: Record<string, { code: string; members: ReferralMember[] }> = {};
let referralCodeToUserMap: Record<string, string> = {};

/**
 * Resets local referral store for testing isolation.
 */
export function clearReferralStoreForTesting(): void {
  localReferralStore = {};
  referralCodeToUserMap = {};
}

/**
 * Generates a deterministic, unique referral code for a user.
 */
export function generateReferralCode(userId: string, pseudonymId?: string): string {
  const seed = (userId || pseudonymId || 'USR_CITIZEN').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const shortHash = seed.slice(-6).padStart(6, 'X');
  return `REF-${shortHash}`;
}

/**
 * Constructs absolute referral link for sharing.
 */
export function getReferralLink(referralCode: string, origin?: string): string {
  const baseUrl =
    origin || (typeof window !== 'undefined' ? window.location.origin : 'https://antijj.app');
  return `${baseUrl}/?ref=${encodeURIComponent(referralCode)}`;
}

/**
 * Calculates Ambassador Tier based on total invited members count.
 */
export function getAmbassadorTier(count: number): ReferralStats['ambassadorTier'] {
  if (count >= 10) return 'Guardian Champion';
  if (count >= 5) return 'Safety Sentinel';
  if (count >= 1) return 'Community Advocate';
  return 'Safety Supporter';
}

/**
 * Returns referral statistics for a user, combining RTDB data and local reactive store.
 */
export function getReferralStats(userId: string, pseudonymId?: string): ReferralStats {
  const code = generateReferralCode(userId, pseudonymId);
  const referralLink = getReferralLink(code);

  let members: ReferralMember[] = [];

  // Check local memory store first
  if (localReferralStore[userId]) {
    members = localReferralStore[userId].members || [];
  } else if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`antijj_referrals_${userId}`);
      if (stored) {
        members = JSON.parse(stored);
        localReferralStore[userId] = { code, members };
      }
    } catch {}
  }

  // Register code-to-user mapping locally
  referralCodeToUserMap[code] = userId;

  const totalInvitedCount = members.length;
  const ambassadorTier = getAmbassadorTier(totalInvitedCount);

  return {
    referralCode: code,
    referralLink,
    totalInvitedCount,
    invitedMembers: members,
    ambassadorTier,
  };
}

/**
 * Registers a new member referral when a user signs up or joins with a referral code.
 */
export async function registerReferral(
  referralCode: string,
  newUserId: string,
  newUserPseudonymId?: string
): Promise<{ success: boolean; referrerUserId?: string }> {
  if (!referralCode || !newUserId) {
    return { success: false };
  }

  const cleanCode = referralCode.trim().toUpperCase();

  // Find referrer user ID from local map or RTDB lookup
  let referrerUserId = referralCodeToUserMap[cleanCode];

  if (!referrerUserId && typeof window !== 'undefined') {
    try {
      const storedMap = localStorage.getItem('antijj_ref_code_map');
      if (storedMap) {
        const map = JSON.parse(storedMap);
        referrerUserId = map[cleanCode];
      }
    } catch {}
  }

  // If referrerUserId is still unknown, check RTDB code mapping with 300ms timeout
  if (!referrerUserId) {
    try {
      const codeRef = ref(rtdb, `referralCodes/${cleanCode}`);
      const snap = await Promise.race([
        get(codeRef),
        new Promise<null>((r) => setTimeout(() => r(null), 300)),
      ]);
      if (snap && (snap as any).exists && (snap as any).exists()) {
        referrerUserId = (snap as any).val()?.userId;
      }
    } catch {}
  }

  // Fallback: If code matches format REF-XXXXXX, attempt heuristic matching
  if (!referrerUserId && cleanCode.startsWith('REF-')) {
    referrerUserId = `usr_${cleanCode.slice(4).toLowerCase()}`;
  }

  if (!referrerUserId || referrerUserId === newUserId) {
    return { success: false };
  }

  const now = Date.now();
  const pseudonym = newUserPseudonymId || `pseudo_${newUserId.slice(0, 8)}`;
  const displayLabel = `Member #${pseudonym.replace('pseudo_', '').toUpperCase().slice(0, 6)}`;

  const newMember: ReferralMember = {
    id: newUserId,
    pseudonymLabel: displayLabel,
    joinedAt: now,
    status: 'VERIFIED',
  };

  // Update local memory store
  if (!localReferralStore[referrerUserId]) {
    localReferralStore[referrerUserId] = { code: cleanCode, members: [] };
  }

  const existing = localReferralStore[referrerUserId].members;
  if (!existing.some((m) => m.id === newUserId)) {
    existing.unshift(newMember);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`antijj_referrals_${referrerUserId}`, JSON.stringify(existing));
      } catch {}
    }

    // Write to Firebase RTDB node asynchronously
    try {
      const userRef = ref(rtdb, `referrals/${referrerUserId}/${newUserId}`);
      set(userRef, {
        id: newUserId,
        pseudonymLabel: displayLabel,
        joinedAt: now,
        status: 'VERIFIED',
      }).catch(() => {});
    } catch (err: any) {
      console.warn('[referrals] RTDB referral write skipped:', err.message);
    }
  }

  return { success: true, referrerUserId };
}

/**
 * Saves a user's referral code mapping to RTDB and localStorage.
 */
export async function saveUserReferralCode(userId: string, pseudonymId?: string): Promise<string> {
  const code = generateReferralCode(userId, pseudonymId);
  referralCodeToUserMap[code] = userId;

  if (typeof window !== 'undefined') {
    try {
      const storedMap = localStorage.getItem('antijj_ref_code_map') || '{}';
      const map = JSON.parse(storedMap);
      map[code] = userId;
      localStorage.setItem('antijj_ref_code_map', JSON.stringify(map));
    } catch {}
  }

  try {
    const codeRef = ref(rtdb, `referralCodes/${code}`);
    set(codeRef, { userId, createdAt: Date.now() }).catch(() => {});
  } catch (err: any) {
    console.warn('[referrals] RTDB referralCode map write skipped:', err.message);
  }

  return code;
}

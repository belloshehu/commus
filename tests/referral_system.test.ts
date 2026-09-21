import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateReferralCode,
  getReferralLink,
  getAmbassadorTier,
  getReferralStats,
  registerReferral,
  saveUserReferralCode,
  clearReferralStoreForTesting,
} from '@/lib/referrals';

describe('Member Referral System & Network Growth', () => {
  const referrerUserId = 'usr_referrer_123';
  const referrerPseudonym = 'pseudo_ref123';

  beforeEach(() => {
    clearReferralStoreForTesting();
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      localStorage.clear();
    }
  });

  it('generates deterministic unique referral codes', () => {
    const code = generateReferralCode(referrerUserId, referrerPseudonym);
    expect(code).toMatch(/^REF-/);
    expect(code.length).toBeGreaterThanOrEqual(7);
  });

  it('constructs valid referral links for sharing', () => {
    const code = 'REF-A1B2C3';
    const link = getReferralLink(code, 'https://antijj.app');
    expect(link).toBe('https://antijj.app/?ref=REF-A1B2C3');
  });

  it('calculates ambassador tier ranks based on invite counts', () => {
    expect(getAmbassadorTier(0)).toBe('Safety Supporter');
    expect(getAmbassadorTier(1)).toBe('Community Advocate');
    expect(getAmbassadorTier(4)).toBe('Community Advocate');
    expect(getAmbassadorTier(5)).toBe('Safety Sentinel');
    expect(getAmbassadorTier(10)).toBe('Guardian Champion');
  });

  it('initializes referral stats for new user with 0 invited members', () => {
    const stats = getReferralStats(referrerUserId, referrerPseudonym);
    expect(stats.referralCode).toMatch(/^REF-/);
    expect(stats.totalInvitedCount).toBe(0);
    expect(stats.invitedMembers).toEqual([]);
    expect(stats.ambassadorTier).toBe('Safety Supporter');
  });

  it('registers a new member referral and increments total count', async () => {
    const code = await saveUserReferralCode(referrerUserId, referrerPseudonym);
    const newUserId = 'usr_new_neighbor_456';
    const newUserPseudonym = 'pseudo_neigh456';

    const result = await registerReferral(code, newUserId, newUserPseudonym);
    expect(result.success).toBe(true);

    const updatedStats = getReferralStats(referrerUserId, referrerPseudonym);
    expect(updatedStats.totalInvitedCount).toBe(1);
    expect(updatedStats.ambassadorTier).toBe('Community Advocate');
    expect(updatedStats.invitedMembers).toHaveLength(1);
    expect(updatedStats.invitedMembers[0].id).toBe(newUserId);
    expect(updatedStats.invitedMembers[0].pseudonymLabel).toMatch(/^Member #/);
    expect(updatedStats.invitedMembers[0].status).toBe('VERIFIED');
  });

  it('prevents self-referrals or duplicate referral registrations', async () => {
    const code = await saveUserReferralCode(referrerUserId, referrerPseudonym);

    // Self-referral attempt
    const selfResult = await registerReferral(code, referrerUserId, referrerPseudonym);
    expect(selfResult.success).toBe(false);

    // Valid referral first time
    const newUserId = 'usr_friend_789';
    await registerReferral(code, newUserId, 'pseudo_friend789');

    // Duplicate registration attempt for same user
    await registerReferral(code, newUserId, 'pseudo_friend789');

    const stats = getReferralStats(referrerUserId, referrerPseudonym);
    expect(stats.totalInvitedCount).toBe(1);
  });
});

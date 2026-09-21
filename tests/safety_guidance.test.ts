import { describe, it, expect, vi } from 'vitest';
import { GUIDANCE_CATEGORIES } from '../src/lib/guidance/types';
import { INITIAL_SAFETY_GUIDES } from '../src/lib/guidance/mockData';
import { can } from '../src/lib/authorization';

describe('Safety Guidance System', () => {
  it('defines metadata for all 6 safety categories', () => {
    const categories = GUIDANCE_CATEGORIES.map((c) => c.id);
    expect(categories).toContain('fire');
    expect(categories).toContain('traffic_accident');
    expect(categories).toContain('gas_leakage');
    expect(categories).toContain('theft');
    expect(categories).toContain('mob_justice');
    expect(categories).toContain('vandalization');
    expect(categories.length).toBe(6);
  });

  it('provides initial seed guides covering topics with media', () => {
    expect(INITIAL_SAFETY_GUIDES.length).toBeGreaterThanOrEqual(6);
    
    const fireGuide = INITIAL_SAFETY_GUIDES.find(g => g.category === 'fire');
    expect(fireGuide).toBeDefined();
    expect(fireGuide?.media.length).toBeGreaterThan(0);
    expect(fireGuide?.doList.length).toBeGreaterThan(0);
    expect(fireGuide?.dontList.length).toBeGreaterThan(0);
    expect(fireGuide?.emergencyContacts.length).toBeGreaterThan(0);

    const mobJusticeGuide = INITIAL_SAFETY_GUIDES.find(g => g.category === 'mob_justice');
    expect(mobJusticeGuide).toBeDefined();
    expect(mobJusticeGuide?.urgencyLevel).toBe('CRITICAL');
  });

  it('restricts safety guidance creation permissions to authorities', () => {
    const userSession = { role: 'user', isAuthenticated: true };
    const authoritySession = { role: 'authority', isAuthenticated: true };
    const adminSession = { role: 'admin', isAuthenticated: true };
    const superAdminSession = { role: 'super_admin', isAuthenticated: true };

    expect(can(userSession, 'guidance:create')).toBe(false);
    expect(can(authoritySession, 'guidance:create')).toBe(true);
    expect(can(adminSession, 'guidance:create')).toBe(true);
    expect(can(superAdminSession, 'guidance:create')).toBe(true);
  });
});

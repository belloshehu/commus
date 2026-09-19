import { describe, it, expect } from 'vitest';
import { COMMON_AUTHORITIES, AuthorityOrganization } from '../src/lib/authority/organizations';

describe('Authority Directory Data Integrity', () => {
  it('contains mandatory emergency organizations (NPF, NEMA, FFS, FRSC, NSCDC, SEMA)', () => {
    const acronyms = COMMON_AUTHORITIES.map((org) => org.acronym);
    expect(acronyms).toContain('NPF');
    expect(acronyms).toContain('NEMA');
    expect(acronyms).toContain('FFS');
    expect(acronyms).toContain('FRSC');
    expect(acronyms).toContain('NSCDC');
    expect(acronyms).toContain('SEMA');
  });

  it('validates every authority has a non-empty title, category, description, and primary hotline', () => {
    COMMON_AUTHORITIES.forEach((org: AuthorityOrganization) => {
      expect(org.id).toBeTruthy();
      expect(org.title).toBeTruthy();
      expect(org.category).toBeTruthy();
      expect(org.description.length).toBeGreaterThan(15);
      expect(org.primaryPhone).toBeTruthy();
      expect(org.brandGradient).toContain('from-');
      expect(org.dispatchEndpoint).toContain('https://');
    });
  });

  it('correctly filters organizations by category', () => {
    const policeOrgs = COMMON_AUTHORITIES.filter((org) => org.category === 'POLICE_SECURITY');
    expect(policeOrgs.some((o) => o.acronym === 'NPF')).toBe(true);
    expect(policeOrgs.some((o) => o.acronym === 'NSCDC')).toBe(true);

    const fireOrgs = COMMON_AUTHORITIES.filter((org) => org.category === 'RESCUE_FIRE');
    expect(fireOrgs.some((o) => o.acronym === 'FFS')).toBe(true);

    const roadOrgs = COMMON_AUTHORITIES.filter((org) => org.category === 'ROAD_SAFETY');
    expect(roadOrgs.some((o) => o.acronym === 'FRSC')).toBe(true);

    const disasterOrgs = COMMON_AUTHORITIES.filter((org) => org.category === 'DISASTER_RELIEF');
    expect(disasterOrgs.some((o) => o.acronym === 'NEMA')).toBe(true);
  });
});

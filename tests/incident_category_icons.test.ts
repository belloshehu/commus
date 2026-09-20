import { describe, it, expect } from 'vitest';
import { getCategoryConfig, CATEGORY_CONFIG_MAP } from '../src/lib/incidentCategoryHelper';
import { IncidentCategory } from '../src/lib/firebase/rtdb';

describe('Incident Category Icons & Styling Helper Suite', () => {
  const allCategories: IncidentCategory[] = [
    'CROWD_SAFETY_ALERT',
    'TRAFFIC_HAZARD',
    'INFRASTRUCTURE_FAILURE',
    'DISTURBANCE',
    'EMERGENCY_OTHER',
  ];

  it('provides a complete configuration mapping for all 5 incident categories', () => {
    allCategories.forEach((cat) => {
      const config = getCategoryConfig(cat);
      expect(config).toBeDefined();
      expect(config.key).toBe(cat);
      expect(config.label).toBeTruthy();
      expect(config.shortLabel).toBeTruthy();
      expect(config.description).toBeTruthy();
      expect(config.icon).toBeDefined();
      expect(config.colorClass.bg).toBeTruthy();
      expect(config.colorClass.border).toBeTruthy();
      expect(config.colorClass.text).toBeTruthy();
      expect(config.colorClass.badgeBg).toBeTruthy();
      expect(config.colorClass.badgeText).toBeTruthy();
      expect(config.colorClass.badgeBorder).toBeTruthy();
      expect(config.colorClass.iconBg).toBeTruthy();
    });
  });

  it('maps correct Lucide icons and themes to specific incident categories', () => {
    const crowdConfig = getCategoryConfig('CROWD_SAFETY_ALERT');
    expect(crowdConfig.shortLabel).toBe('Crowd Safety');
    expect(crowdConfig.colorClass.text).toContain('purple');

    const trafficConfig = getCategoryConfig('TRAFFIC_HAZARD');
    expect(trafficConfig.shortLabel).toBe('Traffic');
    expect(trafficConfig.colorClass.text).toContain('amber');

    const infraConfig = getCategoryConfig('INFRASTRUCTURE_FAILURE');
    expect(infraConfig.shortLabel).toBe('Infrastructure');
    expect(infraConfig.colorClass.text).toContain('sky');

    const disturbanceConfig = getCategoryConfig('DISTURBANCE');
    expect(disturbanceConfig.shortLabel).toBe('Disturbance');
    expect(disturbanceConfig.colorClass.text).toContain('rose');

    const emergencyConfig = getCategoryConfig('EMERGENCY_OTHER');
    expect(emergencyConfig.shortLabel).toBe('Emergency');
    expect(emergencyConfig.colorClass.text).toContain('emerald');
  });

  it('handles case-insensitive category strings cleanly', () => {
    const configLower = getCategoryConfig('traffic_hazard');
    expect(configLower.key).toBe('TRAFFIC_HAZARD');
    expect(configLower.label).toBe('Traffic Hazard');
  });

  it('gracefully provides fallback configuration for unknown or null categories', () => {
    const nullConfig = getCategoryConfig(null);
    expect(nullConfig).toBeDefined();
    expect(nullConfig.label).toBe('Emergency Alert');
    expect(nullConfig.icon).toBeDefined();

    const unknownConfig = getCategoryConfig('UNKNOWN_CATEGORY_XYZ');
    expect(unknownConfig).toBeDefined();
    expect(unknownConfig.label).toBe('Emergency Alert');
  });
});

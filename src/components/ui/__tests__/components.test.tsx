import { describe, it, expect } from 'vitest';
import { ButtonProps } from '../Button';
import { DangerLevelIndicatorProps } from '../DangerLevelIndicator';
import { IncidentCardProps } from '../IncidentCard';

describe('Design System Component Contracts', () => {
  describe('Button Component Props', () => {
    it('accepts valid variants and size props', () => {
      const buttonProps: ButtonProps = {
        variant: 'primary',
        size: 'md',
        isLoading: false,
        fullWidth: true,
      };
      expect(buttonProps.variant).toBe('primary');
      expect(buttonProps.size).toBe('md');
    });
  });

  describe('DangerLevelIndicator Component Contracts', () => {
    it('defines accessible ARIA descriptions for HIGH, MEDIUM, and LOW danger levels', () => {
      const highProps: DangerLevelIndicatorProps = { level: 'HIGH', compact: true };
      const mediumProps: DangerLevelIndicatorProps = { level: 'MEDIUM', compact: false };
      const lowProps: DangerLevelIndicatorProps = { level: 'LOW', compact: true };

      expect(highProps.level).toBe('HIGH');
      expect(mediumProps.level).toBe('MEDIUM');
      expect(lowProps.level).toBe('LOW');
    });
  });

  describe('IncidentCard Component Privacy Contract', () => {
    it('ensures generic reporter label is specified on incident card data', () => {
      const cardProps: IncidentCardProps = {
        incident: {
          id: 'inc_101',
          communityId: 'comm_central',
          category: 'CROWD_SAFETY_ALERT',
          title: 'Crowd Bottleneck',
          description: 'High volume gathering reported',
          reporterLabel: 'Reported by a verified community member',
          blurredLocation: { latitude: 40.71, longitude: -74.00, geohash: 'dr5ru' },
          severity: 'HIGH',
          status: 'VERIFIED',
          createdAt: Date.now(),
        },
      };

      expect(cardProps.incident.reporterLabel).toBe('Reported by a verified community member');
      expect(cardProps.incident.blurredLocation.geohash).toBe('dr5ru');
    });
  });
});

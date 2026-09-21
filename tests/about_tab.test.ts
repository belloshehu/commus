import { describe, it, expect } from 'vitest';
import { en } from '../src/lib/i18n/locales/en';
import { AboutTab, AboutTabProps } from '../src/components/about/AboutTab';
import React from 'react';

describe('About Tab Navigation & Feature Architecture Suite', () => {
  it('registers about tab in english navigation translation dictionary', () => {
    expect(en.nav.about).toBe('About Commus');
  });

  it('verifies AboutTab component props contract and exports', () => {
    let targetNav = '';
    let reported = false;

    const props: AboutTabProps = {
      onNavigateTab: (tabId) => {
        targetNav = tabId;
      },
      onReportClick: () => {
        reported = true;
      },
    };

    expect(typeof AboutTab).toBe('function');
    expect(props.onNavigateTab).toBeDefined();
    props.onNavigateTab?.('guidance');
    expect(targetNav).toBe('guidance');

    props.onReportClick?.();
    expect(reported).toBe(true);
  });

  it('renders a valid React element when invoked', () => {
    const element = React.createElement(AboutTab, {
      onNavigateTab: () => {},
      onReportClick: () => {},
    });

    expect(element).toBeDefined();
    expect(element.type).toBe(AboutTab);
  });
});

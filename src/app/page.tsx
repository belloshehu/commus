'use client';

import React, { useState } from 'react';
import { Locale, getTranslation, getLocaleDirection } from '@/lib/i18n';
import { generateSyntheticIncidents } from '@/lib/synthetic-data';
import { canSubmitIncident, UserSession } from '@/lib/auth';

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>('en');
  const [session, setSession] = useState<UserSession>({
    role: 'ANONYMOUS',
    isAuthenticated: false
  });
  
  const [incidents] = useState(() => generateSyntheticIncidents(4));
  const dir = getLocaleDirection(locale);

  const toggleSession = () => {
    if (session.isAuthenticated) {
      setSession({ role: 'ANONYMOUS', isAuthenticated: false });
    } else {
      setSession({
        userId: 'usr_syn_101',
        pseudonymId: 'pseudo_syn_user_1',
        role: 'CITIZEN_MEMBER',
        communityId: 'comm_central_district',
        isAuthenticated: true
      });
    }
  };

  return (
    <div dir={dir} className="container">
      <header className="header">
        <div className="logo-group">
          <span className="logo-badge">أنتيج</span>
          <div>
            <h1>{getTranslation(locale, 'appName')}</h1>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              {getTranslation(locale, 'tagline')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="locale-switcher">
            <button
              className={`locale-btn ${locale === 'en' ? 'active' : ''}`}
              onClick={() => setLocale('en')}
            >
              English (LTR)
            </button>
            <button
              className={`locale-btn ${locale === 'ar' ? 'active' : ''}`}
              onClick={() => setLocale('ar')}
            >
              العربية (RTL)
            </button>
          </div>

          <button className="btn" onClick={toggleSession}>
            {session.isAuthenticated
              ? `Logged in: ${getTranslation(locale, 'roleCitizen')}`
              : `Switch to Verified Member`}
          </button>
        </div>
      </header>

      {/* Safety First Mandatory Non-Confrontation Banner */}
      <div className="safety-banner">
        <div style={{ fontSize: '1.5rem' }}>⚠️</div>
        <div>
          <h3>{getTranslation(locale, 'safetyBannerTitle')}</h3>
          <p>{getTranslation(locale, 'safetyBannerText')}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>{getTranslation(locale, 'publicIncidents')}</h2>

        <div>
          {canSubmitIncident(session) ? (
            <button className="btn">
              + {getTranslation(locale, 'submitIncident')}
            </button>
          ) : (
            <div style={{ textAlign: dir === 'rtl' ? 'left' : 'right' }}>
              <button className="btn btn-disabled" disabled>
                🔒 {getTranslation(locale, 'submitIncident')}
              </button>
              <p style={{ fontSize: '0.75rem', color: '#fba5a5', marginTop: '0.25rem' }}>
                {getTranslation(locale, 'anonymousWarning')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Synthetic Incident Cards */}
      <div className="card-grid">
        {incidents.map((incident) => (
          <div key={incident.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span className="badge badge-synthetic">Synthetic Data</span>
              <span className="badge badge-fuzzed">
                📍 {incident.blurredLatitude}, {incident.blurredLongitude} (~1.2km blur)
              </span>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{incident.title}</h3>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '1rem' }}>
              {incident.description}
            </p>

            <div style={{ fontSize: '0.8rem', color: '#94a3b8', borderTop: '1px solid #334155', paddingTop: '0.75rem' }}>
              <div>Reporter: <code style={{ color: '#38bdf8' }}>{incident.reporterPseudonymId}</code></div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                Precise location encrypted (AES-256) for auditable authority escalation.
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

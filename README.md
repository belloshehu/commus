# Antijj (أنتيج) - Privacy-First Community Safety Platform

**Antijj** is a privacy-preserving, community-focused incident reporting and safety monitoring application. It enables verified community members to report incidents, view localized safety bulletins, and trigger auditable authority escalations while strictly safeguarding reporter identity and location telemetry.

---

## Key Features & Mandates

- **Reporter Identity Privacy**: Reporter personal data is strictly decoupled from public and community incident records via pseudonymous ID mapping.
- **Anonymous Incident Block**: Anonymous users can view high-level public safety bulletins but **cannot** submit incident reports.
- **Geohash Location Fuzzing**: Public & community incident views display blurred coordinates (~1.2km radius precision). Precise coordinates are encrypted at rest and accessible only during audited emergency escalations.
- **Server-Side EXIF Stripping**: Media evidence uploads are automatically scrubbed of EXIF and GPS metadata prior to storage.
- **Auditable Authority Escalation**: Emergency escalations log an immutable, hash-signed audit event recording actor, target, reason, timestamp, and digest.
- **Non-Confrontation UX**: Prominent safety banners advise users against confronting violent crowds or entering dangerous zones.
- **Internationalization & RTL**: Complete support for English (LTR) and Arabic (RTL) layouts and text translations.
- **Synthetic Development Data**: All non-production environments operate strictly using synthetic datasets.

---

## Documentation

* [Project Rules](ANTIJJ_PROJECT_RULES.md)
* [Development Rules](docs/DEVELOPMENT_RULES.md)
* [System Architecture](docs/ARCHITECTURE.md)
* [Data Model & Schema](docs/DATA_MODEL.md)
* [Security & Threat Model](docs/SECURITY.md)
* [Project Roadmap](docs/ROADMAP.md)
* [Development Log](docs/DEVELOPMENT_LOG.md)

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js v20+ (v25 supported)
- npm 10+

### 2. Setup Environment
```bash
cp .env.example .env
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Verification Commands
```bash
npm run lint
npm run type-check
npm run test
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

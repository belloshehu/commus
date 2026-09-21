# Commus Project Roadmap

## Phase 1: Foundation & Core Architecture (Current)
- [x] Project architecture & security rules documentation
- [x] Next.js 15+ App Router setup with i18n & RTL foundation
- [x] Privacy engine abstractions (Pseudonymity, Location fuzzing, EXIF scrubbing)
- [x] Auditable authority escalation logger abstraction
- [x] Synthetic test data generator
- [x] Automated test suite foundation

## Phase 2: Authentication & Pseudonymity Engine
- [ ] NextAuth.js / Auth.js integration with local DB credentials
- [ ] User role verification middleware (RBAC)
- [ ] Community membership verification & pseudonymous token assignment
- [ ] Anonymous user submission blocking enforcement

## Phase 3: Incident Management & Evidence Storage
- [ ] Incident submission wizard with mandatory safety disclaimers
- [ ] Server-side EXIF media stripper integration
- [ ] Geohash location blur service
- [ ] Private vs. Public community incident feeds

## Phase 4: Auditable Escalation & Authority Integration
- [ ] Authority dispatch provider interface implementation
- [ ] Cryptographic payload hash generator & audit log persistent engine
- [ ] Dispatcher authorization portal with precise coordinate decryption

## Phase 5: Notifications & Localization Polish
- [ ] Web Push / Socket alerting engine with safety warnings
- [ ] Full Arabic (RTL) & English (LTR) language dictionary completion
- [ ] E2E testing using synthetic datasets

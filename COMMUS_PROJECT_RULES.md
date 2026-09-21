# COMMUS PROJECT RULES

## Core Directives & Mandates

### 1. Reporter Identity Privacy
* The real identity of any reporter must **never** be linked directly to publicly or community-visible incident records.
* Pseudonymous IDs (`pseudonym_id`) generated via cryptographically secure hashes/UUIDs must be used for all public/community incident associations.
* Reporter profile data must be strictly isolated in a separate, encrypted user directory accessible only by strict system processes.

### 2. Anonymous Access Control
* **Anonymous users cannot submit incidents.** All incident submission endpoints require authenticated `CITIZEN_MEMBER` (or higher) credentials.
* Unauthenticated/Anonymous users may only access high-level public safety bulletins.

### 3. Community Privacy & Visibility
* Private community incidents are strictly scoped to authorized community members of that specific geographic/membership context.
* Multi-tenant boundary checks must be enforced at the backend/database authorization layer for every query.

### 4. Precise Location Protection & Fuzzing
* Precise geographic coordinates (latitude, longitude, exact address) must **never** be exposed in public APIs, client UI, or community feeds.
* All public and community incident views must present **fuzzed/blurred coordinates** (Geohash truncation ~1-3km radius blur or bounding box).
* Precise location data is stored encrypted and is readable only by authorized dispatchers during active, audited authority escalations.

### 5. Secure Evidence Storage & EXIF Scrubbing
* All uploaded media (images, audio, video) must undergo server-side EXIF and device metadata stripping before persistence.
* Storage access must use time-limited pre-signed URLs with strict access control lists (ACLs).

### 6. Auditable Authority Escalation
* Escalating an incident to emergency authorities is a high-gravity operation that **must** create an immutable audit record.
* Audit logs must record: `escalation_id`, `actor_id` (pseudonymous), `incident_id`, `authority_target`, `timestamp`, and `payload_hash`.

### 7. Non-Confrontation UX & Crowd Safety
* Users must **never** be encouraged to approach, photograph, or confront violent crowds, riots, or active threat zones.
* The application UI must display clear safety disclaimers:
  > **SAFETY FIRST**: Do NOT approach violent crowds or active conflict areas. Seek immediate shelter or safety.

### 8. Backend & Database Authorization Enforcement
* Never rely on client-side restrictions alone.
* Every sensitive endpoint and DB query must explicitly evaluate authorization rules using the centralized permission evaluator `can(session, action, resource)` in `@/lib/authorization`.
* Standard canonical roles (`user`, `community_manager`, `authority`, `admin`, `super_admin`) backed by Firebase Custom Claims (`auth.token.role`) must be used as the authoritative source of truth.
* Custom claim role assignment/revocation must flow strictly through server endpoints (`/api/admin/roles`) with audit logging. Direct client modification of user role fields is strictly forbidden.


### 9. Internationalization & RTL Support
* All user-facing UI text must support multi-language translation (English `en`, Arabic `ar`).
* Arabic text must fully support Right-To-Left (`dir="rtl"`) layouts, mirrored UI components, and RTL-aware styling.

### 10. Synthetic Test Data Policy
* All local development, integration tests, and staging environments must exclusively use **synthetic test data**.
* Production or real-world user data must never be imported into non-production environments.

### 11. Secrets Management
* **Never commit secrets**, API keys, credentials, or private keys to the repository.
* Use environment variables defined in `.env` (derived from `.env.example`).

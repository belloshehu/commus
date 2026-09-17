# Antijj Security & Privacy Specification

## Threat Model & Safeguards

### 1. Reporter Identity Exposure
* **Threat**: Adversaries attempt to correlate reported incidents with citizen identities.
* **Safeguard**: Reporter identities are never stored on public incident records (`/incidents/$incidentId`). All public incidents bear the uniform string `"reporterLabel": "Reported by a verified community member"`. Real reporter UIDs are stored strictly in `/incidentReportersPrivate/$incidentId`, which is protected by RTDB security rules to be readable ONLY by `AUTHORITY_DISPATCHER` or `SYSTEM_ADMIN`.

### 2. Anonymous Access Exploitation
* **Threat**: Malicious actors use anonymous user accounts to submit false alerts or flood community feeds.
* **Safeguard**: Anonymous users (`auth.token.firebase.sign_in_provider == 'anonymous'`) are blocked by RTDB and Storage Security Rules from creating incident reports, uploading media, or accessing private community incident nodes.

### 3. Precise Location Tracking
* **Threat**: Stalking or targeting reporters/citizens based on reported GPS coordinates.
* **Safeguard**: Public coordinates are fuzzed using Geohash truncation before storage/broadcast (`blurredLocation`). Precise coordinates are encrypted at rest using AES-256-GCM (`encryptedPreciseLocation`). Decryption keys are accessible only during audited authority escalations.

### 4. EXIF & Metadata Data Leaks
* **Threat**: Photo uploads containing embedded EXIF GPS tags reveal exact reporter location.
* **Safeguard**: Cloud Storage trigger (`onMediaUploaded`) parses uploaded binary streams, strips all EXIF metadata tags, and updates `/incidentEvidence/$incidentId/$mediaId` with `exifScrubbed: true`.

### 5. Malicious Crowd Targeting / Vigilantism
* **Threat**: App being used to coordinate mob action or direct users into dangerous violent crowds.
* **Safeguard**: System explicitly displays non-confrontation banners (`"SAFETY FIRST: Do NOT approach violent crowds or active conflict areas. Seek immediate shelter."`). Features facilitating real-time crowd confrontation are strictly forbidden by project rules.

### 6. Auditable Escalation & Accountability
* **Threat**: Unauthorized or abusive authority escalation.
* **Safeguard**: Every escalation generates a cryptographically signed audit log (`/escalationAuditLogs/$logId`) recording the actor, target, timestamp, and SHA-256 payload digest. Client SDK write access to `/escalationAuditLogs` is strictly set to `.write: false`.

### 7. Secrets Management
* Firebase Admin credentials and private keys are processed exclusively in server-side Cloud Functions and Next.js server context.
* Client code strictly uses public Firebase config variables (`NEXT_PUBLIC_FIREBASE_*`).


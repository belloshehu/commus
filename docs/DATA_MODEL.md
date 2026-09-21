# Commus Data Model & Schema Specification (Firebase RTDB)

## Data Privacy Principles
1. **Reporter Identity Isolation**: User profile PII is strictly stored in `/userPrivateProfiles/$uid`. Real reporter IDs are written to `/incidentReportersPrivate/$incidentId`, which is accessible ONLY to authorities (`AUTHORITY_DISPATCHER` or `SYSTEM_ADMIN`).
2. **Public Attribution Label**: All public incident records in `/incidents/$incidentId` carry the uniform string `"reporterLabel": "Reported by a verified community member"`.
3. **Location Dual-Representation**: Public coordinates use `blurredLocation` (`latitude`, `longitude`, `geohash` ~1-3km radius). Precise coordinates are encrypted at rest using AES-256-GCM (`encryptedPreciseLocation`).

## Realtime Database (RTDB) Nodes

### 1. User Directory (`/users/$uid`)
* `role` (String: `CITIZEN_MEMBER` | `VERIFIED_COMMUNITY_LEADER` | `AUTHORITY_DISPATCHER` | `SYSTEM_ADMIN`)
* `communityIds` (Map<CommunityId, Boolean>)
* `createdAt` (Timestamp)

### 2. User Private Profile (`/userPrivateProfiles/$uid`)
* `email` (String)
* `displayName` (String)
* `phoneNumber` (String)

### 3. Communities (`/communities/$communityId`)
* `name` (String)
* `isPrivate` (Boolean)
* `geohashPrefix` (String)
* `createdAt` (Timestamp)

### 4. Incidents (`/incidents/$incidentId`)
* `communityId` (String)
* `category` (Enum: `TRAFFIC_HAZARD` | `INFRASTRUCTURE_FAILURE` | `DISTURBANCE` | `CROWD_SAFETY_ALERT` | `EMERGENCY_OTHER`)
* `title` (String)
* `description` (String)
* `reporterLabel` (Constant: `"Reported by a verified community member"`)
* `blurredLocation` (Object: `{ latitude: Float, longitude: Float, geohash: String }`)
* `encryptedPreciseLocation` (String: AES-256-GCM payload)
* `severity` (Enum: `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`)
* `status` (Enum: `SUBMITTED` | `VERIFIED` | `ESCALATED` | `RESOLVED` | `DISMISSED`)
* `riskAssessment` (Object: `{ score: Integer, riskLevel: String, evaluatedAt: Timestamp, aiSummary: String }`)
* `createdAt` (Timestamp)
* `updatedAt` (Timestamp)

### 5. Private Incident Reporters (`/incidentReportersPrivate/$incidentId`)
* `reporterUid` (String: User UID)
* `submittedAt` (Timestamp)

### 6. Media Evidence (`/incidentEvidence/$incidentId/$mediaId`)
* `storagePath` (String: Cloud Storage path `/evidence/{communityId}/{incidentId}/{mediaId}`)
* `contentType` (String)
* `exifScrubbed` (Boolean)
* `uploadedAt` (Timestamp)

### 7. Active Response Coordination (`/activeResponseCoordination/$incidentId`)
* `status` (Enum: `DISPATCHED` | `IN_PROGRESS` | `RESOLVED`)
* `coordinationNotes` (Text)
* `updatedAt` (Timestamp)

### 8. Community Alerts (`/communityAlerts/$communityId/$alertId`)
* `incidentId` (String)
* `title` (String)
* `riskLevel` (String)
* `message` (String)
* `safetyDisclaimer` (Constant: `"SAFETY FIRST: Do NOT approach violent crowds or active conflict areas. Seek immediate shelter."`)
* `issuedAt` (Timestamp)

### 9. Authority Escalation & Audit Log (`/authorityEscalations` & `/escalationAuditLogs`)
* `/authorityEscalations/$incidentId`: `{ escalationId, authorityTarget, status, escalatedAt }`
* `/escalationAuditLogs/$logId`: `{ escalationId, incidentId, actorId, authorityTarget, payloadHash, timestamp }` (Write-locked from client SDKs)


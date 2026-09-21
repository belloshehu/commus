# Antijj — Authorization & Security Audit Report

## 1. Existing Authentication Mechanism
* **Firebase Authentication Client Integration**: Email/Password authentication, Google OAuth popup authentication (`src/lib/firebase/auth.ts`).
* **Session Management**: Client context (`AuthContext.tsx`) synced via `onAuthStateChanged`.
* **Server Request Authentication**: `authenticateServerSession` in `src/lib/security.ts` attempts to verify session tokens (`x-antijj-session-token`) or `x-user-session` header JSON payload.
* **Security Gap**: Currently `x-user-session` header accepts unverified client-constructed JSON objects containing arbitrary role definitions for non-admin endpoints, making client role spoofing possible if unverified.

## 2. Existing User & Profile Model
* **Profile Nodes**:
  * Public/system user node: `users/${uid}` storing `role`, `communityIds`, `createdAt`.
  * Private PII user node: `userPrivateProfiles/${uid}` storing `email`, `displayName`, `createdAt`.
* **Current Roles**: `ANONYMOUS`, `CITIZEN_MEMBER`, `VERIFIED_COMMUNITY_LEADER`, `AUTHORITY_DISPATCHER`, `SYSTEM_ADMIN`.
* **Target Roles**: `user`, `community_manager`, `authority`, `admin`, `super_admin`.

## 3. Existing Incident Authorization
* **Creation**: Gated by `canSubmitIncident` (`session.role !== 'ANONYMOUS'`).
* **Reading**: `canViewPrivateCommunityIncidents` checks `session.communityId === targetCommunityId` or elevated roles (`SYSTEM_ADMIN`, `AUTHORITY_DISPATCHER`).
* **Precise Location Decryption**: `canAccessPreciseLocation` restricted to `AUTHORITY_DISPATCHER` or `SYSTEM_ADMIN`.
* **Security Gap**: Reporter identity isolation is partially in place (`reporterLabel` set to "Reported by a verified community member"), but authorization logic needs centralized condition evaluators (`can(user, action, resource)`).

## 4. Existing Community Authorization
* **Community Scoping**: `communityId` string exists on session (`session.communityId`), but community managers need explicit scoping structure (`communityMembers/{communityId}/{uid}` with role `community_manager`).

## 5. Existing Evidence Authorization
* **Storage Path**: `evidence/{communityId}/{incidentId}/{mediaId}`.
* **Storage Rules**: `storage.rules` allows write for authenticated non-anonymous users (`request.auth.token.firebase.sign_in_provider != 'anonymous'`) and read for any authenticated user (`request.auth != null`).
* **Security Gap**: Read access is not currently restricted by community membership or authority assignment at the storage rules layer.

## 6. Existing Admin Functionality
* **Admin API**: `/api/admin` endpoints guarded by `authenticateServerSession(req, ['SYSTEM_ADMIN'])`.
* **Admin Dashboard**: `src/components/admin/AdminDashboard.tsx` checks `session.role === 'SYSTEM_ADMIN'`.
* **Security Gap**: Lacks `super_admin` tier and fine-grained permission differentiation between platform admins and super admins. Custom Claims are not yet written directly to Firebase Auth tokens via Admin SDK.

## 7. Existing Firebase Security Rules
* `database.rules.json` contains rules based on `auth.token.role` strings ('CITIZEN_MEMBER', 'VERIFIED_COMMUNITY_LEADER', 'AUTHORITY_DISPATCHER', 'SYSTEM_ADMIN').
* Security rules require mapping to the new canonical application roles (`user`, `community_manager`, `authority`, `admin`, `super_admin`).

## 8. Existing Cloud Functions
* `functions/src/index.ts`: Triggered on `/incidents/{incidentId}` creation (AI risk assessment, community alert dispatch, FCM notification, authority escalation, audit logging) and Storage finalization (EXIF metadata scrubbing).

## 9. Identified Security Gaps
1. **Client-Editable Roles**: Role is read from RTDB `users/${uid}` or `x-user-session` header rather than verified Firebase Custom Claims (`request.auth.token.role`).
2. **Missing Scoped Permissions**: Community leaders currently have global `VERIFIED_COMMUNITY_LEADER` flags rather than per-community scoping (`community_manager` scoped to specific `communityId`).
3. **Flat Role Hierarchy Assumption**: Authorization checks in code sometimes assume a flat linear hierarchy instead of contextual permission checks (Role + Scoped Membership + Ownership + Resource State).
4. **Missing Roles**: `super_admin` role and strict administrative privilege separation do not exist yet.
5. **Storage & Database Security Rules**: RTDB and Storage rules do not check Firebase Custom Claims for new canonical role identifiers (`user`, `community_manager`, `authority`, `admin`, `super_admin`).

## 10. Proposed Authorization Retrofit
1. **Centralized Permission Evaluator**: Create `src/lib/authorization.ts` implementing `can(session, action, resource)` with context-aware evaluation.
2. **Firebase Custom Claims Integration**: Introduce server API & Firebase Admin SDK utilities to set and verify Firebase Custom Claims (`user`, `community_manager`, `authority`, `admin`, `super_admin`).
3. **Scoped Community & Authority Roles**: Store community-scoped roles under `communityMembers/{communityId}/{uid}` and authority assignments under `authorityAssignments/{authorityId}/{uid}`.
4. **Role Management API**: Secure server-side routes `/api/admin/roles` to assign/revoke roles with audit logging.
5. **Updated Firebase Security Rules**: Align `database.rules.json` and `storage.rules` to enforce custom claims and scoped access.
6. **Route & Component Protection**: Protect Next.js routes and UI components based on canonical roles and `can(...)` permission helper.

## 11. Files Needing Modification
- `src/lib/auth.ts` -> Update `UserRole` type & add mapping to canonical roles.
- `src/lib/authorization.ts` -> NEW: Centralized `can(...)` permission engine.
- `src/lib/security.ts` -> Verify Firebase Custom Claims ID tokens.
- `src/lib/firebase/auth.ts` & `src/context/AuthContext.tsx` -> Load Custom Claims into session.
- `src/lib/adminService.ts` -> Update role handling, role management & audit logs.
- `src/app/api/admin/roles/route.ts` -> NEW: Server-side Custom Claims & role assignment route.
- `database.rules.json` -> Retrofit with custom claims for canonical roles.
- `storage.rules` -> Retrofit with custom claims and community scoping.
- `docs/AUTHORIZATION.md` -> NEW: Authoritative documentation of roles and permissions.
- `docs/SECURITY.md` -> Update security policies.

# Commus Role-Based Authorization & Permission Architecture

## Overview

Commus uses a context-aware Role-Based Access Control (RBAC) and Scoped Authorization system built on top of Firebase Authentication, Firebase Custom Claims, Firebase Realtime Database Security Rules, and Next.js backend API routes.

This document describes the canonical roles, permissions engine, custom claims, community and authority scoping models, route protection, audit logging, and migration safety.

---

## 1. Canonical Roles

Commus defines five primary roles:

| Role | Name | Scope & Purpose |
| --- | --- | --- |
| `user` | Citizen User | Normal registered member. Can report incidents, join communities, view authorized incidents, upload evidence, participate in campaigns, earn badges. |
| `community_manager` | Community Leader | Responsible for assigned communities. Can review incidents, manage community members, trigger alerts, escalate incidents to authorities within assigned communities. |
| `authority` | First Responder / Dispatcher | Authorized response organization. Can view assigned incidents, update response status, manage active response coordination, view authority analytics. |
| `admin` | Platform Administrator | Global management of users, communities, community managers, authorities, content moderation, safety campaigns, badges, and analytics. |
| `super_admin` | System Administrator | Top-tier administration. Global role assignment/revocation, platform config management, system maintenance, complete audit log inspection. |

### Legacy Mappings & Fallback Compatibility

To preserve backward compatibility with pre-existing accounts and custom claims without breaking active sessions:

- `CITIZEN_MEMBER` -> `user`
- `VERIFIED_COMMUNITY_LEADER` -> `community_manager`
- `AUTHORITY_DISPATCHER` -> `authority`
- `SYSTEM_ADMIN` -> `admin`
- `super_admin` -> `super_admin`

All role checks transparently normalize legacy strings to canonical roles using `normalizeRole()`.

---

## 2. Non-Hierarchical Effective Permission Model

Authorization is NOT evaluated strictly by role rank (`user < community_manager < authority < admin < super_admin`). Instead, authorization computes:

```text
Effective Permission = Global Role (Custom Claims)
                       + Community Membership & Scoping
                       + Authority Assignment Scope
                       + Resource Ownership
                       + Resource State
```

For example:
- A `community_manager` for Community A cannot moderate or trigger alerts for Community B unless they are explicitly assigned to Community B.
- An `authority` dispatcher can only access private reporter information or authority escalations for incidents within their assigned scope.
- A normal `user` can view and edit their own private profile or notifications, but cannot view another user's private data.

---

## 3. Centralized Authorization Engine (`src/lib/authorization.ts`)

All application permission checks flow through a unified, centralized evaluator:

```ts
import { can, hasRole } from "@/lib/authorization";

// Check permissions
if (!can(session, "community:manage", { communityId: "comm-123" })) {
  throw new Error("Unauthorized");
}
```

### Supported Actions:
- **Incident Actions**: `incident:create`, `incident:view`, `incident:update`, `incident:delete`, `incident:escalate`, `incident:view_reporter_identity`
- **Community Actions**: `community:create`, `community:manage`, `community:join`, `community:moderate`
- **User Actions**: `user:view_private_profile`, `user:update_profile`, `user:suspend`
- **Role & Admin Actions**: `role:assign`, `role:revoke`, `admin:access_dashboard`, `admin:manage_authorities`, `admin:view_audit_logs`

---

## 4. Firebase Custom Claims

Global roles are stored securely in Firebase Authentication Custom Claims (`auth.token.role`).

### Client-Side Security Directives:
- Clients CANNOT set or modify custom claims directly.
- The client-side database field `users/{uid}/role` is NOT trusted as the authoritative source of truth.
- Role modifications MUST be performed through trusted server APIs (`/api/admin/roles`).

---

## 5. Community & Authority Scoping

### Community Scoping Data Model:
Community manager memberships and active roles are stored under:
```text
/communityMembers/{communityId}/{uid}
  - role: "community_manager"
  - status: "active"
  - assignedAt: timestamp
```

### Authority Scoping Data Model:
Authority assignments are maintained under:
```text
/authorityAssignments/{authorityId}/{uid}
  - authorityId: string
  - stationId: string
  - active: boolean
```

---

## 6. Secure Role Management API (`/api/admin/roles`)

Privileged role operations are exposed strictly via server API:

- **Assign/Revoke Global Role**: Restricted to `super_admin` callers.
- **Assign Community Manager Scope**: Requires `admin`, `super_admin`, or an active `community_manager` for that specific community.
- **Assign Authority Scope**: Requires `admin` or `super_admin`.

### Super Admin Demotion Protection Guard:
The system prevents accidental removal or demotion of the final active `super_admin`. Before revoking a `super_admin` role or changing it to another role, the backend verifies that at least one other active `super_admin` account exists in the platform database.

---

## 7. Audit Logging Schema

All privilege changes, role assignments, authority escalations, and administrative actions trigger structured audit logging in `/auditLogs`:

```ts
{
  timestamp: string;
  actorUid: string;
  actorRole: string;
  action: string;
  targetType: "user" | "community" | "authority" | "incident";
  targetId: string;
  previousValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  result: "SUCCESS" | "FAILURE";
  reason?: string;
}
```

Audit logs are write-protected in Realtime Database rules (`.write: false`), ensuring client SDKs cannot tamper with history.

---

## 8. Database & Storage Security Rules

- **`database.rules.json`**: Enforces strict `.read` and `.write` conditions using Firebase Auth Custom Claims (`auth.token.role`), protecting `users`, `userPrivateProfiles`, `communities`, `communityMembers`, `incidents`, `incidentReportersPrivate`, `activeResponseCoordination`, and `auditLogs`.
- **`storage.rules`**: Protects evidence uploads under `/evidence/{communityId}/{incidentId}/{mediaId}`, enforcing authentication, non-anonymous status, file size limits (<= 50MB), and image/audio/video MIME types.

---

## 9. Reporter Privacy Safeguards

Public incident nodes (`/incidents/{incidentId}`) expose NO private reporter identifiers.
- All public incidents contain `"reporterLabel": "Reported by a verified community member"`.
- Real reporter UIDs are stored isolated in `/incidentReportersPrivate/{incidentId}`, accessible ONLY by `authority`, `admin`, and `super_admin`.

---

## 10. Backward Compatibility & Migration Strategy

- Existing registered users default safely to the `user` canonical role.
- Existing custom claim string values (`CITIZEN_MEMBER`, `VERIFIED_COMMUNITY_LEADER`, `AUTHORITY_DISPATCHER`, `SYSTEM_ADMIN`) remain supported via `normalizeRole()`.
- No destructive database migrations or schema invalidation required.

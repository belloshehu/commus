# Commus System Architecture

## Overview
Commus is a privacy-first, community-driven safety monitoring and incident reporting application designed to protect citizens while maintaining auditable escalation paths for emergency authorities.

## System Components

```
+-----------------------------------------------------------------------------------+
|                                 NEXT.JS CLIENT                                    |
|   +---------------------------------+      +----------------------------------+   |
|   |   Firebase Client SDK           |      |   Firebase Web Push (FCM)        |   |
|   |   - Auth (Email/Google)         |      |   - High-Risk Incident Alerts    |   |
|   |   - RTDB Subscriptions          |      |   - Community Safety Banners     |   |
|   |   - Secure Storage Uploads      |      |   - Authority Escalation Status  |   |
|   +---------------------------------+      +----------------------------------+   |
+-----------------------------------------------------------------------------------+
             |                                 ^                              ^
             | (RTDB Writes / Storage Uploads) | (FCM Notifications)          | (RTDB Listeners)
             v                                 |                              |
+-----------------------------------------------------------------------------------+
|                                 FIREBASE BACKEND                                  |
|  +---------------------------+  +--------------------------+  +----------------+  |
|  | Realtime Database (RTDB)  |  | Firebase Storage         |  | Firebase Auth  |  |
|  | - Incidents               |  | - Evidence Media         |  | - Custom Claims|  |
|  | - Community Alerts        |  | - Non-Public ACLs        |  | - Role RBAC    |  |
|  | - Active Coordination     |  | - EXIF Scrubbing Trigger |  |                |  |
|  +---------------------------+  +--------------------------+  +----------------+  |
|                 ^                             ^                                   |
|                 | (Trigger / Update)          | (Scrub & Secure)                  |
|  +-----------------------------------------------------------------------------+  |
|  | FIREBASE CLOUD FUNCTIONS (Trusted Server-Side Engine)                       |  |
|  |  - `onIncidentCreated`: AI Risk Assessment, Authority Escalation, FCM Push  |  |
|  |  - `onMediaUploaded`: Server-side EXIF metadata stripping               |  |
|  |  - `onStatusChanged`: Audit logging & community alert dispatch               |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

## Architectural Decoupling

1. **Framework**: Next.js 15+ (App Router, React 19, TypeScript, Tailwind CSS).
2. **Real-time Data Layer**: Firebase Realtime Database (RTDB) for incident reporting, active response coordination, status updates, and community safety alerts.
3. **Authentication**: Firebase Authentication supporting Email/Password, Google OAuth, and strict blocking of Anonymous submissions.
4. **Cloud Storage**: Firebase Cloud Storage for non-public incident evidence (images, audio, video) with automatic server-side EXIF scrubbing.
5. **Trusted Server Engine**: Firebase Cloud Functions for AI risk assessment, FCM push notifications, authority escalation, and audit logging.
6. **Push Notifications**: Firebase Cloud Messaging (FCM) for immediate safety alerts and incident status updates.
7. **Location Engine**: Geohash location blurring (~1-3km) for public/community feeds; AES-256 encrypted precise location reserved for authorized dispatchers.
8. **Privacy Guarantee**: Reporter identities are strictly isolated in `/incidentReportersPrivate` and generic `"Reported by a verified community member"` labels are presented publicly.
9. **Role-Based Authorization**: RBAC with 5 granular roles (`ANONYMOUS`, `CITIZEN_MEMBER`, `VERIFIED_COMMUNITY_LEADER`, `AUTHORITY_DISPATCHER`, `SYSTEM_ADMIN`).
10. **Internationalization**: Native LTR/RTL support for English (`en`) and Arabic (`ar`).


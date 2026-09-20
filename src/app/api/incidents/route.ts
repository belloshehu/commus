import { NextRequest, NextResponse } from 'next/server';
import { canSubmitIncident } from '@/lib/auth';
import { fuzzLocation, encryptPreciseLocation } from '@/lib/location';
import { createIncidentReport, IncidentCategory, IncidentSeverity } from '@/lib/firebase/rtdb';
import { NotificationService } from '@/lib/notifications/service';
import { AuthorityNotificationService } from '@/lib/authority/service';
import {
  authenticateServerSession,
  checkRateLimit,
  sanitizeHtmlText,
  sanitizeEvidenceUrl,
} from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const session = authenticateServerSession(req);

    if (!canSubmitIncident(session)) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Anonymous and unauthenticated users are not permitted to submit safety reports.',
        },
        { status: 403 }
      );
    }

    // Rate Limiting (max 5 incident submissions per minute per user/IP)
    const ip = req.headers.get('x-forwarded-for') || session.userId || 'reporter_client';
    const rateCheck = checkRateLimit(ip, { windowMs: 60000, maxRequests: 5 });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded: You are submitting safety reports too frequently. Please wait a minute.',
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    const {
      communityId = 'comm_central',
      category = 'DISTURBANCE',
      title,
      description,
      voiceNoteUrl,
      dangerLevel,
      incidentLocation,
      evidence = [],
      safetyConfirmed,
    } = body;

    // Server-side validation & XSS Sanitization
    const safeTitle = sanitizeHtmlText(title);
    const safeDesc = sanitizeHtmlText(description);

    const validationErrors: string[] = [];

    if (!safeTitle || safeTitle.length < 3) {
      validationErrors.push('Title must be at least 3 characters long.');
    }

    if (!safeDesc || safeDesc.length < 10) {
      validationErrors.push('Detailed incident description must be at least 10 characters long.');
    }

    if (!dangerLevel || !['LOW', 'MEDIUM', 'HIGH'].includes(dangerLevel)) {
      validationErrors.push('Danger level must be LOW, MEDIUM, or HIGH.');
    }

    if (safetyConfirmed !== true) {
      validationErrors.push('Safety confirmation acknowledgment is mandatory prior to report submission.');
    }

    if (!incidentLocation || typeof incidentLocation.latitude !== 'number' || typeof incidentLocation.longitude !== 'number') {
      validationErrors.push('Valid incident location coordinates (latitude and longitude) are required.');
    }

    // Evidence URL Protocol Sanitization
    let safeEvidence: any[] = [];
    try {
      safeEvidence = (evidence || []).map((e: any) => ({
        ...e,
        url: sanitizeEvidenceUrl(e.url),
      }));
    } catch (urlErr: any) {
      validationErrors.push(urlErr.message);
    }

    let safeVoiceNoteUrl: string | undefined = undefined;
    if (voiceNoteUrl) {
      try {
        safeVoiceNoteUrl = sanitizeEvidenceUrl(voiceNoteUrl);
      } catch (voiceErr: any) {
        validationErrors.push(voiceErr.message);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'VALIDATION_FAILED',
          message: 'Invalid incident report submission data.',
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Location dual-representation processing
    const lat = incidentLocation.latitude;
    const lng = incidentLocation.longitude;
    const fuzzed = fuzzLocation(lat, lng);

    const blurredLocation = {
      latitude: fuzzed.blurredLatitude,
      longitude: fuzzed.blurredLongitude,
      geohash: `geo_${Math.round(fuzzed.blurredLatitude * 10)}_${Math.round(fuzzed.blurredLongitude * 10)}`,
    };

    const encryptedPreciseLocation = encryptPreciseLocation(
      lat,
      lng,
      sanitizeHtmlText(incidentLocation.address || incidentLocation.landmark || 'Target Incident Zone')
    );

    const severityMap: Record<string, IncidentSeverity> = {
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH',
    };
    const severity = severityMap[dangerLevel] || 'MEDIUM';

    const result = await createIncidentReport(session, {
      communityId,
      category: category as IncidentCategory,
      title: safeTitle,
      description: safeDesc,
      voiceNoteUrl: safeVoiceNoteUrl,
      blurredLocation,
      encryptedPreciseLocation,
      incidentLocation: {
        address: sanitizeHtmlText(incidentLocation.address || ''),
        landmark: sanitizeHtmlText(incidentLocation.landmark || ''),
        latitude: fuzzed.blurredLatitude,
        longitude: fuzzed.blurredLongitude,
        isFuzzed: true,
      },
      severity,
      dangerLevel,
      evidence: safeEvidence,
      safetyConfirmed: true,
      upvotes: 0,
      downvotes: 0,
      authenticityStatus: 'UNREVIEWED',
      authorityNotificationStatus: 'PENDING',
      moderationStatus: 'UNREVIEWED',
    });

    // 1. Dispatch Member In-App / Push Notification
    try {
      await NotificationService.getInstance().dispatchEventNotification({
        recipientUserId: session.userId || 'community_member',
        eventType: dangerLevel === 'HIGH' ? 'HIGH_RISK_ALERT' : 'NEW_INCIDENT',
        title: `New Safety Report: ${safeTitle}`,
        message: safeDesc.substring(0, 140),
        riskLevel: dangerLevel === 'HIGH' ? 'HIGH' : 'MEDIUM',
        referenceId: result.incidentId,
        communityId,
        actionUrl: `/incidents/${result.incidentId}`,
      });
    } catch (notifErr: any) {
      console.warn('[API /incidents] Member notification dispatch skip:', notifErr.message);
    }

    // 2. Dispatch Authority Notification (if authority system configured)
    let authorityStatus = 'PENDING';
    try {
      const authService = AuthorityNotificationService.getInstance();
      const adminSystemSession = { ...session, role: 'SYSTEM_ADMIN' as const };
      const escRecord = await authService.escalateIncidentToAuthority(
        adminSystemSession,
        result.incidentId,
        `Automated dispatch for newly reported ${dangerLevel} risk incident.`
      );
      authorityStatus = escRecord.status;
    } catch (authErr: any) {
      console.warn('[API /incidents] Authority notification skip:', authErr.message);
    }

    return NextResponse.json({
      success: true,
      incidentId: result.incidentId,
      message: 'Safety incident report submitted successfully.',
      blurredLocation,
      authorityStatus,
    });
  } catch (error: any) {
    console.error('[API /incidents] Incident submission error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: error.message || 'An unexpected error occurred during incident creation.',
      },
      { status: 500 }
    );
  }
}

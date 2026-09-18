import { NextRequest, NextResponse } from 'next/server';
import { canSubmitIncident, UserSession } from '@/lib/auth';
import { fuzzLocation, encryptPreciseLocation } from '@/lib/location';
import { createIncidentReport, IncidentCategory, IncidentSeverity } from '@/lib/firebase/rtdb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      session,
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

    // 1. Authorization check
    const userSession: UserSession = session || { role: 'ANONYMOUS', isAuthenticated: false };

    if (!canSubmitIncident(userSession)) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Anonymous and unauthenticated users are not permitted to submit safety reports.',
        },
        { status: 403 }
      );
    }

    // 2. Server-side validation
    const validationErrors: string[] = [];

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      validationErrors.push('Title must be at least 3 characters long.');
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
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

    // 3. Location dual-representation processing
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
      incidentLocation.address || incidentLocation.landmark || 'Target Incident Zone'
    );

    // Map dangerLevel to severity
    const severityMap: Record<string, IncidentSeverity> = {
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH',
    };
    const severity = severityMap[dangerLevel] || 'MEDIUM';

    // 4. Save to RTDB via createIncidentReport helper
    const result = await createIncidentReport(userSession, {
      communityId,
      category: category as IncidentCategory,
      title: title.trim(),
      description: description.trim(),
      voiceNoteUrl,
      blurredLocation,
      encryptedPreciseLocation,
      incidentLocation: {
        address: incidentLocation.address || '',
        landmark: incidentLocation.landmark || '',
        latitude: fuzzed.blurredLatitude,
        longitude: fuzzed.blurredLongitude,
        isFuzzed: true,
      },
      severity,
      dangerLevel,
      evidence,
      safetyConfirmed: true,
      authorityNotificationStatus: 'PENDING',
      moderationStatus: 'UNREVIEWED',
    });

    return NextResponse.json({
      success: true,
      incidentId: result.incidentId,
      message: 'Safety incident report submitted successfully.',
      blurredLocation,
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

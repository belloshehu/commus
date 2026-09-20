import { NextRequest, NextResponse } from 'next/server';
import { ref, get, set, update } from 'firebase/database';
import { rtdb } from '@/lib/firebase/client';
import { CommunityCampaign } from '@/lib/education/types';
import { authenticateServerSession, sanitizeHtmlText } from '@/lib/security';

const INITIAL_MOCK_CAMPAIGNS: CommunityCampaign[] = [
  {
    id: 'camp_101',
    title: 'Say No to Jungle Justice: Transit Corridor Awareness Walk',
    description: 'Community-wide educational walk informing drivers, shop owners, and commuters on calling 112 during theft incidents instead of resorting to mob violence.',
    communityId: 'comm_central',
    communityName: 'Downtown Central District',
    organizerId: 'user_leader_01',
    organizerLabel: 'Downtown Safety Council',
    startDate: Date.now() - 1000 * 60 * 60 * 24 * 2,
    endDate: Date.now() + 1000 * 60 * 60 * 24 * 5,
    status: 'ACTIVE',
    participantIds: ['user_leader_01', 'user_demo_101', 'user_citizen_02'],
    metrics: {
      reachCount: 420,
      verifiedActionsCount: 85,
      participantCount: 3,
    },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'camp_102',
    title: 'De-escalation & Conflict Resolution Workshop',
    description: 'Interactive training session for neighborhood watch leaders on verbal de-escalation skills during crowd confrontations.',
    communityId: 'comm_central',
    communityName: 'Downtown Central District',
    organizerId: 'user_leader_02',
    organizerLabel: 'Civil Defense Liaison Unit',
    startDate: Date.now() - 1000 * 60 * 60 * 24 * 10,
    endDate: Date.now() - 1000 * 60 * 60 * 24 * 1,
    status: 'COMPLETED',
    participantIds: ['user_leader_02', 'user_citizen_05', 'user_demo_101'],
    metrics: {
      reachCount: 280,
      verifiedActionsCount: 140,
      participantCount: 3,
    },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
];

export async function GET() {
  try {
    const campaignsRef = ref(rtdb, 'campaigns');
    const snapshot = await get(campaignsRef);

    if (snapshot.exists()) {
      const data = Object.values(snapshot.val()) as CommunityCampaign[];
      return NextResponse.json({ success: true, campaigns: data });
    }

    return NextResponse.json({ success: true, campaigns: INITIAL_MOCK_CAMPAIGNS });
  } catch (err: any) {
    return NextResponse.json({ success: true, campaigns: INITIAL_MOCK_CAMPAIGNS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = authenticateServerSession(req);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required for campaign operations.' }, { status: 401 });
    }

    const body = await req.json();
    const { action, campaign, campaignId } = body;

    if (action === 'CREATE') {
      if (!campaign || !campaign.title) {
        return NextResponse.json({ error: 'Campaign title is required.' }, { status: 400 });
      }

      const id = `camp_${Date.now()}`;
      const safeTitle = sanitizeHtmlText(campaign.title);
      const safeDesc = sanitizeHtmlText(campaign.description || '');

      const newCampaign: CommunityCampaign = {
        id,
        title: safeTitle,
        description: safeDesc,
        communityId: campaign.communityId || session.communityId || 'comm_central',
        communityName: sanitizeHtmlText(campaign.communityName || 'Downtown Central District'),
        organizerId: session.userId || 'user_local_leader',
        organizerLabel: sanitizeHtmlText(campaign.organizerLabel || 'Verified Community Member'),
        startDate: campaign.startDate || Date.now(),
        endDate: campaign.endDate || Date.now() + 1000 * 60 * 60 * 24 * 7,
        status: 'ACTIVE',
        participantIds: [session.userId || 'user_local_leader'],
        metrics: {
          reachCount: 1,
          verifiedActionsCount: 0,
          participantCount: 1,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      try {
        await set(ref(rtdb, `campaigns/${id}`), newCampaign);
      } catch (e: any) {
        console.warn('RTDB write fallback for campaign create:', e.message);
      }

      return NextResponse.json({ success: true, campaign: newCampaign });
    }

    if (action === 'JOIN') {
      if (!campaignId) {
        return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });
      }

      const userId = session.userId || 'user_demo_101';
      let targetCamp = INITIAL_MOCK_CAMPAIGNS.find((c) => c.id === campaignId);

      try {
        const snapshot = await get(ref(rtdb, `campaigns/${campaignId}`));
        if (snapshot.exists()) {
          targetCamp = snapshot.val();
        }
      } catch (e: any) {}

      if (!targetCamp) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }

      if (!targetCamp.participantIds.includes(userId)) {
        targetCamp.participantIds.push(userId);
        targetCamp.metrics.participantCount = targetCamp.participantIds.length;
        targetCamp.metrics.reachCount += 5;
        targetCamp.updatedAt = Date.now();

        try {
          await update(ref(rtdb, `campaigns/${campaignId}`), {
            participantIds: targetCamp.participantIds,
            metrics: targetCamp.metrics,
            updatedAt: targetCamp.updatedAt,
          });
        } catch (e: any) {}
      }

      return NextResponse.json({ success: true, campaign: targetCamp });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

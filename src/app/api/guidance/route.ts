import { NextRequest, NextResponse } from 'next/server';
import { UserSession } from '@/lib/auth';
import { can } from '@/lib/authorization';
import { fetchSafetyGuides, createSafetyGuide, CreateGuideInput } from '@/lib/guidance/service';

export async function GET() {
  try {
    const guides = await fetchSafetyGuides();
    return NextResponse.json({ success: true, guides });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session: UserSession | null = body.session || null;

    if (!session || !can(session, 'guidance:create')) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN: Safety Guidance creation is restricted to verified authorities and system administrators.',
        },
        { status: 403 }
      );
    }

    const input: CreateGuideInput = {
      title: body.title,
      category: body.category,
      summary: body.summary,
      description: body.description,
      urgencyLevel: body.urgencyLevel || 'MEDIUM',
      doList: body.doList || [],
      dontList: body.dontList || [],
      emergencyContacts: body.emergencyContacts || [],
      media: body.media || [],
    };

    if (!input.title || !input.category || !input.summary || !input.description) {
      return NextResponse.json(
        { success: false, error: 'Missing required guidance fields (title, category, summary, description).' },
        { status: 400 }
      );
    }

    const guide = await createSafetyGuide(session, input);
    return NextResponse.json({ success: true, guide }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

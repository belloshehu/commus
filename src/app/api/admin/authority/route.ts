import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/adminService';
import { authenticateServerSession } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const session = authenticateServerSession(req, ['SYSTEM_ADMIN']);
    const adminService = AdminService.getInstance();
    const providers = await adminService.getAuthorityProviders(session);
    return NextResponse.json({ success: true, providers });
  } catch (err: any) {
    const isAuthError = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json(
      { error: isAuthError ? 'UNAUTHORIZED' : 'SERVER_ERROR', message: err.message },
      { status: isAuthError ? 403 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = authenticateServerSession(req, ['SYSTEM_ADMIN']);
    const adminService = AdminService.getInstance();

    const body = await req.json();
    const { providerId, config } = body;

    const provider = await adminService.configureAuthorityProvider(session, providerId, config);
    return NextResponse.json({ success: true, provider });
  } catch (err: any) {
    const isAuthError = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json(
      { error: isAuthError ? 'UNAUTHORIZED' : 'SERVER_ERROR', message: err.message },
      { status: isAuthError ? 403 : 500 }
    );
  }
}

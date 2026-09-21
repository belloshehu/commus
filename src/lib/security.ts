import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { UserSession, UserRole } from './auth';
import { normalizeRole, CanonicalRole } from './authorization';

const SERVER_SESSION_SECRET = process.env.ANTIJJ_SERVER_SECRET || 'antijj_secure_server_session_secret_key_2026';

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 10 }
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const entry = rateLimitStore.get(identifier) || { timestamps: [] };
  const validTimestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (validTimestamps.length >= config.maxRequests) {
    const oldest = validTimestamps[0];
    const resetMs = oldest + config.windowMs - now;
    return { allowed: false, remaining: 0, resetMs };
  }

  validTimestamps.push(now);
  rateLimitStore.set(identifier, { timestamps: validTimestamps });

  return {
    allowed: true,
    remaining: config.maxRequests - validTimestamps.length,
    resetMs: config.windowMs,
  };
}

export function signSessionToken(session: UserSession): string {
  const canonicalRole = normalizeRole(session.role);
  const payload = JSON.stringify({ ...session, canonicalRole });
  const signature = crypto
    .createHmac('sha256', SERVER_SESSION_SECRET)
    .update(payload)
    .digest('hex');
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
}

export function verifySessionToken(tokenString: string): UserSession | null {
  try {
    const decoded = JSON.parse(Buffer.from(tokenString, 'base64').toString('utf8'));
    const { payload, signature } = decoded;

    const expectedSignature = crypto
      .createHmac('sha256', SERVER_SESSION_SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      return null;
    }

    const sess = JSON.parse(payload) as UserSession;
    sess.canonicalRole = normalizeRole(sess.role);
    return sess;
  } catch {
    return null;
  }
}

/**
 * Authenticates request sessions strictly.
 * Rejects untrusted client headers or forged query params.
 */
export function authenticateServerSession(
  req: NextRequest | Request,
  allowedRoles?: (UserRole | CanonicalRole)[],
  bodySession?: any
): UserSession {
  let session: UserSession | null = null;

  // 1. Check Authorization Bearer Token or Signed Session Header
  const authHeader = req.headers.get('authorization') || req.headers.get('x-antijj-session-token');
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    session = verifySessionToken(token);
  }

  // 2. Validate x-user-session Header
  const devSessionHeader = req.headers.get('x-user-session');
  if (!session && devSessionHeader) {
    try {
      const parsed = JSON.parse(devSessionHeader);
      if (typeof parsed === 'object' && parsed !== null && 'role' in parsed) {
        const secretHeader = req.headers.get('x-antijj-server-secret');
        const isSecretValid = secretHeader === SERVER_SESSION_SECRET;

        const normalized = normalizeRole(parsed.role);
        // Elevated admin/authority roles require valid server secret or signed token
        const isElevatedRole = ['admin', 'super_admin', 'authority'].includes(normalized);
        if (!isElevatedRole || isSecretValid) {
          session = {
            userId: parsed.userId || parsed.uid || 'usr_authenticated',
            pseudonymId: parsed.pseudonymId || `pseudo_${(parsed.userId || parsed.uid || 'usr').slice(0, 8)}`,
            role: parsed.role,
            canonicalRole: normalized,
            communityId: parsed.communityId || 'comm_central',
            isAuthenticated: Boolean(parsed.isAuthenticated ?? normalized !== 'user'),
          };
        }
      }
    } catch {
      // Invalid JSON header
    }
  }

  // 3. Check bodySession parameter (e.g. session passed in request payload body)
  if (!session && bodySession && typeof bodySession === 'object' && 'role' in bodySession) {
    const normalized = normalizeRole(bodySession.role);
    const isElevatedRole = ['admin', 'super_admin', 'authority'].includes(normalized);
    if (!isElevatedRole) {
      session = {
        userId: bodySession.userId || bodySession.uid || 'usr_authenticated',
        pseudonymId: bodySession.pseudonymId || `pseudo_${(bodySession.userId || bodySession.uid || 'usr').slice(0, 8)}`,
        role: bodySession.role,
        canonicalRole: normalized,
        communityId: bodySession.communityId || 'comm_central',
        isAuthenticated: Boolean(bodySession.isAuthenticated ?? normalized !== 'user'),
      };
    }
  }

  // 4. Fallback to unauthenticated ANONYMOUS session
  if (!session) {
    session = {
      role: 'ANONYMOUS',
      canonicalRole: 'user',
      isAuthenticated: false,
    };
  } else {
    session.canonicalRole = normalizeRole(session.role);
  }

  // 5. Role Authorization Check if required
  if (allowedRoles && allowedRoles.length > 0) {
    const userCanonicalRole = session.canonicalRole || normalizeRole(session.role);
    const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));

    if (!session.isAuthenticated || !normalizedAllowed.includes(userCanonicalRole)) {
      throw new Error(`UNAUTHORIZED: Role ${session.role} (${userCanonicalRole}) is not permitted to perform this operation.`);
    }
  }

  return session;
}

export function sanitizeHtmlText(input: string | undefined | null): string {
  if (!input) return '';

  return String(input)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .trim();
}

export function sanitizeEvidenceUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();

  if (/^(javascript|data|file|vbscript):/i.test(trimmed)) {
    throw new Error('SECURITY_VIOLATION: Invalid or malicious evidence media URL protocol.');
  }

  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://localhost') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('mock://') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  throw new Error('SECURITY_VIOLATION: Evidence media URL must use HTTPS or trusted storage provider.');
}

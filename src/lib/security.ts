import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { UserSession, UserRole } from './auth';

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
  const payload = JSON.stringify(session);
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

    return JSON.parse(payload) as UserSession;
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
  allowedRoles?: UserRole[]
): UserSession {
  let session: UserSession | null = null;

  // 1. Check Authorization Bearer Token or Signed Session Header
  const authHeader = req.headers.get('authorization') || req.headers.get('x-antijj-session-token');
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    session = verifySessionToken(token);
  }

  // 2. Validate x-user-session ONLY if accompanied by valid server secret header or signed token
  const devSessionHeader = req.headers.get('x-user-session');
  if (!session && devSessionHeader) {
    const secretHeader = req.headers.get('x-antijj-server-secret');
    const isSecretValid = secretHeader === SERVER_SESSION_SECRET;

    if (isSecretValid) {
      try {
        const parsed = JSON.parse(devSessionHeader);
        if (typeof parsed === 'object' && parsed !== null && 'role' in parsed) {
          session = {
            userId: parsed.userId,
            pseudonymId: parsed.pseudonymId,
            role: parsed.role,
            communityId: parsed.communityId,
            isAuthenticated: Boolean(parsed.isAuthenticated),
          };
        }
      } catch {
        // Invalid JSON
      }
    }
  }

  // 3. Fallback to unauthenticated ANONYMOUS session
  if (!session) {
    session = {
      role: 'ANONYMOUS',
      isAuthenticated: false,
    };
  }

  // 4. Role Authorization Check if required
  if (allowedRoles && allowedRoles.length > 0) {
    if (!session.isAuthenticated || !allowedRoles.includes(session.role)) {
      throw new Error(`UNAUTHORIZED: Role ${session.role} is not permitted to perform this operation.`);
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
    trimmed.startsWith('mock://')
  ) {
    return trimmed;
  }

  throw new Error('SECURITY_VIOLATION: Evidence media URL must use HTTPS or trusted storage provider.');
}

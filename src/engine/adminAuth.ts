import crypto from 'node:crypto';

const SCRYPT_KEY_LEN = 64;
const DEFAULT_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const MIN_PASSCODE_LEN = 8;
const MAX_PASSCODE_LEN = 128;

export interface AdminAuthStatus {
  configured: boolean;
  source: 'env' | 'claimed' | 'unconfigured';
  requiresInitialSetup: boolean;
}

export interface AdminAuthResult {
  ok: boolean;
  status: number;
  token?: string;
  error?: string;
}

export function hashPasscode(passcode: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(passcode, salt, SCRYPT_KEY_LEN).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPasscode(passcode: string, storedHash: string): boolean {
  if (!passcode || !storedHash) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;

  try {
    const expectedBuf = Buffer.from(expectedHex, 'hex');
    const actualBuf = crypto.scryptSync(passcode, salt, expectedBuf.length);
    if (actualBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(actualBuf, expectedBuf);
  } catch {
    return false;
  }
}

function isUsableEnvPasscode(raw: string | undefined): raw is string {
  if (typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return false;
  if (trimmed === 'MY_ADMIN_PASSCODE') return false;
  return true;
}

export function createAdminAuthManager(options?: {
  envPasscode?: string;
  sessionSecret?: string;
  ttlMs?: number;
}) {
  const ttlMs = options?.ttlMs ?? DEFAULT_SESSION_TTL_MS;
  const signingSecret =
    options?.sessionSecret && options.sessionSecret.trim().length >= 16
      ? options.sessionSecret.trim()
      : crypto.randomBytes(32).toString('hex');

  const envPasscodeHash = isUsableEnvPasscode(options?.envPasscode)
    ? hashPasscode(options.envPasscode.trim())
    : null;

  let claimedHash: string | null = null;
  const activeSessions = new Map<string, number>();

  function pruneExpired(): void {
    const now = Date.now();
    for (const [token, expiresAt] of activeSessions.entries()) {
      if (expiresAt <= now) {
        activeSessions.delete(token);
      }
    }
  }

  function issueToken(): string {
    pruneExpired();
    const nonce = crypto.randomBytes(24).toString('hex');
    const sig = crypto.createHmac('sha256', signingSecret).update(nonce).digest('hex');
    const token = `${nonce}.${sig}`;
    activeSessions.set(token, Date.now() + ttlMs);
    return token;
  }

  function getActiveHash(): string | null {
    return envPasscodeHash ?? claimedHash;
  }

  function getStatus(): AdminAuthStatus {
    if (envPasscodeHash) {
      return { configured: true, source: 'env', requiresInitialSetup: false };
    }
    if (claimedHash) {
      return { configured: true, source: 'claimed', requiresInitialSetup: false };
    }
    return { configured: false, source: 'unconfigured', requiresInitialSetup: true };
  }

  function claimFirstPasscode(passcode: unknown): AdminAuthResult {
    if (envPasscodeHash || claimedHash) {
      return {
        ok: false,
        status: 409,
        error: 'Private admin passcode is already configured. Please sign in instead.',
      };
    }

    if (typeof passcode !== 'string') {
      return { ok: false, status: 400, error: 'Passcode is required.' };
    }

    const trimmed = passcode.trim();
    if (trimmed.length < MIN_PASSCODE_LEN) {
      return {
        ok: false,
        status: 400,
        error: `Passcode must be at least ${MIN_PASSCODE_LEN} characters long.`,
      };
    }
    if (trimmed.length > MAX_PASSCODE_LEN) {
      return {
        ok: false,
        status: 400,
        error: `Passcode must be under ${MAX_PASSCODE_LEN} characters.`,
      };
    }

    claimedHash = hashPasscode(trimmed);
    return {
      ok: true,
      status: 201,
      token: issueToken(),
    };
  }

  function login(passcode: unknown): AdminAuthResult {
    const activeHash = getActiveHash();
    if (!activeHash) {
      return {
        ok: false,
        status: 409,
        error: 'Private admin access has not been initialized yet. Create your passcode first.',
      };
    }

    if (typeof passcode !== 'string' || passcode.trim().length === 0) {
      return { ok: false, status: 400, error: 'Enter your private admin passcode.' };
    }

    const valid = verifyPasscode(passcode.trim(), activeHash);
    if (!valid) {
      return { ok: false, status: 401, error: 'Invalid passcode.' };
    }

    return {
      ok: true,
      status: 200,
      token: issueToken(),
    };
  }

  function verifyToken(token: string | null | undefined): boolean {
    if (typeof token !== 'string' || !token) return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [nonce, sigHex] = parts;
    if (!nonce || !sigHex) return false;

    const expectedHex = crypto.createHmac('sha256', signingSecret).update(nonce).digest('hex');
    try {
      const providedBuf = Buffer.from(sigHex, 'hex');
      const expectedBuf = Buffer.from(expectedHex, 'hex');
      if (providedBuf.length !== expectedBuf.length) return false;
      if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return false;
    } catch {
      return false;
    }

    const expiresAt = activeSessions.get(token);
    if (!expiresAt) return false;
    if (expiresAt <= Date.now()) {
      activeSessions.delete(token);
      return false;
    }
    return true;
  }

  function revokeToken(token: string | null | undefined): void {
    if (typeof token === 'string' && token) {
      activeSessions.delete(token);
    }
  }

  return {
    getStatus,
    claimFirstPasscode,
    login,
    verifyToken,
    revokeToken,
  };
}

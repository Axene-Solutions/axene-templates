import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { env } from '$env/dynamic/private';

const ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRE_MINUTES = 60;
const REFRESH_TOKEN_EXPIRE_DAYS = 30;

export function createAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET!, {
    algorithm: ALGORITHM,
    expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m`,
  });
}

export function verifyAccessToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, env.JWT_SECRET!, { algorithms: [ALGORITHM] }) as { sub: string };
  } catch {
    return null;
  }
}

export function generateRefreshToken(): { raw: string; hash: string; expiresAt: Date } {
  const raw = randomBytes(32).toString('hex');
  const hash = hashToken(raw);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000);
  return { raw, hash, expiresAt };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

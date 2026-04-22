import { SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'crypto';

export interface TokenPayload {
  sub: string; // userId or clientId
  role: string; // UserRole
  scopes: string[]; // ["read","write","admin"]
  type: 'user' | 'client';
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({
    role: payload.role,
    scopes: payload.scopes,
    type: payload.type,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('15m')
    .setIssuer('dojo-api')
    .sign(getSecret());
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: 'dojo-api',
  });

  return {
    sub: payload.sub!,
    role: payload.role as string,
    scopes: payload.scopes as string[],
    type: payload.type as 'user' | 'client',
  };
}

export function generateRefreshToken(): string {
  return randomUUID();
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { signAccessToken, generateRefreshToken } from '@/lib/jwt';
import { tokenRequestSchema } from '@/lib/validations/auth';
import bcrypt from 'bcryptjs';

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export async function POST(req: Request) {
  const body = await req.json();
  const validated = tokenRequestSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      {
        error: 'invalid_request',
        error_description: validated.error.issues[0]?.message ?? 'Invalid data',
      },
      { status: 400 },
    );
  }

  const data = validated.data;

  // ─── Password Grant ──────────────────────────────────────
  if (data.grant_type === 'password') {
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user?.hashedPassword) {
      return NextResponse.json(
        {
          error: 'invalid_grant',
          error_description: 'Invalid email or password',
        },
        { status: 401 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Account is deactivated' },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(data.password, user.hashedPassword);
    if (!valid) {
      return NextResponse.json(
        {
          error: 'invalid_grant',
          error_description: 'Invalid email or password',
        },
        { status: 401 },
      );
    }

    const scopes = parseScopes(data.scope, user.role);

    const accessToken = await signAccessToken({
      sub: user.id,
      role: user.role,
      scopes,
      type: 'user',
    });

    const refreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        scopes: JSON.stringify(scopes),
        expiresAt: new Date(
          Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return NextResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 900,
      refresh_token: refreshToken,
      scope: scopes.join(' '),
    });
  }

  // ─── Client Credentials Grant ────────────────────────────
  if (data.grant_type === 'client_credentials') {
    const client = await prisma.oAuthClient.findUnique({
      where: { clientId: data.client_id },
    });

    if (!client || !client.isActive) {
      return NextResponse.json(
        {
          error: 'invalid_client',
          error_description: 'Invalid client credentials',
        },
        { status: 401 },
      );
    }

    const validSecret = await bcrypt.compare(
      data.client_secret,
      client.clientSecret,
    );
    if (!validSecret) {
      return NextResponse.json(
        {
          error: 'invalid_client',
          error_description: 'Invalid client credentials',
        },
        { status: 401 },
      );
    }

    const allowedGrants: string[] = JSON.parse(client.grants);
    if (!allowedGrants.includes('client_credentials')) {
      return NextResponse.json(
        {
          error: 'unauthorized_client',
          error_description: 'Grant type not allowed for this client',
        },
        { status: 400 },
      );
    }

    const clientScopes: string[] = JSON.parse(client.scopes);
    const requestedScopes = data.scope ? data.scope.split(' ') : clientScopes;
    const scopes = requestedScopes.filter((s) => clientScopes.includes(s));

    const accessToken = await signAccessToken({
      sub: client.clientId,
      role: 'CLIENT',
      scopes,
      type: 'client',
    });

    return NextResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 900,
      scope: scopes.join(' '),
    });
  }

  // ─── Refresh Token Grant ─────────────────────────────────
  if (data.grant_type === 'refresh_token') {
    const existing = await prisma.refreshToken.findUnique({
      where: { token: data.refresh_token },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid refresh token' },
        { status: 401 },
      );
    }

    if (existing.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: existing.id } });
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Refresh token expired' },
        { status: 401 },
      );
    }

    if (existing.user && !existing.user.isActive) {
      await prisma.refreshToken.delete({ where: { id: existing.id } });
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Account is deactivated' },
        { status: 401 },
      );
    }

    // Rotate: delete old, issue new
    await prisma.refreshToken.delete({ where: { id: existing.id } });

    const scopes: string[] = JSON.parse(existing.scopes);
    const sub = existing.userId ?? existing.clientId!;
    const role = existing.user?.role ?? 'CLIENT';
    const type = existing.userId ? 'user' : 'client';

    const accessToken = await signAccessToken({ sub, role, scopes, type });

    const newRefreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: existing.userId,
        clientId: existing.clientId,
        scopes: JSON.stringify(scopes),
        expiresAt: new Date(
          Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return NextResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 900,
      refresh_token: newRefreshToken,
      scope: scopes.join(' '),
    });
  }

  return NextResponse.json(
    { error: 'unsupported_grant_type' },
    { status: 400 },
  );
}

function parseScopes(scopeParam: string | undefined, role: string): string[] {
  const defaultScopes =
    role === 'ADMIN' ? ['read', 'write', 'admin'] : ['read', 'write'];
  if (!scopeParam) return defaultScopes;

  const requested = scopeParam.split(' ');
  return requested.filter((s) => defaultScopes.includes(s));
}

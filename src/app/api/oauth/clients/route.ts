import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const clients = await prisma.oAuthClient.findMany({
    where: { isActive: true },
    select: {
      id: true,
      clientId: true,
      name: true,
      grants: true,
      scopes: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    clients.map((c) => ({
      ...c,
      grants: JSON.parse(c.grants),
      scopes: JSON.parse(c.scopes),
    })),
  );
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const body = await req.json();
  const { name, grants, scopes } = body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json(
      { error: 'Name must be at least 2 characters' },
      { status: 400 },
    );
  }

  const validGrants = ['password', 'client_credentials', 'refresh_token'];
  const validScopes = ['read', 'write', 'admin'];

  const grantList = Array.isArray(grants)
    ? grants.filter((g: string) => validGrants.includes(g))
    : ['client_credentials'];
  const scopeList = Array.isArray(scopes)
    ? scopes.filter((s: string) => validScopes.includes(s))
    : ['read'];

  const clientId = `client_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const clientSecretPlain = randomUUID().replace(/-/g, '');
  const clientSecretHashed = await bcrypt.hash(clientSecretPlain, 12);

  const client = await prisma.oAuthClient.create({
    data: {
      clientId,
      clientSecret: clientSecretHashed,
      name: name.trim(),
      grants: JSON.stringify(grantList),
      scopes: JSON.stringify(scopeList),
    },
  });

  return NextResponse.json(
    {
      id: client.id,
      clientId: client.clientId,
      clientSecret: clientSecretPlain, // shown only once
      name: client.name,
      grants: grantList,
      scopes: scopeList,
      createdAt: client.createdAt,
    },
    { status: 201 },
  );
}

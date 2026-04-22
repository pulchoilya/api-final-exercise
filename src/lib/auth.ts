import { verifyAccessToken, type TokenPayload } from './jwt';

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function getAuthUser(req: Request): Promise<TokenPayload | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request): Promise<TokenPayload> {
  const user = await getAuthUser(req);
  if (!user) {
    throw new AuthError('Unauthorized', 401);
  }
  return user;
}

export async function requireAdmin(req: Request): Promise<TokenPayload> {
  const user = await requireAuth(req);
  if (user.role !== 'ADMIN') {
    throw new AuthError('Forbidden', 403);
  }
  return user;
}

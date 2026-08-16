import fs from 'fs';
import path from 'path';

export const ADMIN_TOKEN_CACHE_PATH = path.join(__dirname, '..', '.auth', 'admin.json');

type CachedToken = { accessToken: string; expiresAt: number };

export function readCachedAdminToken(bufferMs = 30_000): string | undefined {
  try {
    const raw = fs.readFileSync(ADMIN_TOKEN_CACHE_PATH, 'utf-8');
    const cached = JSON.parse(raw) as CachedToken;
    if (cached.expiresAt - bufferMs > Date.now()) {
      return cached.accessToken;
    }
  } catch {
  }
  return undefined;
}

export function writeCachedAdminToken(accessToken: string, expiresInSeconds: number): void {
  fs.mkdirSync(path.dirname(ADMIN_TOKEN_CACHE_PATH), { recursive: true });
  const cached: CachedToken = { accessToken, expiresAt: Date.now() + expiresInSeconds * 1000 };
  fs.writeFileSync(ADMIN_TOKEN_CACHE_PATH, JSON.stringify(cached));
}

// Credentials for the fixed accounts created by prisma/seed.ts (see "Quick start" log
// at the end of that script). Not real secrets — publicly documented in /api/docs — but
// still overridable via env vars if the seed data ever changes.
export const seedAdmin = {
  email: process.env.SEED_ADMIN_EMAIL ?? 'admin@dojo.api',
  password: process.env.SEED_ADMIN_PASSWORD ?? 'Password1',
};

export const seedUser = {
  email: process.env.SEED_USER_EMAIL ?? 'user@dojo.api',
  password: process.env.SEED_USER_PASSWORD ?? 'Password1',
};

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const databaseUrl = process.env.DATABASE_URL!;
const dbUrl = databaseUrl.replace(/^mysql:\/\//, 'mariadb://');
const adapter = new PrismaMariaDb(dbUrl);
const prisma = new PrismaClient({ adapter });

// Keep only the two accounts prisma/seed.ts creates — everything else here is
// leftover from Playwright runs (register/current-user tests, or older runs
// from before the test suite cleaned up after itself).
const SEEDED_EMAILS = ['admin@dojo.api', 'user@dojo.api'];

async function main() {
  const { count } = await prisma.user.deleteMany({
    where: { email: { notIn: SEEDED_EMAILS } },
  });
  console.log(
    `🧹 Deleted ${count} non-seeded user(s) (cascaded: their refresh tokens, purchases, progress, promo-code usages).`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

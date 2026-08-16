export const seedAdmin = {
  email: process.env.SEED_ADMIN_EMAIL ?? 'admin@dojo.api',
  password: process.env.SEED_ADMIN_PASSWORD ?? 'Password1',
};

export const seedUser = {
  email: process.env.SEED_USER_EMAIL ?? 'user@dojo.api',
  password: process.env.SEED_USER_PASSWORD ?? 'Password1',
};

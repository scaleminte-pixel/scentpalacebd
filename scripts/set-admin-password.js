/**
 * Change an admin user's password.
 * Usage: node scripts/set-admin-password.js <email> <new-password>
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 10) {
    console.error('Usage: node scripts/set-admin-password.js <email> <new-password (min 10 chars)>');
    process.exit(1);
  }
  const prisma = new PrismaClient(require('./data-dir').prismaOptions());
  try {
    const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) throw new Error(`No admin user with email ${email}`);
    const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
    await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash } });
    console.log(`Password updated for ${user.email} (${user.role}).`);
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

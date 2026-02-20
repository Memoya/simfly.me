
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const settings = await prisma.adminSettings.findUnique({ where: { id: 'global' } });
    console.log('--- ADMIN SETTINGS ---');
    console.log(JSON.stringify(settings, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());

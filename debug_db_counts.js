
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const providers = await prisma.provider.findMany();
    for (const p of providers) {
        const count = await prisma.bestOffer.count({ where: { providerId: p.id } });
        console.log(`Provider: ${p.name} (${p.slug}) - Offers: ${count}`);
    }
}
run().catch(console.error).finally(() => prisma.$disconnect());

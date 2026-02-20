
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const providers = await prisma.provider.findMany();
    console.log('--- PROVIDERS ---');
    console.log(JSON.stringify(providers, null, 2));

    const bestOffersCount = await prisma.bestOffer.count();
    console.log('\n--- BEST OFFERS COUNT ---');
    console.log(bestOffersCount);
}
run().catch(console.error).finally(() => prisma.$disconnect());

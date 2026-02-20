
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const providers = await prisma.provider.findMany();
    const providerMap = Object.fromEntries(providers.map(p => [p.id, p.name]));

    const bestOffers = await prisma.bestOffer.findMany({
        take: 20,
        orderBy: { updatedAt: 'desc' }
    });

    console.log('--- LATEST BEST OFFERS ---');
    bestOffers.forEach(o => {
        console.log(`[${providerMap[o.providerId]}] ${o.countryCode} - ${o.dataAmountMB}MB - ${o.validityDays}D : ${o.sellPrice} (Cost: ${o.costPrice})`);
    });
}
run().catch(console.error).finally(() => prisma.$disconnect());

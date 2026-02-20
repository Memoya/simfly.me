
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('--- DATABASE PROBE ---');
    try {
        const boCount = await prisma.bestOffer.count();
        const ppCount = await prisma.providerProduct.count();
        const legacyCount = await prisma.product.count();

        console.log(`Current BestOffer Count: ${boCount}`);
        console.log(`Current ProviderProduct Count: ${ppCount}`);
        console.log(`Current Legacy Product Count: ${legacyCount}`);

        const sample = await prisma.bestOffer.findMany({
            take: 5,
            select: { providerId: true, countryCode: true }
        });
        console.log('Sample BestOffers:', JSON.stringify(sample, null, 2));

        const providers = await prisma.provider.findMany({ select: { slug: true, isActive: true } });
        console.log('Provider Status:', JSON.stringify(providers, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
check();

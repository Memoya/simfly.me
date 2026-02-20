
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    console.log('--- FINAL DATABASE CHECK ---');

    try {
        const ppCount = await prisma.providerProduct.count();
        const boCount = await prisma.bestOffer.count();
        const lCount = await prisma.product.count();
        const providers = await prisma.provider.findMany();

        console.log(`ProviderProducts: ${ppCount}`);
        console.log(`BestOffers: ${boCount}`);
        console.log(`Legacy Products: ${lCount}`);
        console.log('Providers:');
        providers.forEach(p => console.log(` - ${p.name} (${p.slug}): isActive=${p.isActive}`));

        if (boCount === 0 && ppCount === 0) {
            console.log('--- VERIFICATION SUCCESS: DB IS CLEAN ---');
        } else {
            console.log('--- WARNING: DB STILL CONTAINS PRODUCTS ---');
        }
    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();

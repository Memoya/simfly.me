
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function hardPurge() {
    console.log('--- START HARD PURGE ---');

    try {
        // 1. Delete all ProviderProducts EXCEPT eSIMAccess
        const go = await prisma.provider.findUnique({ where: { slug: 'esim-go' } });
        const access = await prisma.provider.findUnique({ where: { slug: 'esim-access' } });

        if (go) {
            const deletedPP = await prisma.providerProduct.deleteMany({
                where: { providerId: go.id }
            });
            console.log(`Deleted ${deletedPP.count} products from ProviderProduct for eSIM Go.`);
        }

        // 2. Wipe BestOffer (Unified view)
        const deletedBO = await prisma.bestOffer.deleteMany({});
        console.log(`Wiped ${deletedBO.count} records from BestOffer.`);

        // 3. Wipe legacy Product table
        const deletedLegacy = await prisma.product.deleteMany({});
        console.log(`Wiped ${deletedLegacy.count} records from legacy Product table.`);

        // 4. Double check: are there ANY ProviderProducts left that aren't eSIMAccess?
        const remainingOthers = await prisma.providerProduct.deleteMany({
            where: { NOT: { providerId: access?.id || 'none' } }
        });
        console.log(`Deleted ${remainingOthers.count} additional non-eSIMAccess products.`);

        console.log('--- PURGE COMPLETE ---');
    } catch (error) {
        console.error('Purge failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

hardPurge();

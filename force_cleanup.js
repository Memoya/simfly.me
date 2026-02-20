
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    console.log('--- START DATABASE CLEANUP ---');

    try {
        // 1. Clear BestOffer table (Unified Shop view)
        const deletedBestOffers = await prisma.bestOffer.deleteMany({});
        console.log(`Deleted ${deletedBestOffers.count} records from BestOffer.`);

        // 2. Clear Legacy Product table (Fallback view)
        const deletedLegacyProducts = await prisma.product.deleteMany({});
        console.log(`Deleted ${deletedLegacyProducts.count} records from legacy Product table.`);

        // 3. Clear ProviderProducts for providers that are NOT eSIMAccess (Optional but cleaner)
        // We keep ProviderProduct for now so the user doesn't have to resync everything, 
        // but clearing the views (BestOffer) is enough to fix the shop.

        console.log('--- CLEANUP SUCCESSFUL ---');
        console.log('ACTION REQUIRED: Please go to Admin -> Carrier Matrix and click SYNC now.');
    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();

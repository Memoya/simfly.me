
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGo() {
    try {
        const go = await prisma.provider.findUnique({ where: { slug: 'esim-go' } });
        if (go) {
            const count = await prisma.providerProduct.count({ where: { providerId: go.id } });
            console.log(`Remaining eSIM Go ProviderProducts: ${count}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
checkGo();

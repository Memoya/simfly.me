
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orderCount = await prisma.order.count();
    const itemCount = await prisma.orderItem.count();
    const syncCount = await prisma.providerSync.count();

    console.log('Order Count:', orderCount);
    console.log('OrderItem Count:', itemCount);
    console.log('ProviderSync Count:', syncCount);

    if (orderCount > 0) {
        const lastOrder = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } });
        console.log('Last Order ID:', lastOrder.id);
        console.log('Last Stripe Session ID:', lastOrder.stripeSessionId);
    }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- TEST WRITE ---');
    try {
        const testOrder = await prisma.order.create({
            data: {
                stripeSessionId: 'test_session_' + Date.now(),
                amount: 9.99,
                currency: 'eur',
                status: 'paid',
                customerEmail: 'test@example.com'
            }
        });
        console.log('Created test order:', testOrder.id);

        const count = await prisma.order.count();
        console.log('Total orders now:', count);

        // Clean up
        await prisma.order.delete({ where: { id: testOrder.id } });
        console.log('Test order deleted.');
    } catch (e) {
        console.error('Test write failed:', e);
    }
}

main().finally(() => prisma.$disconnect());

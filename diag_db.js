
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('Using DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
    console.log('--- RECENT ORDERS ---');
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: true, providerSync: true }
    });

    console.log(JSON.stringify(orders, null, 2));

    console.log('--- RECENT ORDER ITEMS ---');
    const items = await prisma.orderItem.findMany({
        orderBy: { id: 'desc' },
        take: 10
    });
    console.log(JSON.stringify(items, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

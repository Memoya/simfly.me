
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const products = await prisma.product.findMany({ take: 10 });
    console.log('--- LEGACY PRODUCTS ---');
    console.log(JSON.stringify(products, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());

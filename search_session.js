
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const sessions = await prisma.order.findMany({
        where: {
            stripeSessionId: {
                contains: 'a1dkgpndv'
            }
        }
    });
    console.log('Search Result:', JSON.stringify(sessions, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

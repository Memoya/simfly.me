const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

async function main() {
    try {
        const prisma = new PrismaClient();
        await prisma.$connect();
        console.log('Connected');
    } catch (error) {
        console.log('--- FULL ERROR ---');
        console.log(error.toString());
        if (error.message) console.log('MESSAGE:', error.message);
        console.log('------------------');
    }
}

main();

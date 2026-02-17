// MUST set environment variables before importing PrismaClient
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

async function main() {
    console.log('--- Diagnostic (Prisma 7 Early Env Var) ---');
    try {
        const prisma = new PrismaClient({
            log: ['query', 'info', 'warn', 'error']
        });
        console.log('PrismaClient instantiated successfully');

        await prisma.$connect();
        const settings = await prisma.adminSettings.findUnique({
            where: { id: 'global' }
        });
        console.log('DB Query successful:', settings ? 'Found global settings' : 'Global settings not found');
        await prisma.$disconnect();
    } catch (error) {
        console.error('DIAGNOSTIC FAILURE:');
        console.error('Error Message:', error.message);
    }
}

main();

import { PrismaClient } from '@prisma/client';

// Prisma 7 with prisma.config.js configuration.
// We use an explicit options object to satisfy the "non-empty options" requirement.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
            ? ['query', 'info', 'warn', 'error']
            : ['info', 'warn', 'error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

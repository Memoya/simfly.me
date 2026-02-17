const { PrismaClient } = require('@prisma/client');

console.log('--- PrismaClient Inspection ---');
try {
    const prisma = new PrismaClient({
        // Intentional wrong property to trigger valid options list if possible
        invalidProperty: true
    });
} catch (error) {
    if (error.message) {
        console.log('Error Message:', error.message);
    }
}

// Inspect the prototype or static methods
console.log('PrismaClient keys:', Object.keys(PrismaClient));
const p = new PrismaClient();
console.log('Prisma instance keys:', Object.keys(p));

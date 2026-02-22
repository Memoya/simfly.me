// Quick script to count VisitorActivity records in production DB
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL // This will use the production DB on Vercel
});

async function checkProductionDB() {
    try {
        console.log('🔍 Checking Production Database...\n');
        
        const total = await prisma.visitorActivity.count();
        console.log(`Total VisitorActivity records in Production DB: ${total}`);
        
        if (total > 0) {
            console.log('\n✅ GOOD! Records are being saved to production DB!');
            
            const recent = await prisma.visitorActivity.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, sessionId: true, page: true, createdAt: true }
            });
            
            console.log('\n📊 Recent records:');
            recent.forEach(r => {
                console.log(`  - ${r.page} (${new Date(r.createdAt).toLocaleString()})`);
            });
        } else {
            console.log('\n❌ PROBLEM! No records in production DB!');
            console.log('   This means:');
            console.log('   1. /api/track is NOT receiving requests OR');
            console.log('   2. /api/track is NOT saving to DB');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkProductionDB();

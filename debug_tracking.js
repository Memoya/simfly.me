// Debug Script: Check VisitorActivity records
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkVisitorActivity() {
    try {
        console.log('🔍 Überprüfe VisitorActivity records...\n');
        
        const total = await prisma.visitorActivity.count();
        console.log(`✅ Total VisitorActivity Records: ${total}`);
        
        if (total > 0) {
            const recent = await prisma.visitorActivity.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    sessionId: true,
                    page: true,
                    ip: true,
                    browser: true,
                    device: true,
                    os: true,
                    createdAt: true,
                    lastActive: true
                }
            });
            
            console.log('\n📊 Letzte 5 Records:');
            console.table(recent);
        } else {
            console.log('\n⚠️  KEINE VisitorActivity Records gefunden!');
            console.log('\n🔧 Das bedeutet:');
            console.log('  1. Die /api/track API empfängt wahrscheinlich Fehler (500)');
            console.log('  2. Oder die API wird nicht aufgerufen');
            console.log('  3. Oder die VisitorTracker Komponente ist nicht aktiv');
        }
        
        // Check VisitorActivity Model exists
        const schema = await prisma.$runRawUnsafe(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'VisitorActivity'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 VisitorActivity Schema:');
        schema.forEach(col => {
            console.log(`  • ${col.column_name}: ${col.data_type}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('VisitorActivity')) {
            console.log('\n🚨 CRITICAL: VisitorActivity table does NOT exist!');
            console.log('   Run: npx prisma db push');
        }
    } finally {
        await prisma.$disconnect();
    }
}

checkVisitorActivity().catch(console.error);

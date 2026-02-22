// Test what the API returns
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAnalyticsAPI() {
    try {
        console.log('🔍 Testing API response...\n');
        
        // Simulate what the API does with 24h timeRange
        const timeThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        console.log('📅 Time threshold:', timeThreshold.toISOString());
        console.log('🔎 Querying VisitorActivity records from last 24h...\n');
        
        const visitors = await prisma.visitorActivity.findMany({
            where: {
                lastActive: { gte: timeThreshold }
            },
            orderBy: {
                lastActive: 'desc'
            }
        });
        
        console.log(`✅ Found ${visitors.length} records in last 24h`);
        
        if (visitors.length > 0) {
            console.log('\n📊 Sample records:');
            visitors.slice(0, 3).forEach((v, i) => {
                console.log(`\n  [${i+1}] ID: ${v.id}`);
                console.log(`      Session: ${v.sessionId}`);
                console.log(`      IP: ${v.ip}`);
                console.log(`      Page: ${v.page}`);
                console.log(`      Browser: ${v.browser}`);
                console.log(`      Device: ${v.device}`);
                console.log(`      OS: ${v.os}`);
                console.log(`      Created: ${v.createdAt.toISOString()}`);
                console.log(`      Last Active: ${v.lastActive.toISOString()}`);
            });
            
            // Check stats calculation logic
            console.log('\n\n📈 Stats Calculation:');
            const activeThreshold = new Date(Date.now() - 15 * 60 * 1000);
            console.log(`Active threshold (last 15 min): ${activeThreshold.toISOString()}`);
            
            const activeNow = visitors.filter(v => new Date(v.lastActive) >= activeThreshold).length;
            console.log(`  Active now: ${activeNow}`);
            
            const uniqueSessions = new Set(visitors.map(v => v.sessionId)).size;
            console.log(`  Unique sessions: ${uniqueSessions}`);
            console.log(`  Total records: ${visitors.length}`);
        } else {
            console.log('\n⚠️⚠️⚠️ NO RECORDS FOUND! This is the problem!');
            console.log('\n📍 Checking ALL records in database:');
            const allCount = await prisma.visitorActivity.count();
            console.log(`Total records ever: ${allCount}`);
            
            if (allCount > 0) {
                const newest = await prisma.visitorActivity.findFirst({
                    orderBy: { createdAt: 'desc' }
                });
                console.log(`\nNewest record: ${newest?.createdAt.toISOString()}`);
                console.log(`Last active: ${newest?.lastActive.toISOString()}`);
                console.log(`Age: ${Math.round((Date.now() - new Date(newest?.lastActive).getTime()) / 60000)} minutes old`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testAnalyticsAPI().catch(console.error);

#!/usr/bin/env node

/**
 * Test Purchase - NO CHARGE
 * Erstellt eine Test-Bestellung OHNE echte Abbuchung
 */

const http = require('http');

const testSessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
const testEmail = 'test@example.com';

console.log('🛒 TEST PURCHASE OHNE ABBUCHUNG');
console.log('==================================\n');
console.log('Session ID:', testSessionId);
console.log('Email:', testEmail);
console.log('Betrag: 264 EUR');
console.log('Status: WIRD DIREKT IN DB ERSTELLT - KEINE ABBUCHUNG\n');

const webhookPayload = {
    id: `evt_test_${Date.now()}`,
    type: 'checkout.session.completed',
    data: {
        object: {
            id: testSessionId,
            customer_details: {
                email: testEmail
            },
            payment_status: 'paid',
            amount_total: 26400,
            currency: 'eur',
            metadata: {
                payment_intent_data: JSON.stringify({
                    items: [
                        {
                            sku: 'test-esim-15eur-1gb',
                            name: 'Test eSIM - 15 EUR / 1GB',
                            quantity: 1,
                            price: 264,
                            costPrice: 0,
                            providerId: null
                        }
                    ]
                }),
                region: 'DE'
            }
        }
    }
};

const payload = JSON.stringify(webhookPayload);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/webhooks/stripe',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-Test-Mode': 'true'
    }
};

console.log('📡 Verbindung zu: localhost:3000/api/webhooks/stripe\n');

const req = http.request(options, (res) => {
    let data = '';
    
    console.log(`HTTP Status: ${res.statusCode}\n`);
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ ERFOLG! Test-Bestellung erstellt!\n');
            console.log('Response Snippet:', data.substring(0, 150) + '...\n');
            console.log('📋 Nächste Schritte:');
            console.log('  1. http://localhost:3000/de/admin öffnen');
            console.log('  2. Admin-Bereich überprüfen');
            console.log(`  3. Nach Session-ID suchen: ${testSessionId}\n`);
            console.log('💳 WICHTIG: Diese Bestellung wurde NICHT abbezahlt!');
            console.log('   Es ist nur eine Test-Bestellung in der lokalen Datenbank.\n');
        } else {
            console.log(`⚠️  HTTP ${res.statusCode}\n`);
            console.log('Response:', data);
        }
    });
});

req.on('error', (error) => {
    console.log('❌ FEHLER: ' + error.message);
    console.log('\nÜberprüfe:');
    console.log('  - Läuft npm run dev?\n');
});

req.write(payload);
req.end();

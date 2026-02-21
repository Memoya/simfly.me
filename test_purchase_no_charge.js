#!/usr/bin/env node

/**
 * Test Purchase Simulator - NO CHARGE
 * Simuliert einen Kauf OHNE Abbuchung
 */

const http = require('http');

const testSessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
const testEmail = 'test@example.com';

console.log('🛒 TEST PURCHASE OHNE ABBUCHUNG');
console.log('==================================\n');
    id: `evt_test_${Date.now()}`,
    type: 'checkout.session.completed',
    data: {
        object: {
            id: testSessionId,
            customer_details: {
                email: testEmail
            },
            payment_status: 'paid',
            amount_total: 26400, // 264 EUR in cents
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
                            providerId: 'esim-access'
                        }
                    ]
                }),
                region: 'DE'
            }
        }
    }
};

console.log('🛒 TEST PURCHASE OHNE ABBUCHUNG');
console.log('================================\n');
console.log('Session ID:', testSessionId);
console.log('Email: test@example.com');
console.log('Betrag: 264 EUR');
console.log('Status: NICHT VERARBEITET DURCH STRIPE\n');

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

console.log('📡 Verbindung zu:', options.hostname + ':' + options.port + options.path);
console.log('');

const req = http.request(options, (res) => {
    let data = '';
    
    console.log(`📍 HTTP Status: ${res.statusCode}\n`);
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ ERFOLG! Test-Bestellung erstellt!\n');
            console.log('Response:', data.substring(0, 500) + (data.length > 500 ? '...' : ''));
            console.log('\n📋 Nächste Schritte:');
            console.log('  1. http://localhost:3001/de/admin öffnen');
            console.log('  2. Bestellungen überprüfen');
            console.log('  3. Session ID suchen: ' + testSessionId);
            console.log('\n💳 WICHTIG: Diese Bestellung wurde NICHT abbezahlt!');
        } else {
            console.log('⚠️  Status-Code: ' + res.statusCode);
            console.log('Response:', data);
        }
    });
});

req.on('error', (error) => {
    console.log('❌ FEHLER: ' + error.message);
    console.log('Error Code:', error.code);
    console.log('\nMögliche Ursachen:');
    console.log('  - App läuft nicht: npm run dev');
    console.log('  - Falscher Port: 3001');
    console.log('  - Netzwerkproblem\n');
});

req.write(payload);
req.end();

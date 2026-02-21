#!/usr/bin/env node

/**
 * ⚡ QUICK TEST ORDER - Direkt in DB
 * Erstellt Bestellung + eSIM sofort (keine Wartezeit!)
 */

const http = require('http');

const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
const iccid = `TEST${Math.floor(Math.random() * 1000000000)}`;
const matchingId = `TEST-${Math.random().toString(36).slice(2, 10)}`;

console.log('\n⚡ QUICK TEST ORDER - OHNE WARTEZEIT');
console.log('====================================\n');
console.log('Session ID:', sessionId);
console.log('Test ICCID:', iccid);
console.log('Matching ID:', matchingId);
console.log('Betrag: 29 EUR\n');

const webhookPayload = {
    id: `evt_test_${Date.now()}`,
    type: 'checkout.session.completed',
    data: {
        object: {
            id: sessionId,
            customer_details: {
                email: 'test@example.com'
            },
            payment_status: 'paid',
            amount_total: 2900,
            currency: 'eur',
            metadata: {
                payment_intent_data: JSON.stringify({
                    items: [
                        {
                            sku: 'test-esim-5gb-30d',
                            name: '5GB - 30 Tage',
                            quantity: 1,
                            price: 29,
                            costPrice: 0
                        }
                    ]
                })
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

const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ ERFOLG! Bestellung erstellt!\n');
            console.log('📱 Success-Seite öffnen:');
            console.log(`   http://localhost:3000/de/success?session_id=${sessionId}\n`);
            console.log('💡 Diese URL kannst du im Browser öffnen!');
        } else {
            console.error(`❌ Fehler (HTTP ${res.statusCode})`);
            console.error('Response:', data);
        }
    });
});

req.on('error', (error) => {
    console.log('❌ FEHLER:', error.message);
});

req.write(payload);
req.end();

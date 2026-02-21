#!/usr/bin/env node

/**
 * Direct Order Creation - TEST PURCHASE
 * Erstellt eine Bestellung direkt in der DB - KEINE STRIPE ABBUCHUNG!
 */

const http = require('http');

const testSessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
const testEmail = 'test@example.com';

console.log('🛒 DIRECT TEST ORDER (KEINE ABBUCHUNG)');
console.log('======================================\n');
console.log('Session ID:', testSessionId);
console.log('Email:', testEmail);
console.log('Betrag: 264 EUR');
console.log('Status: WIRD DIREKT IN DB ERSTELLT\n');

// Erstelle Order direkt via HTTP
const orderPayload = {
    action: 'create_test_order',
    sessionId: testSessionId,
    customerEmail: testEmail,
    amount: 264,
    currency: 'eur',
    items: [
        {
            productName: 'Test eSIM - 15 EUR / 1GB',
            quantity: 1,
            price: 264,
            region: 'DE'
        }
    ]
};

const payload = JSON.stringify(orderPayload);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/order/test',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-Test-Mode': 'true'
    }
};

console.log('📡 Sende Order zu localhost:3000/api/order/test...\n');

const req = http.request(options, (res) => {
    let data = '';
    
    console.log(`📍 HTTP Status: ${res.statusCode}\n`);
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ ERFOLG! Bestellung erstellt!\n');
            console.log('Response:', data);
            console.log('\n📋 Nächste Schritte:');
            console.log('  1. http://localhost:3000/de/admin öffnen');
            console.log('  2. Bestellungen überprüfen');
            console.log('  3. Session ID suchen: ' + testSessionId);
            console.log('\n💳 WICHTIG: Diese Bestellung wurde NICHT verarbeitet!');
            console.log('           Diese ist nur ein Test ohne echte Zahlungen.\n');
        } else {
            console.log('⚠️  Status-Code: ' + res.statusCode);
            console.log('Response:', data);
            console.log('\n📌 Alternativ: Überprüfe ob es einen Test-Endpoint gibt');
        }
    });
});

req.on('error', (error) => {
    console.log('❌ FEHLER: ' + error.message);
    console.log('\n💡 Alternative: Direct Database Access');
    console.log('   Überprüfe prisma/schema und erstelle Order direkt mit:');
    console.log('   npx prisma studio\n');
});

req.write(payload);
req.end();

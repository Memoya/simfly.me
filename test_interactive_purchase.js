#!/usr/bin/env node

/**
 * 🛒 INTERACTIVE TEST PURCHASE
 * 
 * Fügt einen Artikel in den Warenkorb ein und startet den Checkout OHNE ABBUCHUNG
 * Der komplette Bestellprozess wird simuliert
 */

const http = require('http');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n🛒 SIMFLY TEST PURCHASE SIMULATOR');
console.log('==================================\n');
console.log('Dieser Simulator erstellt einen Testkauf:');
console.log('✅ Mit Warenkorb');
console.log('✅ Mit Checkout-Prozess');
console.log('✅ Ohne echte Abbuchung (lokale DB nur)\n');

const products = [
    { id: 1, name: '2GB - 7 Tage', price: 15, region: 'DE' },
    { id: 2, name: '5GB - 30 Tage', price: 29, region: 'DE' },
    { id: 3, name: '10GB - 30 Tage', price: 49, region: 'DE' },
    { id: 4, name: '1GB - 7 Tage (EU)', price: 12, region: 'EU' }
];

console.log('Verfügbare Produkte:\n');
products.forEach(p => {
    console.log(`  ${p.id}. ${p.name} - ${p.price} EUR`);
});
console.log();

rl.question('Welches Produkt? (1-4): ', (choice) => {
    const productId = parseInt(choice);
    
    if (productId < 1 || productId > 4) {
        console.error('❌ Ungültige Auswahl');
        process.exit(1);
    }

    const product = products[productId - 1];
    const email = 'test@simfly.local';
    const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log(`\n✅ Produkt ausgewählt: ${product.name}`);
    console.log(`📧 Email: ${email}`);
    console.log(`💰 Betrag: ${product.price} EUR\n`);

    console.log('🔄 Starte Checkout-Prozess...\n');

    // Simulate Webhook
    const webhookPayload = {
        id: `evt_test_${Date.now()}`,
        type: 'checkout.session.completed',
        data: {
            object: {
                id: sessionId,
                customer_details: {
                    email: email
                },
                payment_status: 'paid',
                amount_total: product.price * 100, // in cents
                currency: 'eur',
                metadata: {
                    payment_intent_data: JSON.stringify({
                        items: [
                            {
                                sku: `test-esim-${product.id}`,
                                name: product.name,
                                quantity: 1,
                                price: product.price,
                                costPrice: 0,
                                providerId: null,
                                region: product.region
                            }
                        ]
                    }),
                    region: product.region
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
                console.log('✅ BESTELLUNG ERFOLGREICH ERSTELLT!\n');
                console.log('📋 Bestelldetails:');
                console.log(`  - Session ID: ${sessionId}`);
                console.log(`  - Produkt: ${product.name}`);
                console.log(`  - Betrag: ${product.price} EUR`);
                console.log(`  - Email: ${email}`);
                console.log(`  - Status: NICHT ABBEZAHLT (nur lokale DB)\n`);
                
                console.log('📌 Nächste Schritte:');
                console.log('  1. Öffne: http://localhost:3000/de/admin');
                console.log('  2. Gehe zu "Bestellungen"');
                console.log(`  3. Suche nach Session-ID: ${sessionId}\n`);
                
                console.log('💡 Tipp: Du kannst das Kommando mehrfach ausführen,');
                console.log('   um verschiedene Produkte zu testen!\n');
            } else {
                console.error(`❌ Fehler (HTTP ${res.statusCode})`);
                console.error('Response:', data);
            }
            
            rl.close();
        });
    });

    req.on('error', (error) => {
        console.error('❌ FEHLER:', error.message);
        console.error('\nÜberprüfe:');
        console.error('  1. npm run dev ist ausgeführt?');
        console.error('  2. http://localhost:3000 öffnet die App?\n');
        rl.close();
    });

    req.write(payload);
    req.end();
});

rl.on('close', () => {
    process.exit(0);
});

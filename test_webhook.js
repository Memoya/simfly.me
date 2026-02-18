
const fetch = require('node-fetch');

// This script simulates a successful Stripe Checkout Session
// It sends a mock JSON payload to our local webhook endpoint.

async function simulateWebhook() {
    const url = 'http://localhost:3001/api/webhooks/stripe';

    const mockEvent = {
        id: 'evt_test_' + Date.now(),
        type: 'checkout.session.completed',
        data: {
            object: {
                id: 'cs_test_' + Math.random().toString(36).substring(7),
                customer_details: {
                    email: 'bas.mehmet.93@gmail.com'
                },
                payment_status: 'paid',
                amount_total: 264,
                currency: 'eur',
                metadata: {
                    // Fallback metadata if line items aren't fetched
                }
            }
        }
    };

    console.log(`[SIMULATOR] Sending mock event ${mockEvent.data.object.id} to ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // No signature header needed because we use the "Mock Secret" fallback in route.ts
            },
            body: JSON.stringify(mockEvent)
        });

        const result = await response.json();
        console.log('[SIMULATOR] Response Status:', response.status);
        console.log('[SIMULATOR] Response Body:', JSON.stringify(result, null, 2));

        if (response.ok) {
            console.log('\n✅ SUCCESS! The webhook was received.');
            console.log('Now check your Admin Dashboard (/de/admin). The order should appear with details shortly.');
        } else {
            console.log('\n❌ FAILED. Check the console logs of your Next.js server.');
        }
    } catch (error) {
        console.error('[SIMULATOR] Error:', error.message);
    }
}

simulateWebhook();

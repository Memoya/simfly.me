/**
 * Test Email Sending via Resend
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || 'YOUR_RESEND_API_KEY_HERE';

async function testEmail() {
    console.log('🧪 Testing Email via Resend...');
    console.log(`📧 API Key: ${RESEND_API_KEY.substring(0, 10)}...`);

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Simfly <bestellung@simfly.me>',
                to: 'test@example.com', // ÄNDERN SIE DIES ZU IHRER EMAIL
                subject: 'Test Email von Simfly',
                html: '<h1>✅ Email funktioniert!</h1><p>Wenn Sie diese Email erhalten, funktioniert Resend korrekt.</p>'
            })
        });

        const data = await res.json();
        
        if (!res.ok) {
            console.error('❌ Email FAILED:', data);
            return false;
        }

        console.log('✅ Email sent successfully!');
        console.log('📬 Email ID:', data.id);
        return true;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

testEmail().then(success => {
    if (success) {
        console.log('\n✅ Email-System funktioniert!');
    } else {
        console.log('\n❌ Email-System hat Probleme. Prüfen Sie:');
        console.log('   1. RESEND_API_KEY in Vercel richtig gesetzt?');
        console.log('   2. Domain bestellung@simfly.me in Resend verifiziert?');
        console.log('   3. Resend Account aktiv?');
    }
});

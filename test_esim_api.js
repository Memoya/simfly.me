require('dotenv').config({ path: '.env.local' });

async function testApi() {
    const apiKey = process.env.ESIM_GO_API_KEY;
    if (!apiKey) {
        console.error('No API Key');
        return;
    }

    console.log('Testing eSIM-Go v2.5 Catalogue API...');
    try {
        const res = await fetch('https://api.esim-go.com/v2.5/catalogue?perPage=5', {
            headers: { 'X-API-Key': apiKey }
        });

        if (!res.ok) {
            console.error('API Error:', res.status, await res.text());
            return;
        }

        const data = await res.json();
        console.log('Total Count:', data.bundles?.length);
        if (data.bundles && data.bundles.length > 0) {
            console.log('First Bundle Sample:', JSON.stringify(data.bundles[0], null, 2));
        } else {
            console.log('No bundles found or different structure:', Object.keys(data));
        }
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

testApi();

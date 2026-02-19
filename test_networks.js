const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
let API_KEY = '';
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/ESIM_GO_API_KEY=(.+)/);
    if (match) API_KEY = match[1].trim();
} catch (e) { }

const BUNDLE = 'esim_1GB_7D_US_V2'; // Known valid bundle

async function check(url) {
    console.log(`Checking: ${url}`);
    try {
        const res = await fetch(url, { headers: { 'X-API-Key': API_KEY } });
        console.log(`  Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const json = await res.json();
            console.log(`  Response Keys: ${Object.keys(json).join(', ')}`);
            if (Array.isArray(json)) {
                console.log(`  Is Array: Yes, Length: ${json.length}`);
                if (json.length > 0) console.log('  First item:', JSON.stringify(json[0]).substring(0, 100));
            } else if (json.networks) {
                console.log(`  Networks count: ${json.networks.length}`);
            }
        }
    } catch (e) { console.error('  Error:', e.message); }
}

async function run() {
    // User suggestion
    await check('https://api.esim-go.com/v2.4/networks');
    await check(`https://api.esim-go.com/v2.4/networks?bundle=${BUNDLE}`);
    await check(`https://api.esim-go.com/v2.4/networks/${BUNDLE}`);

    // Also valid catalogue checks
    await check(`https://api.esim-go.com/v2.4/catalogue/${BUNDLE}`);
}

run();

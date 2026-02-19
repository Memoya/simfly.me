const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
let API_KEY = '';
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/ESIM_GO_API_KEY=(.+)/);
    if (match) API_KEY = match[1].trim();
} catch (e) {
    console.error('Error reading .env.local:', e.message);
}

if (!API_KEY) {
    console.error('API Key not found!');
    process.exit(1);
}

const BUNDLE = 'esim_1GB_7D_US_V2';
const BASE = 'https://api.esim-go.com/v2.4'; // Try v2.4 first

async function testEndpoint(path) {
    const url = `${BASE}${path}`;
    console.log(`Checking: ${url}`);
    try {
        const res = await fetch(url, {
            headers: { 'X-API-Key': API_KEY }
        });
        console.log(`  Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const json = await res.json();
            console.log('  Data keys:', Object.keys(json));
            if (json.bundles && json.bundles.length > 0) {
                console.log('  Found bundle!', json.bundles[0].name);
                if (json.bundles[0].roamingNetworks) {
                    console.log('  Networks:', json.bundles[0].roamingNetworks.length);
                }
            } else if (json.roamingNetworks) {
                console.log('  Direct networks found:', json.roamingNetworks.length);
            }
        }
    } catch (e) {
        console.error('  Error:', e.message);
    }
}

async function run() {
    await testEndpoint(`/catalogue/bundles/${BUNDLE}`);
    await testEndpoint(`/catalogue/${BUNDLE}`); // Maybe direct ID?
    await testEndpoint(`/catalogue?names=${BUNDLE}`);
    await testEndpoint(`/catalogue?skus=${BUNDLE}`);
    await testEndpoint(`/catalogue?packageCode=${BUNDLE}`);
    await testEndpoint(`/catalogue?search=${BUNDLE}`);
    await testEndpoint(`/catalogue?substring=${BUNDLE}`);

    // Test exact match filter if supported?

    console.log('--- Checking v2.2 ---');
    const BASE_V2 = 'https://api.esim-go.com/v2.2';
    const url2 = `${BASE_V2}/catalogue/bundles/${BUNDLE}`;
    console.log(`Checking: ${url2}`);
    try {
        const res = await fetch(url2, { headers: { 'X-API-Key': API_KEY } });
        console.log(`  Status: ${res.status}`);
    } catch (e) { console.error(e.message); }
}

run();

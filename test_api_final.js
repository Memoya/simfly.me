const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
let API_KEY = '';
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/ESIM_GO_API_KEY=(.+)/);
    if (match) API_KEY = match[1].trim();
} catch (e) { }

const BUNDLE = 'esim_1GB_7D_US_V2';

async function check(url) {
    try {
        const res = await fetch(url, { headers: { 'X-API-Key': API_KEY } });
        if (res.ok) {
            const json = await res.json();
            if (json.bundles && json.bundles.length > 0) {
                console.log(`SUCCESS: ${url} (bundles array)`);
                console.log(`FOUND: ${json.bundles[0].name}`);
                return true;
            } else if (json.roamingNetworks) {
                console.log(`SUCCESS: ${url} (direct)`);
                return true;
            }
        }
    } catch (e) { }
    return false;
}

async function run() {
    console.log('Testing v2.2 and v2.4...');

    // v2.2
    const v22 = 'https://api.esim-go.com/v2.2';
    await check(`${v22}/catalogue/bundles/${BUNDLE}`);
    await check(`${v22}/catalogue?sku=${BUNDLE}`);

    // v2.4
    const v24 = 'https://api.esim-go.com/v2.4';
    await check(`${v24}/catalogue/bundles/${BUNDLE}`);
    await check(`${v24}/catalogue?skus=${BUNDLE}`); // Most likely v2.4
    await check(`${v24}/catalogue?names=${BUNDLE}`);
    await check(`${v24}/catalogue?packageCode=${BUNDLE}`);
}

run();

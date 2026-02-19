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

async function test(param, val) {
    const url = `https://api.esim-go.com/v2.4/catalogue?${param}=${val}`;
    console.log(`Checking ${url}`);
    try {
        const res = await fetch(url, { headers: { 'X-API-Key': API_KEY } });
        if (res.ok) {
            const json = await res.json();
            if (json.bundles) {
                console.log(`  Count: ${json.bundles.length}`);
                if (json.bundles.length > 0) {
                    const first = json.bundles[0];
                    console.log(`  First Bundle: ${first.name}`);
                    if (first.name === BUNDLE) {
                        console.log('  !!! MATCH !!!');
                        if (first.roamingNetworks) {
                            console.log('  Networks:', first.roamingNetworks.length);
                        } else {
                            console.log('  No roamingNetworks in response');
                        }
                    }
                }
            }
        }
    } catch (e) { console.error(e.message); }
}

async function run() {
    await test('skus', BUNDLE);
    await test('names', BUNDLE);
    await test('packageCode', BUNDLE);
    await test('search', BUNDLE);
}

run();

/* eslint-disable @typescript-eslint/no-require-imports */
const https = require('https');

const headers = {
    'X-API-Key': 'jmqYhNBQpOo16TffLoGJSCDckcAgItpaZ6XEkwKG'
};

function countPage(page) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.esim-go.com',
            path: `/v2.1/catalogue?perPage=1000&page=${page}`,
            method: 'GET',
            headers: headers
        };

        console.log(`Fetching page ${page}...`);
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const count = json.bundles ? json.bundles.length : 0;
                    console.log(`Page ${page} count: ${count}`);
                    if (count > 0) {
                        const thItems = json.bundles.filter(b => b.name.includes('_TH_'));
                        console.log(`Thailand items on page ${page}: ${thItems.length}`);
                        if (thItems.length > 0) console.log('First TH item:', thItems[0].name);
                    }
                    resolve(count);
                } catch (e) {
                    console.error(e);
                    resolve(0);
                }
            });
        });
        req.end();
    });
}

async function run() {
    const p1 = await countPage(0); // API might use 0 or 1 based index. Usually 0 or 1.
    const p2 = await countPage(1);
    const p3 = await countPage(2);

    console.log(`Total fetched: ${p1 + p2 + p3}`);
}

run();

/* eslint-disable @typescript-eslint/no-require-imports */
const https = require('https');

const paths = [
    '/v2.1/catalogue?perPage=1000',
    '/v2.1/catalogue?limit=1000'
];

const headers = {
    'X-API-Key': 'jmqYhNBQpOo16TffLoGJSCDckcAgItpaZ6XEkwKG'
};

function testPath(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.esim-go.com',
            path: path,
            method: 'GET',
            headers: headers
        };

        console.log(`Testing: ${path}`);
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                console.log(`${path}: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    console.log(`SUCCESS on ${path}`);
                    try {
                        const json = JSON.parse(data);
                        if (json.bundles && json.bundles.length > 0) {
                            console.log('First bundle full:', JSON.stringify(json.bundles[0], null, 2));
                        }
                    } catch { }
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
        req.on('error', (e) => {
            console.error(`${path} error: ${e.message}`);
            resolve(false);
        });
        req.end();
    });
}

async function run() {
    console.log('Testing eSIM Go API paths...');
    for (const path of paths) {
        const success = await testPath(path);
        if (success) {
            console.log(`Final success on: ${path}`);
            break;
        }
    }
}

run();

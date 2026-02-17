/* eslint-disable @typescript-eslint/no-require-imports */
const https = require('https');

const options = {
    hostname: 'api.esim-go.com',
    path: '/catalogue', // Try root catalogue or /v2.2/catalogue if this fails
    method: 'GET',
    headers: {
        'X-API-Key': 'jmqYhNBQpOo16TffLoGJSCDckcAgItpaZ6XEkwKG'
    }
};

console.log('Fetching catalogue from eSIM Go...');

const req = https.request(options, (res) => {
    let data = '';

    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const json = JSON.parse(data);
                console.log('Data received successfully.');
                // Log first item to see structure
                if (json.bundles && json.bundles.length > 0) {
                    console.log('First bundle:', JSON.stringify(json.bundles[0], null, 2));
                    console.log(`Total bundles: ${json.bundles.length}`);
                } else {
                    console.log('No bundles found in response:', data);
                }
            } catch (e) {
                console.error('Error parsing JSON:', e);
                console.log('Raw data:', data);
            }
        } else {
            console.error('API Error:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error);
});

req.end();


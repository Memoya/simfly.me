// Test getCountryFlag function
function getCountryFlag(isoCode) {
    if (!isoCode || isoCode.length !== 2) return '🌍';

    const codePoints = isoCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));

    return String.fromCodePoint(...codePoints);
}

// Test cases
const testCases = [
    { iso: 'TH', country: 'Thailand' },
    { iso: 'TR', country: 'Turkey' },
    { iso: 'DE', country: 'Germany' },
    { iso: 'US', country: 'USA' },
    { iso: 'JP', country: 'Japan' },
    { iso: undefined, country: 'No ISO' },
    { iso: 'XX', country: 'Invalid' }
];

console.log('Testing Flag Emoji Generation:\n');
testCases.forEach(test => {
    const flag = getCountryFlag(test.iso);
    console.log(`${test.country} (${test.iso || 'N/A'}): ${flag}`);
});


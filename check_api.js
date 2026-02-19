
const id = 'esim_1GB_7D_US_V2'; // Ein Beispiel-Bundle
console.log('Testing API for ID:', id);

fetch(`http://localhost:3000/api/networks?id=${id}`)
    .then(async (res) => {
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);
    })
    .catch((err) => {
        console.error('Fetch failed:', err.message);
    });

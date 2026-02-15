async function test() {
    try {
        console.log('Fetching RPC status...');
        const res = await fetch('https://rpc.testnet.near.org/status');
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data version:', data.version);
    } catch (err) {
        console.error('Fetch failed');
        console.error(err);
    }
}
test();

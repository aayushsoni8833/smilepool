import * as nearAPI from 'near-api-js';
const { keyStores, InMemorySigner } = nearAPI;

try {
    console.log('1. Setting up KeyStore');
    const keyStore = new keyStores.InMemoryKeyStore();

    console.log('2. Setting up InMemorySigner');
    const signer = new InMemorySigner(keyStore);
    console.log('✅ Signer created successfully');
} catch (err) {
    console.error('❌ Signer failed');
    console.error(err);
}

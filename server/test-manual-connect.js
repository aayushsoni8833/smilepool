import * as nearAPI from 'near-api-js';
import dotenv from 'dotenv';
dotenv.config();

const { providers, keyStores, KeyPair, Account } = nearAPI;

async function test() {
    try {
        console.log('1. Setting up Provider');
        const provider = new providers.JsonRpcProvider({ url: 'https://rpc.testnet.near.org' });

        console.log('2. Setting up KeyStore');
        const keyStore = new keyStores.InMemoryKeyStore();
        const keyPair = KeyPair.fromString(process.env.POOL_PRIVATE_KEY);
        await keyStore.setKey('testnet', process.env.POOL_ACCOUNT_ID, keyPair);

        console.log('3. Setting up Connection Object (manually)');
        const connection = new nearAPI.Connection('testnet', provider, new nearAPI.InMemorySigner(keyStore));

        console.log('4. Setting up Account');
        const account = new Account(connection, process.env.POOL_ACCOUNT_ID);

        console.log('5. Fetching Balance');
        const balance = await account.getAccountBalance();
        console.log('✅ Balance:', balance.available);

    } catch (err) {
        console.error('❌ Test failed');
        console.error(err);
    }
}
test();

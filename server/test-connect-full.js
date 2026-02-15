import * as nearAPI from 'near-api-js';
import dotenv from 'dotenv';
dotenv.config();

const { connect, keyStores, KeyPair } = nearAPI;

async function test() {
    try {
        const keyStore = new keyStores.InMemoryKeyStore();
        const keyPair = KeyPair.fromString(process.env.POOL_PRIVATE_KEY);
        await keyStore.setKey('testnet', process.env.POOL_ACCOUNT_ID, keyPair);

        const config = {
            networkId: 'testnet',
            keyStore,
            nodeUrl: 'https://rpc.testnet.near.org',
            helperUrl: 'https://helper.testnet.near.org',
            explorerUrl: 'https://testnet.nearblocks.io',
        };

        console.log('--- Connecting to NEAR ---');
        const connection = await connect(config);
        console.log('✅ Connection successful');

        console.log('--- Getting Account ---');
        const account = await connection.account(process.env.POOL_ACCOUNT_ID);
        console.log('✅ Account retrieved');

        console.log('--- Getting Balance ---');
        const balance = await account.getAccountBalance();
        console.log('✅ Balance retrieved:', balance.available);
    } catch (err) {
        console.error('❌ Test failed');
        console.error(err);
    }
}

test();

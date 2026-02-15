import * as nearAPI from 'near-api-js';
import dotenv from 'dotenv';
dotenv.config();

const { KeyPair } = nearAPI;

try {
    const key = process.env.POOL_PRIVATE_KEY;
    console.log('Key length:', key.length);
    console.log('Key prefix:', key.substring(0, 8));
    const keyPair = KeyPair.fromString(key);
    console.log('✅ KeyPair.fromString successful');
} catch (err) {
    console.error('❌ KeyPair.fromString failed');
    console.error(err);
}

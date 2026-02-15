import nearService from './nearService.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    try {
        console.log('--- Starting Initialize Test ---');
        await nearService.initialize();
        console.log('--- Initialize Successful ---');
    } catch (err) {
        console.error('--- Initialize Failed ---');
        console.error(err);
        process.exit(1);
    }
}

test();

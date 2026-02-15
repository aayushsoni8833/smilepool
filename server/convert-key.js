import { parseSeedPhrase } from 'near-seed-phrase';
import fs from 'fs';

const seedPhrase = "catch good large proud educate evolve toe icon art embrace legend toy";

try {
    const { secretKey, publicKey } = parseSeedPhrase(seedPhrase);
    const accountId = Buffer.from(publicKey.split(':')[1], 'base64').toString('hex');

    const result = {
        secretKey,
        publicKey,
        accountId
    };

    fs.writeFileSync('key-result.json', JSON.stringify(result, null, 2));
    console.log("SUCCESS: Written to key-result.json");
} catch (error) {
    console.error("Error:", error.message);
}

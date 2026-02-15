import { connect, keyStores, KeyPair, utils, providers, Connection, InMemorySigner } from 'near-api-js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * NEAR Service for handling blockchain interactions
 */
class NearService {
    constructor() {
        this.connection = null;
        this.account = null;
        this.networkId = process.env.NEAR_NETWORK || 'testnet';
    }

    /**
     * Initialize connection to NEAR blockchain
     */
    async initialize() {
        try {
            console.log('Initializing NEAR connection...');

            const keyStore = new keyStores.InMemoryKeyStore();
            const keyPair = KeyPair.fromString(process.env.POOL_PRIVATE_KEY);
            await keyStore.setKey(this.networkId, process.env.POOL_ACCOUNT_ID, keyPair);

            const config = {
                networkId: this.networkId,
                keyStore,
                nodeUrl: this.networkId === 'mainnet'
                    ? 'https://rpc.mainnet.near.org'
                    : 'https://rpc.testnet.pagoda.co',
                walletUrl: this.networkId === 'mainnet'
                    ? 'https://wallet.near.org'
                    : 'https://testnet.mynearwallet.com',
                helperUrl: this.networkId === 'mainnet'
                    ? 'https://helper.mainnet.near.org'
                    : 'https://helper.testnet.near.org',
                explorerUrl: this.networkId === 'mainnet'
                    ? 'https://nearblocks.io'
                    : 'https://testnet.nearblocks.io',
            };

            console.log('Connecting to NEAR...');
            this.connection = await connect(config);
            this.account = await this.connection.account(process.env.POOL_ACCOUNT_ID);

            console.log('Connected to NEAR ' + this.networkId);
            const balance = await this.getPoolBalance();
            console.log('Pool balance: ' + balance + ' NEAR');

            return true;
        } catch (error) {
            console.error('Failed to initialize NEAR connection: ' + error.message);
            throw error;
        }
    }

    async getPoolBalance() {
        try {
            const balance = await this.account.getAccountBalance();
            return parseFloat(utils.format.formatNearAmount(balance.available));
        } catch (error) {
            console.error('Error fetching pool balance:', error);
            throw error;
        }
    }

    async sendTokens(recipientId, amount) {
        try {
            console.log('Sending ' + amount + ' NEAR to ' + recipientId + '...');
            const amountInYocto = utils.format.parseNearAmount(amount.toString());
            const result = await this.account.sendMoney(recipientId, amountInYocto);

            return {
                success: true,
                transactionHash: result.transaction.hash,
                amount: amount,
                recipient: recipientId,
                explorerUrl: this.getExplorerUrl(result.transaction.hash)
            };
        } catch (error) {
            console.error('Transfer failed: ' + error.message);
            throw new Error('Transfer failed: ' + error.message);
        }
    }

    getExplorerUrl(hash) {
        const baseUrl = this.networkId === 'mainnet' ? 'https://nearblocks.io' : 'https://testnet.nearblocks.io';
        return baseUrl + '/txns/' + hash;
    }

    async validateAccount(accountId) {
        try {
            await this.connection.account(accountId);
            return true;
        } catch (error) {
            if (error.message.includes('does not exist')) return false;
            throw error;
        }
    }
}

const nearService = new NearService();
export default nearService;

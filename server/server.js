import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nearService from './nearService.js';

dotenv.config();

process.on('uncaughtException', (err) => {
    console.error('FATAL: Uncaught Exception');
    console.error(err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', network: process.env.NEAR_NETWORK });
});

// Get pool balance endpoint
app.get('/api/pool-balance', async (req, res) => {
    try {
        const balance = await nearService.getPoolBalance();
        res.json({ success: true, balance });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/claim-reward', async (req, res) => {
    try {
        const { walletAddress, smileImageBase64 } = req.body;

        if (!walletAddress || !smileImageBase64) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: walletAddress and smileImageBase64'
            });
        }

        console.log('Claim request from: ' + walletAddress);

        const accountExists = await nearService.validateAccount(walletAddress);
        if (!accountExists) {
            return res.status(400).json({
                success: false,
                error: 'NEAR account does not exist. Please create the account first.'
            });
        }

        const poolBalance = await nearService.getPoolBalance();
        const DAILY_EMISSION_PERCENTAGE = 0.002;
        const ESTIMATED_DAILY_PARTICIPANTS = 50;
        const MINIMUM_REWARD = 0.001;

        const calculatedReward = (poolBalance * DAILY_EMISSION_PERCENTAGE) / ESTIMATED_DAILY_PARTICIPANTS;
        const rewardAmount = Math.max(MINIMUM_REWARD, Number(calculatedReward.toFixed(4)));

        if (poolBalance < rewardAmount) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient pool balance for reward distribution'
            });
        }

        const transferResult = await nearService.sendTokens(walletAddress, rewardAmount);

        res.json({
            success: true,
            amount: rewardAmount,
            transactionHash: transferResult.transactionHash,
            explorerUrl: transferResult.explorerUrl,
            message: 'Successfully sent ' + rewardAmount + ' NEAR to ' + walletAddress
        });

    } catch (error) {
        console.error('Claim reward error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process reward claim'
        });
    }
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

async function startServer() {
    try {
        console.log('Starting Smile Pool Backend Server...');
        await nearService.initialize();

        app.listen(PORT, () => {
            console.log('Server running on http://localhost:' + PORT);
            console.log('Network: ' + process.env.NEAR_NETWORK);
            console.log('Pool: ' + process.env.POOL_ACCOUNT_ID);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

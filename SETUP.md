# Backend Setup Instructions

## Prerequisites
- Node.js 18+ installed
- NEAR account with private key
- Pool account funded with NEAR tokens

## Setup Steps

### 1. Install Backend Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your pool account's private key
# IMPORTANT: Never commit .env to git!
```

Required environment variables in `server/.env`:
- `NEAR_NETWORK` - Use `testnet` for testing, `mainnet` for production
- `POOL_ACCOUNT_ID` - Your pool account ID (e.g., `aca87218e28c41f5a693dee3dff12238.poolv1.near`)
- `POOL_PRIVATE_KEY` - Full access key in format `ed25519:YOUR_PRIVATE_KEY_HERE`
- `PORT` - Server port (default: 3001)

### 3. Get Your Private Key

**Option A: From NEAR CLI**
```bash
cat ~/.near-credentials/testnet/YOUR_ACCOUNT.json
```

**Option B: From NEAR Wallet**
1. Go to your wallet settings
2. Export private key
3. Copy the key (starts with `ed25519:`)

### 4. Start the Backend Server
```bash
cd server
npm start
```

You should see:
```
✅ Connected to NEAR testnet
✅ Pool account: aca87218e28c41f5a693dee3dff12238.poolv1.near
💰 Pool balance: X.XX NEAR
✅ Server running on http://localhost:3001
```

### 5. Start the Frontend
In a separate terminal:
```bash
npm run dev
```

## Testing

1. Open http://localhost:5173 (or your Vite dev server URL)
2. Enter a valid NEAR wallet address
3. Take a smile photo
4. Submit the claim
5. Check the backend logs for transaction details
6. Verify the transaction on NEAR Explorer

## Production Deployment

For production:
1. Set `NEAR_NETWORK=mainnet` in `.env`
2. Use your mainnet pool account and private key
3. Deploy backend to a secure server (not localhost)
4. Update frontend `VITE_API_URL` to point to your backend URL
5. Use environment variable management (AWS Secrets Manager, etc.)

## Security Notes

⚠️ **CRITICAL**: The private key has full access to the pool account
- Never commit `.env` to git
- Use secure key storage in production
- Restrict server access
- Monitor transactions regularly

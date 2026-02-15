// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const PUBLIC_POOL_ADDRESS = "14c0f8673d9d7450ae5e9e76875124b6a65260b82f4bd32c49ddfaac06f351d916";

/** 
 * Time-Based Emission Parameters 
 * We target a daily distribution of 0.2% of the total pool balance,
 * distributed among an estimated 50 smiling participants per day.
 */
export const DAILY_EMISSION_PERCENTAGE = 0.002; // 0.2%
export const ESTIMATED_DAILY_PARTICIPANTS = 50;
export const MINIMUM_REWARD = 0.001; // Floor for rewards

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const DONATION_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=near:${PUBLIC_POOL_ADDRESS}`;

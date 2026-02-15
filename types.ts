
export interface SmileValidationResult {
  isValid: boolean;
  reason: string;
}

export interface PoolState {
  balance: number;
  lastUpdated: Date;
  rewardAmount: number;
  totalPayouts: number;
}

export interface Transaction {
  id: string;
  timestamp: Date;
  amount: number;
  wallet: string;
  type: 'donation' | 'payout';
}

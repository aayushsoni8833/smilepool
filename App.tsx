
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DonationSection from './components/DonationSection';
import ClaimForm from './components/ClaimForm';
import { Transaction } from './types';
import {
  PUBLIC_POOL_ADDRESS,
  DAILY_EMISSION_PERCENTAGE,
  ESTIMATED_DAILY_PARTICIPANTS,
  MINIMUM_REWARD
} from './constants';

const App: React.FC = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activityUnavailable, setActivityUnavailable] = useState(false);

  // Time-Based Emission Logic
  // Reward = (Pool Balance * Daily Emission Rate) / Estimated Participants
  const currentReward = useMemo(() => {
    if (balance === null || balance <= 0) return MINIMUM_REWARD;
    const calculated = (balance * DAILY_EMISSION_PERCENTAGE) / ESTIMATED_DAILY_PARTICIPANTS;
    return Math.max(MINIMUM_REWARD, Number(calculated.toFixed(4)));
  }, [balance]);

  const updateBalance = useCallback(async () => {
    try {
      setIsSyncing(true);
      const response = await fetch('https://rpc.mainnet.near.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'smile-pool-query',
          method: 'query',
          params: {
            request_type: 'view_account',
            finality: 'final',
            account_id: PUBLIC_POOL_ADDRESS,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`RPC status: ${response.status}`);
      }

      const data = await response.json();
      if (data.result && data.result.amount) {
        const nearBalance = Number(data.result.amount) / 1e24;
        setBalance(Number(nearBalance.toFixed(2)));
        setError(null);
      } else if (data.error) {
        // If account not found, it's not strictly an "error" but it's empty
        if (data.error.data?.includes("does not exist")) {
          setBalance(0);
          setError(`Account ${PUBLIC_POOL_ADDRESS} not yet registered.`);
        } else {
          setError(`RPC Error: ${data.error.message}`);
        }
      }
    } catch (err) {
      console.error("Failed to fetch NEAR balance:", err);
      setError("Network error: Unable to reach NEAR RPC.");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const updateActivity = useCallback(async () => {
    // Check if this is an implicit account (64 hex chars)
    const isImplicitAccount = /^[a-fA-F0-9]{64}$/.test(PUBLIC_POOL_ADDRESS);

    if (isImplicitAccount) {
      // FastNEAR doesn't support implicit accounts
      setActivityUnavailable(true);
      setTransactions([]);
      return;
    }

    try {
      const response = await fetch(`https://api.fastnear.com/v1/account/${PUBLIC_POOL_ADDRESS}/activity`);

      if (!response.ok) {
        // If the indexer returns 404, it might just mean no activity recorded yet
        if (response.status === 404) {
          setTransactions([]);
          setActivityUnavailable(false);
          return;
        }
        throw new Error(`Indexer status: ${response.status}`);
      }

      // Read as text first to avoid "Unexpected end of JSON input" errors
      const text = await response.text();
      if (!text || text.trim().length === 0) {
        setTransactions([]);
        setActivityUnavailable(false);
        return;
      }

      const data = JSON.parse(text);

      if (data && data.activity && Array.isArray(data.activity)) {
        const formatted: Transaction[] = data.activity.slice(0, 8).map((act: any) => ({
          id: act.hash || act.receipt_id || Math.random().toString(),
          timestamp: new Date(act.timestamp ? act.timestamp / 1000000 : Date.now()),
          amount: act.amount ? Number(act.amount) / 1e24 : 0,
          wallet: act.signer_id || act.sender_id || 'unknown.near',
          type: (act.action_kind === 'TRANSFER' || act.action === 'transfer') && (act.receiver_id === PUBLIC_POOL_ADDRESS) ? 'donation' : 'payout'
        }));
        setTransactions(formatted);
        setActivityUnavailable(false);
      } else {
        setTransactions([]);
        setActivityUnavailable(false);
      }
    } catch (err) {
      console.error("Failed to fetch activity:", err);
      // Don't set transactions to empty on network failure to keep old data visible
    }
  }, []);

  useEffect(() => {
    updateBalance();
    updateActivity();
    const interval = setInterval(() => {
      updateBalance();
      updateActivity();
    }, 45000);
    return () => clearInterval(interval);
  }, [updateBalance, updateActivity]);

  const handlePayoutSuccess = (amount: number, wallet: string) => {
    setBalance(prev => prev !== null ? Number((prev - amount).toFixed(3)) : null);
    // Refresh activity after a short delay to allow indexers to catch up
    setTimeout(updateActivity, 2000);
  };

  return (
    <div className="min-h-screen relative pb-20 overflow-x-hidden">
      <div className="grain"></div>
      <div className="flash-overlay"></div>

      <header className="max-w-4xl mx-auto pt-16 pb-12 px-6 text-center">
        <div className="mb-8 flex justify-center">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm shadow-2xl">
            <img src="/near-logo.png" alt="NEAR Logo" className="w-16 h-16 object-contain filter invert opacity-90" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter leading-none text-white">
          THE <span className="text-[var(--accent-gold)]">SMILE</span> BOOTH
        </h1>
        <p className="serif italic text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
          A touch of kindness in a digital world. Powered by NEAR.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">

          <div className="lg:col-span-12 xl:col-span-7 space-y-8 md:space-y-12">
            <section className="booth-card order-1 xl:order-none">
              <ClaimForm
                poolBalance={balance || 0}
                onSuccess={handlePayoutSuccess}
                rewardAmount={currentReward}
              />
            </section>

            <section className="booth-card">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h3 className="serif text-2xl font-bold flex items-center gap-3">
                  <span className="text-[var(--accent-gold)]">✦</span>
                  Live Ledger
                </h3>
                <button
                  onClick={() => { updateBalance(); updateActivity(); }}
                  className="text-[10px] uppercase tracking-widest font-black text-[var(--accent-gold)] hover:opacity-70 transition-opacity border border-[var(--accent-gold)]/30 px-3 py-1 rounded-full"
                >
                  {isSyncing ? 'Synchronizing...' : 'Refresh Activity'}
                </button>
              </div>

              {activityUnavailable ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
                  <p className="serif italic text-sm text-[var(--text-secondary)] mb-2">Activity feed unavailable for implicit accounts.</p>
                  <p className="text-xs text-[var(--text-secondary)]">Balance tracking is still active.</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
                  <p className="serif italic text-[var(--text-secondary)]">No recent entries found in the ledger.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between border-b border-white/5 pb-4 group last:border-0 animate-in fade-in duration-500">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center bg-white/5 ${tx.type === 'donation' ? 'text-[var(--accent-gold)]' : 'text-[var(--text-primary)]'}`}>
                          <span className="text-sm">{tx.type === 'donation' ? '🌱' : '✨'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white block max-w-[120px] md:max-w-[200px] truncate" title={tx.wallet}>
                            {tx.wallet}
                          </span>
                          <span className="serif italic text-xs text-[var(--text-secondary)]">
                            {tx.type === 'donation' ? 'contributed' : 'received a payout'}
                          </span>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${tx.type === 'donation' ? 'text-[var(--accent-gold)]' : 'text-white'}`}>
                        {tx.type === 'donation' ? '+' : '-'}{tx.amount.toFixed(4)} NEAR
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-12 xl:col-span-5 space-y-8 md:space-y-12">
            <div className="booth-card text-center relative overflow-hidden group">
              <div className={`absolute top-0 left-0 h-1 bg-[var(--accent-gold)] transition-all duration-1000 ${isSyncing ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>
              <span className="serif italic text-sm text-[var(--text-secondary)] mb-2 block">Pool Reservoir</span>
              <div className="text-4xl md:text-5xl font-black text-white mb-4">
                {balance !== null ? balance.toLocaleString() : '---'} <span className="serif italic text-xl font-normal opacity-30">near</span>
              </div>

              {error && <p className="text-[10px] text-red-500 font-bold mb-4 uppercase tracking-tighter px-4 py-1 bg-red-500/10 rounded-full inline-block">{error}</p>}

              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-[var(--accent-gold)] animate-pulse' : 'bg-[var(--accent-gold)]'}`}></div>
                <p className="text-[10px] uppercase tracking-widest font-black text-[var(--accent-gold)]">Sustainable Emission Active</p>
              </div>
            </div>

            <DonationSection />

            <div className="serif italic p-8 md:p-10 border border-white/10 rounded-[24px] bg-white/5 space-y-6">
              <h4 className="not-italic font-black text-white text-lg tracking-tight uppercase">Emission Model</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Daily Distribution Rate</span>
                  <span className="text-[10px] font-bold uppercase text-white">{(DAILY_EMISSION_PERCENTAGE * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Projected Capacity</span>
                  <span className="text-[10px] font-bold uppercase text-white">{ESTIMATED_DAILY_PARTICIPANTS} Smiles/Day</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Current Smile Yield</span>
                  <span className="text-[10px] font-bold uppercase text-[var(--accent-gold)]">{currentReward} NEAR</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Protocol Status</span>
                  <span className="text-[10px] font-bold uppercase text-[var(--accent-gold)]">Verified Stable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto mt-32 text-center pb-20 px-6">
        <div className="h-[1px] w-32 bg-[#D6CEC3] mx-auto mb-10"></div>
        <p className="serif italic text-sm text-[#7A6D5E] max-w-lg mx-auto leading-relaxed">
          The emission model ensures the Smile Pool remains operational indefinitely by adjusting rewards relative to the reservoir's health.
        </p>
      </footer>
    </div>
  );
};

export default App;

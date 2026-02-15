
import React, { useState } from 'react';
import { PUBLIC_POOL_ADDRESS, DONATION_QR_URL } from '../constants';

const DonationSection: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(PUBLIC_POOL_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="booth-card relative group">
      <div className="flex items-center justify-between mb-8">
        <h4 className="text-xl font-black text-white uppercase tracking-tighter">LEND A HAND</h4>
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm shadow-inner text-[var(--accent-gold)]">🌱</div>
      </div>

      <p className="serif italic text-sm text-[var(--text-secondary)] mb-10 leading-relaxed font-medium">
        Support the ecosystem. Keeps the joy flowing for others.
      </p>

      <div className="flex justify-center mb-10">
        <div className="p-4 bg-white border-8 border-[#222] rounded-2xl shadow-2xl transition-transform duration-700 hover:rotate-2">
          <img src={DONATION_QR_URL} alt="NEAR Account QR" className="w-32 h-32 opacity-90" />
        </div>
      </div>

      <div className="space-y-4">
        <span className="serif italic text-[10px] uppercase tracking-widest text-[var(--text-secondary)] block px-1 font-black">Pool Address</span>
        <div
          onClick={copyAddress}
          className="bg-black/20 border border-white/10 rounded-xl px-4 py-4 flex items-center justify-between cursor-pointer hover:border-[var(--accent-gold)] transition-all group/addr"
        >
          <code className="text-[10px] font-black text-white/80 truncate uppercase tracking-[0.2em]">
            {PUBLIC_POOL_ADDRESS}
          </code>
          <div className="ml-4">
            {copied ? (
              <span className="text-[10px] font-black uppercase text-[var(--accent-gold)]">COPIED</span>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20 group-hover/addr:text-[var(--accent-gold)]"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationSection;

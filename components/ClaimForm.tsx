
import React, { useState, useRef, useEffect } from 'react';
import { validateSmile } from '../services/geminiService';

interface ClaimFormProps {
  poolBalance: number;
  rewardAmount: number;
  onSuccess: (amount: number, wallet: string) => void;
}

type Step = 'identity' | 'capture' | 'preview' | 'broadcasting';

const ClaimForm: React.FC<ClaimFormProps> = ({ poolBalance, rewardAmount, onSuccess }) => {
  const [step, setStep] = useState<Step>('identity');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (step === 'capture' && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [step, stream]);

  const startRitual = async () => {
    const isNearAddress = wallet.endsWith('.near') && wallet.length >= 5;
    const isHexAddress = /^[a-fA-F0-9]{64}$/.test(wallet);

    if (!wallet || (!isNearAddress && !isHexAddress)) {
      setStatus({ type: 'error', message: 'The ledger requires a valid NEAR wallet address or account ID.' });
      return;
    }

    setStatus({ type: 'idle', message: '' });

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      setStep('capture');
    } catch (err) {
      setStatus({ type: 'error', message: 'Permissions denied. The oracle requires a visual connection.' });
    }
  };

  const stopCamera = () => {
    if (stream) { stream.getTracks().forEach(track => track.stop()); }
    setStream(null);
    setCameraReady(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPreview(dataUrl);
        setStep('preview');
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setPreview(null);
    startRitual();
  };

  const handleFinalSubmit = async () => {
    if (!preview || !wallet) return;
    setLoading(true);
    setStep('broadcasting');

    try {
      setStatus({ type: 'idle', message: 'Analyzing biometric joy markers...' });
      const result = await validateSmile(preview);

      if (!result.isValid) {
        setStatus({ type: 'error', message: `Verification failed: ${result.reason}` });
        setLoading(false);
        setStep('preview');
        return;
      }

      setStatus({ type: 'idle', message: 'Submitting claim to NEAR blockchain...' });

      // Call backend API to process reward
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/claim-reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: wallet,
          smileImageBase64: preview
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to process reward claim');
      }

      setStatus({
        type: 'success',
        message: `Protocol complete. ${data.amount} NEAR has been distributed. TX: ${data.transactionHash.substring(0, 8)}...`
      });

      onSuccess(data.amount, wallet);
      setPreview(null);
      setWallet('');
      setStep('identity');
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Blockchain connection timeout. Please try again.' });
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="p-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">CLAIM REWARD</h2>
            <p className="serif italic text-sm text-[var(--accent-gold)]">Witnessed by the AI Oracle</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="serif italic text-xs text-[var(--text-secondary)] block">Yield Per Smile</span>
            <span className="text-2xl font-black text-[var(--accent-gold)]">{rewardAmount} NEAR</span>
          </div>
        </div>

        <div className="space-y-12">
          <div className="viewfinder shadow-2xl">
            {step === 'identity' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 bg-[#050505]">
                <div className="w-20 h-20 border border-white/10 rounded-3xl flex items-center justify-center mb-8 bg-white/5 text-[var(--accent-gold)]">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
                <div className="space-y-6 max-w-xs w-full">
                  <input
                    type="text"
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    placeholder="W-ID (e.g. user.near)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center font-black text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--accent-gold)] transition-all tracking-widest text-sm"
                  />
                  <div className="flex flex-col gap-3 items-center">
                    <button onClick={startRitual} className="text-xs uppercase tracking-[0.3em] font-black text-[var(--accent-gold)] hover:opacity-70 transition-opacity border-b-2 border-[var(--accent-gold)]/30 pb-1">
                      INITIALIZE SEQUENCE
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'capture' && (
              <div className="absolute inset-0 animate-in fade-in">
                <div className="viewfinder-crosshair"></div>
                <video ref={videoRef} autoPlay playsInline onLoadedMetadata={() => setCameraReady(true)} className="w-full h-full object-cover scale-x-[-1] opacity-70 grayscale" />
                <div className="absolute top-4 right-4 z-10">
                  <button onClick={() => { stopCamera(); setStep('identity'); }} className="bg-black/40 hover:bg-white/10 p-2 rounded-lg text-white/40 hover:text-white transition-all backdrop-blur-md">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
                <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-6">
                  <span className="text-[10px] uppercase font-black tracking-[0.4em] text-[var(--accent-gold)] animate-pulse">
                    POSITION FACE IN VIEW
                  </span>
                  <button
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                    className="shutter-btn"
                    title="Capture Smile"
                  >
                    <div className="shutter-btn-inner"></div>
                  </button>
                </div>
              </div>
            )}

            {(step === 'preview' || step === 'broadcasting') && preview && (
              <div className="absolute inset-0 animate-in zoom-in-95 duration-700">
                <img src={preview} alt="Captured" className="w-full h-full object-cover grayscale opacity-90 brightness-75" />
                {step === 'preview' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm opacity-0 hover:opacity-100 transition-all duration-300">
                    <button onClick={handleRetake} className="text-xs font-black uppercase tracking-[0.3em] text-white border-2 border-white/20 px-6 py-3 rounded-full hover:bg-white hover:text-black transition-all">RETAKE PHOTO</button>
                  </div>
                )}
                {step === 'broadcasting' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <div className="flex flex-col items-center gap-6 text-center px-10">
                      <div className="w-16 h-16 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin"></div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-gold)] block">PROCESSING...</span>
                        <span className="serif italic text-sm text-white/60 leading-relaxed font-medium">{status.message || 'Connecting to protocol...'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {step === 'preview' && (
              <button
                onClick={handleFinalSubmit}
                disabled={loading || poolBalance < rewardAmount}
                className="w-full bg-[var(--accent-gold)] text-black py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] disabled:bg-white/10 disabled:text-white/20 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
              >
                SUBMIT FOR VALIDATION
              </button>
            )}

            {status.message && step !== 'broadcasting' && (
              <div className={`text-center p-6 rounded-2xl border-2 animate-in fade-in ${status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-[var(--accent-gold)]/10 border-[var(--accent-gold)]/20 text-[var(--accent-gold)]'}`}>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 block">{status.type === 'error' ? 'ERROR' : 'SUCCESS'}</span>
                <span className="serif italic text-sm font-medium">{status.message}</span>
              </div>
            )}

            {step === 'identity' && (
              <div className="flex items-center justify-center gap-4 text-white/20">
                <div className="h-px w-8 bg-current"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-center">
                  POOL STABLE: {poolBalance ? poolBalance.toLocaleString() : '---'} NEAR
                </span>
                <div className="h-px w-8 bg-current"></div>
              </div>
            )}
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ClaimForm;

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  X, 
  AlertCircle,
  Database,
  ArrowRight
} from 'lucide-react';
import { 
  signInWithPopup, 
  signInAnonymously, 
  auth, 
  googleProvider 
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by browser. You can try the Anonymous Guest mode below to test immediately.');
      } else {
        setError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
      onClose();
    } catch (err: any) {
      console.error('Anonymous Sign In Error:', err);
      setError(err.message || 'Failed to start guest session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-slate-100 overflow-hidden"
        id="auth-modal-dialog"
      >
        {/* Subtle accent glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          id="close-auth-modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Sign In to TrustLoop AI
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Personal Consumer Decision Journal & Audit Log
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Security & Data Isolation Highlights */}
        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-4 mb-6 space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Strict User Data Isolation</span>
          </div>
          <div className="flex items-start gap-2 text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>Firestore security rules enforce private access: no user can see or read another user's journal.</span>
          </div>
          <div className="flex items-start gap-2 text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>Server-side Gemini AI credentials protect secrets from browser inspection.</span>
          </div>
        </div>

        {/* Sign In Buttons */}
        <div className="space-y-3">
          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm bg-white text-slate-900 hover:bg-slate-100 active:scale-[0.99] transition-all shadow-md disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            id="anonymous-signin-btn"
            onClick={handleAnonymousSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs text-slate-300 bg-slate-800/80 hover:bg-slate-850 hover:text-white border border-slate-700 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            <span>Continue as Guest / Anonymous Tester</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 text-center mt-5">
          By signing in, your decision entries and outcome analyses are encrypted and stored in your isolated Firestore collection.
        </p>
      </div>
    </div>
  );
};

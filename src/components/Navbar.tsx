import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  LayoutDashboard, 
  PlusCircle, 
  BookOpen, 
  TrendingUp, 
  LogIn, 
  LogOut, 
  Database,
  User as UserIcon,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import type { User } from '../lib/firebase';

interface NavbarProps {
  currentTab: 'dashboard' | 'new-decision' | 'payment-check' | 'journal' | 'insights';
  setCurrentTab: (tab: 'dashboard' | 'new-decision' | 'payment-check' | 'journal' | 'insights') => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onSeedSampleData: () => void;
  isSeeding: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onSignIn,
  onSignOut,
  onSeedSampleData,
  isSeeding,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Name */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setCurrentTab('dashboard')}
            id="brand-logo-button"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">TrustLoop AI</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800/80 rounded-full">
                  Decision Journal
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Promises vs Reality • Consumer Protection
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-tab-dashboard"
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </button>

            <button
              id="nav-tab-new-decision"
              onClick={() => setCurrentTab('new-decision')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'new-decision'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>New Decision</span>
            </button>

            <button
              id="nav-tab-payment-check"
              onClick={() => setCurrentTab('payment-check')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'payment-check'
                  ? 'bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Check Payment</span>
            </button>

            <button
              id="nav-tab-journal"
              onClick={() => setCurrentTab('journal')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'journal'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">My Journal</span>
            </button>

            <button
              id="nav-tab-insights"
              onClick={() => setCurrentTab('insights')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'insights'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden md:inline">Insights</span>
            </button>
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Seed button */}
            <button
              id="seed-sample-btn"
              onClick={onSeedSampleData}
              disabled={isSeeding}
              title="Load realistic example decisions to test the Promise-to-Outcome Gap immediately"
              className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>Load Examples</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || "User"} 
                      className="w-8 h-8 rounded-full ring-1 ring-cyan-500/40"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="hidden xl:block text-left">
                    <p className="text-xs font-medium text-slate-200 truncate max-w-[130px]">
                      {user.displayName || (user.isAnonymous ? "Guest Reviewer" : user.email?.split('@')[0])}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{user.isAnonymous ? "Guest Isolated" : "Firestore Secure"}</span>
                    </div>
                  </div>
                </div>

                <button
                  id="sign-out-button"
                  onClick={onSignOut}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="sign-in-button"
                onClick={onSignIn}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

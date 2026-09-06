/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  signInAnonymously,
  type User 
} from './lib/firebase';
import type { 
  DecisionEntry, 
  ActualOutcome, 
  PromiseToOutcomeGap,
  PaymentCheckEntry,
  PaymentVerificationStatus
} from './types';
import { 
  fetchUserDecisions, 
  saveDecision, 
  deleteDecision, 
  recordOutcomeForDecision 
} from './services/decisionService';
import { 
  fetchUserPaymentChecks, 
  savePaymentCheck, 
  updatePaymentCheck, 
  deletePaymentCheck, 
  SAMPLE_PAYMENT_CHECKS 
} from './services/paymentCheckService';
import { SAMPLE_DECISIONS } from './data/sampleDecisions';

// Components
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './components/DashboardView';
import { NewDecisionView } from './components/NewDecisionView';
import { PaymentScreenshotAnalyzerView } from './components/PaymentScreenshotAnalyzerView';
import { JournalView } from './components/JournalView';
import { InsightsView } from './components/InsightsView';
import { OutcomeModal } from './components/OutcomeModal';
import { DecisionDetailModal } from './components/DecisionDetailModal';
import { PaymentCheckDetailModal } from './components/PaymentCheckDetailModal';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Active view tab
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'new-decision' | 'payment-check' | 'journal' | 'insights'>('dashboard');

  // Decision state
  const [decisions, setDecisions] = useState<DecisionEntry[]>([]);
  const [paymentChecks, setPaymentChecks] = useState<PaymentCheckEntry[]>([]);
  const [loadingDecisions, setLoadingDecisions] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Modals state
  const [selectedDecisionForDetail, setSelectedDecisionForDetail] = useState<DecisionEntry | null>(null);
  const [selectedDecisionForOutcome, setSelectedDecisionForOutcome] = useState<DecisionEntry | null>(null);
  const [selectedPaymentCheck, setSelectedPaymentCheck] = useState<PaymentCheckEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [isPaymentCheckModalOpen, setIsPaymentCheckModalOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // 1. Listen for Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        await loadDecisionsForUser(currentUser.uid);
      } else {
        // Automatically start anonymous session if first time, so Firestore isolation is immediately active
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.warn('Auto anonymous sign-in failed, awaiting explicit sign-in:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch decisions and payment checks for the authenticated user
  const loadDecisionsForUser = async (userId: string) => {
    setLoadingDecisions(true);
    try {
      let items = await fetchUserDecisions(userId);
      // Auto-seed sample decisions on very first session if empty so the user can immediately evaluate the app
      if (items.length === 0) {
        for (const sample of SAMPLE_DECISIONS) {
          await saveDecision(userId, sample);
        }
        items = await fetchUserDecisions(userId);
      }
      setDecisions(items);

      // Also load payment checks
      let pChecks = await fetchUserPaymentChecks(userId);
      if (pChecks.length === 0) {
        for (const pSample of SAMPLE_PAYMENT_CHECKS) {
          await savePaymentCheck(userId, pSample);
        }
        pChecks = await fetchUserPaymentChecks(userId);
      }
      setPaymentChecks(pChecks);
    } catch (err) {
      console.error('Failed to load user decisions:', err);
      showToast('Could not sync journal entries from Firestore', 'error');
    } finally {
      setLoadingDecisions(false);
    }
  };

  // Seed samples manually on demand
  const handleSeedSampleData = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSeeding(true);
    try {
      for (const sample of SAMPLE_DECISIONS) {
        await saveDecision(user.uid, sample);
      }
      for (const pSample of SAMPLE_PAYMENT_CHECKS) {
        await savePaymentCheck(user.uid, pSample);
      }
      const updated = await fetchUserDecisions(user.uid);
      const updatedChecks = await fetchUserPaymentChecks(user.uid);
      setDecisions(updated);
      setPaymentChecks(updatedChecks);
      showToast('Loaded realistic sample decisions and payment checks!');
    } catch (err) {
      console.error('Failed to seed samples:', err);
      showToast('Failed to load sample data', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Save a new decision
  const handleSaveToJournal = async (entry: Omit<DecisionEntry, 'id' | 'userId'>) => {
    if (!user) {
      setIsAuthModalOpen(true);
      throw new Error('Please sign in to save journal entries.');
    }

    const saved = await saveDecision(user.uid, entry);
    setDecisions(prev => [saved, ...prev]);
    showToast(`Saved "${saved.productName}" to your personal journal!`);
  };

  // Save a new payment check
  const handleSavePaymentCheck = async (entry: Omit<PaymentCheckEntry, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) {
      setIsAuthModalOpen(true);
      throw new Error('Please sign in to save payment checks.');
    }

    const saved = await savePaymentCheck(user.uid, entry);
    setPaymentChecks(prev => [saved, ...prev]);
    showToast(`Saved payment check for "${saved.counterpartyName}" to your journal!`);
  };

  // Update payment check verification status
  const handleUpdatePaymentCheckStatus = async (id: string, status: PaymentVerificationStatus, notes?: string) => {
    if (!user) return;
    await updatePaymentCheck(user.uid, id, {
      verificationStatus: status,
      verificationNotes: notes,
      bankVerifiedAt: status === 'verified_in_bank' ? new Date().toISOString() : undefined,
    });
    setPaymentChecks(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          verificationStatus: status,
          verificationNotes: notes !== undefined ? notes : p.verificationNotes,
          bankVerifiedAt: status === 'verified_in_bank' ? new Date().toISOString() : undefined,
        };
      }
      return p;
    }));

    if (selectedPaymentCheck && selectedPaymentCheck.id === id) {
      setSelectedPaymentCheck(prev => prev ? {
        ...prev,
        verificationStatus: status,
        verificationNotes: notes !== undefined ? notes : prev.verificationNotes,
        bankVerifiedAt: status === 'verified_in_bank' ? new Date().toISOString() : undefined,
      } : null);
    }

    showToast('Payment verification status updated.');
  };

  // Delete payment check
  const handleDeletePaymentCheck = async (id: string) => {
    if (!user) return;
    await deletePaymentCheck(user.uid, id);
    setPaymentChecks(prev => prev.filter(p => p.id !== id));
    if (selectedPaymentCheck?.id === id) {
      setIsPaymentCheckModalOpen(false);
      setSelectedPaymentCheck(null);
    }
    showToast('Payment check removed from journal.');
  };

  // Record outcome & gap audit
  const handleSaveOutcome = async (
    decisionId: string,
    outcome: ActualOutcome,
    gapAnalysis: PromiseToOutcomeGap
  ) => {
    if (!user) return;

    await recordOutcomeForDecision(user.uid, decisionId, outcome, gapAnalysis);

    setDecisions(prev => 
      prev.map(d => {
        if (d.id === decisionId) {
          return {
            ...d,
            decisionStatus: 'outcome_recorded',
            outcomeDate: new Date().toISOString(),
            actualOutcome: {
              ...outcome,
              gapAnalysis,
            }
          };
        }
        return d;
      })
    );

    // Also update modals if currently open
    if (selectedDecisionForDetail && selectedDecisionForDetail.id === decisionId) {
      setSelectedDecisionForDetail(prev => prev ? {
        ...prev,
        decisionStatus: 'outcome_recorded',
        actualOutcome: {
          ...outcome,
          gapAnalysis,
        }
      } : null);
    }

    showToast('Promise-to-Outcome Gap analysis saved to your journal!');
  };

  // Delete decision
  const handleDeleteDecision = async (id: string) => {
    if (!user) return;
    await deleteDecision(user.uid, id);
    setDecisions(prev => prev.filter(d => d.id !== id));
    showToast('Decision removed from your journal.');
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      setDecisions([]);
      showToast('Signed out successfully.');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Modal openers
  const openDetailModal = (decision: DecisionEntry) => {
    setSelectedDecisionForDetail(decision);
    setIsDetailModalOpen(true);
  };

  const openOutcomeModal = (decision: DecisionEntry) => {
    setSelectedDecisionForOutcome(decision);
    setIsOutcomeModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center mb-4 shadow-xl shadow-cyan-500/20">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Initializing TrustLoop AI Secure Workspace...</p>
        <p className="text-xs text-slate-500 mt-1">Authenticating isolated Firestore storage</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-medium ${
            toast.type === 'error'
              ? 'bg-red-950 border-red-800 text-red-200'
              : 'bg-slate-900 border-emerald-500/40 text-emerald-300'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onSignIn={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onSeedSampleData={handleSeedSampleData}
        isSeeding={isSeeding}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'dashboard' && (
          <DashboardView
            decisions={decisions}
            paymentChecks={paymentChecks}
            onNavigateToNew={() => setCurrentTab('new-decision')}
            onNavigateToPaymentCheck={() => setCurrentTab('payment-check')}
            onNavigateToJournal={() => setCurrentTab('journal')}
            onSelectDecision={openDetailModal}
            onSelectPaymentCheck={(check) => {
              setSelectedPaymentCheck(check);
              setIsPaymentCheckModalOpen(true);
            }}
            onRecordOutcome={openOutcomeModal}
            onSeedSampleData={handleSeedSampleData}
          />
        )}

        {currentTab === 'new-decision' && (
          <NewDecisionView
            onSaveToJournal={handleSaveToJournal}
            onNavigateToJournal={() => setCurrentTab('journal')}
          />
        )}

        {currentTab === 'payment-check' && (
          <PaymentScreenshotAnalyzerView
            onSaveToJournal={handleSavePaymentCheck}
            onNavigateToJournal={() => setCurrentTab('journal')}
          />
        )}

        {currentTab === 'journal' && (
          <JournalView
            decisions={decisions}
            paymentChecks={paymentChecks}
            onSelectDecision={openDetailModal}
            onSelectPaymentCheck={(check) => {
              setSelectedPaymentCheck(check);
              setIsPaymentCheckModalOpen(true);
            }}
            onRecordOutcome={openOutcomeModal}
            onDeleteDecision={handleDeleteDecision}
            onDeletePaymentCheck={handleDeletePaymentCheck}
            onNavigateToNew={() => setCurrentTab('new-decision')}
            onNavigateToPaymentCheck={() => setCurrentTab('payment-check')}
            onSeedSampleData={handleSeedSampleData}
          />
        )}

        {currentTab === 'insights' && (
          <InsightsView
            decisions={decisions}
            onNavigateToNew={() => setCurrentTab('new-decision')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            TrustLoop AI • Personal Consumer Decision Journal & Audit Log
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Powered by Gemini & Firebase</span>
            <span>•</span>
            <span>Per-User Firestore Data Isolation</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <OutcomeModal
        decision={selectedDecisionForOutcome}
        isOpen={isOutcomeModalOpen}
        onClose={() => {
          setIsOutcomeModalOpen(false);
          setSelectedDecisionForOutcome(null);
        }}
        onSaveOutcome={handleSaveOutcome}
      />

      <DecisionDetailModal
        decision={selectedDecisionForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDecisionForDetail(null);
        }}
        onRecordOutcome={(dec) => {
          setIsDetailModalOpen(false);
          openOutcomeModal(dec);
        }}
        onDeleteDecision={handleDeleteDecision}
      />

      <PaymentCheckDetailModal
        check={selectedPaymentCheck}
        isOpen={isPaymentCheckModalOpen}
        onClose={() => {
          setIsPaymentCheckModalOpen(false);
          setSelectedPaymentCheck(null);
        }}
        onUpdateStatus={(id, status, notes) => handleUpdatePaymentCheckStatus(id, status, notes)}
        onDeleteCheck={(id) => handleDeletePaymentCheck(id)}
      />

    </div>
  );
}

import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  FileCheck, 
  Trash2, 
  ExternalLink,
  Calendar,
  DollarSign,
  User,
  Hash,
  Clock,
  CheckSquare,
  Square
} from 'lucide-react';
import type { PaymentCheckEntry, PaymentRiskLevel, PaymentVerificationStatus } from '../types';
import { SimplePaymentResult } from './SimplePaymentResult';
import { getSimplePaymentSafetySummary } from '../utils/simpleTrustSummary';

interface PaymentCheckDetailModalProps {
  check: PaymentCheckEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (checkId: string, status: PaymentVerificationStatus, notes?: string) => Promise<void>;
  onDelete: (checkId: string) => Promise<void>;
}

export const PaymentCheckDetailModal: React.FC<PaymentCheckDetailModalProps> = ({
  check,
  isOpen,
  onClose,
  onUpdateStatus,
  onDelete,
}) => {
  if (!isOpen || !check) return null;

  const [status, setStatus] = useState<PaymentVerificationStatus>(check.verificationStatus);
  const [notes, setNotes] = useState(check.verificationNotes || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveStatus = async () => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(check.id, status, notes);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this payment check from your journal?')) {
      setIsDeleting(true);
      try {
        await onDelete(check.id);
        onClose();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const analysis = check.analysis;

  const paymentSummary = React.useMemo(() => {
    return getSimplePaymentSafetySummary(check.analysis, check.claimedAmount, check.counterpartyName);
  }, [check]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 relative">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="space-y-2 pr-8">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
              analysis.riskLevel === 'HIGH RISK'
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : analysis.riskLevel === 'MEDIUM RISK'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {analysis.riskLevel}
            </span>
            <span className="text-xs text-slate-400">
              Logged {new Date(check.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            {check.title}
          </h2>
          <p className="text-xs text-slate-400">
            Sender: <strong className="text-slate-200">{check.counterpartyName}</strong> • Claimed: <strong className="text-cyan-300">{check.claimedAmount}</strong>
          </p>
        </div>

        {/* PROMINENT SAFETY BANNER */}
        <div className="bg-amber-950/40 border border-amber-600/60 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            “A payment screenshot cannot confirm that money was actually received. Verify the transaction in your own bank or UPI transaction history before releasing goods, services, refunds, or personal information.”
          </p>
        </div>

        {/* THUMBNAIL IF AVAILABLE */}
        {check.screenshotThumbnail && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 flex justify-center">
            <img 
              src={check.screenshotThumbnail} 
              alt="Screenshot Preview" 
              className="max-h-56 object-contain rounded"
            />
          </div>
        )}

        {/* SIMPLIFIED PAYMENT RESULT */}
        {paymentSummary && (
          <SimplePaymentResult
            summary={paymentSummary}
            counterpartyOrAmount={check.claimedAmount ? `${check.claimedAmount} (${check.counterpartyName || 'Sender'})` : check.counterpartyName}
            defaultExpanded={false}
            detailedChildren={
              <div className="space-y-6">
                {/* RISK ASSESSMENT SUMMARY */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Executive Risk Assessment
          </span>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {analysis.riskSummary}
          </p>

          {analysis.riskReasons && analysis.riskReasons.length > 0 && (
            <ul className="pt-2 space-y-1 text-xs text-slate-300">
              {analysis.riskReasons.map((r, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* EXTRACTED DETAILS */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Visible Transaction Fields Extracted
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Amount</span>
              <span className="text-white font-bold">{analysis.extractedDetails.paymentAmount || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Status</span>
              <span className="text-amber-300 font-semibold">{analysis.extractedDetails.paymentStatus || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Timestamp</span>
              <span className="text-slate-300">{analysis.extractedDetails.dateTime || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Reference ID</span>
              <span className="text-cyan-300 font-mono">{analysis.extractedDetails.transactionId || 'Missing'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Payment App</span>
              <span className="text-slate-300">{analysis.extractedDetails.paymentApp || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Sender Info</span>
              <span className="text-slate-300">{analysis.extractedDetails.senderInfo || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* WARNING SIGNALS */}
        {analysis.warningSignals && analysis.warningSignals.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Warning Signals Detected ({analysis.warningSignals.length})
            </span>
            <div className="space-y-2">
              {analysis.warningSignals.map((sig, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{sig.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-800 text-slate-300">
                      {sig.severity}
                    </span>
                  </div>
                  <p className="text-slate-400">{sig.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6-STEP CHECKLIST STATUS */}
        {analysis.verificationChecklist && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              6-Step Bank Verification Protocol
            </span>
            <div className="space-y-1.5 text-xs">
              {analysis.verificationChecklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-slate-300">
                  {item.checked ? (
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span className={item.checked ? 'text-emerald-200 font-medium' : 'text-slate-400'}>
                    {item.step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

              </div>
            }
          />
        )}

        {/* UPDATE VERIFICATION STATUS */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <label className="block text-xs font-bold text-white">
            Reconcile in Bank History
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setStatus('verified_in_bank')}
              className={`p-2 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-all ${
                status === 'verified_in_bank'
                  ? 'bg-emerald-950 border-emerald-600 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified in Bank</span>
            </button>
            <button
              type="button"
              onClick={() => setStatus('unverified_pending')}
              className={`p-2 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-all ${
                status === 'unverified_pending'
                  ? 'bg-amber-950 border-amber-600 text-amber-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending Check</span>
            </button>
            <button
              type="button"
              onClick={() => setStatus('flagged_suspicious')}
              className={`p-2 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-all ${
                status === 'flagged_suspicious'
                  ? 'bg-rose-950 border-rose-600 text-rose-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Flagged</span>
            </button>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Bank Reconciliation Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified credited in account ending in ...9012"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Check</span>
            </button>

            <button
              type="button"
              onClick={handleSaveStatus}
              disabled={isUpdating}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              {isUpdating ? 'Saving...' : 'Save Updates'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

import React from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  Building2, 
  Truck, 
  RefreshCcw, 
  ExternalLink,
  Award,
  Trash2,
  Edit3,
  Calendar,
  Sparkles,
  FileImage
} from 'lucide-react';
import type { DecisionEntry, ClaimStatus } from '../types';
import { ConsumerPressureGauge } from './ConsumerPressureGauge';
import { SimpleTrustResult } from './SimpleTrustResult';
import { getSimpleProductTrustSummary } from '../utils/simpleTrustSummary';

interface DecisionDetailModalProps {
  decision: DecisionEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordOutcome: (decision: DecisionEntry) => void;
  onDeleteDecision: (id: string) => void;
}

export const DecisionDetailModal: React.FC<DecisionDetailModalProps> = ({
  decision,
  isOpen,
  onClose,
  onRecordOutcome,
  onDeleteDecision,
}) => {
  if (!isOpen || !decision) return null;

  const getStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case 'Supported':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700';
      case 'Partially supported':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      case 'Unverified':
        return 'bg-cyan-950 text-cyan-300 border-cyan-700';
      case 'Missing evidence':
      default:
        return 'bg-rose-950 text-rose-300 border-rose-700';
    }
  };

  const getDecisionStatusBadge = (status: string) => {
    switch (status) {
      case 'outcome_recorded':
        return { label: 'Outcome Audited', color: 'bg-cyan-950 text-cyan-300 border-cyan-800' };
      case 'purchased_pending_outcome':
        return { label: 'Purchased — Pending Reality Check', color: 'bg-amber-950 text-amber-300 border-amber-800' };
      case 'decided_not_to_buy':
        return { label: 'Decided Not to Buy (Saved Money)', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
      case 'analyzed':
      default:
        return { label: 'Under Review', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const currentStatus = getDecisionStatusBadge(decision.decisionStatus);

  const trustSummary = React.useMemo(() => {
    return getSimpleProductTrustSummary(decision, decision.advertisedPrice, decision.sellerBrand);
  }, [decision]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative text-slate-100 overflow-hidden my-auto"
        id="decision-detail-container"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/90 sticky top-0 z-20">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStatus.color}`}>
                {currentStatus.label}
              </span>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                {decision.category}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(decision.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {decision.productName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Seller / Brand: <strong className="text-slate-200">{decision.sellerBrand}</strong> • Channel: <span className="text-slate-300">{decision.sourceType}</span>
            </p>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            id="close-decision-detail"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* PROMISE-TO-OUTCOME GAP BANNER (if outcome recorded) */}
          {decision.actualOutcome?.gapAnalysis && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-cyan-950/40 border border-cyan-800/60 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-cyan-400" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      Promise-to-Outcome Gap Result
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      {decision.actualOutcome.gapAnalysis.overallGap}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Fulfillment Score</span>
                    <span className="text-2xl font-black text-cyan-300">
                      {decision.actualOutcome.gapAnalysis.fulfillmentScore}%
                    </span>
                  </div>
                  <button
                    onClick={() => onRecordOutcome(decision)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-800/50 hover:bg-cyan-700/60 border border-cyan-700 text-xs font-semibold text-cyan-200 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Update Outcome</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                "{decision.actualOutcome.gapAnalysis.verdictSummary}"
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>What Matched the Promise</span>
                  </div>
                  <ul className="space-y-1 text-emerald-200/90">
                    {decision.actualOutcome.gapAnalysis.whatMatched.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl">
                  <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Where Reality Diverged</span>
                  </div>
                  <ul className="space-y-1 text-rose-200/90">
                    {decision.actualOutcome.gapAnalysis.whatDidNotMatch.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {decision.actualOutcome.gapAnalysis.lessonsLearned && decision.actualOutcome.gapAnalysis.lessonsLearned.length > 0 && (
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Lessons Learned for Future Decisions
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {decision.actualOutcome.gapAnalysis.lessonsLearned.map((lesson, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-bold">✓</span>
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Pending Outcome Reminder if status is pending */}
          {decision.decisionStatus === 'purchased_pending_outcome' && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Clock className="w-4 h-4" />
                  <span>Waiting for Real-World Outcome</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Did you receive this product? Record your real experience to compare the original marketing promises with reality.
                </p>
              </div>
              <button
                id="record-outcome-cta-btn"
                onClick={() => onRecordOutcome(decision)}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Record Actual Outcome</span>
              </button>
            </div>
          )}

          {/* SIMPLIFIED CONSUMER TRUST RESULT */}
          {trustSummary && (
            <SimpleTrustResult
              summary={trustSummary}
              productTitle={decision.productName}
              defaultExpanded={false}
              detailedChildren={
                <div className="space-y-6">
                  {/* Consumer Pressure Index */}
                  {decision.consumerPressureIndex && (
                    <ConsumerPressureGauge pressure={decision.consumerPressureIndex} />
                  )}

          {/* Executive Summary & Recommendation */}
          {decision.aiAnalysis && (
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Gemini Consumer Protection Assessment
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700 font-semibold text-slate-200">
                  {decision.aiAnalysis.recommendedAction}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {decision.aiAnalysis.executiveSummary}
              </p>
              {decision.aiAnalysis.balancedVerdict && (
                <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-700/60">
                  <strong className="text-slate-200">Balanced Analysis: </strong>
                  {decision.aiAnalysis.balancedVerdict}
                </p>
              )}
            </div>
          )}

          {/* Claims vs Evidence Table */}
          {decision.claimsVsEvidence && decision.claimsVsEvidence.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Claims vs Available Evidence</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 font-medium border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Claim in Offer</th>
                      <th className="py-2.5 px-3">Classification</th>
                      <th className="py-2.5 px-3">Verifiable Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                    {decision.claimsVsEvidence.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 text-slate-200 font-medium max-w-xs">
                          {item.claim}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 leading-relaxed">
                          {item.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Marketing Persuasion Signals */}
          {decision.marketingPersuasion && decision.marketingPersuasion.detectedSignals?.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Detected Marketing Persuasion Signals</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {decision.marketingPersuasion.detectedSignals.map((signal, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{signal.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        signal.severity === 'High' ? 'text-rose-400' : signal.severity === 'Medium' ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {signal.severity}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">{signal.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supply Chain Transparency */}
          {decision.supplyChainTransparency && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Supply Chain & Seller Transparency</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400">Seller Entity: </span>
                  <span className="text-slate-200">{decision.supplyChainTransparency.sellerIdentified}</span>
                </div>
                <div>
                  <span className="text-slate-400">Manufacturer: </span>
                  <span className="text-slate-200">{decision.supplyChainTransparency.manufacturerIdentified}</span>
                </div>
                <div>
                  <span className="text-slate-400">Country of Origin: </span>
                  <span className="text-slate-200">{decision.supplyChainTransparency.originCountry}</span>
                </div>
                <div>
                  <span className="text-slate-400">Return / Refund Policy: </span>
                  <span className="text-slate-200">{decision.supplyChainTransparency.returnRefundPolicy}</span>
                </div>
                <div>
                  <span className="text-slate-400">Delivery Window: </span>
                  <span className="text-slate-200">{decision.supplyChainTransparency.deliveryTimeline}</span>
                </div>
                <div>
                  <span className="text-slate-400">Warranty: </span>
                  <span className="text-slate-200">{decision.supplyChainTransparency.warrantyDetails}</span>
                </div>

                {decision.supplyChainTransparency.missingInformation && decision.supplyChainTransparency.missingInformation.length > 0 && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-700/60">
                    <span className="text-amber-400 font-semibold">Missing Pre-Purchase Information:</span>
                    <ul className="list-disc list-inside text-slate-400 mt-1 space-y-0.5">
                      {decision.supplyChainTransparency.missingInformation.map((info, idx) => (
                        <li key={idx}>{info}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verification Checklist */}
          {decision.verificationChecklist && decision.verificationChecklist.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>Pre-Purchase Verification Questions</span>
              </h3>
              <div className="space-y-2">
                {decision.verificationChecklist.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-1">
                    <div className="font-semibold text-slate-200 flex items-start gap-2">
                      <span className="text-cyan-400">Q{idx + 1}:</span>
                      <span>{q.question}</span>
                    </div>
                    <p className="text-slate-400 ml-5"><strong className="text-slate-300">Why: </strong>{q.reason}</p>
                    <p className="text-slate-400 ml-5"><strong className="text-slate-300">How to check: </strong>{q.howToVerify}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded Advertisement / Listing Screenshot */}
          {decision.imageUrl && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileImage className="w-4 h-4 text-cyan-400" />
                <span>Saved Advertisement / Listing Screenshot:</span>
              </span>
              <div className="max-w-md rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2">
                <img
                  src={decision.imageUrl}
                  alt={decision.productName}
                  className="w-full max-h-80 object-contain rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Original Ad Copy */}
          {decision.rawOfferText && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400">Raw Offer / Ad Copy Saved:</span>
              <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono whitespace-pre-wrap">
                {decision.rawOfferText}
              </p>
            </div>
          )}

                </div>
              }
            />
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between gap-4 bg-slate-900 sticky bottom-0 z-20">
          <button
            onClick={() => {
              if (confirm('Delete this journal entry? This action cannot be undone.')) {
                onDeleteDecision(decision.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Entry</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onRecordOutcome(decision);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{decision.actualOutcome ? 'Update Outcome' : 'Record Actual Outcome'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

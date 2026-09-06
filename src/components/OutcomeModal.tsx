import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Star, 
  Package, 
  Clock, 
  DollarSign, 
  HelpCircle, 
  ShieldAlert, 
  Lightbulb, 
  Award,
  Loader2,
  Save,
  Check
} from 'lucide-react';
import type { 
  DecisionEntry, 
  ActualOutcome, 
  PromiseToOutcomeGap 
} from '../types';
import { analyzeOutcomeGap } from '../services/apiService';

interface OutcomeModalProps {
  decision: DecisionEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveOutcome: (decisionId: string, outcome: ActualOutcome, gapAnalysis: PromiseToOutcomeGap) => Promise<void>;
}

export const OutcomeModal: React.FC<OutcomeModalProps> = ({
  decision,
  isOpen,
  onClose,
  onSaveOutcome,
}) => {
  if (!isOpen || !decision) return null;

  const existingOutcome = decision.actualOutcome;

  // Form states
  const [actualPricePaid, setActualPricePaid] = useState(existingOutcome?.actualPricePaid || decision.advertisedPrice || '');
  const [deliveryExperience, setDeliveryExperience] = useState(existingOutcome?.deliveryExperience || '');
  const [deliveryDaysActual, setDeliveryDaysActual] = useState<number | ''>(
    existingOutcome?.deliveryDaysActual !== undefined && existingOutcome?.deliveryDaysActual !== null
      ? existingOutcome.deliveryDaysActual
      : ''
  );
  const [productQualityRating, setProductQualityRating] = useState<number>(existingOutcome?.productQualityRating || 3);
  const [productQualityNotes, setProductQualityNotes] = useState(existingOutcome?.productQualityNotes || '');
  const [sellerExperienceRating, setSellerExperienceRating] = useState<number>(existingOutcome?.sellerExperienceRating || 3);
  const [sellerExperienceNotes, setSellerExperienceNotes] = useState(existingOutcome?.sellerExperienceNotes || '');
  const [returnRefundExperience, setReturnRefundExperience] = useState(existingOutcome?.returnRefundExperience || '');
  const [claimsFulfilledSummary, setClaimsFulfilledSummary] = useState(existingOutcome?.claimsFulfilledSummary || '');
  const [overallSatisfactionRating, setOverallSatisfactionRating] = useState<number>(existingOutcome?.overallSatisfactionRating || 3);
  
  const commonProblemOptions = [
    "Surprise checkout fees or unexpected shipping charges",
    "Delivery delayed significantly beyond promised window",
    "Product quality or materials substantially below description",
    "Key claimed features did not work or were absent",
    "Difficult or hostile return / refund procedure",
    "Customer service was unresponsive or bot-only",
    "Misleading dimensions or sizing discrepancy",
    "Unexpected recurring subscription billing"
  ];

  const [selectedProblems, setSelectedProblems] = useState<string[]>(
    existingOutcome?.unexpectedProblems || []
  );

  const [customProblem, setCustomProblem] = useState('');
  const [analyzingGap, setAnalyzingGap] = useState(false);
  const [gapResult, setGapResult] = useState<PromiseToOutcomeGap | null>(
    existingOutcome?.gapAnalysis || null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleProblem = (prob: string) => {
    if (selectedProblems.includes(prob)) {
      setSelectedProblems(selectedProblems.filter(p => p !== prob));
    } else {
      setSelectedProblems([...selectedProblems, prob]);
    }
  };

  const addCustomProblem = () => {
    if (customProblem.trim() && !selectedProblems.includes(customProblem.trim())) {
      setSelectedProblems([...selectedProblems, customProblem.trim()]);
      setCustomProblem('');
    }
  };

  // Run Gemini Promise-to-Outcome Gap Analysis
  const handleRunGapAudit = async () => {
    setAnalyzingGap(true);
    setError(null);

    const outcomePayload = {
      actualPricePaid: actualPricePaid || 'Not specified',
      deliveryExperience: deliveryExperience || 'Standard delivery',
      productQualityRating,
      productQualityNotes: productQualityNotes || 'Standard experience',
      sellerExperienceRating,
      sellerExperienceNotes: sellerExperienceNotes || 'Standard communication',
      returnRefundExperience: returnRefundExperience || 'No return attempted',
      unexpectedProblems: selectedProblems,
      overallSatisfactionRating,
    };

    try {
      const gap = await analyzeOutcomeGap({
        productName: decision.productName,
        sellerBrand: decision.sellerBrand,
        originalClaims: decision.claimsVsEvidence || [],
        originalPromises: {
          advertisedPrice: decision.advertisedPrice,
          deliveryTimeExpected: decision.expectedOutcome?.deliveryTimeExpected,
          qualityExpected: decision.expectedOutcome?.qualityExpected,
          warrantyPolicyExpected: decision.expectedOutcome?.warrantyPolicyExpected,
          keyExpectations: decision.expectedOutcome?.keyExpectations,
        },
        actualOutcome: outcomePayload,
      });

      setGapResult(gap);
    } catch (err: any) {
      console.error('Gap audit failed:', err);
      setError(err.message || 'Failed to analyze Promise-to-Outcome gap.');
    } finally {
      setAnalyzingGap(false);
    }
  };

  const handleSave = async () => {
    if (!gapResult) {
      // Auto-run gap audit first if not yet run
      await handleRunGapAudit();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const outcomeObj: ActualOutcome = {
        recordedAt: new Date().toISOString(),
        actualPricePaid,
        deliveryExperience,
        deliveryDaysActual: deliveryDaysActual === '' ? null : Number(deliveryDaysActual),
        productQualityRating,
        productQualityNotes,
        sellerExperienceRating,
        sellerExperienceNotes,
        returnRefundExperience,
        claimsFulfilledSummary: claimsFulfilledSummary || `Rated ${overallSatisfactionRating}/5 satisfaction.`,
        unexpectedProblems: selectedProblems,
        overallSatisfactionRating,
        gapAnalysis: gapResult,
      };

      await onSaveOutcome(decision.id, outcomeObj, gapResult);
      onClose();
    } catch (err: any) {
      console.error('Error saving outcome:', err);
      setError(err.message || 'Failed to save outcome to Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const getGapBadgeColor = (gapText: string) => {
    switch (gapText) {
      case 'Exceeded Promises':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700';
      case 'Matched Expectations':
        return 'bg-cyan-950 text-cyan-300 border-cyan-700';
      case 'Minor Discrepancies':
        return 'bg-yellow-950 text-yellow-300 border-yellow-700';
      case 'Significant Gap':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      case 'Major Failure / Misleading':
      default:
        return 'bg-rose-950 text-rose-300 border-rose-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative text-slate-100 overflow-hidden my-auto"
        id="outcome-modal-container"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/90 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800">
                Original Feature
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Promise vs Reality: Record Outcome
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Document what actually happened with <strong className="text-slate-200">{decision.productName}</strong> ({decision.sellerBrand}) to generate the Promise-to-Outcome Gap analysis.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            id="close-outcome-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Top Contrast Comparison Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* The Promise (Original baseline) */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                <Award className="w-4 h-4" />
                <span>The Original Promise & Expectations</span>
              </div>
              <div className="text-xs space-y-1.5 text-slate-300">
                <div>
                  <span className="text-slate-400">Advertised Price: </span>
                  <span className="font-semibold text-white">{decision.advertisedPrice || 'Unspecified'}</span>
                </div>
                {decision.expectedOutcome?.deliveryTimeExpected && (
                  <div>
                    <span className="text-slate-400">Expected Delivery: </span>
                    <span className="text-slate-200">{decision.expectedOutcome.deliveryTimeExpected}</span>
                  </div>
                )}
                {decision.expectedOutcome?.qualityExpected && (
                  <div>
                    <span className="text-slate-400">Expected Quality: </span>
                    <span className="text-slate-200">{decision.expectedOutcome.qualityExpected}</span>
                  </div>
                )}
                {decision.claimsVsEvidence && decision.claimsVsEvidence.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-700/60">
                    <span className="text-slate-400 text-[11px]">Key Advertised Claims:</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-300 mt-1 space-y-0.5">
                      {decision.claimsVsEvidence.slice(0, 3).map((c, i) => (
                        <li key={i} className="truncate">{c.claim}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* The Reality (Input area summary) */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>The Actual Real-World Outcome</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fill in what you actually received, paid, and experienced. Gemini will perform an objective side-by-side gap audit.
              </p>
            </div>
          </div>

          {/* Form Fields for Actual Outcome */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <span>1. Financial & Delivery Verification</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Actual Final Price Paid (including taxes, handling, shipping)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="actual-price-input"
                    type="text"
                    placeholder="e.g. $62.50 (was advertised at $49.99)"
                    value={actualPricePaid}
                    onChange={(e) => setActualPricePaid(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Actual Delivery Transit Time (Days)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="actual-delivery-days-input"
                    type="number"
                    min="0"
                    placeholder="e.g. 18"
                    value={deliveryDaysActual}
                    onChange={(e) => setDeliveryDaysActual(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Delivery Experience Notes
              </label>
              <input
                id="delivery-experience-notes"
                type="text"
                placeholder="e.g. Box arrived crushed, delayed by 12 days, carrier tracking was broken"
                value={deliveryExperience}
                onChange={(e) => setDeliveryExperience(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Section 2: Quality & Ratings */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <span>2. Product Quality & Performance Experience</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Quality Rating */}
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Product Build & Performance Rating (1-5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setProductQualityRating(star)}
                      className="p-1 text-yellow-400 hover:scale-110 transition-transform"
                    >
                      <Star 
                        className={`w-6 h-6 ${star <= productQualityRating ? 'fill-yellow-400' : 'text-slate-600'}`} 
                      />
                    </button>
                  ))}
                  <span className="text-xs text-slate-400 ml-2 font-semibold">
                    {productQualityRating === 5 ? 'Exceptional' : productQualityRating === 4 ? 'Good' : productQualityRating === 3 ? 'Average' : productQualityRating === 2 ? 'Substandard' : 'Unusable / Defective'}
                  </span>
                </div>
                <textarea
                  id="product-quality-notes"
                  rows={2}
                  placeholder="Details on physical materials, actual performance vs claims, durability..."
                  value={productQualityNotes}
                  onChange={(e) => setProductQualityNotes(e.target.value)}
                  className="w-full mt-3 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Seller Support & Return Experience */}
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Seller Support & Communication Rating (1-5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSellerExperienceRating(star)}
                      className="p-1 text-cyan-400 hover:scale-110 transition-transform"
                    >
                      <Star 
                        className={`w-6 h-6 ${star <= sellerExperienceRating ? 'fill-cyan-400' : 'text-slate-600'}`} 
                      />
                    </button>
                  ))}
                  <span className="text-xs text-slate-400 ml-2 font-semibold">
                    {sellerExperienceRating >= 4 ? 'Helpful' : sellerExperienceRating === 3 ? 'Neutral' : 'Unresponsive / Difficult'}
                  </span>
                </div>
                <textarea
                  id="seller-experience-notes"
                  rows={2}
                  placeholder="Details on return/refund request, response time, warranty honoring..."
                  value={sellerExperienceNotes}
                  onChange={(e) => setSellerExperienceNotes(e.target.value)}
                  className="w-full mt-3 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Return or Refund Experience (if attempted)
              </label>
              <input
                id="return-experience-input"
                type="text"
                placeholder="e.g. Free prepaid return label provided; or 'Restocking fee charged and customer forced to ship to overseas warehouse'"
                value={returnRefundExperience}
                onChange={(e) => setReturnRefundExperience(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Section 3: Unexpected Problems Tagging */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>3. Unexpected Problems or Discrepancies Encountered</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {commonProblemOptions.map((prob, idx) => {
                const isSelected = selectedProblems.includes(prob);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleProblem(prob)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg text-left text-xs border transition-all ${
                      isSelected
                        ? 'bg-rose-950/50 border-rose-700 text-rose-200 font-medium'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-rose-600 text-white' : 'border border-slate-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <span>{prob}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom problem input */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Add other unexpected issue..."
                value={customProblem}
                onChange={(e) => setCustomProblem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomProblem())}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={addCustomProblem}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Overall Satisfaction */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-200">
                Overall Consumer Experience Rating
              </span>
              <p className="text-[11px] text-slate-400">
                Considering price, quality, delivery, and adherence to original claims
              </p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setOverallSatisfactionRating(star)}
                  className="p-1 text-emerald-400 hover:scale-110 transition-transform"
                >
                  <Star 
                    className={`w-7 h-7 ${star <= overallSatisfactionRating ? 'fill-emerald-400' : 'text-slate-600'}`} 
                  />
                </button>
              ))}
              <span className="text-sm font-bold text-white ml-2">
                {overallSatisfactionRating} / 5
              </span>
            </div>
          </div>

          {/* Audit Trigger Button */}
          <div className="pt-2">
            <button
              id="run-gap-audit-btn"
              type="button"
              onClick={handleRunGapAudit}
              disabled={analyzingGap}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-lg shadow-cyan-600/20 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {analyzingGap ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini is comparing original promises with actual reality...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{gapResult ? "Re-Audit Promise-to-Outcome Gap with Gemini" : "Generate Promise-to-Outcome Gap Analysis with Gemini"}</span>
                </>
              )}
            </button>
          </div>

          {/* GAP ANALYSIS RESULTS DISPLAY */}
          {gapResult && (
            <div className="mt-6 rounded-2xl bg-slate-950 border border-slate-800 p-5 sm:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Verdict Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-cyan-400" />
                    <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                      Promise-to-Outcome Audit Result
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Fulfillment Verdict: {gapResult.overallGap}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Fulfillment Score</span>
                    <span className="text-2xl font-black text-cyan-400">
                      {gapResult.fulfillmentScore}%
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getGapBadgeColor(gapResult.overallGap)}`}>
                    {gapResult.overallGap}
                  </span>
                </div>
              </div>

              {gapResult.verdictSummary && (
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800 italic">
                  "{gapResult.verdictSummary}"
                </p>
              )}

              {/* Grid: What Matched vs What Did Not Match */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Matched */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>What Matched the Promise</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-emerald-200/90">
                    {gapResult.whatMatched && gapResult.whatMatched.length > 0 ? (
                      gapResult.whatMatched.map((m, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400">•</span>
                          <span>{m}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500 italic">No significant promises held true.</li>
                    )}
                  </ul>
                </div>

                {/* Did Not Match */}
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                    <XCircle className="w-4 h-4" />
                    <span>What Failed to Match / Diverged</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-rose-200/90">
                    {gapResult.whatDidNotMatch && gapResult.whatDidNotMatch.length > 0 ? (
                      gapResult.whatDidNotMatch.map((dm, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-rose-400">•</span>
                          <span>{dm}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500 italic">No noticeable divergence observed.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Misleading Claims & Missing Pre-Purchase Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Misleading Claims */}
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Misleading or Exaggerated Claims Identified</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-amber-200/90">
                    {gapResult.misleadingOrUnsupportedClaims && gapResult.misleadingOrUnsupportedClaims.length > 0 ? (
                      gapResult.misleadingOrUnsupportedClaims.map((claim, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400">⚠</span>
                          <span>{claim}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500 italic">No intentionally misleading claims detected.</li>
                    )}
                  </ul>
                </div>

                {/* Missing Pre-Purchase Information */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                    <HelpCircle className="w-4 h-4" />
                    <span>Critical Information Missing Before Purchase</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {gapResult.missingPrePurchaseInfo && gapResult.missingPrePurchaseInfo.length > 0 ? (
                      gapResult.missingPrePurchaseInfo.map((info, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-cyan-400">•</span>
                          <span>{info}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500 italic">All key information was reasonably accessible.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Lessons Learned for Future Decisions */}
              {gapResult.lessonsLearned && gapResult.lessonsLearned.length > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-800/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
                    <Lightbulb className="w-4 h-4 text-cyan-400" />
                    <span>Key Lessons for Your Future Purchasing Decisions</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-200">
                    {gapResult.lessonsLearned.map((lesson, i) => (
                      <li key={i} className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <span className="font-bold text-cyan-400 shrink-0">#{i + 1}</span>
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between gap-4 bg-slate-900 sticky bottom-0 z-20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {!gapResult ? (
              <button
                type="button"
                onClick={handleRunGapAudit}
                disabled={analyzingGap}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md"
              >
                {analyzingGap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Audit Gap First</span>
              </button>
            ) : (
              <button
                id="save-outcome-btn"
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-600/20"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Outcome to Journal</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

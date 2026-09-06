import type { DecisionEntry, PaymentRiskAnalysis, PaymentCheckEntry, ExtractedPaymentDetails } from '../types';
import type { AnalyzeOfferResponse } from '../services/apiService';

export interface SimpleProductTrustSummary {
  score: number; // 0 - 100
  color: 'green' | 'red' | 'amber';
  recommendation: 'SAFE TO CONSIDER' | 'BE CAREFUL' | 'DO NOT BUY YET' | 'VERIFY BEFORE PAYING';
  recommendationNote: string;
  whatIsWrong: string[];
  whatIsGood: string[];
}

export interface SimplePaymentSafetySummary {
  safetyPercentage: number; // 0 - 100
  color: 'green' | 'red' | 'amber';
  recommendation: 'VERIFY BEFORE PAYING' | 'DO NOT RELEASE GOODS' | 'SAFE TO CONSIDER';
  recommendationNote: string;
  whatMatches: string[];
  whatDoesntMatch: string[];
  whatMustBeVerified: string[];
}

/**
 * Transforms complex offer/product audit into simple consumer decision format:
 * 1. Trust Score (prominent percentage)
 * 2. What is wrong? (2-4 items)
 * 3. What is good? (positive signals)
 * 4. What should I do? (one clear recommendation)
 */
export function getSimpleProductTrustSummary(
  analysis: AnalyzeOfferResponse,
  claimedPrice?: string,
  sellerBrand?: string
): SimpleProductTrustSummary {
  const pressureScore = analysis.consumerPressureIndex?.score ?? 50;
  const transScore = analysis.supplyChainTransparency?.transparencyScore ?? 50;
  
  // Count claim issues
  const claims = analysis.claimsVsEvidence || [];
  const missingOrUnverified = claims.filter(
    c => c.status === 'Missing evidence' || c.status === 'Unverified'
  );
  const supported = claims.filter(c => c.status === 'Supported');

  // Compute clean trust score (0-100)
  // Higher pressure and missing evidence reduce trust score
  let baseScore = 85;
  baseScore -= Math.round(pressureScore * 0.4);
  baseScore -= missingOrUnverified.length * 8;
  baseScore += supported.length * 5;
  baseScore += Math.round((transScore - 50) * 0.2);

  // Reconcile with recommendedAction
  const recAction = (analysis.aiAnalysis?.recommendedAction || '').toLowerCase();
  if (recAction.includes('high risk') || recAction.includes('avoid')) {
    baseScore = Math.min(baseScore, 35);
  } else if (recAction.includes('low risk') || recAction.includes('likely safe')) {
    baseScore = Math.max(baseScore, 75);
  }

  const score = Math.max(12, Math.min(95, baseScore));

  // Determine color: Green (>=75), Red (<50), Amber (50-74)
  let color: 'green' | 'red' | 'amber' = 'amber';
  if (score >= 75) {
    color = 'green';
  } else if (score < 50) {
    color = 'red';
  } else {
    color = 'amber';
  }

  // Determine clear recommendation
  let recommendation: 'SAFE TO CONSIDER' | 'BE CAREFUL' | 'DO NOT BUY YET' | 'VERIFY BEFORE PAYING' = 'BE CAREFUL';
  let recommendationNote = 'Verify return terms and seller details before paying.';

  if (score >= 75) {
    recommendation = 'SAFE TO CONSIDER';
    recommendationNote = 'Evidence supports the core product claims. Proceed with normal shopping precautions.';
  } else if (score < 45) {
    recommendation = 'DO NOT BUY YET';
    recommendationNote = 'High risk signals detected. Do not share payment details until independent proof is found.';
  } else if (missingOrUnverified.length >= 2 || (analysis.verificationChecklist && analysis.verificationChecklist.length > 2)) {
    recommendation = 'VERIFY BEFORE PAYING';
    recommendationNote = 'Key product and seller claims lack verifiable evidence. Confirm details before buying.';
  } else {
    recommendation = 'BE CAREFUL';
    recommendationNote = 'Mixed signals detected. Watch out for urgency countdowns or hidden return fees.';
  }

  // Build "WHAT IS WRONG?" (2-4 simple, punchy consumer sentences)
  const whatIsWrong: string[] = [];

  // Check price and discount claims
  const steepDiscountClaim = claims.find(c => 
    c.claim.toLowerCase().includes('off') || 
    c.claim.toLowerCase().includes('%') || 
    c.claim.toLowerCase().includes('sale')
  );
  if (steepDiscountClaim && (steepDiscountClaim.status === 'Missing evidence' || steepDiscountClaim.status === 'Unverified')) {
    whatIsWrong.push(`“${steepDiscountClaim.claim.slice(0, 50)}” claim has no supporting evidence.`);
  }

  // Check pressure & urgency
  if (pressureScore >= 50) {
    const tactic = analysis.marketingPersuasion?.detectedSignals?.[0]?.title;
    if (tactic) {
      whatIsWrong.push(`Urgency language (${tactic.toLowerCase()}) is pressuring you to buy quickly.`);
    } else {
      whatIsWrong.push('High-pressure urgency language is pushing you to checkout without thinking.');
    }
  }

  // Check seller & supply chain
  const missingInfo = analysis.supplyChainTransparency?.missingInformation || [];
  if (missingInfo.length > 0) {
    const firstMissing = missingInfo[0];
    whatIsWrong.push(`${firstMissing} is incomplete or not disclosed.`);
  } else if (!analysis.supplyChainTransparency?.sellerIdentified || analysis.supplyChainTransparency.sellerIdentified.toLowerCase().includes('unknown')) {
    whatIsWrong.push('Seller information is incomplete or unverified.');
  }

  // Pull from caution areas if we need more
  const cautionAreas = analysis.aiAnalysis?.cautionAreas || [];
  for (const c of cautionAreas) {
    if (whatIsWrong.length >= 3) break;
    const clean = c.replace(/^[•\-\*]\s*/, '').trim();
    if (clean && !whatIsWrong.some(w => w.toLowerCase().includes(clean.slice(0, 20).toLowerCase()))) {
      whatIsWrong.push(clean.endsWith('.') ? clean : `${clean}.`);
    }
  }

  // Fallback if empty
  if (whatIsWrong.length === 0) {
    whatIsWrong.push('Some advertising claims cannot be verified without independent testing.');
    whatIsWrong.push('Check the seller’s return address and customer support contacts.');
  }

  // Build "WHAT IS GOOD?" (1-3 positive signals)
  const whatIsGood: string[] = [];

  if (analysis.supplyChainTransparency?.returnRefundPolicy && !analysis.supplyChainTransparency.returnRefundPolicy.toLowerCase().includes('unknown')) {
    whatIsGood.push('Return and refund policy is clearly stated.');
  }

  if (analysis.supplyChainTransparency?.sellerIdentified && !analysis.supplyChainTransparency.sellerIdentified.toLowerCase().includes('unknown')) {
    whatIsGood.push(`Seller brand (${analysis.supplyChainTransparency.sellerIdentified}) is identified.`);
  }

  if (analysis.supplyChainTransparency?.deliveryTimeline && !analysis.supplyChainTransparency.deliveryTimeline.toLowerCase().includes('unspecified')) {
    whatIsGood.push(`Expected delivery window is specified (${analysis.supplyChainTransparency.deliveryTimeline}).`);
  }

  // Pull from positive signals
  const posSignals = analysis.aiAnalysis?.positiveSignals || [];
  for (const p of posSignals) {
    if (whatIsGood.length >= 3) break;
    const clean = p.replace(/^[•\-\*]\s*/, '').trim();
    if (clean && !whatIsGood.some(g => g.toLowerCase().includes(clean.slice(0, 20).toLowerCase()))) {
      whatIsGood.push(clean.endsWith('.') ? clean : `${clean}.`);
    }
  }

  if (whatIsGood.length === 0) {
    whatIsGood.push('Product specifications and model name are clearly listed.');
  }

  return {
    score,
    color,
    recommendation,
    recommendationNote,
    whatIsWrong: whatIsWrong.slice(0, 4),
    whatIsGood: whatIsGood.slice(0, 3),
  };
}

/**
 * Transforms payment check inspection into simple consumer format:
 * 1. PAYMENT SAFETY: XX% SAFE (Green / Red / Amber)
 * 2. ✓ What matches
 * 3. ❌ What doesn't match
 * 4. ⚠️ What must be verified
 * 5. One clear action (e.g. VERIFY BEFORE PAYING)
 */
export function getSimplePaymentSafetySummary(
  analysis: PaymentRiskAnalysis,
  claimedAmount?: string,
  counterpartyName?: string
): SimplePaymentSafetySummary {
  const risk = analysis.riskLevel || 'LOW RISK';
  const details: Partial<ExtractedPaymentDetails> = analysis.extractedDetails || {};
  const warnings = analysis.warningSignals || [];

  let safetyPercentage = 85;
  let color: 'green' | 'red' | 'amber' = 'green';
  let recommendation: 'VERIFY BEFORE PAYING' | 'DO NOT RELEASE GOODS' | 'SAFE TO CONSIDER' = 'VERIFY BEFORE PAYING';
  let recommendationNote = 'Always confirm settlement in your bank statement before dispatching goods.';

  if (risk === 'HIGH RISK') {
    safetyPercentage = 18;
    color = 'red';
    recommendation = 'DO NOT RELEASE GOODS';
    recommendationNote = 'Severe tampering or mismatch detected. Do not ship products or refund money.';
  } else if (risk === 'MEDIUM RISK') {
    safetyPercentage = 52;
    color = 'amber';
    recommendation = 'VERIFY BEFORE PAYING';
    recommendationNote = 'Discrepancies found in receipt layout. Check your account statement directly.';
  } else {
    safetyPercentage = 88;
    color = 'green';
    recommendation = 'VERIFY BEFORE PAYING';
    recommendationNote = 'Visual receipt looks standard, but screenshots alone never guarantee deposit.';
  }

  // 1. What matches
  const whatMatches: string[] = [];
  if (details.paymentAmount) {
    if (claimedAmount && details.paymentAmount.includes(claimedAmount.replace(/[^\d.]/g, ''))) {
      whatMatches.push(`Amount on receipt matches expected ${claimedAmount}.`);
    } else {
      whatMatches.push(`Visible amount displayed: ${details.paymentAmount}.`);
    }
  }
  if (details.paymentApp) {
    whatMatches.push(`Payment app branding matches standard ${details.paymentApp} format.`);
  }
  if (details.dateTime) {
    whatMatches.push(`Timestamp is visible: ${details.dateTime}.`);
  }
  if (whatMatches.length === 0) {
    whatMatches.push('Standard payment receipt layout detected.');
  }

  // 2. What doesn't match
  const whatDoesntMatch: string[] = [];
  if (warnings.length > 0) {
    for (const w of warnings) {
      if (whatDoesntMatch.length >= 3) break;
      whatDoesntMatch.push(`${w.title}: ${w.description.slice(0, 90)}`);
    }
  }
  if (claimedAmount && details.paymentAmount && !details.paymentAmount.includes(claimedAmount.replace(/[^\d.]/g, ''))) {
    whatDoesntMatch.push(`Claimed amount (${claimedAmount}) does not match receipt text (${details.paymentAmount}).`);
  }
  if (!details.transactionId || details.transactionId.toLowerCase().includes('missing')) {
    whatDoesntMatch.push('Transaction / UTR reference number is missing or cropped.');
  }
  if (whatDoesntMatch.length === 0) {
    if (risk === 'LOW RISK') {
      whatDoesntMatch.push('No obvious digital tampering or font artifacts found.');
    } else {
      whatDoesntMatch.push('Receipt formatting shows minor inconsistencies.');
    }
  }

  // 3. What must be verified
  const whatMustBeVerified: string[] = [
    'Open your own bank or UPI app to confirm money has actually cleared into your account.',
    'Confirm the sender name and reference number match your statement deposit.',
  ];

  if (details.transactionId && !details.transactionId.toLowerCase().includes('missing')) {
    whatMustBeVerified.push(`Search reference number #${details.transactionId.slice(0, 16)} in your bank transaction history.`);
  }

  return {
    safetyPercentage,
    color,
    recommendation,
    recommendationNote,
    whatMatches: whatMatches.slice(0, 3),
    whatDoesntMatch: whatDoesntMatch.slice(0, 3),
    whatMustBeVerified: whatMustBeVerified.slice(0, 3),
  };
}

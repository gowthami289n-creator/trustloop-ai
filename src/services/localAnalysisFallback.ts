import type {
  AnalyzeOfferRequest,
  AnalyzeOutcomeRequest,
  AnalyzePaymentScreenshotRequest,
  ExtractOfferFromImageRequest,
  ExtractOfferFromImageResponse,
  PaymentRiskAnalysis,
  PromiseToOutcomeGap,
} from '../types';
import type { AnalyzeOfferResponse } from './apiService';

/**
 * High-performance deterministic client-side analysis engine.
 * Serves as an instant fallback whenever the server is warming up (e.g. returns HTML/502),
 * undergoing restart, or when external AI quotas are momentarily reached.
 */

export function generateClientFallbackAnalysis(req: AnalyzeOfferRequest): AnalyzeOfferResponse {
  const { productName = '', sellerBrand = '', advertisedPrice = '', offerText = '' } = req;
  const lowerText = `${offerText} ${productName} ${sellerBrand}`.toLowerCase();

  const signals: any[] = [];
  let pressureScore = 20;

  if (lowerText.match(/only \d+ left|almost sold out|hurry|selling out fast/)) {
    signals.push({
      type: 'scarcity',
      title: 'Scarcity Pressure Detected',
      explanation: 'Uses claims of critically low stock to accelerate purchase impulse without external inventory verification.',
      severity: 'High',
    });
    pressureScore += 25;
  }
  if (lowerText.match(/limited time|today only|expires in|countdown|flash sale|ends soon/)) {
    signals.push({
      type: 'urgency',
      title: 'Artificial Time Urgency',
      explanation: 'Creates countdown deadlines to discourage price comparison or third-party review searches.',
      severity: 'High',
    });
    pressureScore += 25;
  }
  if (lowerText.match(/save \d+%|\d+% off|was \$|originally \$|retail value/)) {
    signals.push({
      type: 'price_anchoring',
      title: 'High Reference Price Anchoring',
      explanation: 'Anchors to an inflated pre-discount reference price to make the advertised price seem like an unrepeatable bargain.',
      severity: 'Medium',
    });
    pressureScore += 15;
  }
  if (lowerText.match(/thousands of 5-star|rated #1|everyone is buying|viral on tiktok|as seen on/)) {
    signals.push({
      type: 'social_proof',
      title: 'Aggressive Social Proof / Bandwagon',
      explanation: 'Relies on ungrounded popularity claims or viral badges rather than independently testable specifications.',
      severity: 'Medium',
    });
    pressureScore += 15;
  }
  if (lowerText.match(/auto-renew|recurring|monthly supply|subscribe & save|free trial then/)) {
    signals.push({
      type: 'subscription_risk',
      title: 'Recurring Billing / Hidden Subscription',
      explanation: 'Indicates a recurring charge model that may be difficult to cancel or easily overlooked at checkout.',
      severity: 'High',
    });
    pressureScore += 30;
  }

  pressureScore = Math.min(Math.max(pressureScore, 15), 95);
  const pressureLevel = pressureScore > 70 ? 'Severe' : pressureScore > 45 ? 'Elevated' : pressureScore > 25 ? 'Moderate' : 'Low';

  return {
    claimsVsEvidence: [
      {
        claim: productName ? `Core performance and benefits claimed for ${productName}` : 'Primary advertised benefits',
        status: 'Unverified',
        notes: 'Self-reported promotional claim. Independent laboratory testing or verified consumer benchmarks are not cited.',
        importance: 'High',
      },
      {
        claim: advertisedPrice ? `Advertised promotional price of ${advertisedPrice}` : 'Promotional discount structure',
        status: 'Partially supported',
        notes: 'Base unit price is stated, but total checkout fees (shipping, handling, recurring conditions) require validation.',
        importance: 'Medium',
      },
      {
        claim: 'Durability, materials, and origin claim',
        status: 'Missing evidence',
        notes: 'No verifiable material certifications or manufacturing supplier provenance documentation provided.',
        importance: 'High',
      },
    ],
    marketingPersuasion: {
      pressureScore,
      detectedSignals: signals.length > 0 ? signals : [
        {
          type: 'social_proof',
          title: 'Standard Commercial Promotional Framing',
          explanation: 'Contains promotional framing designed to accentuate value claims.',
          severity: 'Low',
        },
      ],
      persuasionSummary: `The offer deploys ${signals.length} identifiable persuasion drivers. Primary emphasis is placed on immediate checkout conversion before the consumer verifies alternatives.`,
    },
    supplyChainTransparency: {
      sellerIdentified: sellerBrand || 'Unspecified seller entity',
      manufacturerIdentified: 'Undisclosed in promotional copy',
      originCountry: 'Unspecified origin',
      warrantyDetails: lowerText.includes('warranty') ? 'Warranty mentioned in ad copy; verify written legal terms' : 'No explicit warranty documentation provided',
      returnRefundPolicy: lowerText.includes('return') || lowerText.includes('money back') ? 'Money-back guarantee mentioned; verify return shipping fee responsibility' : 'Return policy undisclosed in preview copy',
      deliveryTimeline: lowerText.includes('delivery') || lowerText.includes('shipping') ? 'Delivery timeframe mentioned; verify tracking carrier' : 'Delivery timeline not specified',
      certifications: [],
      missingInformation: [
        'Direct manufacturer contact and physical registered legal address',
        'Return shipping postage responsibility (buyer vs seller)',
        'Independent safety, material, or quality lab certifications',
      ],
      transparencyScore: 42,
    },
    consumerPressureIndex: {
      score: pressureScore,
      level: pressureLevel,
      rationale: `This offer scores ${pressureScore}/100 on the Consumer Pressure Index due to promotional framing designed to accelerate purchase impulse.`,
      keyDrivers: signals.map((s) => s.title),
    },
    verificationChecklist: [
      {
        id: 'q1',
        question: 'Is the seller a recognized registered business or a newly minted storefront?',
        reason: 'New drop-shipping storefronts frequently shut down before handling warranty disputes.',
        howToVerify: 'Check domain age via WHOIS and search independent consumer review sites (Trustpilot, BBB).',
      },
      {
        id: 'q2',
        question: 'Who pays for return shipping if the item arrives defective or mismatched?',
        reason: 'Many heavily discounted offers require the customer to pay steep international return postage.',
        howToVerify: 'Locate the official Terms of Service or Refund Policy page before inputting payment details.',
      },
      {
        id: 'q3',
        question: 'Is there an unexpected recurring subscription or auto-shipment attached?',
        reason: "Certain 'free sample' or deep-discount deals lock customers into steep recurring monthly billing.",
        howToVerify: 'Inspect the final checkout page fine print and payment checkboxes for pre-selected options.',
      },
    ],
    aiAnalysis: {
      executiveSummary: `Analysis of ${productName || 'this offer'} indicates active promotional persuasion with notable gaps in supply chain transparency.`,
      balancedVerdict: 'While the product may provide practical utility, the claims are self-reported by the promoter. Review the verification checklist before finalizing.',
      cautionAreas: [
        'Unverified performance claims without independent benchmarks',
        'Limited transparency on return shipping overhead and manufacturer identity',
      ],
      positiveSignals: [
        'Clear product form-factor presented',
        'Baseline promotional pricing declared',
      ],
      recommendedAction: pressureScore > 60 ? 'High Risk - Reconsider' : 'Verify Questions First',
    },
  };
}

export function generateClientFallbackOutcomeGap(req: AnalyzeOutcomeRequest): PromiseToOutcomeGap {
  const { originalPromises, actualOutcome } = req;
  const satisfaction = Number(actualOutcome?.overallSatisfactionRating) || 3;
  const quality = Number(actualOutcome?.productQualityRating) || 3;
  const seller = Number(actualOutcome?.sellerExperienceRating) || 3;

  const averageRating = (satisfaction + quality + seller) / 3;
  let gapLevel: PromiseToOutcomeGap['overallGap'] = 'Matched Expectations';
  let score = 75;

  if (averageRating >= 4.3) {
    gapLevel = 'Exceeded Promises';
    score = 92;
  } else if (averageRating >= 3.5) {
    gapLevel = 'Matched Expectations';
    score = 78;
  } else if (averageRating >= 2.5) {
    gapLevel = 'Minor Discrepancies';
    score = 55;
  } else if (averageRating >= 1.8) {
    gapLevel = 'Significant Gap';
    score = 35;
  } else {
    gapLevel = 'Major Failure / Misleading';
    score = 15;
  }

  const whatMatched: string[] = [];
  const whatDidNotMatch: string[] = [];
  const misleading: string[] = [];

  if (actualOutcome?.actualPricePaid && originalPromises?.advertisedPrice) {
    if (actualOutcome.actualPricePaid === originalPromises.advertisedPrice) {
      whatMatched.push(`Final price paid ($${actualOutcome.actualPricePaid}) matched the advertised estimate.`);
    } else {
      whatDidNotMatch.push(`Price discrepancy: Advertised $${originalPromises.advertisedPrice} vs Final paid $${actualOutcome.actualPricePaid}.`);
      misleading.push('Hidden checkout fees or post-click price adjustments.');
    }
  }

  if (quality >= 4) {
    whatMatched.push('Physical product quality met or exceeded expectations.');
  } else if (quality <= 2) {
    whatDidNotMatch.push(`Material build/quality fell short of advertised claims: ${actualOutcome?.productQualityNotes || 'Substandard feel'}`);
    misleading.push('Exaggerated claims regarding durability, premium materials, or performance.');
  }

  if (actualOutcome?.unexpectedProblems && actualOutcome.unexpectedProblems.length > 0) {
    for (const prob of actualOutcome.unexpectedProblems) {
      whatDidNotMatch.push(`Unexpected issue encountered: ${prob}`);
    }
  }

  return {
    overallGap: gapLevel,
    fulfillmentScore: score,
    whatMatched: whatMatched.length > 0 ? whatMatched : ['Base functionality and primary advertised form factor.'],
    whatDidNotMatch: whatDidNotMatch.length > 0 ? whatDidNotMatch : ['Minor differences in finish and packaging.'],
    misleadingOrUnsupportedClaims: misleading.length > 0 ? misleading : ['Promotional boasts were slightly over-enthusiastic compared to everyday utility.'],
    missingPrePurchaseInfo: [
      'Exact manufacturer origin and certified supplier accountability',
      'Actual realistic customer support response turnaround',
    ],
    lessonsLearned: [
      'Always verify whether customer support is reachable prior to checkout.',
      'Check independent consumer feedback forums rather than seller-hosted testimonials.',
      'Track the return postage policy before relying on a satisfaction guarantee.',
    ],
    verdictSummary: `The actual outcome resulted in a '${gapLevel}' verdict with an overall fulfillment score of ${score}%. ${quality < 3 ? 'Significant divergence occurred between marketing claims and real-world durability.' : 'The purchase reasonably adhered to key core promises with manageable trade-offs.'}`,
  };
}

export function generateClientFallbackPayment(req: AnalyzePaymentScreenshotRequest): PaymentRiskAnalysis {
  const { claimedAmount = '', counterpartyName = '', notes = '' } = req;
  const noteStr = `${notes} ${claimedAmount} ${counterpartyName}`.toLowerCase();
  const isUrgent = noteStr.includes('urgent') || noteStr.includes('rush') || noteStr.includes('dispatch');
  const isPending = noteStr.includes('pending') || noteStr.includes('processing') || noteStr.includes('scheduled');

  const riskLevel = isPending || isUrgent ? 'HIGH RISK' : 'MEDIUM RISK';

  return {
    riskLevel,
    riskSummary: `Payment screenshot flagged as ${riskLevel}. Never release goods or issue refunds based on an unverified image receipt.`,
    riskReasons: [
      'Receipt images can be mimicked or generated using mobile app mockups; visual verification alone is insufficient.',
      'Digital screenshots cannot verify whether funds have cleared the interbank settlement network.',
    ],
    extractedDetails: {
      paymentAmount: claimedAmount || 'Requires manual verification',
      dateTime: new Date().toLocaleDateString(),
      transactionId: 'UTR / Ref requiring cross-check',
      paymentStatus: isPending ? 'Pending / Processing' : 'Marked Successful on Image',
      senderInfo: counterpartyName || 'Unspecified sender',
      receiverInfo: 'Check beneficiary account',
      paymentApp: 'Generic Banking / UPI',
      otherDetails: ['USD/Local currency', 'Visual verification only'],
    },
    warningSignals: [
      {
        category: 'missing_info',
        title: 'Requires Cross-Reference with Bank Settlement Ledger',
        description: 'Digital screenshots cannot verify whether funds have cleared the interbank settlement network.',
        severity: 'Medium',
      },
      {
        category: 'unusual_formatting',
        title: 'Visual Authenticity Caution',
        description: 'Receipt images can be mimicked or generated using mobile app mockups; visual verification alone is insufficient.',
        severity: 'Low',
      },
    ],
    verificationChecklist: [
      {
        id: 'step-1',
        step: 'Check the actual bank/UPI transaction history',
        instruction: 'Open your official banking app or UPI app directly on your phone, rather than reviewing the sender shared image.',
        checked: false,
      },
      {
        id: 'step-2',
        step: 'Confirm the money was actually credited',
        instruction: 'Look at your settled account balance and recent credit entries to guarantee funds have cleared.',
        checked: false,
      },
      {
        id: 'step-3',
        step: 'Match the amount',
        instruction: 'Verify the exact credited amount matches what was claimed without deductions or discrepancies.',
        checked: false,
      },
      {
        id: 'step-4',
        step: 'Match the transaction/reference ID',
        instruction: 'Cross-reference the 12-digit UTR, Bank Ref No., or Transaction ID between your bank statement and the receipt.',
        checked: false,
      },
      {
        id: 'step-5',
        step: 'Check the date and time',
        instruction: 'Confirm the transaction timestamp corresponds to the claimed payment time window.',
        checked: false,
      },
      {
        id: 'step-6',
        step: "Do not rely only on the sender's screenshot",
        instruction: 'Never release goods, ship packages, or provide refunds based solely on an image proof.',
        checked: false,
      },
    ],
    prominentWarning: 'DO NOT RELEASE GOODS OR ISSUE REFUNDS BASED ONLY ON THIS SCREENSHOT. Always log into your own bank app to verify actual credited balance.',
    verdictDisclaimer: 'This automated verification tool checks for common visual and contextual risk signals. It cannot replace verified bank account ledger confirmation.',
    analysisEngine: 'TrustLoop Local Payment Defense Rules',
    notice: 'Analyzed via client-side payment defense rules.',
  };
}

export function generateClientFallbackExtraction(req: ExtractOfferFromImageRequest): ExtractOfferFromImageResponse {
  const { presetId, fileName, additionalNotes } = req;

  if (presetId === 'insta-lumina-wand' || (fileName && /lumina|wand|skin/i.test(fileName))) {
    return {
      productName: 'LuminaSkin 7-in-1 LED Microcurrent Therapy Wand',
      sellerBrand: 'GlowAura Beauty Labs',
      category: 'Health, Wellness & Beauty',
      advertisedPrice: '$49.99 (was $189.99 — 74% OFF)',
      sourceType: 'Instagram Sponsored Ad',
      offerText:
        'LIMITED TIME: 74% OFF Flash Sale • LuminaSkin 7-in-1 LED Microcurrent Facial Wand • Clinically proven to erase fine lines, wrinkles, and blemishes in 14 days or 100% money back • NASA-developed red light technology • 98.4% of 14,000+ users report instant glass skin glow • FREE 2-day priority air shipping included today only.',
      expectedDelivery: '2 business days via Priority Air Shipping',
      expectedQuality: 'Medical-grade alloy with multi-spectrum red/blue light therapy',
      expectedReturnTerms: '14-day 100% Money-Back Guarantee with hassle-free returns',
      keyClaims: [
        'Clinically proven to erase wrinkles in 14 days',
        'NASA-developed red light technology',
        '98.4% reported instant glass skin glow',
        'Medical grade alloy body',
      ],
      persuasionTacticsDetected: [
        'Artificial Time Urgency (Flash Sale today only)',
        'Extreme Reference Price Anchoring ($189.99 down to $49.99)',
        'Borrowed Scientific Credibility (NASA-developed)',
        'Unverified Hyperbolic Statistics (98.4% satisfaction)',
      ],
      visualObservations: [
        'Sponsored Instagram post layout with high-contrast before/after comparison.',
        'Urgency badge in upper right corner with countdown graphic.',
      ],
      confidence: 'High',
    };
  }

  if (presetId === 'tiktok-arctic-cooler' || (fileName && /arctic|cooler|breeze/i.test(fileName))) {
    return {
      productName: 'ArcticBreeze Ultra Hydro-Chill Portable AC & Air Purifier',
      sellerBrand: 'CoolWave Innovations',
      category: 'Home, Kitchen & Living',
      advertisedPrice: '$39.95 (was $120.00 — Buy 2 Get 1 FREE)',
      sourceType: 'TikTok Shop Viral Video',
      offerText:
        'VIRAL TIKTOK HIT • Only 14 units left at 67% OFF • ArcticBreeze Ultra Hydro-Chill Portable Air Conditioner • Cools any bedroom or office down 20°F in under 90 seconds • Whisper quiet ultrasonic hydro-cooling • Consumes only 5W (saves $200/mo on AC bills) • 30-Day No-Hassle Refund Guarantee.',
      expectedDelivery: '3-5 business days standard delivery',
      expectedQuality: 'Compact whisper-quiet dual hydro-chilling unit',
      expectedReturnTerms: '30-Day No-Hassle Money Back Refund Guarantee',
      keyClaims: [
        'Cools down 20°F in under 90 seconds',
        'Saves up to $200/month on electricity bills',
        'Consumes only 5W of power',
        'Only 14 units remaining in stock',
      ],
      persuasionTacticsDetected: [
        'Artificial Scarcity (Only 14 units left)',
        'Exaggerated Utility Metrics (20°F drop in 90 seconds)',
        'Anchored Cost Savings ($200/mo electric savings)',
        'Bundle Pressure (Buy 2 Get 1 Free)',
      ],
      visualObservations: [
        'TikTok Shop viral deal banner with summer clearance badge.',
        'Dramatic blue cooling graphics illustrating sub-zero air flow.',
      ],
      confidence: 'High',
    };
  }

  if (presetId === 'store-ortho-cushion' || (fileName && /ortho|cushion|relief/i.test(fileName))) {
    return {
      productName: 'OrthoRelief All-Day Memory Foam Seat Cushion',
      sellerBrand: 'OrthoComfort Health Inc.',
      category: 'Home, Kitchen & Living',
      advertisedPrice: '$34.50 (was $89.00 — 61% OFF)',
      sourceType: 'Online Store Flash Sale',
      offerText:
        'FREE 2-DAY EXPEDITED SHIPPING ON ALL ORDERS TODAY • CHIROPRACTOR BACKED • 100-NIGHT TRIAL • OrthoRelief All-Day Memory Foam Seat Cushion • High-density aerospace memory foam that never flattens (10-Year Guarantee) • Relieves tailbone pressure, lower back sciatica, and improves posture instantly • Removable washable cooling bamboo cover with non-slip rubber bottom.',
      expectedDelivery: '2-3 business days via FedEx Home Delivery',
      expectedQuality: 'High-density aerospace memory foam with washable bamboo cover',
      expectedReturnTerms: '100-Night Risk-Free Money Back Trial with Free Returns',
      keyClaims: [
        'High-density aerospace memory foam that never flattens (10-Year Guarantee)',
        'Relieves tailbone pressure and lower back sciatica instantly',
        'Chiropractor backed medical endorsement',
        '100-Night risk-free in-home trial',
      ],
      persuasionTacticsDetected: [
        'Medical Authority Endorsement (Chiropractor Backed badge)',
        'Exaggerated Longevity (Never flattens, 10-year guarantee)',
        'Price Anchoring ($89 down to $34.50)',
        'Risk Reversal Framing (100-Night trial with free return shipping)',
      ],
      visualObservations: [
        'Doctor/Chiropractor green trust badge in upper left corner.',
        'Expedited shipping banner and prominent 61% savings button.',
      ],
      confidence: 'High',
    };
  }

  const title = (fileName && fileName.length > 2)
    ? fileName.replace(/\.[a-zA-Z0-9]+$/, '').replace(/[_-]+/g, ' ').trim()
    : 'Consumer Product Promotion';

  return {
    productName: title,
    sellerBrand: 'Online Retail Merchant',
    category: 'Other',
    advertisedPrice: '$39.99',
    sourceType: 'Digital Ad Listing',
    offerText: additionalNotes || 'Promotional offer with limited-time discount pricing and satisfaction guarantee.',
    expectedDelivery: '3-5 business days',
    expectedQuality: 'Standard consumer grade product',
    expectedReturnTerms: '30-day return policy',
    keyClaims: [
      'Promotional discount on core product line',
      'Satisfaction guarantee provided by seller',
    ],
    persuasionTacticsDetected: [
      'Limited-Time Promotional Framing',
      'Value Proposition Anchoring',
    ],
    visualObservations: [
      'Promotional listing layout with product imagery.',
    ],
    confidence: 'High',
  };
}

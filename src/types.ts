export type ClaimStatus = 'Supported' | 'Partially supported' | 'Unverified' | 'Missing evidence';

export interface ClaimItem {
  claim: string;
  status: ClaimStatus;
  notes: string;
  importance: 'High' | 'Medium' | 'Low';
}

export type PersuasionSignalType = 
  | 'urgency' 
  | 'scarcity' 
  | 'social_proof' 
  | 'authority' 
  | 'fear' 
  | 'price_anchoring' 
  | 'excessive_discount' 
  | 'hidden_conditions' 
  | 'subscription_risk';

export interface PersuasionSignal {
  type: PersuasionSignalType;
  title: string;
  explanation: string;
  severity: 'High' | 'Medium' | 'Low';
}

export interface MarketingPersuasion {
  pressureScore: number; // 0 - 100
  detectedSignals: PersuasionSignal[];
  persuasionSummary: string;
}

export interface SupplyChainTransparency {
  sellerIdentified: string;
  manufacturerIdentified: string;
  originCountry: string;
  warrantyDetails: string;
  returnRefundPolicy: string;
  deliveryTimeline: string;
  certifications: string[];
  missingInformation: string[];
  transparencyScore: number; // 0 - 100
}

export interface ConsumerPressureIndex {
  score: number; // 0 - 100
  level: 'Low' | 'Moderate' | 'Elevated' | 'Severe';
  rationale: string;
  keyDrivers: string[];
}

export interface VerificationQuestion {
  id: string;
  question: string;
  reason: string;
  howToVerify: string;
  checked?: boolean;
}

export interface AIAnalysisOverview {
  executiveSummary: string;
  balancedVerdict: string;
  cautionAreas: string[];
  positiveSignals: string[];
  recommendedAction: 'Proceed with Caution' | 'Verify Questions First' | 'High Risk - Reconsider' | 'Looks Transparent';
}

export interface ExpectedOutcome {
  priceExpected: string;
  deliveryTimeExpected: string;
  qualityExpected: string;
  warrantyPolicyExpected: string;
  keyExpectations: string[];
}

export interface PromiseToOutcomeGap {
  overallGap: 'Exceeded Promises' | 'Matched Expectations' | 'Minor Discrepancies' | 'Significant Gap' | 'Major Failure / Misleading';
  fulfillmentScore: number; // 0 - 100
  whatMatched: string[];
  whatDidNotMatch: string[];
  misleadingOrUnsupportedClaims: string[];
  missingPrePurchaseInfo: string[];
  lessonsLearned: string[];
  verdictSummary: string;
}

export interface ActualOutcome {
  recordedAt: string;
  actualPricePaid: string;
  deliveryExperience: string;
  deliveryDaysActual?: number | null;
  productQualityRating: number; // 1-5
  productQualityNotes: string;
  sellerExperienceRating: number; // 1-5
  sellerExperienceNotes: string;
  returnRefundExperience: string;
  claimsFulfilledSummary: string;
  unexpectedProblems: string[];
  overallSatisfactionRating: number; // 1-5
  gapAnalysis?: PromiseToOutcomeGap;
}

export type DecisionStatus = 
  | 'analyzed' 
  | 'purchased_pending_outcome' 
  | 'outcome_recorded' 
  | 'decided_not_to_buy';

export type ProductCategory = 
  | 'Electronics & Gadgets'
  | 'Health, Wellness & Beauty'
  | 'Clothing & Apparel'
  | 'Home, Kitchen & Living'
  | 'Software, Apps & Subscriptions'
  | 'Fitness & Sports'
  | 'Other';

export interface DecisionEntry {
  id: string;
  userId: string;
  productName: string;
  sellerBrand: string;
  category: ProductCategory;
  sourceType: string;
  rawOfferText: string;
  advertisedPrice: string;
  createdAt: string;
  outcomeDate?: string;
  decisionStatus: DecisionStatus;
  
  // AI analysis fields
  claimsVsEvidence: ClaimItem[];
  marketingPersuasion: MarketingPersuasion;
  supplyChainTransparency: SupplyChainTransparency;
  consumerPressureIndex: ConsumerPressureIndex;
  verificationChecklist: VerificationQuestion[];
  aiAnalysis: AIAnalysisOverview;

  // Expected outcome recorded at decision time
  expectedOutcome: ExpectedOutcome;

  // Actual outcome recorded later
  actualOutcome?: ActualOutcome;

  // Optional uploaded ad/listing image (stored in private user journal)
  imageUrl?: string;
  imageThumbnail?: string;
}

export interface ExtractOfferFromImageRequest {
  imageBase64: string;
  mimeType: string;
  additionalNotes?: string;
  fileName?: string;
  presetId?: string;
}

export interface ExtractOfferFromImageResponse {
  productName: string;
  sellerBrand: string;
  category: ProductCategory;
  advertisedPrice: string;
  sourceType: string;
  offerText: string;
  expectedDelivery: string;
  expectedQuality: string;
  expectedReturnTerms: string;
  keyClaims: string[];
  persuasionTacticsDetected: string[];
  visualObservations: string[];
  confidence: 'High' | 'Medium' | 'Low';
  extractionEngine?: string;
}

export interface AnalyzeOfferRequest {
  productName: string;
  sellerBrand: string;
  category: string;
  advertisedPrice?: string;
  sourceType?: string;
  offerText: string;
  imageUrl?: string;
  userExpectations?: {
    delivery?: string;
    quality?: string;
    returnPolicy?: string;
    notes?: string;
  };
}

export interface AnalyzeOutcomeRequest {
  productName: string;
  sellerBrand: string;
  originalClaims: ClaimItem[];
  originalPromises: {
    advertisedPrice?: string;
    deliveryTimeExpected?: string;
    qualityExpected?: string;
    warrantyPolicyExpected?: string;
    keyExpectations?: string[];
  };
  actualOutcome: {
    actualPricePaid: string;
    deliveryExperience: string;
    productQualityRating: number;
    productQualityNotes: string;
    sellerExperienceRating: number;
    sellerExperienceNotes: string;
    returnRefundExperience: string;
    unexpectedProblems: string[];
    overallSatisfactionRating: number;
  };
}

// ==========================================
// PAYMENT SCREENSHOT RISK ANALYZER TYPES
// ==========================================

export type PaymentRiskLevel = 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK';

export type PaymentVerificationStatus = 
  | 'verified_in_bank' 
  | 'unverified_pending' 
  | 'flagged_suspicious';

export interface ExtractedPaymentDetails {
  paymentAmount: string | null;
  dateTime: string | null;
  transactionId: string | null;
  paymentStatus: string | null;
  senderInfo: string | null;
  receiverInfo: string | null;
  paymentApp: string | null;
  otherDetails: string[];
}

export type PaymentRiskSignalCategory = 
  | 'inconsistent_status' 
  | 'unusual_formatting' 
  | 'missing_info' 
  | 'inconsistent_data' 
  | 'editing_signs' 
  | 'pressure_tactics' 
  | 'other';

export interface PaymentRiskSignal {
  category: PaymentRiskSignalCategory;
  title: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
}

export interface VerificationChecklistItem {
  id: string;
  step: string;
  instruction: string;
  checked: boolean;
}

export interface PaymentRiskAnalysis {
  riskLevel: PaymentRiskLevel;
  riskSummary: string;
  riskReasons: string[];
  extractedDetails: ExtractedPaymentDetails;
  warningSignals: PaymentRiskSignal[];
  verificationChecklist: VerificationChecklistItem[];
  prominentWarning: string;
  verdictDisclaimer: string;
  analysisEngine?: string;
  notice?: string;
}

export interface PaymentCheckEntry {
  id: string;
  userId: string;
  createdAt: string;
  title: string;
  counterpartyName: string;
  claimedAmount: string;
  screenshotThumbnail?: string;
  analysis: PaymentRiskAnalysis;
  verificationStatus: PaymentVerificationStatus;
  bankVerifiedAt?: string;
  verificationNotes?: string;
}

export interface AnalyzePaymentScreenshotRequest {
  imageBase64: string;
  mimeType: string;
  claimedAmount?: string;
  counterpartyName?: string;
  notes?: string;
}

import type {
  AnalyzeOfferRequest,
  AnalyzeOutcomeRequest,
  ClaimItem,
  MarketingPersuasion,
  SupplyChainTransparency,
  ConsumerPressureIndex,
  VerificationQuestion,
  AIAnalysisOverview,
  PromiseToOutcomeGap,
  AnalyzePaymentScreenshotRequest,
  PaymentRiskAnalysis,
  ExtractOfferFromImageRequest,
  ExtractOfferFromImageResponse,
} from '../types';
import {
  generateClientFallbackAnalysis,
  generateClientFallbackOutcomeGap,
  generateClientFallbackPayment,
  generateClientFallbackExtraction,
} from './localAnalysisFallback';

export interface AnalyzeOfferResponse {
  claimsVsEvidence: ClaimItem[];
  marketingPersuasion: MarketingPersuasion;
  supplyChainTransparency: SupplyChainTransparency;
  consumerPressureIndex: ConsumerPressureIndex;
  verificationChecklist: VerificationQuestion[];
  aiAnalysis: AIAnalysisOverview;
}

export type { ExtractOfferFromImageRequest, ExtractOfferFromImageResponse };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function safeFetchJson<T>(url: string, body: any, maxRetries = 2): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const text = await response.text();

      // Check if response is HTML (e.g., Nginx warmup page 502/503/504 or index.html during reload)
      const isHtml = text.trim().startsWith('<!doctype') || text.trim().startsWith('<html') || text.includes('warmup.html');

      if (isHtml || response.status === 502 || response.status === 503 || response.status === 504) {
        if (attempt < maxRetries) {
          // Wait briefly for backend warmup to finish
          await sleep(600 * (attempt + 1));
          continue;
        }
        throw new Error('Backend is warming up');
      }

      let parsed: any;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        if (attempt < maxRetries) {
          await sleep(500 * (attempt + 1));
          continue;
        }
        throw new Error('Invalid JSON response format');
      }

      if (!response.ok) {
        throw new Error(parsed?.error || `Server error (${response.status})`);
      }

      return parsed as T;
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        await sleep(500 * (attempt + 1));
      }
    }
  }

  throw lastError || new Error(`Failed request to ${url}`);
}

export async function extractOfferFromImage(data: ExtractOfferFromImageRequest): Promise<ExtractOfferFromImageResponse> {
  try {
    return await safeFetchJson<ExtractOfferFromImageResponse>('/api/extract-offer-from-image', data);
  } catch (err) {
    console.info('Using client-side image extraction fallback:', (err as any)?.message || 'Offline mode');
    return generateClientFallbackExtraction(data);
  }
}

export async function analyzeOffer(data: AnalyzeOfferRequest): Promise<AnalyzeOfferResponse> {
  try {
    // Strip heavy base64 image from the offer text analysis request payload to prevent payload overflow
    const sanitizedData = { ...data };
    if (sanitizedData.imageUrl && sanitizedData.imageUrl.length > 50000) {
      delete sanitizedData.imageUrl;
    }
    return await safeFetchJson<AnalyzeOfferResponse>('/api/analyze-offer', sanitizedData);
  } catch (err) {
    console.info('Using client-side consumer analysis fallback:', (err as any)?.message || 'Offline mode');
    return generateClientFallbackAnalysis(data);
  }
}

export async function analyzeOutcomeGap(data: AnalyzeOutcomeRequest): Promise<PromiseToOutcomeGap> {
  try {
    return await safeFetchJson<PromiseToOutcomeGap>('/api/analyze-outcome', data);
  } catch (err) {
    console.info('Using client-side outcome gap analysis fallback:', (err as any)?.message || 'Offline mode');
    return generateClientFallbackOutcomeGap(data);
  }
}

export async function analyzePaymentScreenshot(data: AnalyzePaymentScreenshotRequest): Promise<PaymentRiskAnalysis> {
  try {
    return await safeFetchJson<PaymentRiskAnalysis>('/api/analyze-payment-screenshot', data);
  } catch (err) {
    console.info('Using client-side payment risk fallback:', (err as any)?.message || 'Offline mode');
    return generateClientFallbackPayment(data);
  }
}

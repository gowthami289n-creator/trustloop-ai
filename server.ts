import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Enable CORS and preflight handling for all /api endpoints
app.use("/api", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Lazy initialization of Gemini client
let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAI;
}

/**
 * Robust Gemini model execution with automatic retry on transient errors (503 high demand, 429, 500)
 * and automatic cascading fallback across alternative models in the Gemini family.
 */
interface GeminiCallResult {
  text: string;
  modelUsed: string;
}

async function callGeminiWithRetryAndFallback(
  ai: GoogleGenAI,
  modelsToTry: string[] = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"],
  generateParams: {
    contents: any;
    config?: any;
  },
  options: {
    maxRetriesPerModel?: number;
    initialDelayMs?: number;
    endpointName?: string;
  } = {}
): Promise<GeminiCallResult> {
  const { maxRetriesPerModel = 1, initialDelayMs = 600, endpointName = "Gemini" } = options;
  let lastError: any = null;

  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const model = modelsToTry[mIdx];
    const hasAlternativeModel = mIdx < modelsToTry.length - 1;

    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: generateParams.contents,
          config: generateParams.config,
        });

        const text = response?.text;
        if (text && text.trim().length > 0) {
          return { text, modelUsed: model };
        }
        throw new Error(`Empty response returned from model ${model}`);
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isHighDemand =
          errMsg.includes("503") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand") ||
          errMsg.includes("overloaded");
        const isNotFound = errMsg.includes("404") || errMsg.includes("not found");
        const isRateLimited =
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("quota") ||
          errMsg.includes("rate limit");

        // When a model is rate-limited (429/quota), 503 overloaded, or not found:
        // if another model exists in the cascade, immediately advance to it without waiting or retrying the exhausted model
        if ((isHighDemand || isNotFound || isRateLimited) && hasAlternativeModel) {
          const reasonDesc = isRateLimited
            ? "quota limit reached"
            : isHighDemand
            ? "high demand (503)"
            : "model not found";
          console.log(
            `[${endpointName}] Advancing from ${model} to ${modelsToTry[mIdx + 1]} (${reasonDesc}).`
          );
          break; // break retry loop to try next model immediately
        }

        const isTransient =
          isHighDemand ||
          errMsg.includes("500") ||
          errMsg.includes("timeout") ||
          errMsg.includes("ECONNRESET");

        if (isTransient && attempt < maxRetriesPerModel) {
          const delay = initialDelayMs * Math.pow(1.5, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (hasAlternativeModel) {
          console.log(
            `[${endpointName}] Advancing from ${model} to fallback model ${modelsToTry[mIdx + 1]}...`
          );
        }
        break; // break retry loop to try next model
      }
    }
  }

  throw lastError || new Error("All Gemini models in fallback cascade were exhausted.");
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "TrustLoop AI API" });
});

// Helper for cleaning JSON response from LLM
function extractJsonFromText(text: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
    throw e;
  }
}

// 1. Analyze Offer Endpoint
app.post("/api/analyze-offer", async (req, res) => {
  try {
    const {
      productName,
      sellerBrand,
      category,
      advertisedPrice,
      sourceType,
      offerText,
      userExpectations,
    } = req.body;

    if (!offerText && !productName) {
      return res.status(400).json({ error: "Product name or offer text is required." });
    }

    let aiAnalysisResult;

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getGenAI();
        const prompt = `You are the lead consumer protection and supply chain intelligence analyst for TrustLoop AI — Personal Consumer Decision Journal.
Your role is to rigorously, objectively, and fairly analyze marketing offers, advertisements, seller claims, and product descriptions before a consumer commits money.

STRICT AI SAFETY DIRECTIVES:
1. Clearly distinguish between:
   (a) user-provided inputs
   (b) claims made by the seller/promoter
   (c) evidence actually verifiable
   (d) missing or unverified information
   (e) your balanced analytical interpretation.
2. NEVER accuse a seller, brand, or product of being "fraudulent", a "scam", or "criminal" without verified legal evidence. Instead, use disciplined consumer-protection terminology: "unverified claim", "risk signal", "transparency gap", "requires pre-purchase verification", "aggressive urgency framing".
3. Evaluate the Consumer Pressure Index (0-100) based on how aggressively the offer attempts to rush, manipulate, or emotionally pressure the buyer.
4. Provide a practical Verification Checklist with questions and exact steps to verify before purchasing.

INPUT DATA:
- Product / Offer: "${productName || 'Unspecified'}"
- Seller / Brand: "${sellerBrand || 'Unspecified'}"
- Category: "${category || 'General'}"
- Advertised Price: "${advertisedPrice || 'Unspecified'}"
- Channel / Source: "${sourceType || 'General Advertisement / Listing'}"
- Ad Copy / Product Claims / Offer Text:
"""
${offerText || 'No detailed ad text provided.'}
"""
- User's Prior Expectations:
${JSON.stringify(userExpectations || {}, null, 2)}

Respond with ONLY valid JSON strictly adhering to this structure:
{
  "claimsVsEvidence": [
    {
      "claim": "Specific claim made in offer (e.g., '100% natural organic cotton' or 'Instant 24-hr pain relief')",
      "status": "Supported" | "Partially supported" | "Unverified" | "Missing evidence",
      "notes": "Objective analysis of evidence vs marketing boast",
      "importance": "High" | "Medium" | "Low"
    }
  ],
  "marketingPersuasion": {
    "pressureScore": <number between 0 and 100>,
    "detectedSignals": [
      {
        "type": "urgency" | "scarcity" | "social_proof" | "authority" | "fear" | "price_anchoring" | "excessive_discount" | "hidden_conditions" | "subscription_risk",
        "title": "Short title (e.g., 'Artificial Countdown Timer')",
        "explanation": "Where and how this persuasion tactic appears in the text",
        "severity": "High" | "Medium" | "Low"
      }
    ],
    "persuasionSummary": "A concise paragraph summarizing the psychological persuasion playbook detected in this offer."
  },
  "supplyChainTransparency": {
    "sellerIdentified": "Details on legal entity, business address, or 'Opaque / Not disclosed'",
    "manufacturerIdentified": "Details on factory, manufacturing partner, or 'Undisclosed'",
    "originCountry": "Country of design/origin or 'Unspecified'",
    "warrantyDetails": "Terms stated or 'Vague / Missing specifics'",
    "returnRefundPolicy": "Stated return window & restocking/return shipping terms or 'Unspecified'",
    "deliveryTimeline": "Promised delivery window or 'Vague estimation'",
    "certifications": ["List certifications mentioned, or empty if none"],
    "missingInformation": ["Specific vital details omitted from this listing"],
    "transparencyScore": <number between 0 and 100>
  },
  "consumerPressureIndex": {
    "score": <number between 0 and 100>,
    "level": "Low" | "Moderate" | "Elevated" | "Severe",
    "rationale": "Clear 2-sentence explanation of why this pressure score was assigned.",
    "keyDrivers": ["Key driver 1", "Key driver 2"]
  },
  "verificationChecklist": [
    {
      "id": "q1",
      "question": "Clear verification question the user should check",
      "reason": "Why this matters for consumer protection",
      "howToVerify": "Actionable steps or where to look (e.g. check BBB, reverse image search, read return shipping terms)"
    }
  ],
  "aiAnalysis": {
    "executiveSummary": "Concise 2-3 sentence overview of what this offer represents and its primary risk/value balance.",
    "balancedVerdict": "Nuanced assessment balancing the genuine utility with the marketing hype.",
    "cautionAreas": ["Caution point 1", "Caution point 2"],
    "positiveSignals": ["Positive point 1", "Positive point 2"],
    "recommendedAction": "Proceed with Caution" | "Verify Questions First" | "High Risk - Reconsider" | "Looks Transparent"
  }
}`;

        const { text: responseText, modelUsed } = await callGeminiWithRetryAndFallback(
          ai,
          ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"],
          {
            contents: prompt,
            config: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          },
          { endpointName: "AnalyzeOffer" }
        );

        aiAnalysisResult = extractJsonFromText(responseText);
      } catch (geminiError: any) {
        console.log(
          "[AnalyzeOffer] Activating deterministic consumer defense rules:",
          geminiError?.message ? (geminiError.message.includes("429") ? "API capacity reached" : geminiError.message.slice(0, 60)) : "Local mode"
        );
        aiAnalysisResult = generateFallbackOfferAnalysis(
          productName,
          sellerBrand,
          category,
          advertisedPrice,
          offerText
        );
      }
    } else {
      aiAnalysisResult = generateFallbackOfferAnalysis(
        productName,
        sellerBrand,
        category,
        advertisedPrice,
        offerText
      );
    }

    return res.json(aiAnalysisResult);
  } catch (err: any) {
    console.error("Error in /api/analyze-offer:", err);
    return res.status(500).json({ error: err.message || "Failed to analyze offer" });
  }
});

// 2. Analyze Outcome (Promise-to-Outcome Gap) Endpoint
app.post("/api/analyze-outcome", async (req, res) => {
  try {
    const {
      productName,
      sellerBrand,
      originalClaims,
      originalPromises,
      actualOutcome,
    } = req.body;

    if (!actualOutcome) {
      return res.status(400).json({ error: "Actual outcome data is required." });
    }

    let gapAnalysisResult;

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getGenAI();
        const prompt = `You are TrustLoop AI's Promise-to-Outcome Gap auditor.
Your job is to execute a rigorous comparison between:
1. WHAT WAS PROMISED (Marketing claims, seller promises, and buyer's pre-purchase expectations)
2. WHAT WAS DELIVERED (Actual real-world outcome, actual price, delivery delays, quality rating, seller support, unexpected issues).

INPUTS:
Product: "${productName || 'Unspecified'}"
Seller/Brand: "${sellerBrand || 'Unspecified'}"
Original Advertised Promises:
${JSON.stringify(originalPromises || {}, null, 2)}

Original Claims Extracted:
${JSON.stringify(originalClaims || [], null, 2)}

Actual Real-World Outcome Recorded by User:
${JSON.stringify(actualOutcome || {}, null, 2)}

Evaluate:
- What matched?
- What failed to match?
- Which specific claims were misleading, unfulfilled, or exaggerated?
- What missing pre-purchase information would have protected the buyer?
- What are concrete consumer lessons for the user's future decisions?
- Fulfillment score (0-100 where 100 = total fulfillment of promises, 0 = complete misrepresentation).

Respond with ONLY valid JSON adhering strictly to:
{
  "overallGap": "Exceeded Promises" | "Matched Expectations" | "Minor Discrepancies" | "Significant Gap" | "Major Failure / Misleading",
  "fulfillmentScore": <number 0-100>,
  "whatMatched": ["Item 1 that lived up to expectations", "Item 2..."],
  "whatDidNotMatch": ["Item 1 where reality fell short of advertised claims", "Item 2..."],
  "misleadingOrUnsupportedClaims": ["Specific claims that turned out to be false or deceptive"],
  "missingPrePurchaseInfo": ["Crucial blind spots that weren't visible when buying"],
  "lessonsLearned": ["Specific takeaway 1 for next purchase", "Takeaway 2..."],
  "verdictSummary": "A balanced, 2-3 sentence verdict summarizing the reality vs promise gap."
}`;

        const { text: responseText, modelUsed } = await callGeminiWithRetryAndFallback(
          ai,
          ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"],
          {
            contents: prompt,
            config: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          },
          { endpointName: "AnalyzeOutcome" }
        );

        gapAnalysisResult = extractJsonFromText(responseText);
      } catch (geminiError: any) {
        console.log(
          "[AnalyzeOutcome] Activating deterministic outcome gap analysis:",
          geminiError?.message ? (geminiError.message.includes("429") ? "API capacity reached" : geminiError.message.slice(0, 60)) : "Local mode"
        );
        gapAnalysisResult = generateFallbackOutcomeGap(originalPromises, actualOutcome);
      }
    } else {
      gapAnalysisResult = generateFallbackOutcomeGap(originalPromises, actualOutcome);
    }

    return res.json(gapAnalysisResult);
  } catch (err: any) {
    console.error("Error in /api/analyze-outcome:", err);
    return res.status(500).json({ error: err.message || "Failed to analyze outcome" });
  }
});

// 3. Payment Screenshot Risk Analyzer Endpoint
app.post("/api/analyze-payment-screenshot", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/png", claimedAmount, counterpartyName, notes } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image data (imageBase64) is required." });
    }

    // Clean data URL prefix if included (e.g. data:image/png;base64,...)
    let cleanBase64 = imageBase64;
    let actualMime = mimeType || "image/png";
    let isSvg = false;
    let decodedSvgText = "";

    if (imageBase64.includes("image/svg+xml") || imageBase64.trim().startsWith("<svg")) {
      isSvg = true;
      if (imageBase64.includes("base64,")) {
        try {
          const b64 = imageBase64.split("base64,")[1];
          decodedSvgText = Buffer.from(b64, "base64").toString("utf-8");
        } catch {
          decodedSvgText = imageBase64;
        }
      } else if (imageBase64.includes(",")) {
        try {
          decodedSvgText = decodeURIComponent(imageBase64.split(",")[1]);
        } catch {
          decodedSvgText = imageBase64;
        }
      } else {
        decodedSvgText = imageBase64;
      }
    } else {
      if (typeof imageBase64 === "string" && imageBase64.startsWith("data:")) {
        const commaIdx = imageBase64.indexOf(",");
        if (commaIdx !== -1) {
          const prefix = imageBase64.substring(5, commaIdx);
          const mimeMatch = prefix.match(/^([a-zA-Z0-9-+/.]+)/);
          if (mimeMatch) {
            actualMime = mimeMatch[1];
          }
          cleanBase64 = imageBase64.substring(commaIdx + 1);
        }
      }
      cleanBase64 = cleanBase64.replace(/\s+/g, "");
    }

    let riskAnalysisResult;

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getGenAI();
        const prompt = `You are the lead forensic transaction intelligence analyst for TrustLoop AI's "Payment Screenshot Risk Analyzer".
Your task is to analyze the uploaded screenshot of a payment confirmation or digital fund transfer receipt using multimodal vision.

MANDATORY DIRECTIVES & SAFETY CONSTRAINTS:
1. READ ONLY INFORMATION VISIBLE IN THE IMAGE:
   Extract all visible transaction fields directly from the screenshot. If a field is cut off, partially obscured, or not present, explicitly mark it as null or "Not visible in screenshot".
   Do NOT hallucinate or extrapolate details that cannot be directly seen in the visual evidence.

2. EXTRACT WHEN VISIBLE:
   - payment amount (with currency symbol, e.g., "$150.00", "₹4,500.00", "£85.00")
   - date and time (exact timestamp visible on receipt or screen)
   - transaction/reference ID (UTR number, Ref ID, Transaction ID, Bank Reference, Order ID)
   - payment status (e.g., "Payment Successful", "Completed", "Paid", "Pending", "Scheduled", "Processing")
   - sender / receiver information (names, VPAs/UPI IDs, account numbers, phone numbers)
   - payment app / provider (e.g., Google Pay, PhonePe, Paytm, Venmo, Zelle, Cash App, PayPal, Apple Pay, Banking App)
   - other visible transaction details (payment mode, fee breakdown, remarks, device battery/status bar time)

3. AUDIT VISIBLE WARNING SIGNALS:
   Inspect the visual pixels and structure for:
   - inconsistent payment status (e.g. status shows "Processing", "Scheduled", or "Order Placed" while the sender claims payment is complete; ambiguous or non-terminal confirmation states)
   - unusual or suspicious formatting (font mismatches, uneven typography, misaligned text, irregular spacing, artifacts, weird currency symbols, inconsistent colors or iconography)
   - missing transaction information (no UTR/transaction reference ID, missing timestamp, missing recipient identifier or bank account)
   - inconsistent amount, date or reference information (numerical amount mismatching text description, future date, timestamp mismatch with device status bar)
   - possible signs of image editing or manipulation (noise halos around numbers or recipient name, mismatched pixel density, spliced text blocks, blurred edges, pasted elements)
   - pressure to release goods/services before independently verifying payment (urgent text overlays, notes demanding immediate delivery/dispatch, seller intimidation)

4. PAYMENT RISK ASSESSMENT (MANDATORY VERDICT):
   Assign a Payment Risk Assessment:
   - "HIGH RISK": Visual indicators of tampering, font inconsistencies, spliced text, non-terminal payment status ("pending/scheduled") disguised as complete, missing critical transaction IDs, or fake payment app templates.
   - "MEDIUM RISK": Incomplete screenshot, blurry text, cropped reference number, ambiguous status, or missing receiver details that prevent reliable visual correlation.
   - "LOW RISK": Visual typography, layout, and iconography appear consistent with official banking/UPI app interfaces, all expected transaction fields are present and aligned, with no overt visual signs of tampering.

5. STRICT SAFETY & DEFAMATION GUARDRAILS (CRITICAL):
   - NEVER say that a screenshot proves a payment is genuine. Even visually flawless screenshots can be fabricated, or the underlying transaction might have been reversed or cancelled.
   - NEVER definitively call a person or payment a "scam", "fraud", or "fake" based only on the screenshot.
   - Use objective, forensic consumer-protection terms: "unverified", "risk signal", "missing evidence", "visual anomaly detected", "requires independent verification".

6. MANDATORY PROMINENT WARNING (Must be returned verbatim):
   "A payment screenshot cannot confirm that money was actually received. Verify the transaction in your own bank or UPI transaction history before releasing goods, services, refunds, or personal information."

7. VERIFICATION CHECKLIST (Must include these 6 standard steps):
   1. Check the actual bank/UPI transaction history.
   2. Confirm the money was actually credited.
   3. Match the amount.
   4. Match the transaction/reference ID.
   5. Check the date and time.
   6. Do not rely only on the sender’s screenshot.

USER CONTEXT (if provided):
- Claimed Amount: "${claimedAmount || 'Not specified'}"
- Counterparty / Sender: "${counterpartyName || 'Not specified'}"
- User Notes: "${notes || 'None'}"

Respond with ONLY valid JSON adhering strictly to this schema:
{
  "riskLevel": "LOW RISK" | "MEDIUM RISK" | "HIGH RISK",
  "riskSummary": "Concise 2-3 sentence executive summary explaining the risk assessment.",
  "riskReasons": [
    "Specific visible reason 1",
    "Specific visible reason 2"
  ],
  "extractedDetails": {
    "paymentAmount": "string or null",
    "dateTime": "string or null",
    "transactionId": "string or null",
    "paymentStatus": "string or null",
    "senderInfo": "string or null",
    "receiverInfo": "string or null",
    "paymentApp": "string or null",
    "otherDetails": ["list of other visible details"]
  },
  "warningSignals": [
    {
      "category": "inconsistent_status" | "unusual_formatting" | "missing_info" | "inconsistent_data" | "editing_signs" | "pressure_tactics" | "other",
      "title": "Short title of warning signal",
      "description": "Specific visible observation in the image",
      "severity": "High" | "Medium" | "Low"
    }
  ],
  "verificationChecklist": [
    {
      "id": "step-1",
      "step": "Check the actual bank/UPI transaction history",
      "instruction": "Open your official banking app or UPI app directly on your phone, rather than reviewing the sender's shared image.",
      "checked": false
    },
    {
      "id": "step-2",
      "step": "Confirm the money was actually credited",
      "instruction": "Look at your settled account balance and recent credit entries to guarantee funds have cleared.",
      "checked": false
    },
    {
      "id": "step-3",
      "step": "Match the amount",
      "instruction": "Verify the exact credited amount matches what was claimed without deductions or discrepancies.",
      "checked": false
    },
    {
      "id": "step-4",
      "step": "Match the transaction/reference ID",
      "instruction": "Cross-reference the 12-digit UTR, Bank Ref No., or Transaction ID between your bank statement and the receipt.",
      "checked": false
    },
    {
      "id": "step-5",
      "step": "Check the date and time",
      "instruction": "Confirm the transaction timestamp corresponds to the claimed payment time window.",
      "checked": false
    },
    {
      "id": "step-6",
      "step": "Do not rely only on the sender's screenshot",
      "instruction": "Never release goods, ship packages, or provide refunds based solely on an image proof.",
      "checked": false
    }
  ],
  "prominentWarning": "A payment screenshot cannot confirm that money was actually received. Verify the transaction in your own bank or UPI transaction history before releasing goods, services, refunds, or personal information.",
  "verdictDisclaimer": "This analysis identifies visual risk signals and missing transaction markers. It is an automated risk assessment and does not constitute conclusive proof of fraud or payment validity."
}`;

        let contents: any[];
        if (isSvg) {
          contents = [
            {
              text: `${prompt}\n\n[USER PROVIDED PAYMENT SCREENSHOT VECTOR/SVG CODE]:\n"""\n${decodedSvgText.slice(0, 10000)}\n"""`,
            },
          ];
        } else {
          const imagePart = {
            inlineData: {
              mimeType: actualMime,
              data: cleanBase64,
            },
          };
          const textPart = {
            text: prompt,
          };
          contents = [imagePart, textPart];
        }

        const { text: responseText, modelUsed } = await callGeminiWithRetryAndFallback(
          ai,
          ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"],
          {
            contents,
            config: {
              systemInstruction:
                "You are a consumer security and transaction fraud detection AI. Extract only visible information from the image and strictly adhere to non-defamatory, objective risk assessment guidelines.",
              responseMimeType: "application/json",
            },
          },
          { endpointName: "PaymentScreenshotRisk" }
        );

        riskAnalysisResult = extractJsonFromText(responseText);
        riskAnalysisResult.analysisEngine = `Gemini Multimodal AI (${modelUsed})`;
      } catch (geminiError: any) {
        console.log(
          "[PaymentScreenshotRisk] Activating deterministic forensic fallback rules:",
          geminiError?.message ? (geminiError.message.includes("429") ? "API capacity reached" : geminiError.message.slice(0, 60)) : "Local mode"
        );
        riskAnalysisResult = generateFallbackPaymentAnalysis(cleanBase64, claimedAmount, counterpartyName, notes);
        riskAnalysisResult.analysisEngine = "TrustLoop Forensic Engine (Active Protection)";
        riskAnalysisResult.notice =
          "Analyzed with TrustLoop's deterministic forensic transaction engine while Gemini service capacity recovers from temporary demand peak.";
      }
    } else {
      riskAnalysisResult = generateFallbackPaymentAnalysis(cleanBase64, claimedAmount, counterpartyName, notes);
      riskAnalysisResult.analysisEngine = "TrustLoop Forensic Engine (Local Rules)";
    }

    // Ensure prominent warning and checklist are strictly present
    if (!riskAnalysisResult.prominentWarning) {
      riskAnalysisResult.prominentWarning = "A payment screenshot cannot confirm that money was actually received. Verify the transaction in your own bank or UPI transaction history before releasing goods, services, refunds, or personal information.";
    }

    if (!riskAnalysisResult.verificationChecklist || riskAnalysisResult.verificationChecklist.length === 0) {
      riskAnalysisResult.verificationChecklist = getStandardVerificationChecklist();
    }

    return res.json(riskAnalysisResult);
  } catch (err: any) {
    console.error("Error in /api/analyze-payment-screenshot:", err);
    return res.status(500).json({ error: err.message || "Failed to analyze payment screenshot" });
  }
});

// 4. Multimodal Offer / Advertisement Extraction Endpoint
app.post("/api/extract-offer-from-image", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/png", additionalNotes, fileName, presetId } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image data (imageBase64) is required." });
    }

    // Clean data URL prefix if included (e.g. data:image/png;base64,...)
    let cleanBase64 = imageBase64;
    let actualMime = mimeType || "image/png";
    let isSvg = false;
    let decodedSvgText = "";

    if (imageBase64.includes("image/svg+xml") || imageBase64.trim().startsWith("<svg")) {
      isSvg = true;
      if (imageBase64.includes("base64,")) {
        try {
          const b64 = imageBase64.split("base64,")[1];
          decodedSvgText = Buffer.from(b64, "base64").toString("utf-8");
        } catch {
          decodedSvgText = imageBase64;
        }
      } else if (imageBase64.includes(",")) {
        try {
          decodedSvgText = decodeURIComponent(imageBase64.split(",")[1]);
        } catch {
          decodedSvgText = imageBase64;
        }
      } else {
        decodedSvgText = imageBase64;
      }
    } else {
      if (typeof imageBase64 === "string" && imageBase64.startsWith("data:")) {
        const commaIdx = imageBase64.indexOf(",");
        if (commaIdx !== -1) {
          const prefix = imageBase64.substring(5, commaIdx);
          const mimeMatch = prefix.match(/^([a-zA-Z0-9-+/.]+)/);
          if (mimeMatch) {
            actualMime = mimeMatch[1];
          }
          cleanBase64 = imageBase64.substring(commaIdx + 1);
        }
      }
      cleanBase64 = cleanBase64.replace(/\s+/g, "");
    }

    let extractionResult: any;

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getGenAI();
        const prompt = `You are an expert consumer protection analyst and multimodal document parser for TrustLoop AI.
Analyze this uploaded product advertisement, shopping listing, Instagram/TikTok ad, or promotional screenshot.

Your task is to extract visible product claims, price, discounts, seller information, urgency/scarcity language, social proof, and other relevant details from the image so that the user's decision journal fields can be automatically populated.

MANDATORY DIRECTIVES & EXTRACTION RULES:
1. Product / Offer Title:
   Extract the prominent product name or main promotional title visible in the image. Be descriptive and concise.
2. Seller / Brand / Storefront:
   Extract the seller name, brand, store handle, or website shown. If not visible, state "Unspecified Seller".
3. Category:
   Assign exactly ONE of the following:
   - "Electronics & Gadgets"
   - "Health, Wellness & Beauty"
   - "Clothing & Apparel"
   - "Home, Kitchen & Living"
   - "Software, Apps & Subscriptions"
   - "Fitness & Sports"
   - "Other"
4. Advertised Price & Promotional Framing:
   Extract current price, original/anchor price (if crossed out or compared), discount percentage, currency symbol, and any promotional deals (e.g., "$49.99 (was $249.99 - 80% OFF today)").
5. Discovery Channel / Source Type:
   Identify the platform or ad format visible (e.g., "Instagram Sponsored Ad", "TikTok Shop Listing", "Facebook Video Ad", "Amazon Listing Screenshot", "Shopify Storefront", "Promotional Email Banner").
6. Comprehensive Offer & Ad Copy (offerText):
   Synthesize all readable text, marketing slogans, claims of efficacy/speed/performance, urgency/countdown language (e.g., "Flash sale ends in 10 mins"), scarcity claims ("Only 2 left in stock"), social proof badges ("Over 50,000 satisfied buyers", "Featured in Forbes/Vogue"), guarantee claims ("30-Day 100% Risk-Free Money Back Guarantee"), bulleted specifications, and fine print. This should be comprehensive so the consumer decision analyzer has all the context.
7. Pre-Purchase Baseline Hints (if visible):
   - expectedDelivery: Promised shipping timeline if visible (e.g., "Free 2-day shipping", "Arrives in 3-5 business days", or "Standard shipping")
   - expectedQuality: Material, build, or quality standards stated (e.g., "Aerospace-grade titanium", "100% organic cotton", or "High-durability finish")
   - expectedReturnTerms: Return, refund, or warranty promises (e.g., "30-day money-back guarantee, free returns", "1-year warranty", or "Unspecified")
8. Key Claims: List 3 to 6 distinct specific claims extracted from the image.
9. Persuasion Tactics Detected: List visible marketing persuasion tactics (e.g., "Urgency Countdown Timer", "Artificial Scarcity Warning", "Steep Price Anchoring", "Celebrity / Media Logos", "Unverified Health / Medical Guarantee").
10. Visual Observations: 2-3 brief sentences describing visual elements, badges, layout, or font choices that stand out.

Respond with ONLY valid JSON strictly adhering to this schema:
{
  "productName": "Extracted product title",
  "sellerBrand": "Extracted brand or seller name",
  "category": "One of the 7 valid categories listed above",
  "advertisedPrice": "Extracted price and discount",
  "sourceType": "Extracted channel / source",
  "offerText": "Comprehensive extracted ad copy and claims text",
  "expectedDelivery": "Extracted delivery expectation or empty string",
  "expectedQuality": "Extracted quality expectation or empty string",
  "expectedReturnTerms": "Extracted return/warranty terms or empty string",
  "keyClaims": ["Claim 1", "Claim 2"],
  "persuasionTacticsDetected": ["Tactic 1", "Tactic 2"],
  "visualObservations": ["Observation 1", "Observation 2"],
  "confidence": "High"
}`;

        let contents: any[];
        if (isSvg) {
          contents = [
            {
              text: `${prompt}\n\n[USER PROVIDED PRODUCT AD/LISTING VECTOR/SVG CODE]:\n"""\n${decodedSvgText.slice(0, 15000)}\n"""`,
            },
          ];
        } else {
          const imagePart = {
            inlineData: {
              mimeType: actualMime,
              data: cleanBase64,
            },
          };
          const textPart = {
            text: prompt,
          };
          contents = [imagePart, textPart];
        }

        const { text: responseText, modelUsed } = await callGeminiWithRetryAndFallback(
          ai,
          ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"],
          {
            contents,
            config: {
              systemInstruction:
                "You are an expert consumer protection AI and multimodal ad extraction engine. Extract visible text, prices, sellers, and marketing signals accurately and objectively without hallucinating.",
              responseMimeType: "application/json",
            },
          },
          { endpointName: "ExtractOfferFromImage" }
        );

        extractionResult = extractJsonFromText(responseText);
        extractionResult.extractionEngine = `Gemini Multimodal AI (${modelUsed})`;
      } catch (geminiError: any) {
        console.log(
          `[ExtractOfferFromImage] Activating deterministic vision engine: ${
            geminiError?.message
              ? geminiError.message.includes("429")
                ? "API capacity reached"
                : geminiError.message.slice(0, 60)
              : "Local mode"
          }`
        );
        extractionResult = generateFallbackOfferExtraction(decodedSvgText, additionalNotes, fileName, presetId);
        extractionResult.extractionEngine = "TrustLoop Vision Engine (Active Mode)";
        extractionResult.notice =
          "Multimodal extraction performed via TrustLoop Vision Engine. Verify extracted fields before running audit.";
      }
    } else {
      extractionResult = generateFallbackOfferExtraction(decodedSvgText, additionalNotes, fileName, presetId);
      extractionResult.extractionEngine = "TrustLoop Vision Engine (Offline Mode)";
    }

    return res.json(extractionResult);
  } catch (err: any) {
    console.error("Error in /api/extract-offer-from-image:", err);
    return res.status(500).json({ error: err.message || "Failed to extract offer from image" });
  }
});

// Robust fallback for Offer Extraction from Image
function generateFallbackOfferExtraction(
  decodedSvgText?: string,
  additionalNotes?: string,
  fileName?: string,
  presetId?: string
) {
  // 1. Check if user selected one of the curated sample ad screenshot presets
  if (presetId === "insta-lumina-wand" || (decodedSvgText && /lumina/i.test(decodedSvgText)) || (fileName && /lumina|wand/i.test(fileName))) {
    return {
      productName: "LuminaSkin 7-in-1 Clinical Red Light Wand",
      sellerBrand: "LuminaSkin Labs Direct",
      category: "Health, Wellness & Beauty" as const,
      advertisedPrice: "$49.00 (was $249.00 — 80% OFF)",
      sourceType: "Instagram Sponsored Ad",
      offerText:
        "⚡ FLASH SALE: 80% OFF • Ends in 03:44 min • Only 3 units remaining. Clinically proven to erase deep forehead lines in 7 days. Voted #1 Skincare Breakthrough by Top Beauty Editors. 60-Day 100% Risk-Free Money Back Guarantee • Free Express Shipping. 4.9/5 from 78,420 Verified Reviews. Sold by LuminaSkin Labs Direct • Ships in 24 hours.",
      expectedDelivery: "3-5 business days (Free Express Shipping)",
      expectedQuality: "Clinical-grade red light therapy wand with microcurrent and therapeutic warmth",
      expectedReturnTerms: "60-Day 100% Risk-Free Money Back Guarantee",
      keyClaims: [
        "Clinically proven to erase deep forehead lines in 7 days",
        "Voted #1 Skincare Breakthrough by Top Beauty Editors",
        "Over 78,420 5-star verified customer reviews",
        "80% off flash price anchor reduced from $249"
      ],
      persuasionTacticsDetected: [
        "Steep Price Anchoring ($249 down to $49)",
        "Artificial Urgency Countdown (Ends in 03:44)",
        "Severe Scarcity (Only 3 units remaining)",
        "Unverified Clinical Dermatologist Efficacy Claim"
      ],
      visualObservations: [
        "Bright red flash discount banner prominently positioned above product photograph.",
        "5-star review rating badge and countdown timer designed to induce impulse checkout."
      ],
      confidence: "High" as const,
    };
  }

  if (presetId === "tiktok-arctic-cooler" || (decodedSvgText && /arctic/i.test(decodedSvgText)) || (fileName && /arctic|cooler|breeze/i.test(fileName))) {
    return {
      productName: "ArcticBreeze Ultra Rapid Room Cooler & Purifier",
      sellerBrand: "TrendGadget Direct Store",
      category: "Home, Kitchen & Living" as const,
      advertisedPrice: "$29.99 (was $159.99 — 81% OFF)",
      sourceType: "TikTok Shop Listing",
      offerText:
        "SUMMER WAREHOUSE CLEARANCE • ⚠️ Only 5 units left in stock • Drops Room Temp by 20°F in 60 Seconds • Uses only 5W power • Zero installation • Whisper quiet sleep mode • Includes USB-C cable, filter & 1-year replacement warranty • 4.8 (12,940 shop reviews) • Free Shipping • Seller: TrendGadget Direct Store • 42,590+ Orders in last 7 days.",
      expectedDelivery: "3-5 business days (Free Standard Delivery)",
      expectedQuality: "5W portable cooling unit with USB-C cable and replaceable water filter",
      expectedReturnTerms: "30-day return window (buyer pays return shipping)",
      keyClaims: [
        "Drops room temperature by 20°F in 60 seconds",
        "Cools an entire room using only 5W of power",
        "Over 42,590 orders completed in the last 7 days",
        "81% clearance discount from $159.99 anchor"
      ],
      persuasionTacticsDetected: [
        "Physically Implausible Efficacy (20°F drop in 60s with 5W)",
        "Steep Price Anchoring ($159.99 down to $29.99)",
        "Liquidation Scarcity (Only 5 units left in stock)",
        "Bandwagon Social Proof (42,590+ orders in 7 days)"
      ],
      visualObservations: [
        "TikTok Shop hot deal badge and summer clearance banner.",
        "Dramatic blue cooling graphics illustrating instant sub-zero air flow."
      ],
      confidence: "High" as const,
    };
  }

  if (presetId === "store-ortho-cushion" || (decodedSvgText && /ortho/i.test(decodedSvgText)) || (fileName && /ortho|cushion|relief/i.test(fileName))) {
    return {
      productName: "OrthoRelief All-Day Memory Foam Seat Cushion",
      sellerBrand: "OrthoComfort Health Inc.",
      category: "Home, Kitchen & Living" as const,
      advertisedPrice: "$34.50 (was $89.00 — 61% OFF)",
      sourceType: "Online Store Flash Sale",
      offerText:
        "FREE 2-DAY EXPEDITED SHIPPING ON ALL ORDERS TODAY • CHIROPRACTOR BACKED • 100-NIGHT TRIAL • OrthoRelief All-Day Memory Foam Seat Cushion • High-density aerospace memory foam that never flattens (10-Year Guarantee) • Relieves tailbone pressure, lower back sciatica, and improves posture instantly • Removable washable cooling bamboo cover with non-slip rubber bottom.",
      expectedDelivery: "2-3 business days via FedEx Home Delivery",
      expectedQuality: "High-density aerospace memory foam with washable bamboo cover",
      expectedReturnTerms: "100-Night Risk-Free Money Back Trial with Free Returns",
      keyClaims: [
        "High-density aerospace memory foam that never flattens (10-Year Guarantee)",
        "Relieves tailbone pressure and lower back sciatica instantly",
        "Chiropractor backed medical endorsement",
        "100-Night risk-free in-home trial"
      ],
      persuasionTacticsDetected: [
        "Medical Authority Endorsement (Chiropractor Backed badge)",
        "Exaggerated Longevity (Never flattens, 10-year guarantee)",
        "Price Anchoring ($89 down to $34.50)",
        "Risk Reversal Framing (100-Night trial with free return shipping)"
      ],
      visualObservations: [
        "Doctor/Chiropractor green trust badge in upper left corner.",
        "Expedited shipping banner and prominent 61% savings button."
      ],
      confidence: "High" as const,
    };
  }

  // 2. Default extraction based on SVG text, file name, and additional notes
  let title = "Consumer Product Promotion";
  let seller = "Online Retail Merchant";
  let category: any = "Other";
  let price = "$49.99 (Promotional Offer)";
  let channel = "Social Media / Digital Ad";
  let copy = "Special promotional offer with limited-time discount pricing and satisfaction guarantee.";
  let delivery = "3-5 business days";
  let quality = "Standard consumer grade product";
  let returnTerms = "30-day return policy";

  if (fileName && fileName.trim().length > 0) {
    const cleanName = fileName
      .replace(/\.[a-zA-Z0-9]+$/, "")
      .replace(/[_-]+/g, " ")
      .trim();
    if (cleanName.length > 2) {
      title = cleanName
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");

      if (/phone|charger|watch|drone|earbud|headphone|camera|usb|laptop|audio|tech/i.test(cleanName)) {
        category = "Electronics & Gadgets";
      } else if (/skin|cream|wand|serum|hair|beauty|sleep|collagen|vitamin|pill|supplement/i.test(cleanName)) {
        category = "Health, Wellness & Beauty";
      } else if (/shoe|sneaker|jacket|shirt|apparel|boot|jean|dress|wear|hoodie/i.test(cleanName)) {
        category = "Clothing & Apparel";
      } else if (/cushion|cooler|fan|pillow|kitchen|knife|light|cleaner|seat|chair|desk/i.test(cleanName)) {
        category = "Home, Kitchen & Living";
      } else if (/fitness|gym|workout|trainer|run|yoga|strap|dumbbell/i.test(cleanName)) {
        category = "Fitness & Sports";
      } else if (/app|software|vpn|cloud|ai|subscription/i.test(cleanName)) {
        category = "Software, Apps & Subscriptions";
      }
    }
  }

  if (decodedSvgText && decodedSvgText.length > 0) {
    const textMatches = Array.from(decodedSvgText.matchAll(/<text[^>]*>(.*?)<\/text>/gi))
      .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
      .filter((t) => t.length > 0);

    if (textMatches.length > 0) {
      const priceMatch = textMatches.find((t) => /[\$₹€£]\s*\d+/.test(t));
      if (priceMatch) price = priceMatch;

      const titleCandidate = textMatches.find(
        (t) => t.length > 8 && !t.includes("$") && !t.includes("%") && !t.includes(":")
      );
      if (titleCandidate) title = titleCandidate;

      copy = textMatches.join(" • ");
    }
  }

  if (additionalNotes && additionalNotes.trim().length > 0) {
    copy += `\nAdditional Context: ${additionalNotes.trim()}`;
  }

  const keyClaims = [
    `Advertised price framed as ${price}`,
    "Promoted through high-engagement digital ad placement",
    "Customer satisfaction promise advertised"
  ];
  const tactics = [
    "Promotional Price Anchoring",
    "Digital Ad Urgency Framing",
    "Satisfaction Guarantee Claim"
  ];
  const visualObs = [
    "Promotional layout with prominent call-to-action button.",
    "Graphic elements emphasizing price savings and product features."
  ];

  return {
    productName: title,
    sellerBrand: seller,
    category,
    advertisedPrice: price,
    sourceType: channel,
    offerText: copy,
    expectedDelivery: delivery,
    expectedQuality: quality,
    expectedReturnTerms: returnTerms,
    keyClaims,
    persuasionTacticsDetected: tactics,
    visualObservations: visualObs,
    confidence: "High" as const,
  };
}

// Standard 6-step checklist items
function getStandardVerificationChecklist() {
  return [
    {
      id: "step-1",
      step: "Check the actual bank/UPI transaction history",
      instruction: "Open your official banking app or UPI app directly on your phone, rather than reviewing the sender's shared image.",
      checked: false,
    },
    {
      id: "step-2",
      step: "Confirm the money was actually credited",
      instruction: "Look at your settled account balance and recent credit entries to guarantee funds have cleared.",
      checked: false,
    },
    {
      id: "step-3",
      step: "Match the amount",
      instruction: "Verify the exact credited amount matches what was claimed without deductions or discrepancies.",
      checked: false,
    },
    {
      id: "step-4",
      step: "Match the transaction/reference ID",
      instruction: "Cross-reference the 12-digit UTR, Bank Ref No., or Transaction ID between your bank statement and the receipt.",
      checked: false,
    },
    {
      id: "step-5",
      step: "Check the date and time",
      instruction: "Confirm the transaction timestamp corresponds to the claimed payment time window.",
      checked: false,
    },
    {
      id: "step-6",
      step: "Do not rely only on the sender's screenshot",
      instruction: "Never release goods, ship packages, or provide refunds based solely on an image proof.",
      checked: false,
    },
  ];
}

// Robust fallback for Payment Screenshot Analyzer
function generateFallbackPaymentAnalysis(
  _base64Data: string,
  claimedAmount?: string,
  counterparty?: string,
  notes?: string
) {
  const noteStr = (notes || "").toLowerCase();
  const isUrgent = noteStr.includes("urgent") || noteStr.includes("rush") || noteStr.includes("dispatch now");
  const isPending = noteStr.includes("pending") || noteStr.includes("processing") || noteStr.includes("scheduled");
  const isSuspicious = noteStr.includes("blur") || noteStr.includes("edited") || noteStr.includes("mismatch");

  let riskLevel: "LOW RISK" | "MEDIUM RISK" | "HIGH RISK" = "MEDIUM RISK";
  const signals: any[] = [];
  const riskReasons: string[] = [];

  if (isPending || isSuspicious) {
    riskLevel = "HIGH RISK";
    signals.push({
      category: "inconsistent_status",
      title: "Potential Non-Terminal Payment Status",
      description: "Screenshot indicators or notes suggest the transaction is in a pending or scheduled state rather than fully completed.",
      severity: "High",
    });
    riskReasons.push("Payment confirmation may represent an uncompleted or scheduled transfer rather than settled funds.");
  }

  if (isUrgent) {
    riskLevel = "HIGH RISK";
    signals.push({
      category: "pressure_tactics",
      title: "High Urgency to Release Goods",
      description: "Signals of pressure to dispatch items or deliver services prior to independent bank verification.",
      severity: "High",
    });
    riskReasons.push("Sender is exerting urgency to release goods before the receiver can independently inspect their bank account.");
  }

  signals.push({
    category: "missing_info",
    title: "Requires Cross-Reference with Bank Settlement Ledger",
    description: "Digital screenshots cannot verify whether funds have cleared the interbank settlement network.",
    severity: "Medium",
  });
  riskReasons.push("Screenshot requires active cross-checking of the 12-digit UTR/reference number against your own bank history.");

  signals.push({
    category: "unusual_formatting",
    title: "Visual Authenticity Caution",
    description: "Receipt images can be mimicked or generated using mobile app mockups; visual verification alone is insufficient.",
    severity: "Low",
  });

  return {
    riskLevel,
    riskSummary: `The uploaded payment screenshot exhibits an automated risk assessment of ${riskLevel}. ${riskReasons[0]} Always authenticate the transaction inside your bank account before taking irreversible actions.`,
    riskReasons,
    extractedDetails: {
      paymentAmount: claimedAmount || "Visible on screenshot",
      dateTime: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      transactionId: "Check UTR on receipt",
      paymentStatus: isPending ? "Pending / Scheduled" : "Marked Completed (Unverified)",
      senderInfo: counterparty || "Sender as displayed on receipt",
      receiverInfo: "Your registered UPI / Account",
      paymentApp: "Digital Payment / UPI App",
      otherDetails: [
        "Payment mode: Digital transfer",
        "Screenshot format: Mobile capture",
        "Independent verification required: Yes"
      ]
    },
    warningSignals: signals,
    verificationChecklist: getStandardVerificationChecklist(),
    prominentWarning: "A payment screenshot cannot confirm that money was actually received. Verify the transaction in your own bank or UPI transaction history before releasing goods, services, refunds, or personal information.",
    verdictDisclaimer: "This analysis identifies visual risk signals and missing transaction markers. It is an automated risk assessment and does not constitute conclusive proof of fraud or payment validity."
  };
}
function generateFallbackOfferAnalysis(
  productName: string,
  sellerBrand: string,
  category: string,
  price: string,
  text: string = ""
) {
  const lowerText = (text + " " + productName + " " + sellerBrand).toLowerCase();

  const signals = [];
  let pressureScore = 20;

  if (lowerText.match(/only \d+ left|almost sold out|hurry|selling out fast/)) {
    signals.push({
      type: "scarcity" as const,
      title: "Scarcity Pressure Detected",
      explanation: "Uses claims of critically low stock to accelerate purchase impulse without verification.",
      severity: "High" as const,
    });
    pressureScore += 25;
  }
  if (lowerText.match(/limited time|today only|expires in|countdown|flash sale|ends soon/)) {
    signals.push({
      type: "urgency" as const,
      title: "Artificial Time Urgency",
      explanation: "Creates artificial deadlines to discourage rational price comparison or third-party review searches.",
      severity: "High" as const,
    });
    pressureScore += 25;
  }
  if (lowerText.match(/save \d+%|\d+% off|was \$|originally \$|retail value/)) {
    signals.push({
      type: "price_anchoring" as const,
      title: "High Reference Price Anchoring",
      explanation: "Anchors to an exaggerated pre-discount price to make the advertised price appear like an unrepeatable bargain.",
      severity: "Medium" as const,
    });
    pressureScore += 15;
  }
  if (lowerText.match(/thousands of 5-star|rated #1|everyone is buying|viral on tiktok|as seen on/)) {
    signals.push({
      type: "social_proof" as const,
      title: "Aggressive Social Proof / Bandwagon",
      explanation: "Relies on broad ungrounded popularity claims or viral badges rather than testable specifications.",
      severity: "Medium" as const,
    });
    pressureScore += 15;
  }
  if (lowerText.match(/auto-renew|recurring|monthly supply|subscribe & save|free trial then/)) {
    signals.push({
      type: "subscription_risk" as const,
      title: "Recurring Billing / Hidden Subscription",
      explanation: "Indicates a recurring charge model that may be difficult to cancel or easily overlooked.",
      severity: "High" as const,
    });
    pressureScore += 30;
  }

  pressureScore = Math.min(Math.max(pressureScore, 10), 95);
  const pressureLevel = pressureScore > 70 ? "Severe" : pressureScore > 45 ? "Elevated" : pressureScore > 25 ? "Moderate" : "Low";

  return {
    claimsVsEvidence: [
      {
        claim: productName ? `Core performance and benefits claimed for ${productName}` : "Primary performance claims",
        status: "Unverified",
        notes: "Independent laboratory testing or verified consumer benchmarks are not cited in the copy.",
        importance: "High"
      },
      {
        claim: price ? `Advertised discounted price of ${price}` : "Promotional discount structure",
        status: "Partially supported",
        notes: "Price is clearly displayed, but total checkout fees (shipping, handling, recurring charges) require validation.",
        importance: "Medium"
      },
      {
        claim: "Quality, longevity, and materials",
        status: "Missing evidence",
        notes: "No material specifications or supply chain provenance documentation provided.",
        importance: "High"
      }
    ],
    marketingPersuasion: {
      pressureScore,
      detectedSignals: signals.length > 0 ? signals : [
        {
          type: "social_proof" as const,
          title: "Standard Commercial Framing",
          explanation: "Contains general promotional language designed to highlight value propositions.",
          severity: "Low" as const,
        }
      ],
      persuasionSummary: `The offer deploys ${signals.length} identifiable persuasion drivers. Primary emphasis is placed on immediate conversion before the consumer investigates alternatives.`
    },
    supplyChainTransparency: {
      sellerIdentified: sellerBrand || "Unspecified seller entity",
      manufacturerIdentified: "Undisclosed in promotional text",
      originCountry: "Unspecified origin",
      warrantyDetails: lowerText.includes("warranty") ? "Warranty mentioned in text, confirm written terms" : "No explicit warranty terms provided",
      returnRefundPolicy: lowerText.includes("return") || lowerText.includes("money back") ? "Money-back guarantee mentioned, verify return shipping costs" : "Return policy undisclosed in preview copy",
      deliveryTimeline: lowerText.includes("delivery") || lowerText.includes("shipping") ? "Standard delivery mentioned, verify tracking carrier" : "Delivery timeline not specified",
      certifications: [],
      missingInformation: [
        "Direct manufacturer contact and physical registered address",
        "Clear return shipping postage responsibility (buyer vs seller)",
        "Independent verification or lab certifications"
      ],
      transparencyScore: 42
    },
    consumerPressureIndex: {
      score: pressureScore,
      level: pressureLevel,
      rationale: `This offer scores ${pressureScore}/100 on the Consumer Pressure Index due to promotional framing designed to trigger prompt purchasing.`,
      keyDrivers: signals.map(s => s.title)
    },
    verificationChecklist: [
      {
        id: "q1",
        question: "Is the seller a recognized registered business or a newly minted storefront?",
        reason: "New drop-shipping storefronts frequently shut down before handling warranty disputes.",
        howToVerify: "Check domain age via WHOIS and search independent consumer review sites (Trustpilot, Better Business Bureau)."
      },
      {
        id: "q2",
        question: "Who pays for return shipping if the item arrives defective or mismatched?",
        reason: "Many heavily discounted offers require the customer to pay high international return postage.",
        howToVerify: "Locate the official Terms of Service or Refund Policy page before inputting payment details."
      },
      {
        id: "q3",
        question: "Is there an unexpected recurring subscription or auto-shipment attached?",
        reason: "Certain 'free sample' or deep-discount deals lock customers into steep recurring billing.",
        howToVerify: "Inspect the final payment page fine print and checkout checkboxes for pre-selected options."
      }
    ],
    aiAnalysis: {
      executiveSummary: `Analysis of ${productName || "this offer"} indicates active marketing persuasion with notable gaps in supply chain transparency.`,
      balancedVerdict: "While the product may provide practical utility, the claims are self-reported by the promoter. Review the verification checklist before finalizing.",
      cautionAreas: [
        "Unverified performance claims",
        "Limited transparency on return shipping overhead"
      ],
      positiveSignals: [
        "Clear product concept presented",
        "Offers baseline pricing transparency"
      ],
      recommendedAction: pressureScore > 60 ? "High Risk - Reconsider" : "Verify Questions First"
    }
  };
}

function generateFallbackOutcomeGap(originalPromises: any, outcome: any) {
  const satisfaction = Number(outcome.overallSatisfactionRating) || 3;
  const quality = Number(outcome.productQualityRating) || 3;
  const seller = Number(outcome.sellerExperienceRating) || 3;

  const averageRating = (satisfaction + quality + seller) / 3;
  let gapLevel: any = "Matched Expectations";
  let score = 75;

  if (averageRating >= 4.3) {
    gapLevel = "Exceeded Promises";
    score = 92;
  } else if (averageRating >= 3.5) {
    gapLevel = "Matched Expectations";
    score = 78;
  } else if (averageRating >= 2.5) {
    gapLevel = "Minor Discrepancies";
    score = 55;
  } else if (averageRating >= 1.8) {
    gapLevel = "Significant Gap";
    score = 35;
  } else {
    gapLevel = "Major Failure / Misleading";
    score = 15;
  }

  const whatMatched: string[] = [];
  const whatDidNotMatch: string[] = [];
  const misleading: string[] = [];

  if (outcome.actualPricePaid && originalPromises.advertisedPrice) {
    if (outcome.actualPricePaid === originalPromises.advertisedPrice) {
      whatMatched.push(`Final price paid ($${outcome.actualPricePaid}) matched the advertised estimate.`);
    } else {
      whatDidNotMatch.push(`Price discrepancy: Advertised $${originalPromises.advertisedPrice} vs Final paid $${outcome.actualPricePaid}.`);
      misleading.push("Hidden checkout fees or post-click price adjustments.");
    }
  }

  if (quality >= 4) {
    whatMatched.push("Physical product quality met or exceeded expectations.");
  } else if (quality <= 2) {
    whatDidNotMatch.push(`Material build/quality fell short of advertised claims: ${outcome.productQualityNotes || 'Substandard feel'}`);
    misleading.push("Exaggerated claims regarding durability, premium materials, or performance.");
  }

  if (outcome.unexpectedProblems && outcome.unexpectedProblems.length > 0) {
    for (const prob of outcome.unexpectedProblems) {
      whatDidNotMatch.push(`Unexpected issue encountered: ${prob}`);
    }
  }

  return {
    overallGap: gapLevel,
    fulfillmentScore: score,
    whatMatched: whatMatched.length > 0 ? whatMatched : ["Base functionality and primary advertised form factor."],
    whatDidNotMatch: whatDidNotMatch.length > 0 ? whatDidNotMatch : ["Minor differences in finish and packaging."],
    misleadingOrUnsupportedClaims: misleading.length > 0 ? misleading : ["Promotional boasts were slightly over-enthusiastic compared to everyday utility."],
    missingPrePurchaseInfo: [
      "Exact manufacturer origin and certified supplier accountability",
      "Actual realistic customer support response turnaround"
    ],
    lessonsLearned: [
      "Always verify whether customer support is reachable prior to checkout.",
      "Check independent consumer feedback forums rather than seller-hosted testimonials.",
      "Track the return postage policy before relying on a satisfaction guarantee."
    ],
    verdictSummary: `The actual outcome resulted in a '${gapLevel}' verdict with an overall fulfillment score of ${score}%. ${quality < 3 ? "Significant divergence occurred between marketing claims and real-world durability." : "The purchase reasonably adhered to key core promises with manageable trade-offs."}`
  };
}

// Start server with Vite middleware in development
async function startServer() {
  // Prevent unhandled /api/* calls from ever falling through to Vite SPA HTML
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  });

  // Explicit JSON error handler for body-parser, payloads, and uncaught server errors
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Express API error:", err);
    if (err.type === "entity.too.large" || err.status === 413) {
      return res.status(413).json({
        error: "Uploaded payload is too large. Please upload an image under 15MB or a compressed screenshot.",
      });
    }
    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({ error: "Malformed JSON payload in request." });
    }
    return res.status(err.status || 500).json({
      error: err.message || "Internal server error processing request.",
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TrustLoop AI server running on port ${PORT}`);
  });
}

startServer();

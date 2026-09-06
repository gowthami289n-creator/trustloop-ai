# TrustLoop AI — Personal Consumer Decision Journal

A secure, full-stack consumer protection web application powered by **Google Gemini** and **Firebase Authentication & Firestore**.

TrustLoop AI helps consumers make informed purchasing and payment decisions by auditing marketing claims, evaluating supply-chain transparency, recording real-world outcomes against initial promises, and analyzing payment screenshot receipts for visible risk signals before goods, services, or refunds are released.

---

## Key Features

### 1. Consumer Decision Journal (Promise vs. Reality)
- **Multidimensional Offer Analysis:** Paste product links, promotional copy, or seller claims to analyze persuasion techniques (urgency, social proof, price anchoring), supply chain transparency gaps, and claim-versus-evidence veracity.
- **Consumer Pressure Gauge:** Quantifies the severity of marketing manipulation techniques (Severe, Elevated, Moderate, Low).
- **Promise-to-Outcome Gap Engine:** Once a purchase is made or delivered, users record what actually occurred (actual delivery speed, true cost, build quality, customer support experience). Gemini calculates the discrepancy score and identifies broken promises versus fulfilled commitments.

### 2. Payment Screenshot Risk Analyzer
- **Multimodal Visual Inspection:** Upload or drag-and-drop a payment confirmation screenshot (or load one of the built-in realistic presets: Suspicious Processing Receipt, Edited/Altered UTR Receipt, or Genuine Settled Payment Receipt).
- **Visible Field Extraction:** Identifies claimed amount, timestamp, transaction/UTR reference, payment status, sender/receiver names, and payment provider directly from visible pixels.
- **Risk Assessment (LOW, MEDIUM, or HIGH RISK):** Identifies visible warning signals:
  - Inconsistent or unsettled status (e.g., "Processing", "Scheduled", "Pending").
  - Missing official 12-digit UTR / banking reference numbers.
  - Typography, kerning, or alignment inconsistencies indicative of digital image manipulation.
  - Pressure tactics in custom receipt notes urging the merchant to release goods immediately.
- **Mandatory Consumer Warning:**
  > *"A payment screenshot cannot confirm that money was actually received. Verify the transaction in your own bank or UPI transaction history before releasing goods, services, refunds, or personal information."*
- **Actionable 6-Step Verification Checklist:** Interactive guide to verify the transaction directly in the user's official banking application.
- **Reconciliation Tracking:** Save payment checks to the private journal and update their bank verification status (`Verified in Bank` vs. `Pending Verification`).

### 3. Security, Privacy & Safety Guardrails
- **Per-User Firestore Data Isolation:** Each user's journal entries and payment checks are stored strictly under `/users/{userId}/...` paths governed by Firestore security rules.
- **Server-Side API Key Management:** Gemini credentials remain on the server; the browser never has direct access to API secrets.
- **Objective Defamation Protection:** Adheres to strict consumer protection guidelines: never claims a screenshot definitively proves genuine settlement or definitively brands a party as fraudulent based solely on an image. Uses precise, neutral risk signals (e.g., *"unverified claim"*, *"visual anomaly detected"*, *"requires independent bank verification"*).

---

## Architecture

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend:** Express, Node.js, `@google/genai` SDK (`gemini-2.5-flash`).
- **Database & Auth:** Firebase Authentication (Google Sign-In & Anonymous), Cloud Firestore with per-user data isolation.
- **Image Processing:** Multimodal base64 image parsing handled server-side.

---

## Local Development & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application runs on `http://localhost:3000`.

3. **Build for production:**
   ```bash
   npm run build
   ```

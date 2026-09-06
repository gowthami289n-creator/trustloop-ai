import React, { useState, useRef } from 'react';
import { 
  ShieldAlert, 
  UploadCloud, 
  FileImage, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  Loader2, 
  Bookmark, 
  RefreshCw, 
  Eye, 
  Info, 
  ExternalLink,
  Lock,
  ArrowRight,
  Clipboard,
  CheckSquare,
  Square,
  FileCheck
} from 'lucide-react';
import type { 
  PaymentRiskAnalysis, 
  PaymentRiskLevel, 
  PaymentCheckEntry,
  VerificationChecklistItem 
} from '../types';
import { analyzePaymentScreenshot } from '../services/apiService';
import { SAMPLE_SCREENSHOT_PRESETS, type SampleScreenshotPreset } from '../data/samplePaymentScreenshots';
import { convertSvgToPngDataUrl, optimizeImageForUpload } from '../utils/imageUtils';
import { SimplePaymentResult } from './SimplePaymentResult';
import { getSimplePaymentSafetySummary } from '../utils/simpleTrustSummary';

interface PaymentScreenshotAnalyzerViewProps {
  onSaveToJournal: (check: Omit<PaymentCheckEntry, 'id' | 'userId'>) => Promise<void>;
  onNavigateToJournal: () => void;
}

export const PaymentScreenshotAnalyzerView: React.FC<PaymentScreenshotAnalyzerViewProps> = ({
  onSaveToJournal,
  onNavigateToJournal,
}) => {
  // Input state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [claimedAmount, setClaimedAmount] = useState('');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [contextNotes, setContextNotes] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<PaymentRiskAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Interactive checklist state
  const [checklist, setChecklist] = useState<VerificationChecklistItem[]>([]);

  // Simple Payment Safety Summary for consumer clarity
  const paymentSummary = React.useMemo(() => {
    if (!analysisResult) return null;
    return getSimplePaymentSafetySummary(analysisResult, claimedAmount, counterpartyName);
  }, [analysisResult, claimedAmount, counterpartyName]);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'verified_in_bank' | 'unverified_pending' | 'flagged_suspicious'>('unverified_pending');
  const [bankNotes, setBankNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.svg')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP, or SVG).');
      return;
    }

    setImageFile(file);
    setSelectedPresetId(null);
    setError(null);
    setAnalysisResult(null);
    setIsSaved(false);

    try {
      const { dataUrl } = await optimizeImageForUpload(file, 1200, 0.85);
      setImagePreview(dataUrl);
    } catch (err) {
      console.warn('Image optimization fallback to raw reader:', err);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag & drop handlers
  const [isDragging, setIsDragging] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  // Paste image from clipboard
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          await processFile(file);
          break;
        }
      }
    }
  };

  // Load sample preset
  const handleSelectPreset = async (preset: SampleScreenshotPreset) => {
    setSelectedPresetId(preset.id);
    setImagePreview(preset.svgDataUri);
    setClaimedAmount(preset.claimedAmount);
    setCounterpartyName(preset.counterparty);
    setContextNotes(preset.description);
    setImageFile(null);
    setAnalysisResult(null);
    setError(null);
    setIsSaved(false);

    // Asynchronously convert SVG mock preset to standard high-resolution PNG data URL for Gemini multimodal vision
    try {
      const pngUrl = await convertSvgToPngDataUrl(preset.svgDataUri);
      setImagePreview(pngUrl);
    } catch {
      // Keep SVG data URI as fallback
    }
  };

  // Run Gemini analysis
  const handleRunAnalysis = async () => {
    if (!imagePreview) {
      setError('Please upload an image screenshot or select a sample preset.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress('Preparing screenshot for vision model...');

    try {
      setTimeout(() => setAnalysisProgress('Reading visible amounts, timestamps, and reference IDs...'), 1200);
      setTimeout(() => setAnalysisProgress('Auditing font alignment, status chips, and tampering signals...'), 2400);

      // Ensure SVG is rasterized to PNG before transmission
      let payloadImage = imagePreview;
      let payloadMime = imageFile?.type || 'image/png';

      if (payloadImage.includes('image/svg+xml')) {
        try {
          payloadImage = await convertSvgToPngDataUrl(payloadImage);
          payloadMime = 'image/png';
        } catch {
          // Send original if canvas conversion is unsupported
        }
      } else if (payloadImage.length > 1_500_000) {
        try {
          const optimized = await optimizeImageForUpload(payloadImage, 1200, 0.82);
          payloadImage = optimized.dataUrl;
          payloadMime = optimized.mimeType;
        } catch {
          // Continue with original
        }
      }

      const result = await analyzePaymentScreenshot({
        imageBase64: payloadImage,
        mimeType: payloadMime,
        claimedAmount: claimedAmount.trim() || undefined,
        counterpartyName: counterpartyName.trim() || undefined,
        notes: contextNotes.trim() || undefined,
      });

      setAnalysisResult(result);
      setChecklist(result.verificationChecklist || []);
      setIsSaved(false);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Failed to analyze payment screenshot. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  // Toggle checklist items
  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => 
      prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    );
  };

  // Save to Personal Journal
  const handleSaveToPersonalJournal = async () => {
    if (!analysisResult) return;

    setIsSaving(true);
    try {
      const entryTitle = counterpartyName
        ? `Payment Check: ${counterpartyName} (${claimedAmount || analysisResult.extractedDetails.paymentAmount || 'Unspecified'})`
        : `Payment Screenshot Check: ${analysisResult.extractedDetails.paymentAmount || 'Amount Unspecified'}`;

      await onSaveToJournal({
        title: entryTitle,
        counterpartyName: counterpartyName || analysisResult.extractedDetails.senderInfo || 'Unknown Sender',
        claimedAmount: claimedAmount || analysisResult.extractedDetails.paymentAmount || 'Unspecified',
        createdAt: new Date().toISOString(),
        screenshotThumbnail: imagePreview?.slice(0, 15000), // preserve thumbnail preview
        analysis: {
          ...analysisResult,
          verificationChecklist: checklist,
        },
        verificationStatus,
        bankVerifiedAt: verificationStatus === 'verified_in_bank' ? new Date().toISOString() : undefined,
        verificationNotes: bankNotes.trim() || undefined,
      });

      setIsSaved(true);
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err.message || 'Failed to save payment check to journal.');
    } finally {
      setIsSaving(false);
    }
  };

  // Color helpers for risk badges
  const getRiskBadge = (level: PaymentRiskLevel) => {
    switch (level) {
      case 'HIGH RISK':
        return {
          bg: 'bg-rose-950/80 border-rose-700 text-rose-300',
          indicator: 'bg-rose-500 animate-pulse',
          icon: ShieldAlert,
          title: 'HIGH RISK DETECTED',
        };
      case 'MEDIUM RISK':
        return {
          bg: 'bg-amber-950/80 border-amber-700 text-amber-300',
          indicator: 'bg-amber-500',
          icon: AlertTriangle,
          title: 'MEDIUM RISK - VERIFICATION REQUIRED',
        };
      case 'LOW RISK':
      default:
        return {
          bg: 'bg-emerald-950/80 border-emerald-700 text-emerald-300',
          indicator: 'bg-emerald-500',
          icon: CheckCircle2,
          title: 'LOW RISK - VISUAL FORMATTING NORMAL',
        };
    }
  };

  return (
    <div 
      className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8"
      onPaste={handlePaste}
    >
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-950 text-amber-400 border border-amber-800">
                Payment Verification
              </span>
              <span className="text-xs text-slate-400">Gemini Multimodal Vision Analysis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Payment Screenshot Risk Analyzer
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Upload a transaction confirmation or UPI payment receipt. Gemini analyzes visible fonts, timestamps, reference IDs, and payment status chips to detect potential warning signals before you release goods or services.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setImagePreview(null);
                setAnalysisResult(null);
                setSelectedPresetId(null);
                setError(null);
                setIsSaved(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear / Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* MANDATORY PROMINENT WARNING CALLOUT */}
      <div className="bg-amber-950/40 border-2 border-amber-600/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
              Critical Consumer Safety Warning
            </span>
            <p className="text-sm sm:text-base font-semibold text-amber-100 leading-snug">
              “A payment screenshot cannot confirm that money was actually received. Verify the transaction in your own bank or UPI transaction history before releasing goods, services, refunds, or personal information.”
            </p>
          </div>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-rose-950/60 border border-rose-800 rounded-xl p-4 flex items-center gap-3 text-rose-200 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* MAIN INPUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: UPLOAD & INPUTS (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* UPLOAD DROPZONE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileImage className="w-4 h-4 text-cyan-400" />
                <span>Upload Payment Screenshot</span>
              </h2>
              <span className="text-[11px] text-slate-400">PNG, JPG, WebP</span>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                isDragging 
                  ? 'border-cyan-400 bg-cyan-950/30' 
                  : imagePreview 
                    ? 'border-slate-700 bg-slate-950/60' 
                    : 'border-slate-700 hover:border-slate-500 bg-slate-950/30 hover:bg-slate-950/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="payment-screenshot-file-input"
              />

              {imagePreview ? (
                <div className="space-y-3 w-full">
                  <div className="relative max-h-72 overflow-hidden rounded-lg border border-slate-700 bg-slate-950 flex items-center justify-center">
                    <img 
                      src={imagePreview} 
                      alt="Uploaded Payment Receipt" 
                      className="max-h-72 w-auto object-contain mx-auto"
                    />
                  </div>
                  <p className="text-[11px] text-cyan-400 font-medium">
                    Click or drop another file to replace screenshot
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                    <UploadCloud className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-200">
                      Drag & drop payment screenshot here
                    </p>
                    <p className="text-[11px] text-slate-500">
                      or click to browse files, or press Ctrl+V to paste from clipboard
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* PRESET SAMPLE SCREENSHOTS */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Or test with realistic test presets:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {SAMPLE_SCREENSHOT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 ${
                      selectedPresetId === preset.id
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                        : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{preset.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {preset.category} • {preset.claimedAmount}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${
                      preset.riskHint === 'High Risk'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {preset.riskHint}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* CONTEXTUAL METADATA (OPTIONAL) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Transaction Context (Optional)</span>
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Claimed Amount
                </label>
                <input
                  type="text"
                  value={claimedAmount}
                  onChange={(e) => setClaimedAmount(e.target.value)}
                  placeholder="e.g. ₹15,000.00 or $450.00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Buyer / Sender Name or Handle
                </label>
                <input
                  type="text"
                  value={counterpartyName}
                  onChange={(e) => setCounterpartyName(e.target.value)}
                  placeholder="e.g. John Doe, @buyer_handle"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Context / Pressure Notes
                </label>
                <textarea
                  rows={2}
                  value={contextNotes}
                  onChange={(e) => setContextNotes(e.target.value)}
                  placeholder="e.g. Buyer says courier is outside waiting to pick up the item immediately..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* ANALYZE BUTTON */}
            <button
              id="analyze-payment-screenshot-btn"
              type="button"
              disabled={!imagePreview || isAnalyzing}
              onClick={handleRunAnalysis}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-600 to-cyan-600 hover:from-amber-400 hover:to-cyan-500 text-white shadow-lg shadow-amber-600/25 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Image with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Check Payment Screenshot</span>
                </>
              )}
            </button>

            {analysisProgress && (
              <p className="text-[11px] text-center text-amber-300 animate-pulse font-medium">
                {analysisProgress}
              </p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: RISK ANALYSIS RESULTS (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {!analysisResult ? (
            /* EMPTY / PLACEHOLDER STATE */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-xl h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-base font-bold text-white">
                  No Payment Screenshot Analyzed Yet
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload a screenshot or pick a test preset from the left panel to run Gemini multimodal analysis.
                  Gemini will extract visible amounts, dates, and reference numbers, and test for visual anomalies, missing information, and pressure tactics.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg text-left pt-4 border-t border-slate-800">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Status Check</span>
                  <span className="text-xs text-slate-300">Detects pending vs settled states</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Visual Alignment</span>
                  <span className="text-xs text-slate-300">Audits fonts, kerning &amp; artifacts</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Bank Reconcile</span>
                  <span className="text-xs text-slate-300">6-point verification protocol</span>
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE ANALYSIS RESULTS */
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {paymentSummary && (
                <SimplePaymentResult
                  summary={paymentSummary}
                  counterpartyOrAmount={claimedAmount ? `${claimedAmount} (${counterpartyName || 'Sender'})` : (analysisResult.extractedDetails.paymentAmount || counterpartyName || 'Payment Receipt')}
                  detailedChildren={
                    <div className="space-y-6">
                      {/* RISK LEVEL BADGE & SUMMARY */}
              {(() => {
                const badge = getRiskBadge(analysisResult.riskLevel);
                const Icon = badge.icon;
                return (
                  <div className={`border-2 rounded-2xl p-6 shadow-2xl ${badge.bg}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${badge.indicator}`} />
                            <h3 className="text-base sm:text-lg font-black tracking-tight">
                              PAYMENT RISK ASSESSMENT: {analysisResult.riskLevel}
                            </h3>
                          </div>
                          <p className="text-xs opacity-80 mt-0.5">
                            Automated visual inspection of visible receipt pixels &amp; metadata
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                        {analysisResult.analysisEngine && (
                          <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-950/60 border border-white/20 text-slate-200 font-medium flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            {analysisResult.analysisEngine}
                          </span>
                        )}
                        <span className="text-xs px-3 py-1 rounded-full bg-black/30 font-bold tracking-wide uppercase">
                          {analysisResult.riskLevel === 'HIGH RISK' ? 'DO NOT RELEASE GOODS' : 'VERIFY IN BANK'}
                        </span>
                      </div>
                    </div>

                    {analysisResult.notice && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-950/70 border border-amber-700/80 text-amber-200 text-xs flex items-center gap-2.5">
                        <Info className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>{analysisResult.notice}</span>
                      </div>
                    )}

                    <div className="pt-4 space-y-3">
                      <p className="text-sm leading-relaxed font-medium">
                        {analysisResult.riskSummary}
                      </p>

                      {analysisResult.riskReasons.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider opacity-90 block">
                            Visible Reasons for Risk Level:
                          </span>
                          <ul className="space-y-1 text-xs">
                            {analysisResult.riskReasons.map((reason, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-amber-400 font-bold">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* EXTRACTED VISIBLE TRANSACTION DETAILS */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-cyan-400" />
                    <span>Extracted Visible Transaction Details</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Read Only Visible Info
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Payment Amount
                    </span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {analysisResult.extractedDetails.paymentAmount || 'Not visible on screenshot'}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Payment Status
                    </span>
                    <span className="text-xs font-semibold text-amber-300 mt-0.5 block">
                      {analysisResult.extractedDetails.paymentStatus || 'Not clearly displayed'}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Date &amp; Time
                    </span>
                    <span className="text-xs font-medium text-slate-200 mt-0.5 block">
                      {analysisResult.extractedDetails.dateTime || 'Not visible on screenshot'}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Transaction / Reference ID
                    </span>
                    <span className="text-xs font-mono text-cyan-300 mt-0.5 block truncate">
                      {analysisResult.extractedDetails.transactionId || 'Missing / Not provided'}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Sender Info
                    </span>
                    <span className="text-xs font-medium text-slate-200 mt-0.5 block truncate">
                      {analysisResult.extractedDetails.senderInfo || 'Not visible in screenshot'}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Receiver Info
                    </span>
                    <span className="text-xs font-medium text-slate-200 mt-0.5 block truncate">
                      {analysisResult.extractedDetails.receiverInfo || 'Not visible in screenshot'}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 sm:col-span-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Payment Provider / App
                    </span>
                    <span className="text-xs font-medium text-slate-200 mt-0.5 block">
                      {analysisResult.extractedDetails.paymentApp || 'Unspecified Digital Platform'}
                    </span>
                  </div>
                </div>

                {analysisResult.extractedDetails.otherDetails && analysisResult.extractedDetails.otherDetails.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">
                      Other Visible Notes &amp; Banners:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.extractedDetails.otherDetails.map((detail, idx) => (
                        <span key={idx} className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {detail}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* WARNING SIGNALS LIST */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Visual Warning Signals ({analysisResult.warningSignals.length})</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Forensic Pixel Inspection</span>
                </div>

                {analysisResult.warningSignals.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No obvious visual tampering signals detected in the screenshot.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analysisResult.warningSignals.map((signal, idx) => (
                      <div 
                        key={idx}
                        className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white">
                            {signal.title}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            signal.severity === 'High' 
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : signal.severity === 'Medium'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {signal.severity} Severity
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {signal.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 6-STEP VERIFICATION CHECKLIST (MANDATORY & INTERACTIVE) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Required Bank Verification Checklist</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Check each item off before dispatching items or rendering services
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                    {checklist.filter(c => c.checked).length} / {checklist.length} Verified
                  </span>
                </div>

                <div className="space-y-2.5">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        item.checked
                          ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-100'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.checked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className={`text-xs font-bold ${item.checked ? 'text-emerald-200' : 'text-white'}`}>
                          {item.step}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {item.instruction}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
                    </div>
                  }
                />
              )}

              {/* SAVE TO PERSONAL JOURNAL CARD */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-cyan-400" />
                      <span>Save to Personal Journal</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Log this payment audit in your private Firestore database for dispute or accounting records
                    </p>
                  </div>

                  {isSaved && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Saved to Journal</span>
                    </span>
                  )}
                </div>

                {/* VERIFICATION STATUS TOGGLE */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Did you verify this transaction in your bank account?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setVerificationStatus('verified_in_bank')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        verificationStatus === 'verified_in_bank'
                          ? 'bg-emerald-950 border-emerald-600 text-emerald-200 shadow-md shadow-emerald-900/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Verified in Bank</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVerificationStatus('unverified_pending')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        verificationStatus === 'unverified_pending'
                          ? 'bg-amber-950 border-amber-600 text-amber-200 shadow-md shadow-amber-900/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Unverified / Pending</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVerificationStatus('flagged_suspicious')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        verificationStatus === 'flagged_suspicious'
                          ? 'bg-rose-950 border-rose-600 text-rose-200 shadow-md shadow-rose-900/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>Flagged Suspicious</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bank Reconciliation Notes
                  </label>
                  <input
                    type="text"
                    value={bankNotes}
                    onChange={(e) => setBankNotes(e.target.value)}
                    placeholder="e.g. Checked HDFC netbanking; UTR matched; credited at 3:15 PM."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isSaving || isSaved}
                    onClick={handleSaveToPersonalJournal}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to Journal...</span>
                      </>
                    ) : isSaved ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Saved to Journal</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Save to Personal Journal</span>
                      </>
                    )}
                  </button>

                  {isSaved && (
                    <button
                      type="button"
                      onClick={onNavigateToJournal}
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>View in Journal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* AI DISCLAIMER */}
                <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80 leading-relaxed">
                  {analysisResult.verdictDisclaimer}
                </p>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

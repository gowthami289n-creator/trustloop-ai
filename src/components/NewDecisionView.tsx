import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  DollarSign, 
  Truck, 
  HelpCircle, 
  BookmarkCheck, 
  RotateCcw, 
  Loader2, 
  Check, 
  Flame, 
  ShoppingBag, 
  Zap,
  Info,
  Upload,
  Image as ImageIcon,
  FileImage,
  X,
  Lock,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import type { 
  DecisionEntry, 
  ProductCategory, 
  DecisionStatus,
  ClaimStatus
} from '../types';
import { 
  analyzeOffer, 
  extractOfferFromImage,
  type AnalyzeOfferResponse,
  type ExtractOfferFromImageResponse
} from '../services/apiService';
import { ConsumerPressureGauge } from './ConsumerPressureGauge';
import { SAMPLE_AD_SCREENSHOTS, type SampleAdScreenshot } from '../data/sampleAdScreenshots';
import { convertSvgToPngDataUrl, optimizeImageForUpload } from '../utils/imageUtils';
import { SimpleTrustResult } from './SimpleTrustResult';
import { getSimpleProductTrustSummary } from '../utils/simpleTrustSummary';

interface NewDecisionViewProps {
  onSaveToJournal: (entry: Omit<DecisionEntry, 'id' | 'userId'>) => Promise<void>;
  onNavigateToJournal: () => void;
}

export const NewDecisionView: React.FC<NewDecisionViewProps> = ({
  onSaveToJournal,
  onNavigateToJournal,
}) => {
  // Input fields
  const [productName, setProductName] = useState('');
  const [sellerBrand, setSellerBrand] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Electronics & Gadgets');
  const [sourceType, setSourceType] = useState('Instagram / TikTok Ad');
  const [advertisedPrice, setAdvertisedPrice] = useState('');
  const [offerText, setOfferText] = useState('');

  // User's pre-purchase expectations
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [expectedQuality, setExpectedQuality] = useState('');
  const [expectedReturnTerms, setExpectedReturnTerms] = useState('');

  // Multimodal Image Upload & Vision Extraction state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState<string>('');
  const [isExtractingImage, setIsExtractingImage] = useState(false);
  const [extractionSummary, setExtractionSummary] = useState<ExtractOfferFromImageResponse | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activeAdPresetId, setActiveAdPresetId] = useState<string | null>(null);
  const [imageNotice, setImageNotice] = useState<string | null>(null);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeOfferResponse | null>(null);
  const [checklistChecks, setChecklistChecks] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Simplified Trust Score summary for consumer clarity
  const trustSummary = React.useMemo(() => {
    if (!analysisResult) return null;
    return getSimpleProductTrustSummary(analysisResult, advertisedPrice, sellerBrand);
  }, [analysisResult, advertisedPrice, sellerBrand]);

  // Quick Preset Samples
  const loadPreset = (type: 'mask' | 'chair' | 'ac') => {
    if (type === 'mask') {
      setProductName("LumaGlow 7-in-1 LED Therapy Mask");
      setSellerBrand("AuraSkin Radiance Co. (Shopify Store)");
      setCategory("Health, Wellness & Beauty");
      setSourceType("Instagram Sponsored Ad");
      setAdvertisedPrice("$49.99 (Marked down from $299.99)");
      setOfferText("⚡ FLASH SALE ENDS IN 14 MINUTES! ⚡ 85% OFF TODAY ONLY! 🌟 As seen on Vogue & TikTok! Clinically proven to erase 10 years of wrinkles, boost collagen by 400%, and eliminate acne overnight with medical-grade NASA wavelengths. Over 45,000 5-star reviews! Warning: High demand, only 3 units remaining in your area. 60-Day 100% Risk-Free Money Back Guarantee!");
      setExpectedDelivery("3-5 business days");
      setExpectedQuality("Medical grade silicone with built-in eye protection");
      setExpectedReturnTerms("60-day full refund if unsatisfied");
    } else if (type === 'chair') {
      setProductName("ErgoFlow Precision Pro Task Chair");
      setSellerBrand("ErgoWork Furnishings Inc.");
      setCategory("Home, Kitchen & Living");
      setSourceType("Official Website");
      setAdvertisedPrice("$389.00");
      setOfferText("Ergonomic office chair with 4D adjustable armrests, synchronized tilt mechanism, dynamic lumbar support, and breathable Korean mesh. BIFMA X5.1 certified for durability up to 300 lbs. 30-day home trial with free return pickups. 10-year manufacturer warranty on cylinder and frame.");
      setExpectedDelivery("5-7 business days via FedEx");
      setExpectedQuality("Heavy aluminum base, silent castors, firm lumbar support");
      setExpectedReturnTerms("30-day in-home trial with prepaid return label");
    } else {
      setProductName("SolarBreeze Mini Desktop Chill Cooler");
      setSellerBrand("EcoTech Innovations");
      setCategory("Electronics & Gadgets");
      setSourceType("Facebook Video Ad");
      setAdvertisedPrice("$69.95 (Reg. $230)");
      setOfferText("❄️ BEAT THE HEAT WAVE! ❄️ Disruptive mini air conditioner that cools any room down by 20°F in under 90 seconds using only $0.05 of electricity a day! 70% Off Today. As endorsed by leading climatologists. Plug-and-play freeze technology with nano-mist filter.");
      setExpectedDelivery("5 business days");
      setExpectedQuality("Chills bedroom by at least 10 degrees quietly");
      setExpectedReturnTerms("30-day refund guarantee");
    }
    setAnalysisResult(null);
    setError(null);
    setSavedSuccess(false);
  };

  // Perform multimodal vision extraction on image base64
  const extractFromDataUrl = async (dataUrl: string, mime: string, name?: string, presetId?: string) => {
    setIsExtractingImage(true);
    setError(null);
    setImageNotice(null);

    try {
      const res = await extractOfferFromImage({
        imageBase64: dataUrl,
        mimeType: mime || 'image/png',
        fileName: name || uploadedImageName,
        presetId: presetId || activeAdPresetId || undefined,
      });

      setExtractionSummary(res);

      // Populate existing analysis fields automatically
      if (res.productName) setProductName(res.productName);
      if (res.sellerBrand) setSellerBrand(res.sellerBrand);
      if (res.category) setCategory(res.category);
      if (res.advertisedPrice) setAdvertisedPrice(res.advertisedPrice);
      if (res.sourceType) setSourceType(res.sourceType);
      if (res.offerText) setOfferText(res.offerText);
      if (res.expectedDelivery) setExpectedDelivery(res.expectedDelivery);
      if (res.expectedQuality) setExpectedQuality(res.expectedQuality);
      if (res.expectedReturnTerms) setExpectedReturnTerms(res.expectedReturnTerms);

      setImageNotice(
        `Extracted visible product claims, price, discounts, and seller info with ${res.extractionEngine || 'Gemini Multimodal AI'}. Analysis fields below have been populated automatically.`
      );
    } catch (err: any) {
      console.error('Multimodal vision extraction error:', err);
      setError(err.message || 'Failed to extract offer details from the image.');
    } finally {
      setIsExtractingImage(false);
    }
  };

  // Process user-uploaded image file
  const handleFileSelect = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP, or SVG).');
      return;
    }

    try {
      const { dataUrl, mimeType } = await optimizeImageForUpload(file);
      setUploadedImage(dataUrl);
      setUploadedImageName(file.name);
      setActiveAdPresetId(null);
      await extractFromDataUrl(dataUrl, mimeType, file.name);
    } catch (err: any) {
      console.error('Image processing failed:', err);
      setError('Could not process the selected image.');
    }
  };

  // Load a realistic sample ad screenshot preset
  const handleSelectAdPreset = async (preset: SampleAdScreenshot) => {
    setActiveAdPresetId(preset.id);
    setUploadedImageName(preset.name);
    setError(null);

    try {
      const pngData = await convertSvgToPngDataUrl(preset.svgDataUri, 450, 600);
      setUploadedImage(pngData);
      const mime = pngData.startsWith('data:image/svg+xml') ? 'image/svg+xml' : 'image/png';
      await extractFromDataUrl(pngData, mime, preset.name, preset.id);
    } catch (err: any) {
      console.error('Preset loading error:', err);
      setUploadedImage(preset.svgDataUri);
      await extractFromDataUrl(preset.svgDataUri, 'image/svg+xml', preset.name, preset.id);
    }
  };

  const handleClearImage = () => {
    setUploadedImage(null);
    setUploadedImageName('');
    setExtractionSummary(null);
    setActiveAdPresetId(null);
    setImageNotice(null);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() && !offerText.trim()) {
      setError('Please provide at least a Product Name or Offer/Ad Copy to analyze.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await analyzeOffer({
        productName,
        sellerBrand,
        category,
        advertisedPrice,
        sourceType,
        offerText,
        userExpectations: {
          delivery: expectedDelivery,
          quality: expectedQuality,
          returnPolicy: expectedReturnTerms,
        }
      });

      setAnalysisResult(res);
      // Initialize checklist state
      const initialChecks: Record<string, boolean> = {};
      res.verificationChecklist?.forEach((q) => {
        initialChecks[q.id] = false;
      });
      setChecklistChecks(initialChecks);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to complete analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveWithStatus = async (status: DecisionStatus) => {
    if (!analysisResult) return;

    setSaving(true);
    setError(null);

    try {
      // Build entry
      const entry: Omit<DecisionEntry, 'id' | 'userId'> = {
        productName: productName || 'Untitled Offer',
        sellerBrand: sellerBrand || 'Unspecified Seller',
        category,
        sourceType,
        rawOfferText: offerText,
        advertisedPrice,
        createdAt: new Date().toISOString(),
        decisionStatus: status,
        imageUrl: uploadedImage || undefined,
        imageThumbnail: uploadedImage || undefined,
        claimsVsEvidence: analysisResult.claimsVsEvidence || [],
        marketingPersuasion: analysisResult.marketingPersuasion,
        supplyChainTransparency: analysisResult.supplyChainTransparency,
        consumerPressureIndex: analysisResult.consumerPressureIndex,
        verificationChecklist: (analysisResult.verificationChecklist || []).map(q => ({
          ...q,
          checked: checklistChecks[q.id] || false,
        })),
        aiAnalysis: analysisResult.aiAnalysis,
        expectedOutcome: {
          priceExpected: advertisedPrice || 'Standard',
          deliveryTimeExpected: expectedDelivery || 'Standard delivery',
          qualityExpected: expectedQuality || 'Standard product quality',
          warrantyPolicyExpected: expectedReturnTerms || 'Standard return terms',
          keyExpectations: [expectedDelivery, expectedQuality, expectedReturnTerms].filter(Boolean),
        }
      };

      await onSaveToJournal(entry);
      setSavedSuccess(true);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save to journal.');
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Title & Purpose Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Pre-Purchase Decision Auditor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Analyze New Product or Offer
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Paste an advertisement, social media offer, or product listing. Gemini will dissect marketing persuasion tactics, unverified claims, supply chain opacity, and calculate the Consumer Pressure Index.
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Try a Realistic Sample Offer:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadPreset('mask')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
            >
              Viral LED Mask
            </button>
            <button
              type="button"
              onClick={() => loadPreset('chair')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors"
            >
              Ergonomic Chair
            </button>
            <button
              type="button"
              onClick={() => loadPreset('ac')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors"
            >
              Mini Eco AC Fan
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleAnalyze} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Multimodal Ad Screenshot Upload & Vision Extraction */}
        <div className="bg-slate-950/80 border border-cyan-900/40 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-300 shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Upload Advertisement or Listing Screenshot</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Multimodal Vision
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Upload an Instagram, TikTok, or shopping listing screenshot to automatically extract claims, prices, discounts, and seller info.
                </p>
              </div>
            </div>

            {uploadedImage && (
              <button
                type="button"
                onClick={handleClearImage}
                className="text-xs text-slate-400 hover:text-rose-300 flex items-center gap-1 transition-colors self-start sm:self-auto"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove image</span>
              </button>
            )}
          </div>

          {/* Upload Dropzone / Image Preview Area */}
          {!uploadedImage ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isDraggingOver 
                  ? 'border-cyan-400 bg-cyan-950/20 scale-[1.005]' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
              }`}
            >
              <input
                id="ad-screenshot-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              
              <div className="flex flex-col items-center justify-center gap-2.5">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                  <Upload className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-200">
                    Drag and drop screenshot here, or{' '}
                    <label
                      htmlFor="ad-screenshot-input"
                      className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                    >
                      browse file
                    </label>
                  </p>
                  <p className="text-xs text-slate-500">
                    Supports PNG, JPG, WEBP, or SVG screenshot from Instagram, TikTok Shop, Amazon, or web ads
                  </p>
                </div>

                {/* Sample Presets to quickly test Vision Extraction */}
                <div className="pt-3 border-t border-slate-800/80 w-full mt-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Or Test With Sample Ad Screenshots (1-Click Multimodal Vision):
                  </span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SAMPLE_AD_SCREENSHOTS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectAdPreset(preset)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                          activeAdPresetId === preset.id
                            ? 'bg-cyan-950 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-900/30'
                            : 'bg-slate-800/90 hover:bg-slate-750 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        <FileImage className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{preset.name.split(':')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                {/* Image Thumbnail */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-slate-950 border border-slate-700/80 shrink-0 flex items-center justify-center p-1">
                  <img
                    src={uploadedImage}
                    alt="Uploaded advertisement"
                    className="w-full h-full object-contain rounded"
                  />
                </div>

                {/* Details & Actions */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {uploadedImageName || 'Advertisement Screenshot'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Loaded
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Image attached to decision. Gemini multimodal vision extracts claims and auto-populates the fields below.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isExtractingImage}
                      onClick={() => extractFromDataUrl(uploadedImage, 'image/png', uploadedImageName)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {isExtractingImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Extracting with Vision...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Re-Extract with Gemini Vision</span>
                        </>
                      )}
                    </button>

                    <label
                      htmlFor="ad-screenshot-input-replace"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                    >
                      Replace Image
                    </label>
                    <input
                      id="ad-screenshot-input-replace"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Extraction State Indicators */}
              {isExtractingImage && (
                <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-xl text-xs text-cyan-200 flex items-center gap-2.5 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                  <span>Gemini Multimodal Vision is reading text, price anchors, discounts, and urgency badges from the image...</span>
                </div>
              )}

              {extractionSummary && (
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Multimodal Vision Extraction Successful</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700 font-mono">
                      {extractionSummary.extractionEngine}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Extracted {extractionSummary.extractedClaimsCount || 0} claims, price info, and marketing tactics. All fields below have been automatically populated. You can review or edit them before running the comprehensive audit.
                  </p>

                  {/* Detected Tactics Chips */}
                  {extractionSummary.detectedTactics && extractionSummary.detectedTactics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {extractionSummary.detectedTactics.map((tactic, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-900 border border-slate-700 text-amber-300"
                        >
                          ⚡ {tactic}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Visual Notes if available */}
                  {extractionSummary.visualObservations && (
                    <p className="text-[11px] text-slate-400 italic">
                      Vision note: {extractionSummary.visualObservations}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Privacy Guarantee Messaging */}
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-start gap-2.5 text-xs text-slate-400">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-300">Privacy & Data Isolation Guarantee:</span>
              <p className="text-[11px] leading-relaxed">
                Uploaded images are used exclusively for this analysis session by server-side Gemini Multimodal Vision. Images are never shared publicly, used for model training, or exposed to other users, and are stored only in your private personal journal if you choose to save this decision.
              </p>
            </div>
          </div>
        </div>

        {/* Form Fields Notice if populated */}
        {imageNotice && (
          <div className="p-3 bg-cyan-950/40 border border-cyan-800/80 rounded-xl text-xs text-cyan-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{imageNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setImageNotice(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Row 1: Product Name, Brand, Category */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Product / Offer Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. LumaGlow 7-in-1 LED Therapy Mask"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Seller / Brand / Storefront
            </label>
            <input
              type="text"
              placeholder="e.g. AuraSkin Co. / TikTok Shop"
              value={sellerBrand}
              onChange={(e) => setSellerBrand(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Product Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="Electronics & Gadgets">Electronics & Gadgets</option>
              <option value="Health, Wellness & Beauty">Health, Wellness & Beauty</option>
              <option value="Clothing & Apparel">Clothing & Apparel</option>
              <option value="Home, Kitchen & Living">Home, Kitchen & Living</option>
              <option value="Software, Apps & Subscriptions">Software, Apps & Subscriptions</option>
              <option value="Fitness & Sports">Fitness & Sports</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Row 2: Price & Channel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Advertised Price & Promotional Framing
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="e.g. $49.99 (was $299 - 85% off today only)"
                value={advertisedPrice}
                onChange={(e) => setAdvertisedPrice(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Discovery Channel / Source
            </label>
            <input
              type="text"
              placeholder="e.g. Instagram Sponsored Reel, Google Search Ad, Email Promo"
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Offer / Ad Copy */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Paste Ad Copy, Claims, or Product Page Description *
            </label>
            <span className="text-[11px] text-slate-500">Include countdowns, discounts, reviews, and guarantee claims</span>
          </div>
          <textarea
            rows={5}
            required
            placeholder="Paste the full advertising text or listing copy here..."
            value={offerText}
            onChange={(e) => setOfferText(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans leading-relaxed"
          />
        </div>

        {/* Pre-Purchase Baseline Expectations (Crucial for Promise-to-Outcome) */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <BookmarkCheck className="w-4 h-4" />
            <span>Pre-Purchase Expectations (Baseline for Outcome Gap)</span>
          </div>
          <p className="text-xs text-slate-400">
            What are you personally expecting based on this offer? Recording this now lets Gemini objectively evaluate whether the seller kept their promise later.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Expected Delivery Timeline
              </label>
              <input
                type="text"
                placeholder="e.g. 3-5 business days"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Expected Material & Quality
              </label>
              <input
                type="text"
                placeholder="e.g. Sturdy medical silicone, durable"
                value={expectedQuality}
                onChange={(e) => setExpectedQuality(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Expected Warranty / Return
              </label>
              <input
                type="text"
                placeholder="e.g. Full refund within 30 days"
                value={expectedReturnTerms}
                onChange={(e) => setExpectedReturnTerms(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Analyze Button */}
        <div>
          <button
            id="analyze-offer-submit-btn"
            type="submit"
            disabled={analyzing}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-xl shadow-cyan-600/20 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Gemini is dissecting claims, persuasion tactics, and supply chain transparency...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Analyze Offer with Gemini</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ANALYSIS RESULTS SECTION */}
      {analysisResult && trustSummary && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          
          {/* SIMPLIFIED CONSUMER TRUST RESULT: 1. Trust Score, 2. What's Wrong, 3. What's Good, 4. Recommendation, 5. See Details */}
          <SimpleTrustResult
            summary={trustSummary}
            productTitle={productName || 'This Product Offer'}
            detailedChildren={
              <div className="space-y-6">
                {/* Consumer Pressure Index Meter */}
                {analysisResult.consumerPressureIndex && (
                  <ConsumerPressureGauge pressure={analysisResult.consumerPressureIndex} size="lg" />
                )}

                {/* AI Executive Summary Card */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    Executive Consumer Protection Brief
                  </span>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {analysisResult.aiAnalysis.executiveSummary}
                  </p>
                  {analysisResult.aiAnalysis.balancedVerdict && (
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                      <strong className="text-slate-100 font-semibold">Balanced Reality Check: </strong>
                      {analysisResult.aiAnalysis.balancedVerdict}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {analysisResult.aiAnalysis.cautionAreas?.length > 0 && (
                      <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl text-xs space-y-1">
                        <span className="font-semibold text-rose-400">Caution Areas:</span>
                        <ul className="list-disc list-inside text-rose-200/90 space-y-0.5">
                          {analysisResult.aiAnalysis.cautionAreas.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysisResult.aiAnalysis.positiveSignals?.length > 0 && (
                      <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-xs space-y-1">
                        <span className="font-semibold text-emerald-400">Positive Signals:</span>
                        <ul className="list-disc list-inside text-emerald-200/90 space-y-0.5">
                          {analysisResult.aiAnalysis.positiveSignals.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* CLAIMS VS EVIDENCE TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        <span>A. Claims vs Verifiable Evidence</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Distinguishing between seller boasts and scientifically/commercially supported evidence.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Extracted Claim</th>
                          <th className="py-2.5 px-3">Classification</th>
                          <th className="py-2.5 px-3">Importance</th>
                          <th className="py-2.5 px-3">Objective Evidence Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                        {analysisResult.claimsVsEvidence?.map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-3 text-slate-200 font-medium max-w-xs">
                              "{c.claim}"
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(c.status)}`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                              {c.importance}
                            </td>
                            <td className="py-3 px-3 text-slate-300 leading-relaxed">
                              {c.notes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MARKETING PERSUASION SIGNALS */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span>B. Marketing Persuasion Tactics Detected</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Psychological leverage designed to bypass deliberate thinking and accelerate checkout.
                    </p>
                  </div>

                  {analysisResult.marketingPersuasion.persuasionSummary && (
                    <p className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 leading-relaxed">
                      {analysisResult.marketingPersuasion.persuasionSummary}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {analysisResult.marketingPersuasion.detectedSignals?.map((sig, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{sig.title}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            sig.severity === 'High' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {sig.severity}
                          </span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">{sig.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SUPPLY CHAIN TRANSPARENCY */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-400" />
                        <span>C. Supply-Chain Transparency Audit</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Origin disclosure, manufacturer accountability, and return logistics clarity.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Transparency Score</span>
                      <span className="text-xl font-bold text-emerald-400">
                        {analysisResult.supplyChainTransparency.transparencyScore}/100
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                    <div>
                      <span className="text-slate-400 block">Identified Seller Entity:</span>
                      <span className="text-slate-200 font-medium">{analysisResult.supplyChainTransparency.sellerIdentified}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Manufacturer / Factory:</span>
                      <span className="text-slate-200 font-medium">{analysisResult.supplyChainTransparency.manufacturerIdentified}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Country of Origin:</span>
                      <span className="text-slate-200 font-medium">{analysisResult.supplyChainTransparency.originCountry}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Delivery Window:</span>
                      <span className="text-slate-200 font-medium">{analysisResult.supplyChainTransparency.deliveryTimeline}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Return & Refund Terms:</span>
                      <span className="text-slate-200 font-medium">{analysisResult.supplyChainTransparency.returnRefundPolicy}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Warranty Details:</span>
                      <span className="text-slate-200 font-medium">{analysisResult.supplyChainTransparency.warrantyDetails}</span>
                    </div>

                    {analysisResult.supplyChainTransparency.missingInformation?.length > 0 && (
                      <div className="sm:col-span-2 md:col-span-3 pt-2.5 border-t border-slate-700/60">
                        <span className="text-amber-400 font-semibold block mb-1">
                          Vital Information Missing From This Offer:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisResult.supplyChainTransparency.missingInformation.map((info, idx) => (
                            <span key={idx} className="bg-slate-900 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700">
                              • {info}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* VERIFICATION CHECKLIST */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-cyan-400" />
                      <span>Pre-Purchase Verification Checklist</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Questions you should check before entering card details. Check them off as you verify.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {analysisResult.verificationChecklist?.map((q) => {
                      const isChecked = checklistChecks[q.id] || false;
                      return (
                        <div 
                          key={q.id}
                          onClick={() => setChecklistChecks(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            isChecked
                              ? 'bg-emerald-950/30 border-emerald-800 text-slate-200'
                              : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600 text-slate-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-600'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5" />}
                          </div>

                          <div className="text-xs space-y-1 flex-1">
                            <p className={`font-semibold ${isChecked ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                              {q.question}
                            </p>
                            <p className="text-slate-400"><strong className="text-slate-300">Why it matters: </strong>{q.reason}</p>
                            <p className="text-cyan-400/90"><strong className="text-cyan-300">How to verify: </strong>{q.howToVerify}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            }
          />

          {/* ACTION BUTTONS: SAVE TO PERSONAL JOURNAL */}
          <div className="bg-slate-900 border border-cyan-800/50 rounded-2xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-emerald-400" />
                <span>Save Decision to Your Personal Journal</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Choose your decision status. If you proceed to purchase, you can record the actual outcome later to generate the original Promise-to-Outcome Gap analysis.
              </p>
            </div>

            {savedSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-emerald-300 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Saved to your personal journal in Firestore!</span>
                </div>
                <button
                  type="button"
                  onClick={onNavigateToJournal}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  View in My Journal →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  type="button"
                  id="save-purchased-btn"
                  onClick={() => handleSaveWithStatus('purchased_pending_outcome')}
                  disabled={saving}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-gradient-to-b from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white shadow-md active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  <ShoppingBag className="w-5 h-5 mb-1.5" />
                  <span className="text-xs font-bold">Purchased This Offer</span>
                  <span className="text-[10px] text-cyan-200 mt-0.5">Awaiting delivery & outcome audit</span>
                </button>

                <button
                  type="button"
                  id="save-researching-btn"
                  onClick={() => handleSaveWithStatus('analyzed')}
                  disabled={saving}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  <BookmarkCheck className="w-5 h-5 mb-1.5 text-cyan-400" />
                  <span className="text-xs font-bold">Just Researching / Saved</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Keep in journal for consideration</span>
                </button>

                <button
                  type="button"
                  id="save-rejected-btn"
                  onClick={() => handleSaveWithStatus('decided_not_to_buy')}
                  disabled={saving}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5 mb-1.5 text-emerald-400" />
                  <span className="text-xs font-bold">Decided Not to Buy</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Recorded as money saved!</span>
                </button>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

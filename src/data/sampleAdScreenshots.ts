export interface SampleAdScreenshot {
  id: string;
  name: string;
  platform: 'Instagram Sponsored Ad' | 'TikTok Shop Listing' | 'Online Store Flash Sale';
  category: string;
  claimedPrice: string;
  sellerBrand: string;
  highlightTactics: string[];
  description: string;
  svgDataUri: string;
}

function createSvgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

export const SAMPLE_AD_SCREENSHOTS: SampleAdScreenshot[] = [
  {
    id: 'insta-lumina-wand',
    name: 'Instagram Ad: Viral 7-in-1 Red Light Therapy Wand',
    platform: 'Instagram Sponsored Ad',
    category: 'Health, Wellness & Beauty',
    claimedPrice: '$49.00 (was $249.00 — 80% OFF)',
    sellerBrand: 'LuminaSkin Labs Direct',
    highlightTactics: ['80% Steep Discount Anchor', '4-Minute Fake Countdown', 'Unverified Dermatologist Claim'],
    description: 'Instagram sponsored ad boasting "clinically proven wrinkle reversal in 7 days", 78,000+ reviews, and steep price anchoring.',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" width="450" height="600" viewBox="0 0 450 600" style="background:#090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Top App Bar / Sponsored header -->
        <rect width="450" height="52" fill="#0f172a"/>
        <circle cx="28" cy="26" r="14" fill="#ec4899"/>
        <text x="50" y="24" fill="#f8fafc" font-size="13" font-weight="700">luminaskin_official</text>
        <text x="50" y="38" fill="#94a3b8" font-size="10">Sponsored • Paid Partnership</text>
        <text x="415" y="30" fill="#94a3b8" font-size="16">•••</text>

        <!-- Product Image Area -->
        <rect y="52" width="450" height="260" fill="#1e1b4b"/>
        <!-- Decorative Glow -->
        <circle cx="225" cy="180" r="90" fill="#f43f5e" opacity="0.25"/>
        <rect x="195" y="90" width="60" height="170" rx="30" fill="#f43f5e"/>
        <circle cx="225" cy="120" r="18" fill="#ffe4e6"/>

        <!-- Urgent Discount Banner Overlay -->
        <rect x="18" y="68" width="170" height="26" rx="6" fill="#dc2626"/>
        <text x="26" y="85" fill="#ffffff" font-size="11" font-weight="800">⚡ FLASH SALE: 80% OFF</text>

        <!-- Countdown Pill Overlay -->
        <rect x="290" y="68" width="142" height="26" rx="6" fill="#000000" opacity="0.85"/>
        <text x="300" y="85" fill="#facc15" font-size="11" font-weight="700">⏳ Ends in 03:44 min</text>

        <!-- Scarcity Badge -->
        <rect x="20" y="270" width="160" height="22" rx="4" fill="#0f172a" opacity="0.9"/>
        <text x="28" y="285" fill="#fb7185" font-size="10" font-weight="700">🔥 Only 3 units remaining</text>

        <!-- Bottom Ad Info / Caption -->
        <rect y="312" width="450" height="288" fill="#0f172a"/>
        
        <!-- CTA Bar -->
        <rect x="18" y="325" width="414" height="42" rx="8" fill="#0284c7"/>
        <text x="32" y="351" fill="#ffffff" font-size="13" font-weight="700">Shop Now • Get 80% Off Today</text>
        <text x="390" y="352" fill="#ffffff" font-size="16">→</text>

        <!-- Headline and Price -->
        <text x="18" y="395" fill="#f8fafc" font-size="16" font-weight="800">LuminaSkin 7-in-1 Clinical Red Light Wand</text>
        
        <text x="18" y="420" fill="#22c55e" font-size="20" font-weight="800">$49.00</text>
        <text x="100" y="420" fill="#64748b" font-size="14" text-decoration="line-through">$249.00</text>
        <rect x="165" y="405" width="68" height="20" rx="4" fill="#15803d"/>
        <text x="173" y="419" fill="#dcfce7" font-size="10" font-weight="700">SAVE $200</text>

        <!-- Social Proof / Star Rating -->
        <text x="18" y="445" fill="#fbbf24" font-size="13">★★★★★</text>
        <text x="80" y="445" fill="#cbd5e1" font-size="11">4.9/5 from 78,420 Verified Reviews</text>

        <!-- Bullets of Claims -->
        <text x="18" y="475" fill="#94a3b8" font-size="11">✓ Clinically proven to erase deep forehead lines in 7 days</text>
        <text x="18" y="495" fill="#94a3b8" font-size="11">✓ Voted #1 Skincare Breakthrough by Top Beauty Editors</text>
        <text x="18" y="515" fill="#94a3b8" font-size="11">✓ 60-Day 100% Risk-Free Money Back Guarantee • Free Express Shipping</text>
        <text x="18" y="535" fill="#64748b" font-size="10">Sold by LuminaSkin Labs Direct • Ships in 24 hours</text>

        <!-- Footer fine print -->
        <line x1="18" y1="550" x2="432" y2="550" stroke="#1e293b"/>
        <text x="18" y="572" fill="#475569" font-size="9">Terms apply. Results based on company consumer perception survey of 32 participants.</text>
      </svg>
    `)
  },
  {
    id: 'tiktok-arctic-cooler',
    name: 'TikTok Shop: ArcticBreeze Ultra Mini AC',
    platform: 'TikTok Shop Listing',
    category: 'Home, Kitchen & Living',
    claimedPrice: '$29.99 (was $159.99 — 81% OFF)',
    sellerBrand: 'TrendGadget Direct Store',
    highlightTactics: ['81% Fake Liquidation Discount', 'Instant Cooling Claim', 'Over 40,000 Units Sold Counter'],
    description: 'TikTok Shop listing promoting a mini USB cooler with claims of "cooling 500 sq ft in 30 seconds" and extreme price reduction.',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" width="450" height="600" viewBox="0 0 450 600" style="background:#090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Header -->
        <rect width="450" height="48" fill="#111827"/>
        <text x="20" y="30" fill="#f43f5e" font-size="15" font-weight="900">TikTok</text>
        <text x="75" y="30" fill="#38bdf8" font-size="15" font-weight="900">Shop</text>
        <rect x="330" y="12" width="100" height="24" rx="12" fill="#be123c"/>
        <text x="345" y="28" fill="#ffffff" font-size="10" font-weight="700">Hot Deals</text>

        <!-- Product Image -->
        <rect y="48" width="450" height="260" fill="#0f172a"/>
        <rect x="150" y="80" width="150" height="150" rx="16" fill="#1e293b" stroke="#0284c7" stroke-width="2"/>
        <circle cx="225" cy="155" r="45" fill="#0284c7" opacity="0.3"/>
        <path d="M210 155 L240 155 M225 140 L225 170" stroke="#38bdf8" stroke-width="3"/>
        
        <!-- Cold air waves -->
        <path d="M110 130 Q130 110 150 130" stroke="#38bdf8" stroke-width="2" fill="none"/>
        <path d="M100 155 Q125 135 150 155" stroke="#38bdf8" stroke-width="2" fill="none"/>
        <path d="M110 180 Q130 160 150 180" stroke="#38bdf8" stroke-width="2" fill="none"/>

        <!-- Floating Tag -->
        <rect x="20" y="65" width="150" height="24" rx="4" fill="#be123c"/>
        <text x="28" y="81" fill="#ffffff" font-size="10" font-weight="800">SUMMER WAREHOUSE CLEARANCE</text>

        <!-- Scarcity banner -->
        <rect x="270" y="270" width="160" height="24" rx="4" fill="#7f1d1d"/>
        <text x="280" y="286" fill="#fecaca" font-size="10" font-weight="700">⚠️ Only 5 units left in stock</text>

        <!-- Listing Content -->
        <rect y="308" width="450" height="292" fill="#0f172a"/>

        <g id="pricing-group">
          <text x="18" y="335" fill="#ef4444" font-size="24" font-weight="900">$29.99</text>
          <text x="115" y="335" fill="#64748b" font-size="15" text-decoration="line-through">$159.99</text>
          <rect x="185" y="318" width="75" height="22" rx="4" fill="#dc2626"/>
          <text x="193" y="333" fill="#ffffff" font-size="11" font-weight="800">-81% OFF</text>
        </g>

        <text x="18" y="365" fill="#f8fafc" font-size="15" font-weight="700">ArcticBreeze Ultra Rapid Room Cooler &amp; Purifier</text>
        <text x="18" y="385" fill="#94a3b8" font-size="11">Seller: TrendGadget Direct Store • 42,590+ Orders in last 7 days</text>

        <rect x="18" y="402" width="414" height="60" rx="8" fill="#1e293b"/>
        <text x="28" y="422" fill="#38bdf8" font-size="11" font-weight="700">❄️ Drops Room Temp by 20°F in 60 Seconds</text>
        <text x="28" y="438" fill="#cbd5e1" font-size="10">• Uses only 5W power • Zero installation • Whisper quiet sleep mode</text>
        <text x="28" y="452" fill="#cbd5e1" font-size="10">• Includes USB-C cable, filter &amp; 1-year replacement warranty</text>

        <text x="18" y="485" fill="#fbbf24" font-size="12">★★★★★</text>
        <text x="75" y="485" fill="#94a3b8" font-size="11">4.8 (12,940 shop reviews) • Free Shipping</text>

        <!-- CTA button -->
        <rect x="18" y="510" width="414" height="46" rx="8" fill="#f43f5e"/>
        <text x="160" y="538" fill="#ffffff" font-size="14" font-weight="800">BUY NOW WITH 1-CLICK</text>
        
        <text x="18" y="580" fill="#475569" font-size="9">Delivery in 3-5 business days. Return policy: 30-day return window (buyer pays return shipping).</text>
      </svg>
    `)
  },
  {
    id: 'store-ortho-cushion',
    name: 'Online Store: OrthoRelief Ergonomic Memory Cushion',
    platform: 'Online Store Flash Sale',
    category: 'Home, Kitchen & Living',
    claimedPrice: '$34.50 (was $89.00 — 61% OFF)',
    sellerBrand: 'OrthoComfort Health Inc.',
    highlightTactics: ['Doctor Recommended Endorsement', '61% Price Cut', '10-Year Warranty Promise'],
    description: 'Shopping website promo featuring orthopedic memory foam cushion claiming instant sciatica cure and 100-night trial.',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" width="450" height="600" viewBox="0 0 450 600" style="background:#090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Top bar -->
        <rect width="450" height="42" fill="#0369a1"/>
        <text x="18" y="26" fill="#ffffff" font-size="12" font-weight="700">🚚 FREE 2-DAY EXPEDITED SHIPPING ON ALL ORDERS TODAY</text>

        <!-- Main Product Area -->
        <rect y="42" width="450" height="230" fill="#0f172a"/>
        <!-- Cushion shape -->
        <rect x="140" y="75" width="170" height="120" rx="28" fill="#334155" stroke="#38bdf8" stroke-width="2"/>
        <circle cx="225" cy="135" r="22" fill="#0f172a"/>

        <!-- Trust badges -->
        <rect x="20" y="55" width="130" height="22" rx="4" fill="#15803d"/>
        <text x="26" y="70" fill="#ffffff" font-size="10" font-weight="700">🩺 CHIROPRACTOR BACKED</text>

        <rect x="300" y="55" width="130" height="22" rx="4" fill="#1e293b"/>
        <text x="308" y="70" fill="#38bdf8" font-size="10" font-weight="700">⭐ 100-NIGHT TRIAL</text>

        <!-- Body Section -->
        <rect y="272" width="450" height="328" fill="#090d16"/>
        <text x="18" y="302" fill="#f8fafc" font-size="17" font-weight="800">OrthoRelief All-Day Memory Foam Seat Cushion</text>
        <text x="18" y="322" fill="#94a3b8" font-size="11">Brand: OrthoComfort Health Inc. • Model: Pro-Ergo Gen 3</text>

        <text x="18" y="354" fill="#0ea5e9" font-size="22" font-weight="900">$34.50</text>
        <text x="110" y="354" fill="#64748b" font-size="15" text-decoration="line-through">$89.00</text>
        <rect x="180" y="338" width="80" height="22" rx="4" fill="#0284c7"/>
        <text x="188" y="353" fill="#ffffff" font-size="10" font-weight="700">SAVE $54.50</text>

        <!-- Claim items -->
        <rect x="18" y="375" width="414" height="96" rx="8" fill="#1e293b"/>
        <text x="30" y="398" fill="#f8fafc" font-size="11" font-weight="600">Key Features &amp; Medical Claims:</text>
        <text x="30" y="418" fill="#cbd5e1" font-size="10">• High-density aerospace memory foam that never flattens (10-Year Guarantee)</text>
        <text x="30" y="434" fill="#cbd5e1" font-size="10">• Relieves tailbone pressure, lower back sciatica, and improves posture instantly</text>
        <text x="30" y="450" fill="#cbd5e1" font-size="10">• Removable washable cooling bamboo cover with non-slip rubber bottom</text>

        <!-- Guarantee and Return -->
        <text x="18" y="495" fill="#22c55e" font-size="11" font-weight="700">✓ 100-Night Risk-Free Money Back Trial • Free Returns</text>
        <text x="18" y="512" fill="#94a3b8" font-size="10">Expected Delivery: 2-3 business days via FedEx Home Delivery</text>

        <!-- Add to cart -->
        <rect x="18" y="528" width="414" height="44" rx="8" fill="#0284c7"/>
        <text x="160" y="555" fill="#ffffff" font-size="13" font-weight="700">CLAIM 61% DISCOUNT NOW</text>
      </svg>
    `)
  }
];

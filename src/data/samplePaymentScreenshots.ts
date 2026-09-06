export interface SampleScreenshotPreset {
  id: string;
  name: string;
  category: string;
  claimedAmount: string;
  counterparty: string;
  riskHint: 'High Risk' | 'Medium Risk' | 'Low Risk';
  description: string;
  svgDataUri: string;
}

// Generate realistic SVG mock receipts encoded as data URLs
function createSvgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

export const SAMPLE_SCREENSHOT_PRESETS: SampleScreenshotPreset[] = [
  {
    id: 'sample-upi-tampered',
    name: 'UPI Receipt with Mismatched Font & Missing UTR',
    category: 'Marketplace Electronics',
    claimedAmount: '₹14,999.00',
    counterparty: 'Amit Sharma (Buyer)',
    riskHint: 'High Risk',
    description: 'Suspicious typography around amount digits, missing official 12-digit UTR bank reference, and urgent release banner.',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="650" viewBox="0 0 400 650" style="background:#0f172a; font-family: sans-serif;">
        <!-- Status Bar -->
        <rect width="400" height="28" fill="#090d16"/>
        <text x="20" y="19" fill="#94a3b8" font-size="11" font-weight="600">09:41 AM</text>
        <text x="340" y="19" fill="#94a3b8" font-size="11">5G 92%</text>

        <!-- Top Header -->
        <rect y="28" width="400" height="60" fill="#1e293b"/>
        <text x="24" y="64" fill="#38bdf8" font-size="16" font-weight="700">QuickPay UPI</text>
        <text x="310" y="64" fill="#94a3b8" font-size="12">HELP</text>

        <!-- Success Tick -->
        <circle cx="200" cy="140" r="32" fill="#10b981"/>
        <path d="M188 140 L196 148 L214 130" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round"/>

        <!-- Inconsistent Font Amount (tampered look) -->
        <text x="200" y="200" fill="#ffffff" font-size="28" font-weight="bold" text-anchor="middle" font-family="Courier, monospace">₹ 14,999.00</text>
        <rect x="110" y="215" width="180" height="22" rx="4" fill="#047857"/>
        <text x="200" y="230" fill="#d1fae5" font-size="11" font-weight="bold" text-anchor="middle">Payment Completed</text>

        <!-- Transaction Details Card -->
        <rect x="24" y="260" width="352" height="240" rx="12" fill="#1e293b" stroke="#334155"/>
        
        <text x="44" y="295" fill="#94a3b8" font-size="12">To</text>
        <text x="44" y="315" fill="#f8fafc" font-size="14" font-weight="600">Merchant Store Electronics</text>
        <text x="44" y="332" fill="#64748b" font-size="11">merchant@okhdfcbank</text>

        <line x1="44" y1="345" x2="356" y2="345" stroke="#334155" stroke-dasharray="4"/>

        <text x="44" y="375" fill="#94a3b8" font-size="12">From</text>
        <text x="44" y="395" fill="#f8fafc" font-size="14" font-weight="600">Amit Sharma</text>
        <text x="44" y="412" fill="#64748b" font-size="11">State Bank of India (***3310)</text>

        <line x1="44" y1="425" x2="356" y2="425" stroke="#334155" stroke-dasharray="4"/>

        <text x="44" y="455" fill="#f43f5e" font-size="11" font-weight="bold">UTR / Ref No: [NOT PROVIDED / HIDDEN]</text>
        <text x="44" y="475" fill="#94a3b8" font-size="11">Timestamp: 05 Sep 2026, 09:40:12 AM</text>

        <!-- Urgency Banner (suspicious) -->
        <rect x="24" y="520" width="352" height="50" rx="8" fill="#7f1d1d" stroke="#b91c1c"/>
        <text x="200" y="542" fill="#fecaca" font-size="11" font-weight="bold" text-anchor="middle">⚠️ SHOW SCREEN TO SELLER TO DISPATCH NOW</text>
        <text x="200" y="558" fill="#fca5a5" font-size="10" text-anchor="middle">Payment is guaranteed under buyer instant protection</text>

        <!-- Bottom action bar -->
        <rect y="590" width="400" height="60" fill="#0f172a"/>
        <rect x="30" y="602" width="340" height="38" rx="8" fill="#334155"/>
        <text x="200" y="626" fill="#f8fafc" font-size="12" font-weight="600" text-anchor="middle">Share Screenshot</text>
      </svg>
    `)
  },
  {
    id: 'sample-delayed-transfer',
    name: 'Scheduled / Processing Transfer Passed as Completed',
    category: 'Freelance Service',
    claimedAmount: '$850.00',
    counterparty: 'David K. (Client)',
    riskHint: 'High Risk',
    description: 'Status badge indicates "Processing / Scheduled for Delivery" rather than terminal settled funds.',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="650" viewBox="0 0 400 650" style="background:#18181b; font-family: sans-serif;">
        <!-- Status Bar -->
        <rect width="400" height="28" fill="#09090b"/>
        <text x="20" y="19" fill="#a1a1aa" font-size="11" font-weight="600">14:22</text>
        <text x="350" y="19" fill="#a1a1aa" font-size="11">LTE 85%</text>

        <!-- Top Header -->
        <text x="200" y="65" fill="#f4f4f5" font-size="15" font-weight="600" text-anchor="middle">Transfer Confirmation</text>

        <!-- Amber Processing Icon -->
        <circle cx="200" cy="130" r="30" fill="#d97706"/>
        <path d="M190 130 L200 120 L210 130 M200 120 L200 145" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/>

        <!-- Amount -->
        <text x="200" y="195" fill="#ffffff" font-size="28" font-weight="bold" text-anchor="middle">$850.00 USD</text>
        
        <!-- Ambiguous Status Chip -->
        <rect x="120" y="212" width="160" height="24" rx="12" fill="#451a03" stroke="#b45309"/>
        <text x="200" y="228" fill="#fde68a" font-size="11" font-weight="600" text-anchor="middle">Processing (Hold Period)</text>

        <!-- Receipt Box -->
        <rect x="24" y="255" width="352" height="230" rx="12" fill="#27272a" stroke="#3f3f46"/>

        <text x="44" y="290" fill="#a1a1aa" font-size="11">Recipient</text>
        <text x="44" y="310" fill="#fafafa" font-size="13" font-weight="600">Alex Miller (Freelance Retainer)</text>

        <text x="44" y="345" fill="#a1a1aa" font-size="11">Estimated Settlement</text>
        <text x="44" y="365" fill="#f59e0b" font-size="13" font-weight="600">Pending verification (Up to 48 hrs)</text>

        <text x="44" y="400" fill="#a1a1aa" font-size="11">Reference Code</text>
        <text x="44" y="420" fill="#fafafa" font-size="13" font-family="monospace">TRX-HOLD-992384</text>

        <text x="44" y="455" fill="#a1a1aa" font-size="11">Payment Method</text>
        <text x="44" y="475" fill="#fafafa" font-size="13">Linked Checking (...7712)</text>

        <!-- Warning Callout -->
        <rect x="24" y="505" width="352" height="60" rx="8" fill="#27272a" stroke="#eab308"/>
        <text x="44" y="530" fill="#fde047" font-size="11" font-weight="bold">Note on Pending Status:</text>
        <text x="44" y="548" fill="#e4e4e7" font-size="10">Funds have not left the sender account and may be cancelled.</text>

        <rect x="24" y="585" width="352" height="42" rx="8" fill="#3f3f46"/>
        <text x="200" y="611" fill="#ffffff" font-size="12" font-weight="600" text-anchor="middle">Download PDF Summary</text>
      </svg>
    `)
  },
  {
    id: 'sample-standard-clean',
    name: 'Standard Clean Direct Bank Transfer Receipt',
    category: 'Commercial Consulting',
    claimedAmount: '$2,100.00',
    counterparty: 'Nexus Systems LLC',
    riskHint: 'Low Risk',
    description: 'Native banking layout with valid transaction ID, timestamp, and settled status. Always verify in your bank app.',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="650" viewBox="0 0 400 650" style="background:#09090b; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
        <!-- Status Bar -->
        <rect width="400" height="28" fill="#000000"/>
        <text x="20" y="19" fill="#71717a" font-size="11" font-weight="600">11:05 AM</text>
        <text x="340" y="19" fill="#71717a" font-size="11">WiFi 100%</text>

        <!-- Bank Brand Header -->
        <rect y="28" width="400" height="55" fill="#18181b"/>
        <text x="24" y="61" fill="#3b82f6" font-size="15" font-weight="bold">CHASE MOBILE®</text>
        <text x="320" y="61" fill="#a1a1aa" font-size="12">Done</text>

        <!-- Checkmark -->
        <circle cx="200" cy="135" r="28" fill="#16a34a"/>
        <path d="M190 135 L197 142 L212 127" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round"/>

        <!-- Title & Amount -->
        <text x="200" y="190" fill="#a1a1aa" font-size="12" text-anchor="middle">Transfer Succeeded</text>
        <text x="200" y="222" fill="#ffffff" font-size="30" font-weight="bold" text-anchor="middle">$2,100.00</text>

        <!-- Receipt Details Table -->
        <rect x="20" y="250" width="360" height="300" rx="12" fill="#18181b" stroke="#27272a"/>

        <text x="40" y="285" fill="#71717a" font-size="11">TO</text>
        <text x="40" y="303" fill="#ffffff" font-size="13" font-weight="600">Design Studio Account (...9012)</text>

        <text x="40" y="340" fill="#71717a" font-size="11">FROM</text>
        <text x="40" y="358" fill="#ffffff" font-size="13" font-weight="600">Nexus Systems LLC (...4410)</text>

        <text x="40" y="395" fill="#71717a" font-size="11">TRANSACTION NUMBER</text>
        <text x="40" y="413" fill="#38bdf8" font-size="13" font-family="monospace">CH-99201948271</text>

        <text x="40" y="450" fill="#71717a" font-size="11">DATE &amp; TIME</text>
        <text x="40" y="468" fill="#ffffff" font-size="13">September 5, 2026 at 11:04 AM EDT</text>

        <text x="40" y="505" fill="#71717a" font-size="11">TRANSFER TYPE</text>
        <text x="40" y="523" fill="#ffffff" font-size="13">Real-time Zelle® Payment</text>

        <!-- Footer Note -->
        <text x="200" y="580" fill="#71717a" font-size="11" text-anchor="middle">Funds sent to recipient's registered financial institution.</text>
        <text x="200" y="598" fill="#52525b" font-size="10" text-anchor="middle">Reference record for personal accounting.</text>
      </svg>
    `)
  }
];

import {
  db,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy
} from '../lib/firebase';
import type { PaymentCheckEntry, PaymentVerificationStatus } from '../types';

export const SAMPLE_PAYMENT_CHECKS: Omit<PaymentCheckEntry, 'id' | 'userId'>[] = [
  {
    title: 'Marketplace Buyer Smartphone Payment Confirmation',
    counterpartyName: 'Rahul Verma (@rahul_v98)',
    claimedAmount: '₹18,500.00',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    verificationStatus: 'unverified_pending',
    analysis: {
      riskLevel: 'HIGH RISK',
      riskSummary: 'The screenshot displays an ambiguous transaction status ("Processing / Scheduled") while the buyer claims immediate settlement. Furthermore, critical interbank UTR reference numbers are truncated, and the font used for the numerical amount appears slightly irregular.',
      riskReasons: [
        'Payment status is in an unsettled "Processing" state rather than completed clearance.',
        '12-digit UTR / UPI transaction reference number is missing or truncated.',
        'Buyer is demanding immediate dispatch of electronics prior to receiver account verification.'
      ],
      extractedDetails: {
        paymentAmount: '₹18,500.00',
        dateTime: 'Today, 2:15 PM',
        transactionId: 'UPI/REF/--TRUNCATED--',
        paymentStatus: 'Processing / Scheduled for Release',
        senderInfo: 'Rahul Verma (Axis Bank)',
        receiverInfo: 'Seller Store VPA',
        paymentApp: 'UPI Payment App',
        otherDetails: [
          'Banner: "Scheduled payout - hand over item to carrier"',
          'Device battery: 42%, WiFi connected',
          'Notice: Image contains high-urgency call to action'
        ]
      },
      warningSignals: [
        {
          category: 'inconsistent_status',
          title: 'Unsettled / Scheduled Payment Status',
          description: 'The status chip displays "Processing" rather than terminal confirmation like "Paid Successfully". Scheduled payments can be cancelled before settlement.',
          severity: 'High'
        },
        {
          category: 'missing_info',
          title: 'Missing Official 12-Digit UTR ID',
          description: 'No valid Bank Reference Number / UTR is present to reconcile inside the banking portal.',
          severity: 'High'
        },
        {
          category: 'pressure_tactics',
          title: 'Urgency to Release Goods',
          description: 'Receipt includes custom text advising merchant to release merchandise before bank confirmation.',
          severity: 'High'
        },
        {
          category: 'unusual_formatting',
          title: 'Typography & Boundary Discrepancies',
          description: 'The font kerning around the amount figures exhibits uneven pixel density compared to native app renders.',
          severity: 'Medium'
        }
      ],
      verificationChecklist: [
        {
          id: 'step-1',
          step: 'Check the actual bank/UPI transaction history',
          instruction: 'Open your official banking app or UPI app directly on your phone, rather than reviewing the sender\'s shared image.',
          checked: false
        },
        {
          id: 'step-2',
          step: 'Confirm the money was actually credited',
          instruction: 'Look at your settled account balance and recent credit entries to guarantee funds have cleared.',
          checked: false
        },
        {
          id: 'step-3',
          step: 'Match the amount',
          instruction: 'Verify the exact credited amount matches what was claimed without deductions or discrepancies.',
          checked: false
        },
        {
          id: 'step-4',
          step: 'Match the transaction/reference ID',
          instruction: 'Cross-reference the 12-digit UTR, Bank Ref No., or Transaction ID between your bank statement and the receipt.',
          checked: false
        },
        {
          id: 'step-5',
          step: 'Check the date and time',
          instruction: 'Confirm the transaction timestamp corresponds to the claimed payment time window.',
          checked: false
        },
        {
          id: 'step-6',
          step: 'Do not rely only on the sender\'s screenshot',
          instruction: 'Never release goods, ship packages, or provide refunds based solely on an image proof.',
          checked: false
        }
      ],
      prominentWarning: 'A payment screenshot cannot confirm that money was actually received. Verify the transaction in your own bank or UPI transaction history before releasing goods, services, refunds, or personal information.',
      verdictDisclaimer: 'This analysis identifies visual risk signals and missing transaction markers. It is an automated risk assessment and does not constitute conclusive proof of fraud or payment validity.'
    }
  },
  {
    title: 'Freelance Design Invoice Payment Receipt',
    counterpartyName: 'Apex Digital Studio (Zelle/Bank Wire)',
    claimedAmount: '$1,250.00',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // Yesterday
    verificationStatus: 'verified_in_bank',
    bankVerifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    verificationNotes: 'Reconciled in Chase banking app. Funds settled and available in checking account.',
    analysis: {
      riskLevel: 'LOW RISK',
      riskSummary: 'The screenshot exhibits visual and typographic consistency with standard banking receipt layouts. All expected transaction fields including reference number, timestamp, and account masking are present with no visual splicing detected.',
      riskReasons: [
        'Formatting, fonts, and icons strictly match official mobile banking interface guidelines.',
        'Complete 10-digit transaction confirmation number and clear timestamp are visible.',
        'No manipulative urgency banners or conflicting statuses detected in the layout.'
      ],
      extractedDetails: {
        paymentAmount: '$1,250.00',
        dateTime: 'Yesterday, 10:45 AM EDT',
        transactionId: 'ZL-9823419084',
        paymentStatus: 'Payment Sent & Completed',
        senderInfo: 'Apex Digital Studio LLC (Checking ...4829)',
        receiverInfo: 'Freelancer Business Account (...1043)',
        paymentApp: 'Direct Bank Zelle Transfer',
        otherDetails: [
          'Memo: Invoice #TL-2026-08',
          'Confirmation code format: Standard alphanumeric',
          'Transfer speed: Instant'
        ]
      },
      warningSignals: [
        {
          category: 'missing_info',
          title: 'Visual Proof Still Requires Settlement Confirmation',
          description: 'While the image appears clean and properly formatted, digital screenshots can be duplicated. Always verify fund arrival in your own account.',
          severity: 'Low'
        }
      ],
      verificationChecklist: [
        {
          id: 'step-1',
          step: 'Check the actual bank/UPI transaction history',
          instruction: 'Open your official banking app or UPI app directly on your phone, rather than reviewing the sender\'s shared image.',
          checked: true
        },
        {
          id: 'step-2',
          step: 'Confirm the money was actually credited',
          instruction: 'Look at your settled account balance and recent credit entries to guarantee funds have cleared.',
          checked: true
        },
        {
          id: 'step-3',
          step: 'Match the amount',
          instruction: 'Verify the exact credited amount matches what was claimed without deductions or discrepancies.',
          checked: true
        },
        {
          id: 'step-4',
          step: 'Match the transaction/reference ID',
          instruction: 'Cross-reference the 12-digit UTR, Bank Ref No., or Transaction ID between your bank statement and the receipt.',
          checked: true
        },
        {
          id: 'step-5',
          step: 'Check the date and time',
          instruction: 'Confirm the transaction timestamp corresponds to the claimed payment time window.',
          checked: true
        },
        {
          id: 'step-6',
          step: 'Do not rely only on the sender\'s screenshot',
          instruction: 'Never release goods, ship packages, or provide refunds based solely on an image proof.',
          checked: true
        }
      ],
      prominentWarning: 'A payment screenshot cannot confirm that money was actually received. Verify the transaction in your own bank or UPI transaction history before releasing goods, services, refunds, or personal information.',
      verdictDisclaimer: 'This analysis identifies visual risk signals and missing transaction markers. It is an automated risk assessment and does not constitute conclusive proof of fraud or payment validity.'
    }
  },
  {
    title: 'Consulting Fee Advance Transfer Receipt',
    counterpartyName: 'Global Ventures Partner',
    claimedAmount: '$3,400.00',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(), // 2 days ago
    verificationStatus: 'unverified_pending',
    analysis: {
      riskLevel: 'MEDIUM RISK',
      riskSummary: 'The screenshot contains compression artifacts around the beneficiary account line and lacks an interbank wire tracking reference. A manual bank history audit is required before acknowledging receipt.',
      riskReasons: [
        'Interbank wire sequence code is absent from the transfer summary slip.',
        'Slight compression blur localized exclusively around the recipient account text line.'
      ],
      extractedDetails: {
        paymentAmount: '$3,400.00',
        dateTime: '2 days ago, 4:12 PM',
        transactionId: 'WIRE-PENDING-REF',
        paymentStatus: 'Submitted for Processing',
        senderInfo: 'Global Ventures Holdings',
        receiverInfo: 'Consulting Retainer Account',
        paymentApp: 'Commercial Web Banking Portal',
        otherDetails: [
          'Value date: Next business day',
          'Routing code: Unverified regional transit code'
        ]
      },
      warningSignals: [
        {
          category: 'missing_info',
          title: 'Lacks End-to-End Interbank Clearance ID',
          description: 'The slip indicates the wire instruction was submitted, but does not provide an interbank Fedwire / SWIFT IMAD confirmation.',
          severity: 'Medium'
        },
        {
          category: 'editing_signs',
          title: 'Localized Image Compression Anomaly',
          description: 'Pixel artifact density around the account number field differs slightly from adjacent interface labels.',
          severity: 'Medium'
        }
      ],
      verificationChecklist: [
        {
          id: 'step-1',
          step: 'Check the actual bank/UPI transaction history',
          instruction: 'Open your official banking app or UPI app directly on your phone, rather than reviewing the sender\'s shared image.',
          checked: false
        },
        {
          id: 'step-2',
          step: 'Confirm the money was actually credited',
          instruction: 'Look at your settled account balance and recent credit entries to guarantee funds have cleared.',
          checked: false
        },
        {
          id: 'step-3',
          step: 'Match the amount',
          instruction: 'Verify the exact credited amount matches what was claimed without deductions or discrepancies.',
          checked: false
        },
        {
          id: 'step-4',
          step: 'Match the transaction/reference ID',
          instruction: 'Cross-reference the 12-digit UTR, Bank Ref No., or Transaction ID between your bank statement and the receipt.',
          checked: false
        },
        {
          id: 'step-5',
          step: 'Check the date and time',
          instruction: 'Confirm the transaction timestamp corresponds to the claimed payment time window.',
          checked: false
        },
        {
          id: 'step-6',
          step: 'Do not rely only on the sender\'s screenshot',
          instruction: 'Never release goods, ship packages, or provide refunds based solely on an image proof.',
          checked: false
        }
      ],
      prominentWarning: 'A payment screenshot cannot confirm that money was actually received. Verify the transaction in your own bank or UPI transaction history before releasing goods, services, refunds, or personal information.',
      verdictDisclaimer: 'This analysis identifies visual risk signals and missing transaction markers. It is an automated risk assessment and does not constitute conclusive proof of fraud or payment validity.'
    }
  }
];

export async function fetchUserPaymentChecks(userId: string): Promise<PaymentCheckEntry[]> {
  try {
    const checksRef = collection(db, 'users', userId, 'paymentChecks');
    const q = query(checksRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const results: PaymentCheckEntry[] = [];
    snapshot.forEach((docSnap) => {
      results.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as PaymentCheckEntry);
    });

    return results;
  } catch (error) {
    console.error('Error fetching payment checks from Firestore:', error);
    // Fallback to local storage if offline or permissions pending
    const localData = localStorage.getItem(`trustloop_payment_checks_${userId}`);
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch (e) {
        return [];
      }
    }
    return [];
  }
}

export async function savePaymentCheck(
  userId: string,
  entry: Omit<PaymentCheckEntry, 'id' | 'userId' | 'createdAt'> & { createdAt?: string }
): Promise<PaymentCheckEntry> {
  const newId = `paychk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const fullEntry: PaymentCheckEntry = {
    ...entry,
    id: newId,
    userId,
    createdAt: entry.createdAt || new Date().toISOString(),
  };

  try {
    const docRef = doc(db, 'users', userId, 'paymentChecks', newId);
    await setDoc(docRef, fullEntry);
  } catch (error) {
    console.warn('Could not write payment check directly to Firestore (saving locally):', error);
  }

  // Backup to localStorage
  try {
    const localData = localStorage.getItem(`trustloop_payment_checks_${userId}`);
    const list: PaymentCheckEntry[] = localData ? JSON.parse(localData) : [];
    list.unshift(fullEntry);
    localStorage.setItem(`trustloop_payment_checks_${userId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Local backup failed:', e);
  }

  return fullEntry;
}

export async function updatePaymentCheck(
  userId: string,
  checkId: string,
  updates: Partial<PaymentCheckEntry>
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'paymentChecks', checkId);
    await setDoc(docRef, updates, { merge: true });
  } catch (error) {
    console.warn('Could not update payment check in Firestore (updating locally):', error);
  }

  try {
    const localData = localStorage.getItem(`trustloop_payment_checks_${userId}`);
    if (localData) {
      const list: PaymentCheckEntry[] = JSON.parse(localData);
      const idx = list.findIndex((item) => item.id === checkId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem(`trustloop_payment_checks_${userId}`, JSON.stringify(list));
      }
    }
  } catch (e) {
    console.error('Local payment check update backup failed:', e);
  }
}

export async function deletePaymentCheck(userId: string, checkId: string): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'paymentChecks', checkId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Could not delete payment check from Firestore:', error);
  }

  try {
    const localData = localStorage.getItem(`trustloop_payment_checks_${userId}`);
    if (localData) {
      let list: PaymentCheckEntry[] = JSON.parse(localData);
      list = list.filter((item) => item.id !== checkId);
      localStorage.setItem(`trustloop_payment_checks_${userId}`, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Local delete failed:', e);
  }
}

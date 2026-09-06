import type { DecisionEntry } from '../types';

export const SAMPLE_DECISIONS: Omit<DecisionEntry, 'id' | 'userId'>[] = [
  {
    productName: "LumaGlow 7-in-1 LED Therapy Youth Mask",
    sellerBrand: "AuraSkin Radiance Co. (Shopify Store)",
    category: "Health, Wellness & Beauty",
    sourceType: "Instagram Sponsored Ad",
    rawOfferText: "⚡ FLASH SALE ENDS IN 14 MINUTES! ⚡ 85% OFF TODAY ONLY! 🌟 As seen on Vogue & TikTok! Clinically proven to erase 10 years of wrinkles, boost collagen by 400%, and eliminate acne overnight with medical-grade NASA wavelengths. Over 45,000 5-star reviews! Warning: High demand, only 3 units remaining in your area. 60-Day 100% Risk-Free Money Back Guarantee!",
    advertisedPrice: "$49.99 (Marked down from $299.99)",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    outcomeDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    decisionStatus: "outcome_recorded",
    expectedOutcome: {
      priceExpected: "$49.99 free shipping",
      deliveryTimeExpected: "3 to 5 business days",
      qualityExpected: "Solid medical-grade silicone mask with multiple light frequencies and USB controller",
      warrantyPolicyExpected: "60-day hassle-free full refund if unsatisfied",
      keyExpectations: [
        "Noticeable skin smoothing within 2 weeks",
        "Safe eye protection shields built-in",
        "Quick customer support response"
      ]
    },
    claimsVsEvidence: [
      {
        claim: "Boosts collagen by 400% and erases 10 years of wrinkles overnight",
        status: "Missing evidence",
        notes: "No clinical trial identifiers, sample size, or peer-reviewed dermatological studies cited.",
        importance: "High"
      },
      {
        claim: "Medical-grade NASA wavelengths",
        status: "Unverified",
        notes: "Generic invocation of 'NASA technology' without diode wavelength spectrum (e.g. 633nm / 830nm) or optical power density data.",
        importance: "High"
      },
      {
        claim: "Over 45,000 5-star reviews",
        status: "Unverified",
        notes: "Domain registration was created 3 months ago; mathematical improbability of 45k verified sales.",
        importance: "Medium"
      },
      {
        claim: "60-Day 100% Risk-Free Guarantee",
        status: "Partially supported",
        notes: "Return policy exists in footer, but fine print states buyer must pay return shipping to an overseas warehouse with 25% restocking fee.",
        importance: "High"
      }
    ],
    marketingPersuasion: {
      pressureScore: 92,
      detectedSignals: [
        {
          type: "urgency",
          title: "Artificial 14-Minute Countdown Timer",
          explanation: "Script resets upon page refresh to fabricate deadline panic.",
          severity: "High"
        },
        {
          type: "scarcity",
          title: "Simulated Local Stock Depletion",
          explanation: "Claims 'only 3 units left in your area' via IP geolocation lookups.",
          severity: "High"
        },
        {
          type: "price_anchoring",
          title: "Extreme 85% Price Markdown",
          explanation: "Fabricated $299.99 baseline anchor makes $49.99 appear deeply discounted.",
          severity: "High"
        },
        {
          type: "authority",
          title: "Ungrounded NASA & Vogue Associations",
          explanation: "Logos used without licensing verification or editorial endorsement.",
          severity: "Medium"
        }
      ],
      persuasionSummary: "Deploys a classic rapid-fire impulse stack: extreme artificial scarcity, simulated countdowns, and hyperbolic medical claims designed to prompt purchase before researching return terms."
    },
    supplyChainTransparency: {
      sellerIdentified: "Generic Delaware LLC shell name; no physical office address listed",
      manufacturerIdentified: "Undisclosed; white-label direct-import from Shenzhen",
      originCountry: "China",
      warrantyDetails: "No explicit warranty beyond the disputed 60-day return window",
      returnRefundPolicy: "Returns require unsealed original packaging and return shipping paid to Guangzhou, China",
      deliveryTimeline: "Promised 3-5 days; standard ePacket international transit usually takes 14-25 days",
      certifications: ["CE mark pictured, but no verification certificate number"],
      missingInformation: [
        "Wavelength nanometer specifications (nm)",
        "Optical irradiance power (mW/cm²)",
        "Registered manufacturer entity",
        "Clear domestic return address"
      ],
      transparencyScore: 28
    },
    consumerPressureIndex: {
      score: 92,
      level: "Severe",
      rationale: "Extreme marketing pressure combining reset timers, artificial stock alerts, and unsupported clinical claims.",
      keyDrivers: [
        "14-Minute Countdown Reset",
        "Simulated Regional Stock Shortage",
        "85% Anchor Discount Framing",
        "Hyperbolic Overnight Wrinkle Boast"
      ]
    },
    verificationChecklist: [
      {
        id: "v1",
        question: "Does the countdown timer persist after opening an incognito browser window?",
        reason: "Proves artificial pressure designed to bypass thoughtful decision-making.",
        howToVerify: "Open link in private/incognito mode to test timer persistence."
      },
      {
        id: "v2",
        question: "What is the physical return address in the store's Refund Policy fine print?",
        reason: "Drop-shippers frequently require $30+ international return postage on a $50 item.",
        howToVerify: "Check the Refund Policy page for the exact return destination."
      },
      {
        id: "v3",
        question: "Are the LEDs certified for safe ocular exposure (eye shields)?",
        reason: "Low-cost high-intensity blue light diodes can cause retinal strain without proper filtering.",
        howToVerify: "Look for IEC 62471 photobiological safety testing documentation."
      }
    ],
    aiAnalysis: {
      executiveSummary: "This offer exhibits textbook high-pressure direct-response marketing. While red LED phototherapy has legitimate dermatological backing, this specific unit is an unbranded white-label device with heavily inflated marketing claims and obscure return logistics.",
      balancedVerdict: "High likelihood of receiving an operational low-power LED mask, but zero probability of '400% collagen overnight'. Customer support and refund execution are severe risk zones.",
      cautionAreas: [
        "Overly complex return terms requiring international postage",
        "Exaggerated clinical claims with no medical certification",
        "High Consumer Pressure Index (92/100)"
      ],
      positiveSignals: [
        "Price point is relatively low if treated purely as an entry-level novelty mask"
      ],
      recommendedAction: "High Risk - Reconsider"
    },
    actualOutcome: {
      recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      actualPricePaid: "$62.45 ($49.99 + unexpected $12.46 'handling & insurance' at checkout)",
      deliveryExperience: "Arrived in 21 days with crumpled packaging, despite 3-5 day advertised window.",
      deliveryDaysActual: 21,
      productQualityRating: 2,
      productQualityNotes: "Flimsy plastic mask. Only 3 light colors work, power cord is very short, and straps pull hair. No eye protection shields included.",
      sellerExperienceRating: 1,
      sellerExperienceNotes: "Support email auto-responded stating returns require sending the package back to Shenzhen at buyer's cost ($38 postage). Decided not to return.",
      returnRefundExperience: "Return effectively blocked by exorbitant return shipping overhead.",
      claimsFulfilledSummary: "It lights up, but build quality is poor and claims of overnight transformation were completely false.",
      unexpectedProblems: [
        "Surprise $12.46 handling fee added during final 1-click checkout",
        "Delivery delayed by 16 extra days",
        "International return shipping cost 60% of item price",
        "Lack of eye shields makes usage uncomfortable"
      ],
      overallSatisfactionRating: 1,
      gapAnalysis: {
        overallGap: "Major Failure / Misleading",
        fulfillmentScore: 22,
        whatMatched: [
          "The item functions as an illuminated LED facial mask with colored diodes."
        ],
        whatDidNotMatch: [
          "Delivery took 21 days instead of advertised 3-5 days.",
          "Hidden $12.46 handling fee charged at final payment step.",
          "Material quality was cheap lightweight plastic rather than medical-grade silicone.",
          "Return policy proved economically unfeasible due to mandatory overseas postage."
        ],
        misleadingOrUnsupportedClaims: [
          "Overnight 400% collagen regeneration (unsubstantiated marketing fiction)",
          "100% Risk-Free Guarantee (negated by fine-print shipping restrictions)",
          "Over 45,000 verified reviews (synthetic testimonials)"
        ],
        missingPrePurchaseInfo: [
          "Hidden handling fee added after credit card entry",
          "Lack of domestic return center address",
          "Absence of certified eye safety shields"
        ],
        lessonsLearned: [
          "Always test checkout total before confirming payment to catch hidden fees.",
          "Never rely on a money-back guarantee without checking the return warehouse location.",
          "Treat artificial countdown timers and regional stock counters as immediate red flags."
        ],
        verdictSummary: "The outcome revealed a severe Promise-to-Outcome gap (22% fulfillment score). The seller leveraged manipulative urgency and exaggerated medical claims, followed by hidden checkout fees and an obstructive return process."
      }
    }
  },
  {
    productName: "ErgoFlow Precision Pro Task Chair",
    sellerBrand: "ErgoWork Furnishings",
    category: "Home, Kitchen & Living",
    sourceType: "Official Manufacturer Website",
    rawOfferText: "Ergonomic office chair with 4D adjustable armrests, synchronized tilt mechanism, dynamic lumbar support, and breathable Korean mesh. BIFMA X5.1 certified for durability up to 300 lbs. 30-day home trial with free return pickups. 10-year manufacturer warranty on cylinder and frame.",
    advertisedPrice: "$389.00 (Standard retail)",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    outcomeDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    decisionStatus: "outcome_recorded",
    expectedOutcome: {
      priceExpected: "$389.00 with free ground shipping",
      deliveryTimeExpected: "5 to 7 business days via FedEx",
      qualityExpected: "Heavy-duty aluminum wheelbase, firm responsive mesh, and quiet castors",
      warrantyPolicyExpected: "10-year written warranty with free domestic replacement parts",
      keyExpectations: [
        "Relief for lower back strain during 8-hour desk work",
        "Clear assembly instructions and included hex key",
        "Responsive phone or chat support"
      ]
    },
    claimsVsEvidence: [
      {
        claim: "BIFMA X5.1 Certified for commercial grade durability",
        status: "Supported",
        notes: "Testing certificate number provided with downloadable lab PDF report.",
        importance: "High"
      },
      {
        claim: "10-Year manufacturer warranty on cylinder and frame",
        status: "Supported",
        notes: "Detailed warranty policy clearly posted with step-by-step claims procedure.",
        importance: "High"
      },
      {
        claim: "30-Day home trial with free domestic return pickup",
        status: "Supported",
        notes: "Clear domestic return logistics via prepaid FedEx label.",
        importance: "High"
      }
    ],
    marketingPersuasion: {
      pressureScore: 18,
      detectedSignals: [
        {
          type: "price_anchoring",
          title: "Market Segment Reference",
          explanation: "Notes competitive chairs retail for $800+, positioning $389 as value-oriented.",
          severity: "Low"
        }
      ],
      persuasionSummary: "Extremely low pressure. Focuses on verifiable engineering specifications, industrial certifications, and clear return policies."
    },
    supplyChainTransparency: {
      sellerIdentified: "ErgoWork Furnishings Inc., registered in Portland, OR with physical showroom",
      manufacturerIdentified: "Partner factory in Taichung, Taiwan specializing in BIFMA seating",
      originCountry: "Taiwan",
      warrantyDetails: "10-year warranty covering frame, gas cylinder, and tilt mechanism",
      returnRefundPolicy: "30-day in-home trial with prepaid return label and no restocking deductions",
      deliveryTimeline: "Ships within 48 hours via FedEx Ground; 5-7 business days",
      certifications: ["ANSI/BIFMA X5.1-2017", "GREENGUARD Gold Certified for low VOC emissions"],
      missingInformation: [
        "Fabric stain resistance rating"
      ],
      transparencyScore: 92
    },
    consumerPressureIndex: {
      score: 18,
      level: "Low",
      rationale: "Factual, specifications-driven offer with zero artificial urgency or misleading stock timers.",
      keyDrivers: [
        "Clear BIFMA Engineering Certifications",
        "Prepaid Domestic Trial Terms",
        "Transparent Origin & Warranty Terms"
      ]
    },
    verificationChecklist: [
      {
        id: "v1",
        question: "Does the manufacturer provide replacement gas cylinders after warranty?",
        reason: "Ensures longevity beyond the 10-year window.",
        howToVerify: "Check the parts & accessories section on the website."
      }
    ],
    aiAnalysis: {
      executiveSummary: "A transparent, high-integrity consumer offer. Verifiable engineering standards, clear corporate identity, and legitimate post-purchase protection.",
      balancedVerdict: "Represents a benchmark in consumer-respectful marketing with minimal manipulative pressure.",
      cautionAreas: [
        "Self-assembly required; verify assembly tool requirements"
      ],
      positiveSignals: [
        "BIFMA testing documentation available",
        "Clear 10-year warranty terms",
        "Prepaid domestic return shipping"
      ],
      recommendedAction: "Looks Transparent"
    },
    actualOutcome: {
      recordedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      actualPricePaid: "$389.00 (Free shipping, zero hidden fees)",
      deliveryExperience: "Arrived in 6 business days via FedEx with tracking updates.",
      deliveryDaysActual: 6,
      productQualityRating: 5,
      productQualityNotes: "Substantial build quality, solid aluminum base, silent castors, and excellent lumbar support.",
      sellerExperienceRating: 5,
      sellerExperienceNotes: "Emailed support to ask about armrest width adjustment; received helpful diagram within 3 hours.",
      returnRefundExperience: "Did not return; completely satisfied with purchase.",
      claimsFulfilledSummary: "Every claim regarding ergonomic adjustability, BIFMA durability, and build quality held true in daily use.",
      unexpectedProblems: [],
      overallSatisfactionRating: 5,
      gapAnalysis: {
        overallGap: "Matched Expectations",
        fulfillmentScore: 96,
        whatMatched: [
          "Delivered in exactly 6 days as promised.",
          "Solid commercial-grade construction and supportive mesh.",
          "Transparent pricing with no surprise charges.",
          "High responsiveness from customer service."
        ],
        whatDidNotMatch: [
          "Assembly took 35 minutes instead of advertised 15 minutes."
        ],
        misleadingOrUnsupportedClaims: [],
        missingPrePurchaseInfo: [
          "Assembly requires a little extra leverage for the seat pan screws."
        ],
        lessonsLearned: [
          "High supply-chain transparency and verifiable third-party certifications (BIFMA) strongly correlate with positive real-world outcomes.",
          "Brands that do not employ artificial urgency tend to invest more in post-purchase customer satisfaction."
        ],
        verdictSummary: "The purchase closely mirrored all pre-purchase promises with an outstanding 96% fulfillment score. Verifiable transparency upfront led to dependable satisfaction."
      }
    }
  },
  {
    productName: "SolarBreeze Portable Eco AC & Humidifier",
    sellerBrand: "EcoTech Innovators",
    category: "Electronics & Gadgets",
    sourceType: "Facebook Feed Video Ad",
    rawOfferText: "❄️ BEAT THE HEAT WAVE! ❄️ Disruptive mini air conditioner that cools any room down by 20°F in under 90 seconds using only $0.05 of electricity a day! 70% Off Today. As endorsed by leading climatologists. Plug-and-play freeze technology with nano-mist filter.",
    advertisedPrice: "$69.95 (Regularly $230)",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    decisionStatus: "purchased_pending_outcome",
    expectedOutcome: {
      priceExpected: "$69.95",
      deliveryTimeExpected: "5 to 8 business days",
      qualityExpected: "Compact evaporative cooler that noticeably chills desk space",
      warrantyPolicyExpected: "1-year warranty",
      keyExpectations: [
        "Cool down home office bedroom by at least 10 degrees",
        "Quiet fan operation while taking calls"
      ]
    },
    claimsVsEvidence: [
      {
        claim: "Cools any room down by 20°F in under 90 seconds",
        status: "Missing evidence",
        notes: "Physically impossible for a USB-powered desktop water-evaporation fan to drop ambient room temperatures by 20°F without a compressor and exterior exhaust.",
        importance: "High"
      },
      {
        claim: "Endorsed by leading climatologists",
        status: "Missing evidence",
        notes: "No names, academic institutions, or citations provided.",
        importance: "Medium"
      }
    ],
    marketingPersuasion: {
      pressureScore: 84,
      detectedSignals: [
        {
          type: "urgency",
          title: "Heat Wave Fear Appeal",
          explanation: "Leverages seasonal weather anxiety and impending blackout fears.",
          severity: "High"
        },
        {
          type: "price_anchoring",
          title: "70% Mark Down Anchor",
          explanation: "Anchors to $230 baseline for what is essentially a small USB fan with a water reservoir.",
          severity: "High"
        }
      ],
      persuasionSummary: "Capitalizes on weather anxiety and exaggerated thermodynamic claims to drive impulse sales."
    },
    supplyChainTransparency: {
      sellerIdentified: "Virtual office address in Cyprus; customer service email only",
      manufacturerIdentified: "Undisclosed OEM",
      originCountry: "China",
      warrantyDetails: "Requires contacting support within 14 days of delivery",
      returnRefundPolicy: "30-day window, but customer pays international postage",
      deliveryTimeline: "Estimated 7-14 business days",
      certifications: [],
      missingInformation: [
        "BTU cooling capacity rating",
        "Decibel noise level specifications",
        "Registered corporation entity"
      ],
      transparencyScore: 35
    },
    consumerPressureIndex: {
      score: 84,
      level: "Severe",
      rationale: "Deploys seasonal climate fear and thermodynamically impossible promises to push rapid checkout.",
      keyDrivers: [
        "Unrealistic 20°F Drop in 90 Seconds",
        "Seasonal Heat Wave Anxiety",
        "70% Fake Price Anchor"
      ]
    },
    verificationChecklist: [
      {
        id: "v1",
        question: "Does this device contain a refrigeration compressor or just a water sponge with a fan?",
        reason: "Evaporative swamp coolers raise indoor humidity and cannot cool a closed room without an exhaust hose.",
        howToVerify: "Check power draw (USB 5V vs standard 115V AC compressor requirement)."
      }
    ],
    aiAnalysis: {
      executiveSummary: "A seasonal gadget leveraging heat-wave anxiety. The product is a desktop evaporative cooler, not a true air conditioner.",
      balancedVerdict: "Will blow slightly cool damp air directly in front of your face if filled with ice, but cannot cool a room by 20°F. High probability of expectation mismatch.",
      cautionAreas: [
        "Thermodynamically unfeasible cooling claims",
        "High Consumer Pressure Index (84/100)"
      ],
      positiveSignals: [
        "Low power consumption is technically true because it is just a 5W USB fan"
      ],
      recommendedAction: "High Risk - Reconsider"
    }
  }
];

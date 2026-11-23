import type { ProductCandidate } from '../engine/unitEconomics';
import type { AdTelemetryInput } from '../engine/adDecisionEngine';

export interface ProductVariant {
  id: string;
  label: string;
  swatchHex: string;
  inStock: boolean;
}

export interface BundleTier {
  qty: 1 | 2 | 3;
  label: string;
  discountPct: number;
  note: string;
}

export interface FreeGiftItem {
  id: string;
  name: string;
  retailValue: number;
  detail: string;
}

export interface ProductReview {
  id: string;
  author: string;
  role: string;
  rating: 4 | 5;
  date: string;
  headline: string;
  body: string;
  verifiedVariant: string;
}

export interface StoreProduct {
  id: string;
  sku: string;
  slug: string;
  name: string;
  hookTitle: string;
  category: string;
  price: number;
  compareAtPrice: number;
  landedCogs: number;
  weightKg: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  shortSubtitle: string;
  bullets: string[];
  variants: ProductVariant[];
  bundles: BundleTier[];
  freeGifts: FreeGiftItem[];
  toggleAddOn: {
    id: string;
    name: string;
    regularPrice: number;
    offerPrice: number;
    description: string;
  };
  mechanismHeadline: string;
  mechanismBody: string;
  routineHeadline: string;
  routineBody: string;
  day1Outcome: string;
  day30Outcome: string;
  surveyStats: { pct: number; label: string }[];
  specs: string;
  howToUse: string;
  adPainPoint: string;
  adVillain: string;
  adMechanism: string;
  defaultAvatar: string;
  seoFocusKeyword: string;
  seoMetaDescription: string;
}

export interface SeoGuideArticle {
  id: string;
  slug: string;
  title: string;
  targetKeyword: string;
  monthlySearchVolume: number;
  cpcEquivalent: number;
  readMinutes: number;
  publishedDate: string;
  summary: string;
  featuredProductId: string;
  sections: { heading: string; body: string }[];
  faqs: { question: string; answer: string }[];
}

export interface AdCampaignRecord {
  id: string;
  name: string;
  productId: string;
  avatar: string;
  angle: string;
  dailyBudget: number;
  telemetry: AdTelemetryInput;
}

export interface FulfillmentOrder {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  quantity: number;
  retailTotal: number;
  landedCogs: number;
  allocatedCpa: number;
  carrier: string;
  trackingCode: string;
  daysWithoutScan: number;
  promisedWindow: string;
  sourceChannel: 'Meta Broad CBO' | 'TikTok Smart+' | 'Organic SEO Guide' | 'Direct Storefront';
}

export interface SupplierNode {
  id: string;
  name: string;
  role: 'Primary' | 'Backup 1' | 'Backup 2';
  location: string;
  shippingLine: string;
  dispatchHours: number;
  avgTransitDays: number;
  defectiveRatePct: number;
  landedCogsToRetailPct: number;
  storeRating: number;
  bufferUnits: number;
}

export const INITIAL_PRODUCTS: StoreProduct[] = [
  {
    id: 'kova-pulse-pro',
    sku: 'KV-PULSE-PRO-01',
    slug: 'heated-cervical-traction-pillow',
    name: 'Kova Pulse Pro',
    hookTitle: 'Kova Pulse Pro — Heated Cervical Relief in 15 Minutes',
    category: 'Cervical Recovery',
    price: 89.0,
    compareAtPrice: 139.0,
    landedCogs: 20.0,
    weightKg: 0.68,
    rating: 4.9,
    reviewCount: 1428,
    imageUrl: '/src/assets/images/hero_cervical_relief_1795379203320.jpg',
    shortSubtitle:
      'Dual-zone graphene heat and 26-degree ergonomic traction engineered to decompress daily desk and sleep neck tension.',
    bullets: [
      '26-degree orthopedic C-curve decompresses stiff cervical joints naturally',
      '3-stage graphene warmth (104°F–122°F) boosts circulation within 90 seconds',
      'Washable knit charcoal cover fits inside a carry-on or bedside drawer',
      '15-minute auto-shutoff timer with zero straps, cords, or clinic appointments',
    ],
    variants: [
      { id: 'charcoal', label: 'Graphite Charcoal', swatchHex: '#27272A', inStock: true },
      { id: 'slate', label: 'Nordic Slate', swatchHex: '#475569', inStock: true },
      { id: 'stone', label: 'Mineral Stone', swatchHex: '#94A3B8', inStock: true },
    ],
    bundles: [
      { qty: 1, label: '1x Single Unit', discountPct: 0, note: 'Includes 2 Free Gifts' },
      { qty: 2, label: '2x Double Pack', discountPct: 20, note: 'Most Popular · Save 20%' },
      { qty: 3, label: '3x Family Recovery Set', discountPct: 28, note: 'Best Value · Save 28%' },
    ],
    freeGifts: [
      {
        id: 'gift-usb-c',
        name: 'Braided 2m USB-C Power Cable',
        retailValue: 14.0,
        detail: 'Unbundled in-box accessory included free at Tier 1',
      },
      {
        id: 'gift-pdf-guide',
        name: '15-Min Cervical Mobility Protocol (PDF)',
        retailValue: 19.0,
        detail: 'Instant digital recovery guide emailed on checkout',
      },
    ],
    toggleAddOn: {
      id: 'addon-extra-cover',
      name: 'Extra Antimicrobial Washable Knit Cover',
      regularPrice: 28.0,
      offerPrice: 14.0,
      description: '50% off when bundled today — keep a fresh cover ready on laundry days.',
    },
    mechanismHeadline: 'Precision 26-degree traction meets controlled graphene heat.',
    mechanismBody:
      'Ordinary memory foam pillows collapse flat under the weight of your skull, locking your upper spine in forward-head posture all night. Kova Pulse Pro cradles the occipital ridge at an anatomically calibrated 26-degree arc while gentle radiant heat softens tight suboccipital fascia in 15 minutes.',
    routineHeadline: 'Built for desk workers, side sleepers, and frequent travelers.',
    routineBody:
      'Set Kova Pulse Pro on your bed or floor before sleep, dial your preferred warmth with the anodized aluminum knob, and unwind for 15 minutes. No noisy vibration motors, no bulky inflatable collars, and zero assembly.',
    day1Outcome:
      'Immediate warm suboccipital release and noticeably lighter shoulder posture after your first 15-minute evening session.',
    day30Outcome:
      'Sustained morning neck mobility, deeper uninterrupted sleep cycles, and reduced end-of-day desk tension.',
    surveyStats: [
      { pct: 94, label: 'Felt measurable neck tension relief in Week 1' },
      { pct: 91, label: 'Reported easier morning mobility by Day 30' },
      { pct: 96, label: 'Preferred it over flat memory foam pillows' },
    ],
    specs:
      'Dimensions: 24 × 19 × 11.5 cm (shoebox-compact) · Weight: 680g · Core: High-density CertiPUR rebound foam · Heating element: 5V USB-C carbon-graphene sheet with 15-min thermal cutoff.',
    howToUse:
      '1. Connect the included braided USB-C cable. 2. Turn the brushed aluminum side dial to Low, Medium, or Deep Warmth. 3. Rest the base of your skull in the contoured cradle for 10–15 minutes each evening.',
    adPainPoint: 'stiff neck and evening desk headaches',
    adVillain: 'flat memory foam pillows that collapse after 30 days',
    adMechanism: '26-degree contoured cervical decompression with 3-stage graphene heat',
    defaultAvatar: 'remote professionals spending 8+ hours at dual monitors',
    seoFocusKeyword: 'Heated Cervical Traction Pillow',
    seoMetaDescription:
      'Relieve neck stiffness in 15 minutes daily with the Kova Pulse Pro heated cervical traction pillow. Ships free in 3–5 business days with a 30-day guarantee.',
  },
  {
    id: 'kova-drift-mask',
    sku: 'KV-DRIFT-MASK-02',
    slug: 'contoured-bluetooth-sleep-audio-mask',
    name: 'Kova Drift Mask',
    hookTitle: 'Kova Drift — Zero-Pressure Blackout Sleep Audio Mask',
    category: 'Sleep Hardware',
    price: 58.0,
    compareAtPrice: 89.0,
    landedCogs: 13.5,
    weightKg: 0.14,
    rating: 4.8,
    reviewCount: 892,
    imageUrl: '/src/assets/images/product_sleep_mask_1795379203793.jpg',
    shortSubtitle:
      'Ultra-thin 4mm side-sleeper acoustic drivers inside a deep 3D zero-eyelash-pressure blackout knit shell.',
    bullets: [
      'Deep molded eye cavities allow full REM blinking with zero lash friction',
      '4mm flat acoustic speakers stay comfortable even for strict side sleepers',
      '14-hour continuous battery life outlasts red-eye flights and full nights',
      '100% nose-bridge blackout seal blocks streetlamps and early sunrise',
    ],
    variants: [
      { id: 'slate-knit', label: 'Slate Knit', swatchHex: '#334155', inStock: true },
      { id: 'obsidian', label: 'Obsidian Black', swatchHex: '#111315', inStock: true },
    ],
    bundles: [
      { qty: 1, label: '1x Single Mask', discountPct: 0, note: 'Includes 2 Free Gifts' },
      { qty: 2, label: '2x Partner Sleep Set', discountPct: 20, note: 'Most Popular · Save 20%' },
      { qty: 3, label: '3x Travel & Home Pack', discountPct: 28, note: 'Best Value · Save 28%' },
    ],
    freeGifts: [
      {
        id: 'gift-travel-pouch',
        name: 'Breathable Mesh Travel Pouch',
        retailValue: 12.0,
        detail: 'Included free at Tier 1',
      },
      {
        id: 'gift-brown-noise',
        name: 'Deep Sleep Acoustic Frequency Library',
        retailValue: 15.0,
        detail: 'Instant digital download link included',
      },
    ],
    toggleAddOn: {
      id: 'addon-silk-liner',
      name: 'Cooling Mulberry Replacement Liner',
      regularPrice: 22.0,
      offerPrice: 11.0,
      description: '50% off today — snap-in washable liner for humid summer nights.',
    },
    mechanismHeadline: 'True total darkness without hard earbuds digging into your ears.',
    mechanismBody:
      'In-ear wireless buds cause painful ear-canal pressure for side sleepers within 45 minutes. Kova Drift embeds featherweight 4mm transducer discs inside breathable acoustic knit so you hear brown noise or podcasts clearly without feeling hardware against your pillow.',
    routineHeadline: 'Engineered for shift workers, light sleepers, and frequent flyers.',
    routineBody:
      'Pair via Bluetooth 5.3 in two seconds, adjust the micro-velcro strap without tangling hair, and fall asleep to uninterrupted audio through 14 hours of runtime.',
    day1Outcome:
      'Complete ambient light elimination and pressure-free side-sleeping audio on night one.',
    day30Outcome:
      'Faster sleep-onset latency and consistent deep sleep across hotels, flights, and bright summer mornings.',
    surveyStats: [
      { pct: 95, label: 'Reported zero ear pain while side sleeping' },
      { pct: 92, label: 'Blocked 100% of morning bedroom light' },
      { pct: 94, label: 'Fell asleep faster using audio masking' },
    ],
    specs:
      'Weight: 140g · Connectivity: Bluetooth 5.3 · Battery: 14h playback, 90-min USB-C fast charge · Washable removable speaker core.',
    howToUse:
      '1. Hold the matte aluminum side button for 2 seconds to pair. 2. Align the 4mm flat drivers over your ears inside the pocket. 3. Set your phone sleep timer and rest.',
    adPainPoint: 'ear pain from sleeping with hard wireless earbuds',
    adVillain: 'bulky plastic earbuds and flat light-leaking sleep masks',
    adMechanism: '4mm flat side-sleeper acoustic drivers inside a 3D zero-pressure blackout shell',
    defaultAvatar: 'light side-sleepers who fall asleep to podcasts or brown noise',
    seoFocusKeyword: 'Bluetooth Sleep Mask for Side Sleepers',
    seoMetaDescription:
      'Sleep comfortably on your side with the Kova Drift contoured blackout Bluetooth sleep mask. 4mm flat speakers, 14-hour battery, free 3–5 day shipping.',
  },
  {
    id: 'kova-arc-mount',
    sku: 'KV-ARC-MOUNT-03',
    slug: 'aluminum-desk-cup-holder-headphone-hanger',
    name: 'Kova Arc 2-in-1 Mount',
    hookTitle: 'Kova Arc — Machined Aluminum Cup & Headphone Desk Clamp',
    category: 'Desk Ergonomics',
    price: 49.0,
    compareAtPrice: 74.0,
    landedCogs: 10.5,
    weightKg: 0.42,
    rating: 4.9,
    reviewCount: 641,
    imageUrl: '/src/assets/images/product_desk_clamp_1795379203386.jpg',
    shortSubtitle:
      'CNC-anodized aluminum clamp that moves hot coffee off your desk surface and suspends studio headphones safely below.',
    bullets: [
      'Spill-proof recessed aluminum ring holds mugs, tumblers, and 32oz bottles',
      '360-degree rotating silicone-padded arm protects leather headphone headbands',
      'Tool-free tension knob fits wood, glass, or standing desks (10mm–52mm)',
      'Non-marking neoprene clamp pads leave zero scratches on oak or veneer',
    ],
    variants: [
      { id: 'matte-black', label: 'Matte Anodized Black', swatchHex: '#18181B', inStock: true },
      { id: 'space-silver', label: 'Bead-Blasted Silver', swatchHex: '#CBD5E1', inStock: true },
    ],
    bundles: [
      { qty: 1, label: '1x Desk Mount', discountPct: 0, note: 'Includes 2 Free Gifts' },
      { qty: 2, label: '2x Dual Workstation Pack', discountPct: 20, note: 'Most Popular · Save 20%' },
      { qty: 3, label: '3x Studio Team Set', discountPct: 25, note: 'Best Value · Save 25%' },
    ],
    freeGifts: [
      {
        id: 'gift-cable-clip',
        name: 'Magnetic Under-Desk Cable Organizer',
        retailValue: 11.0,
        detail: 'Included free at Tier 1',
      },
      {
        id: 'gift-coaster',
        name: 'Removable Silicone Anti-Rattle Coaster',
        retailValue: 9.0,
        detail: 'Pre-fitted inside aluminum cup well',
      },
    ],
    toggleAddOn: {
      id: 'addon-desk-tray',
      name: 'Clip-On Aluminum Dongle & Pen Tray',
      regularPrice: 24.0,
      offerPrice: 12.0,
      description: '50% off today — locks onto the clamp spine for adapters and keys.',
    },
    mechanismHeadline: 'One spilled mug ruins a $2,400 workstation.',
    mechanismBody:
      'Plastic desk clips snap under heavy stainless tumblers and leave harsh clamp dents on solid wood desks. Kova Arc is machined from 6061 aluminum alloy with dual silicone grip pads, isolating beverages outside your keyboard zone while keeping headphones within arm’s reach.',
    routineHeadline: 'Mounts in 15 seconds with zero drilling or adhesive.',
    routineBody:
      'Slide Kova Arc onto any desk edge up to 52mm thick, tighten the knurled thumb screw, and reclaim clean desk space immediately.',
    day1Outcome:
      'Zero accidental coffee knocks near keyboards and clutter-free headphone storage in 15 seconds.',
    day30Outcome:
      'Cleaner studio ergonomics with rock-solid stability across sit-stand desk transitions.',
    surveyStats: [
      { pct: 97, label: 'Confirmed zero wobble on standing desks' },
      { pct: 95, label: 'Reported zero marks on hardwood surfaces' },
      { pct: 93, label: 'Reclaimed desk space for larger mousepads' },
    ],
    specs:
      'Material: 6061-T6 Anodized Aluminum · Weight: 420g · Clamp range: 10mm–52mm · Load capacity: 5.0 kg.',
    howToUse:
      '1. Loosen the lower tension knob to match desk thickness. 2. Slide cleanly onto desk edge and hand-tighten. 3. Rotate the headphone arm inward when not in use.',
    adPainPoint: 'spilling coffee near expensive laptops and tangled desk headphones',
    adVillain: 'flimsy plastic clip-on holders that snap and scratch wood desks',
    adMechanism: '6061 anodized aluminum clamp with spill-proof mug ring and 360° headphone arm',
    defaultAvatar: 'software engineers, audio editors, and gamers with clean desk setups',
    seoFocusKeyword: 'Aluminum Desk Cup Holder Headphone Hanger',
    seoMetaDescription:
      'Protect your keyboard and declutter your workspace with the Kova Arc 2-in-1 anodized aluminum desk cup holder and headphone hanger. Free 3–5 day shipping.',
  },
  {
    id: 'kova-hush-earplugs',
    sku: 'KV-HUSH-ACOUSTIC-04',
    slug: 'precision-acoustic-filter-earplugs',
    name: 'Kova Hush Earplugs',
    hookTitle: 'Kova Hush — Titanium Acoustic Filter Earplugs (-21dB)',
    category: 'Acoustic Focus',
    price: 44.0,
    compareAtPrice: 64.0,
    landedCogs: 8.5,
    weightKg: 0.05,
    rating: 4.9,
    reviewCount: 1104,
    imageUrl: '/src/assets/images/product_earplugs_1795379203282.jpg',
    shortSubtitle:
      'Precision-milled titanium mesh filters reduce harsh volume by 21dB while preserving crisp speech and concert clarity.',
    bullets: [
      'Flat-attenuation acoustic mesh lowers volume evenly without muffled sound',
      'Machined dark titanium housing with 4 medical-grade silicone tip sizes (XS–L)',
      'Waterproof knurled aluminum keychain pod keeps pairs clean everywhere',
      'Ultra-light 30g parcel ships fast with zero batteries or charging needed',
    ],
    variants: [
      { id: 'dark-titanium', label: 'Dark Titanium', swatchHex: '#3F3F46', inStock: true },
      { id: 'brushed-silver', label: 'Brushed Titanium', swatchHex: '#A1A1AA', inStock: true },
    ],
    bundles: [
      { qty: 1, label: '1x Single Pair + Pod', discountPct: 0, note: 'Includes 2 Free Gifts' },
      { qty: 2, label: '2x Concert & Focus Duo', discountPct: 20, note: 'Most Popular · Save 20%' },
      { qty: 3, label: '3x Group Pack', discountPct: 28, note: 'Best Value · Save 28%' },
    ],
    freeGifts: [
      {
        id: 'gift-tip-kit',
        name: '4-Size Silicone Ear Tip Fit Kit (XS–L)',
        retailValue: 12.0,
        detail: 'Unbundled fit kit included free at Tier 1',
      },
      {
        id: 'gift-aluminum-pod',
        name: 'Waterproof Knurled Aluminum Carry Pod',
        retailValue: 16.0,
        detail: 'Machined pocket canister included free',
      },
    ],
    toggleAddOn: {
      id: 'addon-mute-inserts',
      name: '+6dB Deep-Sleep Silicone Mute Rings',
      regularPrice: 18.0,
      offerPrice: 9.0,
      description: '50% off today — boost attenuation to -27dB for snoring or flights.',
    },
    mechanismHeadline: 'Lower the decibels, keep the fidelity.',
    mechanismBody:
      'Disposable orange foam plugs muffle high frequencies, making concerts sound underwater and conversations impossible. Kova Hush routes sound through a calibrated micro-perforated titanium acoustic channel that drops peak noise by 21dB across every frequency equally.',
    routineHeadline: 'From live music festivals to loud open-plan offices.',
    routineBody:
      'Twist in your matched silicone tip size in 3 seconds, protect your ears from post-concert ringing, and store cleanly inside the O-ring sealed aluminum pod.',
    day1Outcome:
      'Zero post-concert ear ringing and calmer concentration in noisy cafes or flights immediately.',
    day30Outcome:
      'Protected long-term hearing clarity and effortless daily sensory control in crowded environments.',
    surveyStats: [
      { pct: 96, label: 'Heard clear conversation while cutting background roar' },
      { pct: 94, label: 'Reported zero ear ringing after live concerts' },
      { pct: 92, label: 'Found their ideal seal with the 4-size tip kit' },
    ],
    specs:
      'Attenuation: SNR 21dB (27dB with Mute Ring) · Body: Grade 5 Titanium · Weight: 50g total with aluminum canister.',
    howToUse:
      '1. Select your snug silicone tip size (XS, S, M, or L). 2. Gently insert and twist backward until flush. 3. Rinse silicone tips with warm water after use.',
    adPainPoint: 'post-concert ringing ears and sensory overload in noisy spaces',
    adVillain: 'disposable foam earplugs that muffle music and fall out',
    adMechanism: 'flat-attenuation titanium acoustic mesh reducing volume 21dB without distortion',
    defaultAvatar: 'live music fans, commuters, and open-office professionals',
    seoFocusKeyword: 'High Fidelity Acoustic Filter Earplugs',
    seoMetaDescription:
      'Protect your hearing without muffled audio using Kova Hush titanium acoustic filter earplugs (-21dB). Includes aluminum pod and free 3–5 day shipping.',
  },
];

export const PRODUCT_REVIEWS: Record<string, ProductReview[]> = {
  'kova-pulse-pro': [
    {
      id: 'rev-1',
      author: 'Marcus Delgado',
      role: 'Principal Systems Architect, Austin TX',
      rating: 5,
      date: 'November 14, 2026',
      headline: 'At first I thought a heated pillow was hype, actually retired my $220 foam pillow',
      body: 'At first I thought a contoured heated traction pillow was another desk-worker gadget, but actually 15 minutes at medium warmth completely unlocked the stiffness at the base of my skull by Day 4. The aluminum dial feels solid and it fits cleanly on my nightstand.',
      verifiedVariant: 'Graphite Charcoal · 2x Double Pack',
    },
    {
      id: 'rev-2',
      author: 'Hannah Lindholm',
      role: 'Pediatric Physical Therapist, Seattle WA',
      rating: 5,
      date: 'November 9, 2026',
      headline: 'Accurate 26-degree cervical arc without aggressive pull',
      body: 'Most consumer traction devices push too hard on the upper spine. This hits a gentle natural decompression angle and the radiant graphene warmth relaxes tight trapezius muscles before stretching. Ordered a second unit for my husband.',
      verifiedVariant: 'Nordic Slate · 2x Double Pack',
    },
    {
      id: 'rev-3',
      author: 'Devon Patel',
      role: 'Product Designer, Chicago IL',
      rating: 4,
      date: 'November 2, 2026',
      headline: 'Takes 2 evenings to get used to the firmness, worth every dollar',
      body: 'At first I thought the rebound density felt firmer than expected on night one, but actually by night three my neck stopped waking up sore after long Figma sprints. Giving 4 stars only because I wish the USB-C cord were angled 90 degrees.',
      verifiedVariant: 'Graphite Charcoal · 1x Single Unit',
    },
  ],
  'kova-drift-mask': [
    {
      id: 'rev-4',
      author: 'Claire Bennett',
      role: 'ICU Night-Shift Nurse, Denver CO',
      rating: 5,
      date: 'November 12, 2026',
      headline: 'Zero ear soreness sleeping on my side at 10 AM',
      body: 'At first I thought built-in speakers would press into my ears just like earbuds, but actually the 4mm pads disappear completely against my pillow. Total blackout for daytime recovery sleep.',
      verifiedVariant: 'Slate Knit · 2x Partner Sleep Set',
    },
    {
      id: 'rev-5',
      author: 'Tariq Al-Mansoor',
      role: 'Management Consultant, Boston MA',
      rating: 4,
      date: 'November 4, 2026',
      headline: 'Saved me on back-to-back transatlantic flights',
      body: 'Battery lasted both flights with room to spare and the eye cups leave plenty of room to blink. Knocked one star because the travel pouch fits snug with the charging cable.',
      verifiedVariant: 'Obsidian Black · 1x Single Mask',
    },
  ],
  'kova-arc-mount': [
    {
      id: 'rev-6',
      author: 'Owen Takahashi',
      role: 'Mastering Engineer, Portland OR',
      rating: 5,
      date: 'November 10, 2026',
      headline: 'Machined like studio audio gear, zero flex with a 32oz Yeti',
      body: 'At first I thought a clamp cup holder would wobble when raising my standing desk, but actually the anodized aluminum frame stays dead still with a full insulated mug and studio headphones hanging underneath.',
      verifiedVariant: 'Matte Anodized Black · 2x Dual Pack',
    },
  ],
  'kova-hush-earplugs': [
    {
      id: 'rev-7',
      author: 'Sofia Morales',
      role: 'Live Sound Technician, Nashville TN',
      rating: 5,
      date: 'November 15, 2026',
      headline: 'Clear cymbals and vocals with zero ringing the next morning',
      body: 'At first I thought -21dB would kill the energy of a live room, but actually vocals stay crystal clear while harsh high-SPL snare hits drop right into a comfortable zone. The machined carry pod lives on my keys.',
      verifiedVariant: 'Dark Titanium · 2x Duo Pack',
    },
  ],
};

export const STORE_FAQS = [
  {
    question: 'How fast does Kova Studio process and ship US orders?',
    answer:
      'Every order is processed in 1 business day and ships free via tracked delivery arriving in 3–5 business days across the continental United States. International UK, CA, EU, and AU orders arrive in 5–8 business days via YunExpress dedicated air.',
  },
  {
    question: 'What is covered under your 30-day money-back guarantee?',
    answer:
      'Test any Kova Studio hardware at home for 30 days. If you do not experience noticeable daily relief, email support@kovastudio.com for a return authorization within 24 hours with $0 restocking fees. Damaged or defective units are replaced free immediately.',
  },
  {
    question: 'How do the free gifts unlock on single-unit orders?',
    answer:
      'Every Tier 1 (1x unit) order automatically unlocks both complementary accessories and digital guides at $0.00 in your slide-out cart drawer—no coupon code required.',
  },
  {
    question: 'Are your payment details encrypted and protected?',
    answer:
      'Yes. Checkout uses 256-bit TLS encryption with 3D Secure verification and recognizable KOVASTUDIO.COM billing statements.',
  },
];

export const SEO_GUIDES: SeoGuideArticle[] = [
  {
    id: 'guide-cervical-traction',
    slug: 'best-heated-cervical-traction-pillow-for-desk-neck-relief',
    title: 'Heated Cervical Traction Pillows Explained: 15-Minute Desk Recovery Protocol',
    targetKeyword: 'heated cervical traction pillow',
    monthlySearchVolume: 18400,
    cpcEquivalent: 2.85,
    readMinutes: 5,
    publishedDate: 'November 18, 2026',
    summary:
      'Why forward-head posture compresses cervical discs during 8-hour screen days, how 26-degree passive traction differs from flat memory foam, and how to pair radiant heat safely.',
    featuredProductId: 'kova-pulse-pro',
    sections: [
      {
        heading: 'Why Flat Memory Foam Fails Forward-Head Posture',
        body: 'Every inch your head drifts forward over a laptop screen adds roughly 10 pounds of mechanical load to your lower cervical vertebrae. Standard soft pillows compress flat within weeks, failing to restore the natural 20° to 30° lordotic curve when you lie down at night.',
      },
      {
        heading: 'Combining 26-Degree Contouring with Controlled Graphene Heat',
        body: 'Passive traction works best when tight suboccipital muscles stop guarding. Applying gentle 104°F–122°F graphene warmth along the base of the skull increases local micro-circulation in under two minutes so 15 minutes of supine traction feels restorative rather than rigid.',
      },
      {
        heading: 'Day 1 to Day 30 Evening Recovery Schedule',
        body: 'Start with 8 minutes on Low warmth for Nights 1–3, then progress to the full 15-minute auto-shutoff cycle on Medium warmth. Pair your evening decompression with two minutes of chin-tuck mobility drills to preserve posture gains throughout the workday.',
      },
    ],
    faqs: [
      {
        question: 'How long should I use a heated cervical traction pillow per day?',
        answer:
          'Most orthopedic protocols recommend 10 to 15 minutes once per evening. Kova Pulse Pro includes an automatic 15-minute shutoff timer so you never overstretch.',
      },
      {
        question: 'Can I sleep on a cervical traction pillow all night?',
        answer:
          'Dedicated traction pillows are built for targeted 15-minute decompression sessions rather than 8-hour overnight sleep. Use it right before transitioning to your standard sleep pillow.',
      },
    ],
  },
  {
    id: 'guide-side-sleeper-audio',
    slug: 'bluetooth-sleep-mask-for-side-sleepers-guide',
    title: 'Side-Sleeper Audio Guide: Why 4mm Flat Drivers Beat In-Ear Sleep Buds',
    targetKeyword: 'bluetooth sleep mask for side sleepers',
    monthlySearchVolume: 24900,
    cpcEquivalent: 2.15,
    readMinutes: 4,
    publishedDate: 'November 11, 2026',
    summary:
      'A clinical comfort comparison of wireless in-ear earbuds versus contoured 3D blackout sleep masks with thin fabric-embedded transducers for side sleepers and shift workers.',
    featuredProductId: 'kova-drift-mask',
    sections: [
      {
        heading: 'The Ear-Canal Pressure Problem with Wireless Earbuds',
        body: 'Even compact sleep earbuds protrude 6–9mm from the tragus. Pressing your head sideways into a firm pillow drives plastic shells against sensitive cartilage, waking light sleepers two hours into the night.',
      },
      {
        heading: 'Zero-Eyelash-Pressure 3D Cavities & True Blackout Seals',
        body: 'Flat silk masks press directly on your eyelids during REM rapid eye movement. Deep contoured eye chambers let you blink freely while a tapered nose baffle seals out streetlamps and 5 AM summer light.',
      },
    ],
    faqs: [
      {
        question: 'Can you wash a Bluetooth sleep audio mask?',
        answer:
          'Yes. The 4mm acoustic module slides out through an internal seam in 10 seconds so the breathable knit shell can be hand-washed safely.',
      },
    ],
  },
  {
    id: 'guide-acoustic-earplugs',
    slug: 'high-fidelity-acoustic-filter-earplugs-vs-foam',
    title: 'High-Fidelity Acoustic Filter Earplugs vs. Foam: Protecting Hearing Without Muffling',
    targetKeyword: 'high fidelity acoustic filter earplugs',
    monthlySearchVolume: 14200,
    cpcEquivalent: 1.9,
    readMinutes: 4,
    publishedDate: 'November 6, 2026',
    summary:
      'Understanding flat-attenuation titanium mesh filters (-21dB SNR), safe concert decibel budgets, and why commuters and live-music fans are ditching disposable foam plugs.',
    featuredProductId: 'kova-hush-earplugs',
    sections: [
      {
        heading: 'How Flat Attenuation Preserves Speech and Music Clarity',
        body: 'Foam earplugs absorb high-frequency harmonics much more aggressively than bass frequencies, creating a muddy underwater effect. Acoustic mesh filters use a calibrated micro-channel to attenuate lows, mids, and highs evenly by 21dB.',
      },
      {
        heading: 'Matching Silicone Tip Diameter for a Reliable Acoustic Seal',
        body: 'An undersized tip leaks high-SPL treble around the edge while an oversized tip causes ear fatigue. Testing all four XS–L medical silicone sizes guarantees both all-night comfort and verified decibel reduction.',
      },
    ],
    faqs: [
      {
        question: 'Are -21dB earplugs enough for indoor concerts and clubs?',
        answer:
          'Dropping a 105dB venue by 21dB brings sound pressure down to ~84dB—the safe multi-hour listening range recommended by occupational hearing standards.',
      },
    ],
  },
];

export const INITIAL_AD_CAMPAIGNS: AdCampaignRecord[] = [
  {
    id: 'camp-01',
    name: 'Meta Broad CBO · Pulse Pro · H1 Symptom Callout',
    productId: 'kova-pulse-pro',
    avatar: 'Remote Engineers (Tech Neck)',
    angle: 'Day 1 vs Day 30 Mechanism',
    dailyBudget: 150,
    telemetry: {
      platform: 'Meta',
      spend: 138,
      uniqueLinkClicks: 214,
      ctrLinkPct: 3.18,
      ctrAllPct: 5.6,
      cpm: 21.4,
      addToCarts: 19,
      purchases: 6,
      revenue: 534,
      breakEvenRoas: 1.36,
      breakEvenCpa: 65.66,
      adSetRoas: 3.87,
      daysProfitable: 3,
    },
  },
  {
    id: 'camp-02',
    name: 'Meta Andromeda · Drift Mask · Side-Sleeper ToF Assist',
    productId: 'kova-drift-mask',
    avatar: 'Light Side-Sleepers',
    angle: 'Silent 3s Visual Contrast Demo',
    dailyBudget: 100,
    telemetry: {
      platform: 'Meta',
      spend: 42,
      uniqueLinkClicks: 61,
      ctrLinkPct: 2.45,
      ctrAllPct: 4.8,
      cpm: 24.8,
      addToCarts: 5,
      purchases: 0,
      revenue: 0,
      breakEvenRoas: 1.37,
      breakEvenCpa: 42.33,
      adSetRoas: 2.72,
      isTopOfFunnelAssist: true,
      daysProfitable: 2,
    },
  },
  {
    id: 'camp-03',
    name: 'TikTok Smart+ · Arc Mount · Spill Contrast Hook',
    productId: 'kova-arc-mount',
    avatar: 'Clean Desk & Audio Creators',
    angle: 'Immediate Relief / Vanity',
    dailyBudget: 75,
    telemetry: {
      platform: 'TikTok',
      spend: 24,
      uniqueLinkClicks: 31,
      ctrLinkPct: 0.84,
      ctrAllPct: 2.1,
      cpm: 18.5,
      addToCarts: 1,
      purchases: 0,
      revenue: 0,
      breakEvenRoas: 1.34,
      breakEvenCpa: 36.66,
      adSetRoas: 0.9,
      daysProfitable: 1,
    },
  },
  {
    id: 'camp-04',
    name: 'Meta Broad Test · Hush Earplugs · Generic Festival Copy',
    productId: 'kova-hush-earplugs',
    avatar: 'General Festival Attendees',
    angle: 'Social Proof / Ritual',
    dailyBudget: 50,
    telemetry: {
      platform: 'Meta',
      spend: 31,
      uniqueLinkClicks: 38,
      ctrLinkPct: 2.2,
      ctrAllPct: 4.9,
      cpm: 68.4,
      addToCarts: 2,
      purchases: 0,
      revenue: 0,
      breakEvenRoas: 1.3,
      breakEvenCpa: 33.85,
      adSetRoas: 1.1,
      daysProfitable: 1,
    },
  },
];

export const INITIAL_RESEARCH_CANDIDATES: ProductCandidate[] = [
  {
    id: 'cand-01',
    name: 'Kova Lumbar Air-Traction Belt',
    category: 'Posture Recovery',
    weightKg: 0.58,
    fitsShoebox: true,
    isFragileOrChemical: false,
    isRetailCommodity: false,
    activeCompetitors: 4,
    seriousCompetitors: 2,
    revenue30d: 68400,
    videoRevenueSharePct: 81,
    activeAdSets: 27,
    economics: {
      manufacturingCost: 11.2,
      packagingCost: 1.8,
      shippingCost: 6.5,
      tariffDuty: 0.5,
      retailPrice: 84.0,
      targetCac: 21.0,
      repeatRate6Mo: 0.24,
      competitorMonthlyVisits: 44000,
    },
    painUrgencyScore: 93,
    creativeWatchScore: 86,
    logisticsScore: 90,
  },
  {
    id: 'cand-02',
    name: 'Magnetic Under-Desk Foot Hammock Pro',
    category: 'Desk Ergonomics',
    weightKg: 0.45,
    fitsShoebox: true,
    isFragileOrChemical: false,
    isRetailCommodity: false,
    activeCompetitors: 3,
    seriousCompetitors: 1,
    revenue30d: 41200,
    videoRevenueSharePct: 74,
    activeAdSets: 21,
    economics: {
      manufacturingCost: 7.4,
      packagingCost: 1.1,
      shippingCost: 5.5,
      tariffDuty: 0.4,
      retailPrice: 54.0,
      targetCac: 15.0,
      repeatRate6Mo: 0.22,
      competitorMonthlyVisits: 28000,
    },
    painUrgencyScore: 82,
    creativeWatchScore: 84,
    logisticsScore: 92,
  },
  {
    id: 'cand-03',
    name: 'Ceramic Essential Oil Diffuser Lamp',
    category: 'Home Decor',
    weightKg: 2.4,
    fitsShoebox: false,
    isFragileOrChemical: true,
    isRetailCommodity: true,
    activeCompetitors: 28,
    seriousCompetitors: 14,
    revenue30d: 19000,
    videoRevenueSharePct: 38,
    activeAdSets: 11,
    economics: {
      manufacturingCost: 14.0,
      packagingCost: 3.5,
      shippingCost: 11.0,
      tariffDuty: 1.5,
      retailPrice: 48.0,
      targetCac: 22.0,
      repeatRate6Mo: 0.1,
      competitorMonthlyVisits: 16000,
    },
    painUrgencyScore: 45,
    creativeWatchScore: 52,
    logisticsScore: 38,
  },
];

export const INITIAL_ORDERS: FulfillmentOrder[] = [
  {
    id: 'KV-1048',
    createdAt: '2026-11-22 10:14',
    customerName: 'Rachel Kim',
    customerEmail: 'rachel.kim@example.com',
    productName: 'Kova Pulse Pro (2x Double Pack)',
    quantity: 2,
    retailTotal: 142.4,
    landedCogs: 40.0,
    allocatedCpa: 21.5,
    carrier: 'YunExpress Dedicated Air',
    trackingCode: 'YT2632621272094812',
    daysWithoutScan: 1,
    promisedWindow: 'Delivered free in 3–5 business days',
    sourceChannel: 'Meta Broad CBO',
  },
  {
    id: 'KV-1047',
    createdAt: '2026-11-21 18:42',
    customerName: 'Daniel Okafor',
    customerEmail: 'd.okafor@example.com',
    productName: 'Kova Drift Mask (1x + Cooling Liner)',
    quantity: 1,
    retailTotal: 69.0,
    landedCogs: 16.5,
    allocatedCpa: 17.0,
    carrier: 'YunExpress Dedicated Air',
    trackingCode: 'YT2632590148201144',
    daysWithoutScan: 2,
    promisedWindow: 'Delivered free in 3–5 business days',
    sourceChannel: 'Organic SEO Guide',
  },
  {
    id: 'KV-1046',
    createdAt: '2026-11-17 09:05',
    customerName: 'Lauren Alvarez',
    customerEmail: 'lauren.a@example.com',
    productName: 'Kova Arc 2-in-1 Mount (1x)',
    quantity: 1,
    retailTotal: 49.0,
    landedCogs: 10.5,
    allocatedCpa: 15.0,
    carrier: '4PX Air Secondary',
    trackingCode: '4PX300091827461CN',
    daysWithoutScan: 5,
    promisedWindow: 'Delivered free in 3–5 business days',
    sourceChannel: 'TikTok Smart+',
  },
];

export const SUPPLIER_NODES: SupplierNode[] = [
  {
    id: 'sup-primary',
    name: 'Shenzhen Huayi Private Sourcing ERP',
    role: 'Primary',
    location: 'Shenzhen, CN (12 min from OEM factory)',
    shippingLine: 'YunExpress Dedicated Air',
    dispatchHours: 18,
    avgTransitDays: 7.8,
    defectiveRatePct: 0.7,
    landedCogsToRetailPct: 22.5,
    storeRating: 4.9,
    bufferUnits: 35,
  },
  {
    id: 'sup-backup-1',
    name: 'Yiwu Nova Fulfill 1688 Team',
    role: 'Backup 1',
    location: 'Yiwu, CN',
    shippingLine: '4PX / CNE Express Air',
    dispatchHours: 24,
    avgTransitDays: 8.6,
    defectiveRatePct: 1.1,
    landedCogsToRetailPct: 24.8,
    storeRating: 4.8,
    bufferUnits: 15,
  },
  {
    id: 'sup-backup-2',
    name: 'Austin Domestic 3PL Overflow Node',
    role: 'Backup 2',
    location: 'Austin, TX (Domestic US)',
    shippingLine: 'USPS Priority / UPS Ground',
    dispatchHours: 16,
    avgTransitDays: 2.9,
    defectiveRatePct: 0.4,
    landedCogsToRetailPct: 29.0,
    storeRating: 4.9,
    bufferUnits: 120,
  },
];

export const KLAVIYO_FLOWS = [
  {
    id: 'site-abandon',
    trigger: 'Active on Site',
    delay: '4 hours -> Day 2 plain-text note',
    filter: '0 Viewed Product · 0 Added to Cart · 0 Checkout · 30d cooldown',
    recoveryShare: '11% of recovered revenue',
  },
  {
    id: 'browse-abandon',
    trigger: 'Viewed Product',
    delay: '1h dynamic item -> Day 2 FAQ -> Day 3 code -> Day 4 founder note',
    filter: '0 Added to Cart in last 24h',
    recoveryShare: '22% of recovered revenue',
  },
  {
    id: 'cart-abandon',
    trigger: 'Added to Cart (High-Impact Trigger)',
    delay: '30m dynamic cart -> Day 2 authority proof -> Day 3 code+FAQ -> Day 4 P.S. last chance',
    filter: '0 Checkout Started · 0 Placed Order',
    recoveryShare: '38% of recovered revenue',
  },
  {
    id: 'checkout-abandon',
    trigger: 'Checkout Started',
    delay: '30m checkout reminder + 60m single TCPA SMS (max 1 per 48h)',
    filter: '0 Placed Order since starting flow',
    recoveryShare: '29% of recovered revenue',
  },
];

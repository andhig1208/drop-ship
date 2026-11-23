export interface SeoGmcAuditInput {
  pageTitle: string;
  metaDescription: string;
  focusKeyword: string;
  urlSlug: string;
  hasProductJsonLd: boolean;
  hasFaqJsonLd: boolean;
  policyLinksCount: number; // Must be 6: About, Contact, Terms, Privacy, Shipping, Returns
  pdpHandlingDays: number;
  gmcHandlingDays: number;
  pdpTransitRange: string; // e.g., "3-5"
  gmcTransitRange: string; // e.g., "3-5"
  returnWindowDays: number;
  restockingFeeDollars: number;
  hasMatchingContactInfo: boolean;
}

export interface SeoAuditCheck {
  id: string;
  category: 'On-Page SEO' | 'Structured Data' | 'GMC Compliance';
  label: string;
  passed: boolean;
  detail: string;
}

export interface SeoAuditResult {
  score: number;
  passedCount: number;
  totalChecks: number;
  gmcParityStatus: 'COMPLIANT' | 'ACTION_REQUIRED';
  checks: SeoAuditCheck[];
}

export function auditSeoAndGmcParity(input: SeoGmcAuditInput): SeoAuditResult {
  const titleLen = input.pageTitle.trim().length;
  const descLen = input.metaDescription.trim().length;
  const keywordLower = input.focusKeyword.trim().toLowerCase();
  const titleContainsKw =
    keywordLower.length > 0 && input.pageTitle.toLowerCase().includes(keywordLower);
  const slugClean = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.urlSlug.trim());
  const handlingParity = input.pdpHandlingDays === input.gmcHandlingDays;
  const transitParity =
    input.pdpTransitRange.trim().toLowerCase() === input.gmcTransitRange.trim().toLowerCase();
  const returnParity = input.returnWindowDays >= 30 && input.restockingFeeDollars === 0;

  const checks: SeoAuditCheck[] = [
    {
      id: 'title-length',
      category: 'On-Page SEO',
      label: 'Title Tag Length (30–60 chars)',
      passed: titleLen >= 30 && titleLen <= 60,
      detail: `${titleLen} characters (${titleLen >= 30 && titleLen <= 60 ? 'optimal SERP display' : 'adjust to 30–60 chars'})`,
    },
    {
      id: 'meta-length',
      category: 'On-Page SEO',
      label: 'Meta Description Length (120–160 chars)',
      passed: descLen >= 120 && descLen <= 160,
      detail: `${descLen} characters (${descLen >= 120 && descLen <= 160 ? 'no snippet truncation' : 'target 120–160 chars'})`,
    },
    {
      id: 'keyword-title',
      category: 'On-Page SEO',
      label: 'Focus Keyword in H1 / Title Tag',
      passed: titleContainsKw,
      detail: titleContainsKw
        ? `Includes "${input.focusKeyword}"`
        : `Missing focus keyword "${input.focusKeyword}" in title`,
    },
    {
      id: 'clean-slug',
      category: 'On-Page SEO',
      label: 'Clean Lowercase Hyphenated URL Slug',
      passed: slugClean,
      detail: slugClean ? `/${input.urlSlug}` : 'Use lowercase alphanumeric words separated by hyphens',
    },
    {
      id: 'schema-jsonld',
      category: 'Structured Data',
      label: 'Product + FAQPage Schema.org JSON-LD',
      passed: input.hasProductJsonLd && input.hasFaqJsonLd,
      detail:
        input.hasProductJsonLd && input.hasFaqJsonLd
          ? 'Rich price, rating, shipping & FAQ snippets active'
          : 'Enable both Product and FAQPage JSON-LD blocks',
    },
    {
      id: 'gmc-policies',
      category: 'GMC Compliance',
      label: 'All 6 Policy Pages Linked in Footer',
      passed: input.policyLinksCount >= 6,
      detail: `${input.policyLinksCount}/6 required links (About, Contact, Terms, Privacy, Shipping, Returns)`,
    },
    {
      id: 'gmc-shipping-parity',
      category: 'GMC Compliance',
      label: 'PDP-to-GMC Handling & Transit Parity',
      passed: handlingParity && transitParity,
      detail:
        handlingParity && transitParity
          ? `100% parity: ${input.pdpHandlingDays}d handling + ${input.pdpTransitRange}d transit`
          : `Mismatch detected: PDP (${input.pdpHandlingDays}d / ${input.pdpTransitRange}d) vs GMC (${input.gmcHandlingDays}d / ${input.gmcTransitRange}d)`,
    },
    {
      id: 'gmc-returns-contact',
      category: 'GMC Compliance',
      label: '30-Day Returns, $0 Restocking & Verified Contact',
      passed: returnParity && input.hasMatchingContactInfo,
      detail:
        returnParity && input.hasMatchingContactInfo
          ? `${input.returnWindowDays}-day returns, $0 restocking fee, verbatim business info`
          : 'Ensure >=30-day return window, $0 restocking fee, and exact contact match',
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const gmcChecksPassed = checks
    .filter((c) => c.category === 'GMC Compliance')
    .every((c) => c.passed);

  return {
    score,
    passedCount,
    totalChecks: checks.length,
    gmcParityStatus: gmcChecksPassed ? 'COMPLIANT' : 'ACTION_REQUIRED',
    checks,
  };
}

export function buildProductJsonLd(params: {
  name: string;
  description: string;
  sku: string;
  price: number;
  rating: number;
  reviewCount: number;
  handlingDays: number;
  transitMin: number;
  transitMax: number;
  url: string;
}): string {
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: params.name,
      description: params.description,
      sku: params.sku,
      brand: {
        '@type': 'Brand',
        name: 'Kova Studio',
      },
      url: params.url,
      offers: {
        '@type': 'Offer',
        price: params.price.toFixed(2),
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: '0.00',
            currency: 'USD',
          },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {
              '@type': 'QuantitativeValue',
              minValue: params.handlingDays,
              maxValue: params.handlingDays,
              unitCode: 'DAY',
            },
            transitTime: {
              '@type': 'QuantitativeValue',
              minValue: params.transitMin,
              maxValue: params.transitMax,
              unitCode: 'DAY',
            },
          },
        },
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: params.rating.toFixed(1),
        reviewCount: String(params.reviewCount),
      },
    },
    null,
    2
  );
}

export function buildFaqJsonLd(faqs: { question: string; answer: string }[]): string {
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
    null,
    2
  );
}

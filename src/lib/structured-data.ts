import type { AgentProduct } from '@/lib/agent-catalog';
import { absoluteUrl, SITE_URL } from '@/lib/site';

type StoreInfo = {
  name: string;
  url: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  sameAs: string[];
};

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

export function organizationNode(info: StoreInfo) {
  return {
    '@type': ['OnlineStore', 'Organization'],
    '@id': ORG_ID,
    name: info.name,
    url: info.url,
    description: info.description,
    logo: { '@type': 'ImageObject', url: info.logo },
    image: info.logo,
    ...(info.email ? { email: info.email } : {}),
    ...(info.phone ? { telephone: info.phone } : {}),
    ...(info.address
      ? { address: { '@type': 'PostalAddress', streetAddress: info.address, addressLocality: 'Dhaka', addressCountry: 'BD' } }
      : {}),
    areaServed: { '@type': 'Country', name: 'Bangladesh' },
    currenciesAccepted: 'BDT',
    paymentAccepted: 'Cash on delivery, bKash',
    ...(info.phone || info.email
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            areaServed: 'BD',
            availableLanguage: ['en', 'bn'],
            ...(info.phone ? { telephone: info.phone } : {}),
            ...(info.email ? { email: info.email } : {}),
          },
        }
      : {}),
    ...(info.sameAs.length ? { sameAs: info.sameAs } : {}),
  };
}

export function websiteNode(info: StoreInfo) {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: SITE_URL,
    name: info.name,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/shop?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

const availability = (inStock: boolean) => (inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock');

export function productNode(p: AgentProduct, full = false) {
  const base = {
    '@type': 'Product',
    '@id': `${p.url}#product`,
    name: p.name,
    url: p.url,
    ...(p.image ? { image: p.image } : {}),
    ...(p.description ? { description: p.description } : {}),
    ...(p.category ? { category: p.category } : {}),
    seller: { '@id': ORG_ID },
  };
  if (!full || p.variants.length <= 1) {
    return {
      ...base,
      ...(p.variants[0]?.sku ? { sku: p.variants[0].sku } : {}),
      offers:
        p.variants.length > 1
          ? {
              '@type': 'AggregateOffer',
              priceCurrency: 'BDT',
              lowPrice: p.minPrice,
              highPrice: p.maxPrice,
              offerCount: p.variants.length,
              availability: availability(p.inStock),
              url: p.url,
            }
          : {
              '@type': 'Offer',
              priceCurrency: 'BDT',
              price: p.minPrice,
              availability: availability(p.inStock),
              itemCondition: 'https://schema.org/NewCondition',
              url: p.url,
              seller: { '@id': ORG_ID },
            },
    };
  }
  return {
    ...base,
    offers: p.variants.map((v) => ({
      '@type': 'Offer',
      name: v.size,
      sku: v.sku,
      priceCurrency: 'BDT',
      price: v.price,
      availability: availability(v.inStock),
      itemCondition: 'https://schema.org/NewCondition',
      url: p.url,
      seller: { '@id': ORG_ID },
    })),
  };
}

export function itemListNode(products: AgentProduct[], name: string) {
  return {
    '@type': 'ItemList',
    name,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: productNode(p) })),
  };
}

export function breadcrumbNode(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

/** Serialise safely for a <script type="application/ld+json"> tag. */
export function ldJson(graph: object[]) {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

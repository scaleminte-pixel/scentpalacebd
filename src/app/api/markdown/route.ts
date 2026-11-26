import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { getAgentProduct, getAgentProducts, getStoreInfo, money, STATIC_PAGES } from '@/lib/agent-catalog';
import { getOurStory } from '@/lib/our-story';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Markdown versions of the public pages, for AI agents (far fewer tokens than HTML).
 * Reached via `Accept: text/markdown` on the page URL (see middleware) or /api/markdown?path=/shop
 */
const md = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      Vary: 'Accept',
    },
  });

async function settingNumber(key: string, fallback: number) {
  const s = await prisma.storeSetting.findUnique({ where: { key } }).catch(() => null);
  const n = Number(s ? JSON.parse(s.valueJson) : NaN);
  return Number.isFinite(n) ? n : fallback;
}

function nav() {
  return ['', '---', 'Pages: ' + STATIC_PAGES.map((p) => `[${p.title}](${absoluteUrl(p.path)})`).join(' · '), ''].join('\n');
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('path') || '/';
  const path = raw.replace(/\/+$/, '') || '/';
  const info = await getStoreInfo();
  const contact = [info.phone && `Phone: ${info.phone}`, info.email && `Email: ${info.email}`, info.address && `Address: ${info.address}`]
    .filter(Boolean)
    .join(' · ');

  // ---- product page
  const pm = path.match(/^\/product\/([^/]+)$/);
  if (pm) {
    const p = await getAgentProduct(decodeURIComponent(pm[1]));
    if (!p) return md(`# Not found\n\nNo product at ${absoluteUrl(path)}.\n${nav()}`, 404);
    return md(
      [
        `# ${p.name}`,
        '',
        `URL: ${p.url}`,
        p.image ? `\n![${p.name}](${p.image})` : '',
        '',
        p.description,
        '',
        '| Size | Price | Regular price | In stock |',
        '|---|---|---|---|',
        ...p.variants.map((v) => `| ${v.size} | ${money(v.price)} | ${v.originalPrice ? money(v.originalPrice) : '—'} | ${v.inStock ? 'Yes' : 'No'} |`),
        '',
        [p.concentration && `Concentration: ${p.concentration}`, p.category && `Category: ${p.category}`, p.scentFamily && `Scent family: ${p.scentFamily}`]
          .filter(Boolean)
          .join(' · '),
        '',
        `Order online at ${p.url} — cash on delivery across Bangladesh.`,
        nav(),
      ].join('\n')
    );
  }

  // ---- catalog
  if (path === '/shop' || path === '/') {
    const products = await getAgentProducts().catch(() => []);
    const list = products.map(
      (p) =>
        `- [${p.name}](${p.url}) — ${p.minPrice === p.maxPrice ? money(p.minPrice) : `from ${money(p.minPrice)}`}${
          p.variants.length ? ` (${p.variants.map((v) => v.size).join(', ')})` : ''
        }${p.inStock ? '' : ' — out of stock'}`
    );
    const head =
      path === '/'
        ? [`# ${info.name}`, '', info.description, '', contact, '', `## Perfumes (${products.length})`]
        : ['# Shop all perfumes', '', `All prices in BDT (৳). ${products.length} products.`, ''];
    return md([...head, ...list, nav()].join('\n'));
  }

  // ---- about
  if (path === '/our-story' || path === '/about') {
    const s = await getOurStory();
    return md(
      [
        `# ${s.heroTitle || 'Our Story'}`,
        '',
        s.heroSubtitle || '',
        '',
        s.storyHeading ? `## ${s.storyHeading}` : '',
        '',
        ...s.storyParagraphs.map((t) => `${t}\n`),
        ...s.pillars.map((p) => `### ${p.title}\n\n${p.text}\n`),
        nav(),
      ].join('\n')
    );
  }

  if (path === '/contact') {
    return md([`# Contact ${info.name}`, '', contact || 'Use the form at ' + absoluteUrl('/contact'), '', `Website: ${info.url}`, ...info.sameAs.map((u) => `- ${u}`), nav()].join('\n'));
  }

  if (path === '/faq') {
    const sec = await prisma.websiteSection.findUnique({ where: { sectionKey: 'faq' } }).catch(() => null);
    let items: { q: string; a: string }[] = [];
    try {
      const c = JSON.parse(sec?.contentJson || '{}');
      if (Array.isArray(c.items)) items = c.items;
    } catch {}
    return md(['# Frequently asked questions', '', ...items.map((i) => `## ${i.q}\n\n${i.a}\n`), nav()].join('\n'));
  }

  if (path === '/shipping-returns') {
    const [dhaka, outside, free] = await Promise.all([
      settingNumber('shippingFeeDhaka', 80),
      settingNumber('shippingFeeOutside', 150),
      settingNumber('freeShippingThreshold', 5000),
    ]);
    return md(
      [
        '# Shipping & returns',
        '',
        `- Delivery inside Dhaka: ${money(dhaka)}`,
        `- Delivery outside Dhaka: ${money(outside)}`,
        `- Free delivery on orders over ${money(free)}`,
        '- Payment: cash on delivery or bKash',
        '',
        `Full policy: ${absoluteUrl('/shipping-returns')}`,
        nav(),
      ].join('\n')
    );
  }

  if (path === '/privacy-policy') {
    return md(['# Privacy policy', '', `Read the full privacy policy at ${absoluteUrl('/privacy-policy')}.`, '', contact, nav()].join('\n'));
  }

  return md(`# Not available\n\nNo Markdown version for ${path}.\n${nav()}`, 404);
}

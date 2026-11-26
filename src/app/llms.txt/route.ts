import { getAgentProducts, getStoreInfo, money, STATIC_PAGES } from '@/lib/agent-catalog';
import { absoluteUrl, SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** /llms.txt — plain-Markdown summary of the shop for language models (llmstxt.org). */
export async function GET() {
  const [info, products] = await Promise.all([getStoreInfo(), getAgentProducts().catch(() => [])]);

  const lines: string[] = [
    `# ${info.name}`,
    '',
    `> ${info.description} Prices are in Bangladeshi Taka (BDT, ৳).`,
    '',
    '## Store facts',
    `- Website: ${SITE_URL}`,
    ...(info.phone ? [`- Phone: ${info.phone}`] : []),
    ...(info.email ? [`- Email: ${info.email}`] : []),
    ...(info.address ? [`- Address: ${info.address}`] : []),
    '- Payment: cash on delivery and bKash',
    '- Delivery: all over Bangladesh',
    ...info.sameAs.map((u) => `- Profile: ${u}`),
    '',
    '## Key pages',
    ...STATIC_PAGES.map((p) => `- [${p.title}](${absoluteUrl(p.path)}): ${p.about}`),
    '',
    '## For agents',
    `- Any page above is available as Markdown: send \`Accept: text/markdown\`, or open ${absoluteUrl('/api/markdown?path=/shop')}`,
    `- MCP server (search products, product details, store info): ${absoluteUrl('/api/mcp')} — card at ${absoluteUrl('/.well-known/mcp/server-card.json')}`,
    `- Sitemap: ${absoluteUrl('/sitemap.xml')}`,
    '',
    `## Products (${products.length})`,
    ...products.map((p) => {
      const price = p.minPrice === p.maxPrice ? money(p.minPrice) : `${money(p.minPrice)}–${money(p.maxPrice)}`;
      const sizes = p.variants.map((v) => v.size).join(', ');
      return `- [${p.name}](${p.url}): ${price}${sizes ? ` (${sizes})` : ''}${p.inStock ? '' : ' — out of stock'}`;
    }),
    '',
    '## Optional',
    `- [Full product list as Markdown](${absoluteUrl('/api/markdown?path=/shop')})`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  });
}

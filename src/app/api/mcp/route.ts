import { NextRequest, NextResponse } from 'next/server';
import { getAgentProduct, getAgentProducts, getStoreInfo } from '@/lib/agent-catalog';
import { MCP_SERVER, MCP_TOOLS, PROTOCOL_VERSIONS } from '@/lib/mcp-tools';

export const dynamic = 'force-dynamic';

/**
 * Public, read-only MCP server (Streamable HTTP, stateless, JSON responses).
 * Tools expose only what the storefront already shows publicly: products, prices, store info.
 * Card: /.well-known/mcp/server-card.json
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id',
};

type Rpc = { jsonrpc: '2.0'; id?: string | number | null; method?: string; params?: any };

const ok = (id: Rpc['id'], result: unknown) => ({ jsonrpc: '2.0', id, result });
const fail = (id: Rpc['id'], code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

async function callTool(name: string, args: any) {
  if (name === 'search_products') {
    const limit = Math.min(Math.max(Number(args?.limit) || 20, 1), 50);
    let items = await getAgentProducts({ q: typeof args?.query === 'string' ? args.query.slice(0, 80) : undefined });
    if (Number(args?.maxPrice) > 0) items = items.filter((p) => p.minPrice <= Number(args.maxPrice));
    const results = items.slice(0, limit).map((p) => ({
      name: p.name,
      slug: p.slug,
      url: p.url,
      priceFrom: p.minPrice,
      priceTo: p.maxPrice,
      currency: 'BDT',
      sizes: p.variants.map((v) => v.size),
      inStock: p.inStock,
    }));
    return { results, total: items.length };
  }
  if (name === 'get_product') {
    const slug = String(args?.slug || '').trim().replace(/^.*\/product\//, '').replace(/\/$/, '');
    if (!slug) throw new Error('slug is required');
    const p = await getAgentProduct(slug);
    if (!p) throw new Error(`No product with slug "${slug}"`);
    const { updatedAt, ...rest } = p;
    return { ...rest, currency: 'BDT' };
  }
  if (name === 'get_store_info') {
    return { ...(await getStoreInfo()), payment: ['Cash on delivery', 'bKash'], delivery: 'All over Bangladesh' };
  }
  throw new Error(`Unknown tool: ${name}`);
}

async function handle(msg: Rpc) {
  const { id, method, params } = msg || ({} as Rpc);
  if (!method) return fail(id, -32600, 'Invalid request');
  const isNotification = id === undefined;

  switch (method) {
    case 'initialize': {
      const requested = params?.protocolVersion;
      return ok(id, {
        protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: MCP_SERVER,
        instructions: 'Read-only catalog of Scent Palace BD (perfume shop, Bangladesh). Prices are in BDT. Orders are placed on the website.',
      });
    }
    case 'ping':
      return ok(id, {});
    case 'tools/list':
      return ok(id, { tools: MCP_TOOLS });
    case 'tools/call': {
      try {
        const data = await callTool(params?.name, params?.arguments || {});
        return ok(id, { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data, isError: false });
      } catch (e: any) {
        return ok(id, { content: [{ type: 'text', text: e?.message || 'Tool failed' }], isError: true });
      }
    }
    default:
      if (isNotification || method.startsWith('notifications/')) return null;
      return fail(id, -32601, `Method not found: ${method}`);
  }
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(fail(null, -32700, 'Parse error'), { status: 400, headers: CORS });
  }
  const batch = Array.isArray(body);
  const msgs: Rpc[] = (batch ? body : [body]).slice(0, 20);
  const out = (await Promise.all(msgs.map(handle))).filter(Boolean);
  if (out.length === 0) return new Response(null, { status: 202, headers: CORS });
  return NextResponse.json(batch ? out : out[0], { headers: CORS });
}

export function GET() {
  // No server-initiated stream in this stateless server
  return NextResponse.json(
    { name: MCP_SERVER.name, info: 'MCP endpoint. POST JSON-RPC 2.0 messages here.', card: '/.well-known/mcp/server-card.json' },
    { status: 405, headers: { ...CORS, Allow: 'POST, OPTIONS' } }
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

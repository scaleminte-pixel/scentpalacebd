import { MCP_SERVER, MCP_TOOLS, PROTOCOL_VERSIONS } from '@/lib/mcp-tools';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-static';

/** MCP Server Card (SEP-1649), served at /.well-known/mcp/server-card.json via a rewrite. */
export function GET() {
  const card = {
    $schema: 'https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json',
    name: MCP_SERVER.name,
    title: MCP_SERVER.title,
    version: MCP_SERVER.version,
    description: 'Read-only catalog of Scent Palace BD, an online perfume shop in Bangladesh: search perfumes, prices in BDT, stock and store info.',
    websiteUrl: absoluteUrl('/'),
    icons: [{ src: absoluteUrl('/brand/app-icon-512.png'), mimeType: 'image/png', sizes: ['512x512'] }],
    protocolVersions: PROTOCOL_VERSIONS,
    endpoints: [{ type: 'streamable-http', url: absoluteUrl('/api/mcp') }],
    remotes: [{ type: 'streamable-http', url: absoluteUrl('/api/mcp') }],
    authentication: { required: false, schemes: [] },
    capabilities: { tools: { listChanged: false }, resources: null, prompts: null },
    tools: MCP_TOOLS.map(({ name, title, description, inputSchema }) => ({ name, title, description, inputSchema })),
  };
  return Response.json(card, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' },
  });
}

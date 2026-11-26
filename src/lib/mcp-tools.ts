/** Shared by the MCP endpoint (/api/mcp) and its server card. */
export const MCP_SERVER = { name: 'scentpalacebd-catalog', title: 'Scent Palace BD catalog', version: '1.0.0' };
export const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

export const MCP_TOOLS = [
  {
    name: 'search_products',
    title: 'Search perfumes',
    description:
      'Search Scent Palace BD perfumes by name or keyword. Returns name, URL, price range in BDT, sizes and stock. Leave query empty to list all.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Words to search for, e.g. "oud", "rose", "Lattafa"' },
        maxPrice: { type: 'number', description: 'Only products with a size at or below this price (BDT)' },
        limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Max results (default 20)' },
      },
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_product',
    title: 'Get product details',
    description: 'Full details for one perfume by its slug (from search results or the product URL): sizes, prices, stock, description.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string', description: 'Product slug, e.g. "swiss-arabian-rose-01"' } },
      required: ['slug'],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_store_info',
    title: 'Store information',
    description: 'Contact details, address, payment and delivery information for Scent Palace BD.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];


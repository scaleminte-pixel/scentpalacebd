'use client';

import { useEffect } from 'react';
import { MCP_TOOLS } from '@/lib/mcp-tools';

/**
 * WebMCP: exposes the shop's read-only tools to in-browser AI agents via
 * navigator.modelContext (registerTool, or provideContext on older drafts).
 * Each tool calls the same public MCP endpoint used by remote agents (/api/mcp).
 */
async function callMcp(name: string, args: unknown) {
  const res = await fetch('/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name, arguments: args || {} } }),
  });
  const data = await res.json();
  if (data?.error) return { content: [{ type: 'text', text: data.error.message || 'Tool failed' }], isError: true };
  return data.result;
}

export function WebMcpTools() {
  useEffect(() => {
    const mc = (navigator as any).modelContext;
    if (!mc) return;
    const tools = MCP_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      annotations: t.annotations,
      execute: (args: unknown) => callMcp(t.name, args),
    }));

    const registrations: Array<{ unregister?: () => void }> = [];
    try {
      if (typeof mc.registerTool === 'function') {
        for (const tool of tools) registrations.push(mc.registerTool(tool) || {});
      } else if (typeof mc.provideContext === 'function') {
        mc.provideContext({ tools });
      }
    } catch (e) {
      console.warn('WebMCP registration failed', e);
    }
    return () => {
      for (const r of registrations) {
        try {
          r?.unregister?.();
        } catch {}
      }
      if (typeof mc.unregisterTool === 'function') {
        for (const t of tools) {
          try {
            mc.unregisterTool(t.name);
          } catch {}
        }
      }
    };
  }, []);

  return null;
}

#!/usr/bin/env node

/**
 * ============================================================================
 * Rāwdah Haute Parfumerie — Complete System Verification Entrypoint
 * ============================================================================
 * 
 * Delegating entrypoint for the complete 4-Tier E2E verification test runner.
 * Automatically runs `scripts/test-e2e-all.js` across Tiers 1–4 with full
 * port auto-detection, comprehensive coverage, and clean exit codes.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const testScript = path.join(__dirname, 'test-e2e-all.js');
const result = spawnSync(process.execPath, [testScript, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status !== null ? result.status : (result.error ? 1 : 0));

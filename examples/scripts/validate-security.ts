/**
 * Antigravity Security Validation Script
 * Runs security checks before commit/deploy.
 */

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const REQUIRED_FILES = [
  'examples/src/lib/sanitize.ts',
  'examples/src/lib/rate-limit.ts',
  'examples/src/lib/logger.ts',
  'examples/ci.yml'
];

export function checkRequiredFiles() {
  console.log('🔍 Checking for required security files...');
  let missing = false;

  for (const file of REQUIRED_FILES) {
    if (!fs.existsSync(file)) {
      console.error(`❌ Missing required security file: ${file}`);
      missing = true;
    } else {
      console.log(`✅ Found: ${file}`);
    }
  }

  if (missing) {
    console.error('Security validation failed: Missing critical files.');
    process.exit(1);
  }
}

export function run() {
  console.log('🛡️ Starting Antigravity Security Validation...');
  checkRequiredFiles();
  console.log('✅ All security checks passed.');
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run();
}

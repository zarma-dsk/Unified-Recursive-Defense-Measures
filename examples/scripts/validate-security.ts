/**
 * Antigravity Security Validation Script
 * Runs security checks before commit/deploy.
 */

import fs from 'node:fs';

const REQUIRED_FILES = [
  'src/lib/sanitize.ts',
  'src/lib/rate-limit.ts',
  'src/lib/logger.ts',
  '.github/workflows/ci.yml'
];

function checkRequiredFiles() {
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

function run() {
  console.log('🛡️ Starting Antigravity Security Validation...');
  checkRequiredFiles();
  console.log('✅ All security checks passed.');
}

run();

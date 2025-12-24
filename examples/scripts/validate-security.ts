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

/**
 * Verifies that all required security files exist.
 *
 * Logs the presence or absence of each file checked. If any required file is missing,
 * logs a security validation failure and terminates the process with exit code 1.
 */
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

/**
 * Starts the Antigravity Security Validation flow and logs progress.
 *
 * Runs the required-file checks, logs a startup message and a success message when validation passes.
 * If validation fails, the process will exit with a non-zero status.
 */
function run() {
  console.log('🛡️ Starting Antigravity Security Validation...');
  checkRequiredFiles();
  console.log('✅ All security checks passed.');
}

run();
run();

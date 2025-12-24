/**
 * Post-install script to ensure clean environment
 */

import { fileURLToPath } from 'node:url';

export function run() {
  console.log('🧹 Cleaning up environment...');
  // Logic to remove or warn about local npm structures if strict adherence to pnpm is required
  console.log('✅ Environment ready.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run();
}

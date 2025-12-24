/**
 * Dependency Validator
 * Checks installed packages against security policies.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';

interface AuditResult {
  vulnerabilities: Record<string, any>;
  metadata: {
    vulnerabilities: {
      info: number;
      low: number;
      moderate: number;
      high: number;
      critical: number;
      total: number;
    };
  };
}

/**
 * Performs an npm security audit and enforces policy by failing the process if high or critical vulnerabilities are present.
 *
 * Checks for a local package.json, runs `npm audit --json`, parses the audit metadata, and logs a vulnerability summary.
 * If any high or critical vulnerabilities are found, or if the audit cannot be completed, the function logs an error and exits the process with code 1.
 */
function validateDependencies() {
  console.log('🔍 Vetting dependencies...');

  if (!fs.existsSync('package.json')) {
    console.error('❌ package.json not found');
    process.exit(1);
  }

  try {
    // Run npm audit and capture JSON output
    // Note: handling potential nonzero exit code from npm audit (which it does if vulns found)
    let auditOutput = '';
    try {
        auditOutput = execSync('npm audit --json', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch (e: any) {
        // npm audit returns exit code 1 if it finds vulnerabilities
        if (e.stdout) {
            auditOutput = e.stdout;
        } else {
            throw e;
        }
    }

    const result: AuditResult = JSON.parse(auditOutput);
    const { high, critical } = result.metadata.vulnerabilities;

    console.log('📊 Vulnerability Report:', result.metadata.vulnerabilities);

    if (high > 0 || critical > 0) {
      console.error(`❌ CRITICAL FAILURE: Found ${high} high and ${critical} critical vulnerabilities.`);
      console.error('   Run "npm audit fix" or resolve manually before deploying.');
      process.exit(1);
    }

    console.log('✅ Dependency vetting complete. No high/critical issues found.');
  } catch (error) {
    console.error('❌ Failed to run dependency validation:', error);
    process.exit(1);
  }
}

validateDependencies();
validateDependencies();

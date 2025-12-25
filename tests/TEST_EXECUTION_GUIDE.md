# Test Execution Guide

Quick reference for running and understanding the Antigravity test suite.

## Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

## Test Commands

### Basic Execution
```bash
# Run all tests
npm test

# Run in watch mode (auto-rerun on file changes)
npx vitest

# Run unit tests only
npm run test:unit

# Run adversarial tests only
npm run test:adversarial
```

### Advanced Options
```bash
# Run specific test file
npx vitest run tests/unit/lib/logger.test.ts

# Run tests matching a pattern
npx vitest run --grep "XSS"

# Run with coverage report
npm test -- --coverage

# Run with detailed output
npm test -- --reporter=verbose

# Run in UI mode (browser interface)
npx vitest --ui
```

## Understanding Test Output

### Success Output
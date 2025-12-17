# Antigravity Starter Kit 🛡️

This starter kit contains the core **Antigravity 5.1.1** security framework, extracted from the Jamia Website project. It works as a drop-in foundation for secure Next.js applications.

## 🚀 Features

- **7-Layer Security Architecture**: Pre-configured protection against OWASP Top 10 and advanced threats.
- **Strict Validation**: `safe-action` wrapper with Zod integration.
- **Secure Infrastructure**:
  - `src/lib/logger.ts`: Structured logging.
  - `src/lib/rate-limit.ts`: Token bucket rate limiting.
  - `src/lib/sanitize.ts`: HTML sanitization.
- **Ready-to-Use Scripts**:
  - `npm run validate:security`: Full compliance check (TS, Lint, Deps).
  - `npm run vet:dependency`: Supply chain security scanner.
- **CI/CD Integrated**: GitHub Actions workflow included (`.github/workflows/ci.yml`).

## 📁 Directory Structure

```text
.
├── .github/workflows/   # CI/CD Pipeline
├── scripts/             # Security & Validation Scripts
├── docs/                # Documentation
├── package.json         # Dependencies & Scripts
└── vitest.config.ts     # Test Configuration
```

## 🛠️ Usage

1.  **Install Dependencies**:

    ```bash
    pnpm install
    # or
    npm install
    ```

2.  **Run Validation**:

    ```bash
    npm run validate:security
    ```

3.  **Start Developing**:
    - Create new actions in `src/app/actions/` using `safeAction`.
    - Define entities in `src/domain/`.
    - Use repositories in `src/data/`.

## 📜 Included Scripts

- `npm run format`: Prettier
- `npm run lint`: ESLint (Security Rules)
- `npm run typecheck`: TypeScript strict check
- `npm run test`: Vitest unit tests
- `npm run vet:dependency`: Check new packages for risks

## 🛡️ Security Levels

This kit enforces:

1.  **Input Validation**: Strict Zod schemas.
2.  **Authentication**: Role-based access control (RBAC).
3.  **Rate Limiting**: DoS protection.
4.  **Output Sanitization**: XSS & Leak prevention.
5.  **Logging**: Auditable security events.

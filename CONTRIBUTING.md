# Contributing to Unified Recursive Security

Thank you for your interest in contributing to the **Unified Recursive Security** protocol! We welcome contributions that help harden AI-assisted codebases and refine our security primitives.

## 🛡️ Security First Philosophy

This project is not just a standard web application; it is a **security protocol**. All contributions must adhere to the **Unified Recursive Security v5.1.1** guidelines.

### Critical Rules
1.  **No Synthetic Vulnerabilities**: All code must pass the adversarial test suite.
2.  **No Unverified Dependencies**: New packages must undergo the 7-step vetting process described in `docs/unified-recursive-defense-measures-v511-synthetic-elimination-guide.md`.
3.  **Strict Type Safety**: `any` types are strictly forbidden. `npm run typecheck` must pass.

## 🚀 How to Contribute

1.  **Fork the repository** and create your branch from `main`.
2.  **Install dependencies**: `npm install`.
3.  **Run Security Checks**: Ensure your environment is secure by running `npm run validate:security`.

## 📝 Pull Request Process

All Pull Requests (PRs) must follow this checklist:

-   [ ] **Code Style**: Run `npm run lint` and `npm run format`.
-   [ ] **Type Check**: Run `npm run typecheck` and ensure zero errors.
-   [ ] **Security Scan**: Run `npm run validate:security` and fix any critical findings.
-   [ ] **Tests**: Add comprehensive tests for new features. For security fixes, add a regression test in `tests/adversarial/`.
-   [ ] **Documentation**: Update irrelevant documentation in `docs/` if your change affects the protocol.

## 🐛 Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.
Please refer to [SECURITY.md](SECURITY.md) for our responsible disclosure policy.

## 🏗️ Development Workflow

-   **Dev Server**: `npm run dev`
-   **Tests**: `npm run test`
-   **Adversarial Tests**: `npm run test:adversarial`

We look forward to your contributions in making the AI-coding ecosystem safer!

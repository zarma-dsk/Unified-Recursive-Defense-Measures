# Unified Recursive Security

## 🌌 Unified Recursive Security PROTOCOL 5.0.0
### VISUAL REFERENCE GUIDE
#### Flowcharts, Patterns, and Quick Lookups

---

### 📊 FLOWCHART 1: 10-STEP DECISION PROCESS

```
┌─────────────────────────────────────────┐
│   START: Identify Issue/Refactoring    │
└────────────────┬────────────────────────┘
                 │
                 ▼
         ┌──────────────────┐
         │ 1. OBSERVE       │ ← Read actual code
         │ (What's broken?)  │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ 2. QUESTION      │ ← Why? Impact? Severity?
         │ (5 questions)    │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ 3. RESEARCH      │ ← Check established sources
         │ (NOT AI)         │   OWASP, Framework docs,
         └────────┬─────────┘   Library documentation
                  │
         ┌────────▼────────┐
         │ Found answers?  │
         └────────┬────────┘
         YES ✅   │   ❌ NO
                  ▼
         Continue             ← Go back to 3. RESEARCH
                  │
                  ▼
         ┌──────────────────┐
         │ 4. HYPOTHESIZE   │ ← Propose solution
         │ (Using proven    │   using established
         │  patterns only)  │   patterns
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ 5. PREDICT       │ ← Improvements? Risks?
         │ (List both)      │   Mitigations?
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ 6. TEST          │ ← Write tests
         │ (Before coding)  │   Unit + Security
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ 7. ANALYZE       │ ← Review results
         │ (Review results) │   New issues?
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ 8. REFACTOR      │ ← Clean up
         │ (Based on tests) │   Optimize
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ 9. DOCUMENT      │ ← Add security comments
         │ (Decision logs)  │   References
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ 10. VALIDATE     │ ← npm audit
         │ (4+ gates)       │   npm build
         │                  │   npm type-check
         └────────┬─────────┘
                  │
         ┌────────▼────────┐
         │ All pass?       │
         └────────┬────────┘
         YES ✅   │   ❌ NO
                  ▼
         ┌──────────────────┐       Go back to Step 8
    ✅   │ CODE IS READY    │  ←────────(REFACTOR)
         └──────────────────┘
```

---

### 📊 FLOWCHART 2: 8-GATE FORTRESS PATTERN

```
                    USER INPUT
                         │
                         ▼
        ┌────────────────────────────────┐
        │  GATE 1: INPUT VALIDATION      │
        │  - Check type (string, email)  │
        │  - Check range (0-100)         │
        │  - Check format (uuid, etc)    │
        │  Tool: Zod                     │
        └────────────┬───────────────────┘
                     │
         ✅ Valid?   │   ❌ Invalid
                     │   ├─→ Return error
                     │   └─→ Log attempt
                     │
                     ▼
        ┌────────────────────────────────┐
        │  GATE 2: AUTHENTICATION        │
        │  - Is user logged in?          │
        │  - Is session valid?           │
        │  - Is token not expired?       │
        └────────────┬───────────────────┘
                     │
         ✅ Auth OK? │   ❌ Unauthorized
                     │   ├─→ Return 401
                     │   └─→ Log attempt
                     │
                     ▼
        ┌────────────────────────────────┐
        │  GATE 3: AUTHORIZATION         │
        │  - User owns this resource?    │
        │  - User has required role?     │
        │  - Feature enabled for user?   │
        └────────────┬───────────────────┘
                     │
         ✅ Allowed? │   ❌ Forbidden
                     │   ├─→ Return 403
                     │   └─→ Log attempt
                     │
                     ▼
        ┌────────────────────────────────┐
        │  GATE 4: RATE LIMITING         │
        │  - Too many requests?          │
        │  - Suspicious pattern?         │
        │  - DDoS detection?             │
        │  Tool: Upstash/Redis           │
        └────────────┬───────────────────┘
                     │
         ✅ OK?      │   ❌ Rate Limited
                     │   ├─→ Return 429
                     │   └─→ Log attempt
                     │
                     ▼
        ┌────────────────────────────────┐
        │  GATE 5-6: QUERY EXECUTION     │
        │  - Use Prisma ORM              │
        │  - No string interpolation     │
        │  - Prepared statements only    │
        │  - Respect foreign keys        │
        └────────────┬───────────────────┘
                     │
         ✅ Success? │   ❌ Error
                     │   ├─→ Return error
                     │   └─→ Rollback transaction
                     │
                     ▼
        ┌────────────────────────────────┐
        │  GATE 7: OUTPUT SANITIZATION   │
        │  - Map to DTO                  │
        │  - Remove sensitive fields     │
        │  - NO: passwordHash, apiKeys   │
        │  - YES: id, name, email        │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │  GATE 8: AUDIT LOGGING         │
        │  - Log action                  │
        │  - Log actor (user ID)         │
        │  - Log result (success/fail)   │
        │  - Log timestamp               │
        │  Tool: Database audit_log      │
        └────────────┬───────────────────┘
                     │
                     ▼
             RESPONSE TO CLIENT
              (Sanitized + Logged)
```

---

### 📊 FLOWCHART 3: SIMULTANEOUS TWO-TRACK EXECUTION

```
DAY 1: IDENTIFICATION
├─────────────────────────────┬──────────────────────────────┐
│ Identify legacy code        │ Identify vulnerabilities     │
│ Plan refactoring            │ Plan security fixes          │
└─────────────────────────────┴──────────────────────────────┘
          │                              │
          ▼                              ▼
    TRACK A:                         TRACK B:
    Architecture                     Security
    Refactoring                      Hardening
    (PARALLEL)                       (PARALLEL)

DAY 1-2: PARALLEL EXECUTION
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Track A:                          Track B:                 │
│  ─────────────────────────         ─────────────────────    │
│  ├─ Extract components             ├─ Add Zod schemas      │
│  ├─ Move to _components/           ├─ Add validation       │
│  ├─ Extract logic to _actions      ├─ Add rate limiting    │
│  ├─ Move util to _lib/             ├─ Add DTO mapping      │
│  ├─ Add TypeScript types           ├─ Add audit logging    │
│  └─ npm run type-check ✅          └─ npm audit --fix ✅   │
│                                                              │
│  (Both tracks running simultaneously)                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
           │                              │
           └──────────────┬───────────────┘
                          │
                          ▼
            DAY 2-3: INTEGRATION POINT
            ┌──────────────────────────┐
            │ Merge Track A + Track B  │
            │ in test environment      │
            └────────────┬─────────────┘
                         │
                         ▼
            DAY 3: FINAL TESTING
            ├─ npm run type-check ✅
            ├─ npm run lint ✅
            ├─ npm run test ✅
            ├─ npm run build ✅
            ├─ npm audit ✅
            └─ All gates pass ✅
                         │
                         ▼
            ✅ READY FOR CODE REVIEW
               (Not deployment yet)

RESULT: 2-3 days instead of 4+ weeks
```

---

### 📊 FLOWCHART 4: DEPENDENCY VALIDATION

```
┌─────────────────────────────────────┐
│  New package needed (npm install)  │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ STEP 1: Does package exist?  │
    │ $ npm view <package-name>    │
    └──────────┬───────────────────┘
               │
    ✅ Found?  │  ❌ Not found
               │  └─→ Hallucination!
               │     Do not use
               ▼
    ┌──────────────────────────────┐
    │ STEP 2: Check authenticity   │
    │ - Author verified?           │
    │ - GitHub present?            │
    │ - Recent maintenance?        │
    │ - Public repo with CI/CD?    │
    └──────────┬───────────────────┘
               │
    ✅ OK?     │  ❌ Suspicious
               │  └─→ Research further
               │
               ▼
    ┌──────────────────────────────┐
    │ STEP 3: Check adoption       │
    │ - Weekly downloads > 1000?   │
    │ - npm trends upward?         │
    │ - No recent security issues? │
    │ - Active issue resolution?   │
    └──────────┬───────────────────┘
               │
    ✅ OK?     │  ❌ Low adoption
               │  └─→ Verify necessity
               │
               ▼
    ┌──────────────────────────────┐
    │ STEP 4: Security check       │
    │ $ npm audit view <package>   │
    │ - Known vulnerabilities?     │
    │ - CVE history?               │
    │ - Author trustworthiness?    │
    └──────────┬───────────────────┘
               │
    ✅ Safe?   │  ❌ Vulnerable
               │  └─→ Find alternative
               │
               ▼
    ┌──────────────────────────────┐
    │ STEP 5: Add to vetted list   │
    │ - Add to vetted-libs.json    │
    │ - Record decision            │
    │ - Set approval date          │
    │ - Plan review date (6 mo)    │
    └──────────┬───────────────────┘
               │
               ▼
    ✅ APPROVED TO USE
       (Add to package.json)
```

---

### 📊 FLOWCHART 5: CODE REVIEW CHECKLIST

```
┌─────────────────────────────────┐
│  Code Review Gate               │
│  (Before: npm run build)         │
└──────────────┬──────────────────┘
               │
               ▼
    ┌────────────────────────────┐
    │ 1. Check 10-Step Method    │
    │ ✓ Observed actual code?    │
    │ ✓ Questioned thoroughly?   │
    │ ✓ Researched patterns?     │
    │ ✓ Hypothesized solution?   │
    │ ✓ Predicted risks?         │
    │ ✓ Tested locally?          │
    │ ✓ Analyzed results?        │
    │ ✓ Refactored clean?        │
    │ ✓ Documented decision?     │
    │ ✓ Validated gates?         │
    └────────────┬───────────────┘
                 │
    All pass?    │
    YES ✅  │  NO ❌
            │  └─→ Send back for changes
            │
            ▼
    ┌────────────────────────────┐
    │ 2. Check 5 Logics          │
    │ ✓ Folder Logic OK?         │
    │ ✓ Layer Logic OK?          │
    │ ✓ Core Logic OK?           │
    │ ✓ Code Logic OK?           │
    │ ✓ Conceptual OK?           │
    └────────────┬───────────────┘
                 │
    All pass?    │
    YES ✅  │  NO ❌
            │  └─→ Send back
            │
            ▼
    ┌────────────────────────────┐
    │ 3. Check 5 Security Logics │
    │ ✓ Dependencies verified?   │
    │ ✓ Inputs validated (Zod)?  │
    │ ✓ Outputs sanitized (DTO)? │
    │ ✓ No dynamic imports?      │
    │ ✓ Data flow unidirectional?│
    └────────────┬───────────────┘
                 │
    All pass?    │
    YES ✅  │  NO ❌
            │  └─→ Send back
            │
            ▼
    ┌────────────────────────────┐
    │ 4. Check 8-Gate Fortress   │
    │ ✓ Input validation?        │
    │ ✓ Authentication?          │
    │ ✓ Authorization?           │
    │ ✓ Rate limiting?           │
    │ ✓ Query execution?         │
    │ ✓ Sanitation?              │
    │ ✓ Logging?                 │
    │ ✓ Error handling?          │
    └────────────┬───────────────┘
                 │
    All pass?    │
    YES ✅  │  NO ❌
            │  └─→ Send back
            │
            ▼
    ┌────────────────────────────┐
    │ 5. Check Documentation     │
    │ ✓ Security comments added? │
    │ ✓ Decision log present?    │
    │ ✓ References cited?        │
    │ ✓ Tests documented?        │
    └────────────┬───────────────┘
                 │
    All pass?    │
    YES ✅  │  NO ❌
            │  └─→ Send back
            │
            ▼
    ┌────────────────────────────┐
    │ 6. Run Validation Suite    │
    │ $ npm run type-check       │
    │ $ npm run lint             │
    │ $ npm run test             │
    │ $ npm run build            │
    │ $ npm audit                │
    └────────────┬───────────────┘
                 │
    All pass?    │
    YES ✅  │  NO ❌
            │  └─→ Fix and retry
            │
            ▼
    ✅ APPROVED FOR MERGE
```

---

### 📋 QUICK REFERENCE TABLE 1: 10-Step Deliverables

| Step | Activity | Deliverable | Duration |
|------|----------|-------------|----------|
| 1 | OBSERVE | Line-by-line code review | 15 min |
| 2 | QUESTION | Written answers (5 Q's) | 10 min |
| 3 | RESEARCH | 3+ established sources + notes | 20 min |
| 4 | HYPOTHESIZE | Proposed solution + reasoning | 15 min |
| 5 | PREDICT | Lists of improvements + risks | 10 min |
| 6 | TEST | 5+ test cases + results | 30 min |
| 7 | ANALYZE | Test result analysis | 10 min |
| 8 | REFACTOR | Clean code + optimization | 30 min |
| 9 | DOCUMENT | Security decision log | 15 min |
| 10 | VALIDATE | npm audit + npm build ✅ | 5 min |
| **TOTAL** | | **Ready for Production** | **2.5 hours** |

---

### 📋 QUICK REFERENCE TABLE 2: Gate Requirements

| Gate | Check | Pass Criteria | Tool |
|------|-------|---------------|------|
| 1 | Input Validation | All fields validated with Zod | npm run build |
| 2 | Authentication | Session verified | npm run type-check |
| 3 | Authorization | Permissions checked | Code review |
| 4 | Rate Limiting | Limits enforced | npm run test |
| 5-6 | Query Execution | Prisma ORM (no raw SQL) | npm run lint |
| 7 | Output Sanitization | DTO mapping only | Code review |
| 8 | Audit Logging | All actions logged | npm audit |

**Rule:** All 8 gates must pass for production code.

---

### 📋 QUICK REFERENCE TABLE 3: Anti-Patterns (❌ Don't Do)

| Pattern | Problem | Solution |
|---------|---------|----------|
| ❌ `const data = any` | No type safety | ✅ `const data: UserDTO` |
| ❌ Raw SQL strings | SQL injection | ✅ Prisma ORM |
| ❌ `return user` object | Password leak | ✅ `return sanitizeUser(user)` |
| ❌ `eval()` | Code injection | ✅ Static imports only |
| ❌ Skip input validation | Invalid data | ✅ Always use Zod |
| ❌ No error handling | Silent failures | ✅ Try/catch + return errors |
| ❌ No logging | No audit trail | ✅ Log all actions |
| ❌ AI-generated code (untested) | Hallucinations | ✅ Follow 10-step method |
| ❌ Trust npm audit only | Miss vulnerabilities | ✅ Manual verification too |
| ❌ Skip build verification | Runtime failures | ✅ Always `npm run build` |

---

### 🎯 DECISION TREE: Do I Need to Refactor This?

```
Is this legacy code? ─────────┐
                              │
YES ─────────────────────────►┌─────────────────────┐
                              │ Does it work well?  │
NO ─────────────────────────►├─►YES ────────────────►┌────────┐
                              │                       │ SKIP   │
                              │ NO ────────────────►┌────────┐
                              │                     │ NEED   │
    Is it security-critical? ─►REFACTOR (5.0.0)    │
    YES                                             └────────┘
    NO ────► Skip for now
```

---

### ✨ VISUAL SUMMARY

```
                    🌌 Unified Recursive Security 5.0.0 🌌

┌─────────────────────────────────────────────────────────┐
│                  10-STEP SCIENTIFIC METHOD              │
│  OBSERVE → QUESTION → RESEARCH → HYPOTHESIZE → PREDICT │
│              → TEST → ANALYZE → REFACTOR → DOCUMENT    │
│                     → VALIDATE                          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ 8-GATE FORTRESS │
                   │   PATTERN       │
                   │ 1. Validate     │
                   │ 2. Authenticate │
                   │ 3. Authorize    │
                   │ 4. Rate Limit   │
                   │ 5-6. Execute    │
                   │ 7. Sanitize     │
                   │ 8. Log          │
                   └─────────────────┘
                            │
                            ▼
           ┌────────────────────────────────┐
           │  5 ARCHITECTURE + 5 SECURITY   │
           │  LOGICS ENFORCED               │
           └────────────────────────────────┘
                            │
                            ▼
           ┌────────────────────────────────┐
           │  SIMULTANEOUS TWO-TRACK MODEL  │
           │  Track A: Refactoring          │
           │  Track B: Security (Parallel)  │
           └────────────────────────────────┘
                            │
                            ▼
                  ✅ PRODUCTION READY
                 🛡️ SECURITY HARDENED
                🚀 DEPLOYMENT PREPARED
```

---

**Status: ✅ Unified Recursive Defense Measures 5.0.0 VISUAL REFERENCE COMPLETE**
**Use these flowcharts for quick decision-making and team communication.**

---

## 📚 Research & References

This protocol is based on 8 academic papers (Radware, CSET, IEEE, etc.).
For a complete mapping of vulnerabilities to defenses, see the [Research Defense Matrix](./unified-recursive-defense-measures-v511-research-defense-matrix.md).

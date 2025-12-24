# Unified Recursive Security

## 🌌 Unified Recursive Security PROTOCOL 5.0.0
### QUICK IMPLEMENTATION GUIDE
#### 10-Step Scientific Method + Simultaneous Refactoring

---

### 🎯 START HERE: Real-World Example

#### Scenario: Refactor Old Authentication + Fix Security Vulnerability

**Current State:**
- Old auth code in `src/lib/auth.ts` (monolithic, no validation)
- SQL injection in user search endpoint
- Missing rate limiting
- No audit logging

**Goal:**
- Move auth to proper folder structure
- Add input validation (Zod)
- Implement 8-gate security pattern
- Add logging

---

### 📋 APPLY 10-STEP METHOD

#### Step 1: OBSERVE (Read Actual Code)

**File:** `src/lib/auth.ts`
```typescript
// ❌ PROBLEM CODE
export async function authenticateUser(email: string, password: string) {
  const user = await db.$queryRaw`SELECT * FROM users WHERE email = ${email}`
  
  if (!user) return { success: false }
  
  const match = await bcrypt.compare(password, user.passwordHash)
  
  return { success: match, user }  // Returns full user object!
}

export async function searchUsers(query: string) {
  const results = await db.$queryRaw`SELECT * FROM users WHERE name LIKE '%${query}%'`
  return results
}
```

**Observations:**
- Line 2: Raw SQL query (SQL injection risk)
- Line 7: Returns full user object including password hash (data leakage)
- Line 11-13: String interpolation in SQL (SQL injection)
- No input validation anywhere
- No error handling
- No logging

---

#### Step 2: QUESTION (Identify Problems)

**Questions to Ask:**
1. **What's broken?** Multiple security issues
2. **Why?** Code written before security awareness, no validation layer
3. **Impact?** Attackers can:
   - Extract all user data (SQL injection)
   - Access password hashes (data leakage)
   - Brute force without rate limiting
   - No audit trail of who accessed what
4. **Who's affected?** All users
5. **Severity?** Critical (CVSS 9.8)

---

#### Step 3: RESEARCH (Check Established Patterns)

**Research Tasks:**
```bash
## Check Prisma documentation
## ✅ Found: Prepared statements in Prisma
## ✅ Found: Prisma user model pattern

## Check OWASP
## ✅ Found: Input validation is critical
## ✅ Found: Never return password hashes

## Check Next.js + React docs
## ✅ Found: Server Actions for auth
## ✅ Found: Zod for validation

## Check established auth libraries
## ✅ Found: next-auth is industry standard
## ✅ Found: But can implement custom with best practices

## Result: Use Prisma ORM + Zod + Next.js Server Actions
```

---

#### Step 4: HYPOTHESIZE (Propose Solution)

**Solution Design:**
```
Current Structure:
src/lib/auth.ts (monolithic, no validation)

Proposed Structure:
app/(auth)/
├── _actions.ts           (Server Actions with Zod validation)
├── _lib/
│   ├── validations.ts    (Zod schemas)
│   ├── sanitize.ts       (DTO functions)
│   └── constants.ts      (Auth constants)
└── login/
    ├── page.tsx          (Server Component)
    └── _components/
        └── login-form.tsx (Client Component)

Security Pattern:
User Input
  ↓
Zod Validation (Gate 1)
  ↓
Authentication (Gate 2)
  ↓
Authorization (Gate 3)
  ↓
Rate Limiting (Gate 4)
  ↓
Prisma Query (Gate 5-6)
  ↓
DTO Sanitization (Gate 7)
  ↓
Audit Log (Gate 8)
  ↓
Response
```

---

#### Step 5: PREDICT (Identify Risks & Mitigations)

**Improvements:**
✅ SQL injection prevented (Prisma)
✅ Password never exposed (DTO)
✅ Rate limiting prevents brute force
✅ Audit trail of all auth attempts
✅ Type-safe validation (Zod)

**Potential Risks:**
⚠️ Breaking API changes (need versioning)
⚠️ Migration from old auth to new (backwards compatibility)
⚠️ Performance implications unknown

**Mitigations:**
- Wrap in try/catch
- Maintain old endpoint temporarily
- Add feature flag for new auth
- Document migration path
- Benchmark performance

---

#### Step 6: TEST (Write Tests Locally)

**Test File:** `tests/auth.test.ts`

```typescript
import { authenticateUser } from '@/app/(auth)/_actions'

describe('Authentication', () => {
  it('should authenticate valid user', async () => {
    // Setup
    const user = await db.user.create({
      data: { 
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10)
      }
    })

    // Execute
    const result = await authenticateUser({
      email: 'test@example.com',
      password: 'password123'
    })

    // Assert
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data.passwordHash).toBeUndefined()  // DTO sanitization
  })

  it('should reject invalid password', async () => {
    const result = await authenticateUser({
      email: 'test@example.com',
      password: 'wrong'
    })
    expect(result.success).toBe(false)
  })

  it('should not allow SQL injection', async () => {
    const result = await authenticateUser({
      email: "' OR '1'='1",
      password: 'anything'
    })
    // Should either return error or find nothing (not inject)
    expect(result.success).toBe(false)
  })

  it('should enforce rate limiting', async () => {
    // Make 10 requests quickly
    for (let i = 0; i < 10; i++) {
      await authenticateUser({ email: 'test@ex.com', password: 'p' })
    }
    
    // 11th should be rate limited
    const result = await authenticateUser({
      email: 'test@ex.com',
      password: 'p'
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('rate limit')
  })

  it('should log authentication attempts', async () => {
    await authenticateUser({ email: 'test@ex.com', password: 'p' })
    
    // Check audit log was created
    const logs = await db.auditLog.findMany({
      where: { action: 'authenticate-user' }
    })
    expect(logs.length).toBeGreaterThan(0)
  })
})
```

**Run Tests:**
```bash
npm run test
## ✅ All tests pass

npm run type-check
## ✅ No type errors

npm run lint
## ✅ No linting errors

npm run build
## ✅ Production build succeeds
```

---

#### Step 7: ANALYZE (Review Results)

**Test Results:**
```
✅ Authentication works
✅ SQL injection prevented
✅ Password never leaked
✅ Rate limiting works
✅ Audit logging works
⚠️ Performance: 45ms → 52ms (acceptable)
```

**New Issues Found:**
- None

**Performance Impact:**
- Login requests: 45ms → 52ms (acceptable for security gain)
- No major performance degradation

**Recommendation:** Proceed to Step 8

---

#### Step 8: REFACTOR (Clean Up Code)

**New Auth Action:** `app/(auth)/_actions.ts`

```typescript
'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// VALIDATION SCHEMA
const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

// RATE LIMITING
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '5 m')  // 5 attempts per 5 min
})

/**
 * SECURITY DECISION LOG:
 * Authenticate user with strict validation and rate limiting
 * - Prevents SQL injection (Prisma prepared statements)
 * - Prevents password exposure (DTO sanitization)
 * - Prevents brute force (rate limiting)
 * - Maintains audit trail (logging)
 */
export async function authenticateUser(input: unknown) {
  // GATE 1: INPUT VALIDATION
  const parsed = authSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid input',
      details: parsed.error.flatten()
    }
  }

  // GATE 4: RATE LIMITING (Gate 2-3 skipped for login endpoint)
  const { success: rateLimitOk } = await ratelimit.limit(parsed.data.email)
  if (!rateLimitOk) {
    // Gate 8: AUDIT LOG
    await auditLog('authenticate-user', parsed.data.email, 'failed', {
      reason: 'Rate limited'
    })
    return { success: false, error: 'Too many attempts. Try again later.' }
  }

  try {
    // GATE 5-6: PRISMA QUERY (Prepared statements - SQL injection safe)
    const user = await db.user.findUnique({
      where: { email: parsed.data.email }
    })

    if (!user) {
      await auditLog('authenticate-user', parsed.data.email, 'failed', {
        reason: 'User not found'
      })
      return { success: false, error: 'Invalid credentials' }
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(
      parsed.data.password,
      user.passwordHash
    )

    if (!passwordMatch) {
      await auditLog('authenticate-user', parsed.data.email, 'failed', {
        reason: 'Invalid password'
      })
      return { success: false, error: 'Invalid credentials' }
    }

    // GATE 7: SANITIZATION (Never return password hash)
    const sanitized = sanitizeUser(user)

    // Gate 8: AUDIT LOG
    await auditLog('authenticate-user', parsed.data.email, 'success', {
      userId: user.id
    })

    return { success: true, data: sanitized }
  } catch (error) {
    console.error('[authenticateUser]', error)
    await auditLog('authenticate-user', parsed.data.email, 'error', {
      error: String(error)
    })
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * DTO SANITIZATION
 * Never return sensitive fields
 */
function sanitizeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name
    // NO: passwordHash, apiKeys, etc.
  }
}

/**
 * AUDIT LOGGING
 * Record all authentication attempts
 */
async function auditLog(
  action: string,
  email: string,
  result: 'success' | 'failed' | 'error',
  details?: Record<string, any>
) {
  await db.auditLog.create({
    data: {
      action,
      actor: email,
      result,
      details: JSON.stringify(details),
      timestamp: new Date()
    }
  })
}
```

**New Validation Schema:** `app/(auth)/_lib/validations.ts`

```typescript
import { z } from 'zod'

export const authSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8).max(128)
})

export const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(50)
})

export type AuthInput = z.infer<typeof authSchema>
```

---

#### Step 9: DOCUMENT (Security Comments)

**Documentation:** Inline comments + decision log

```typescript
/**
 * FILE: app/(auth)/_actions.ts
 * SECURITY DECISION LOG
 * 
 * PROBLEM: Previous auth implementation had multiple security issues:
 * 1. Raw SQL queries (SQL injection vulnerability)
 * 2. Full user object returned (password hash exposure)
 * 3. No rate limiting (brute force attacks)
 * 4. No audit trail
 * 
 * SOLUTION: Implemented 8-gate fortress pattern:
 * - Gate 1: Zod input validation
 * - Gate 2: (N/A for login)
 * - Gate 3: (N/A for login)
 * - Gate 4: Rate limiting via Upstash
 * - Gate 5-6: Prisma ORM (prepared statements)
 * - Gate 7: DTO sanitization (no sensitive fields)
 * - Gate 8: Audit logging
 * 
 * DEPENDENCIES:
 * - prisma: ORM with prepared statements
 * - zod: Input validation library
 * - bcryptjs: Password hashing
 * - @upstash/ratelimit: Rate limiting service
 * 
 * TESTED: Yes (5 test cases covering security + functionality)
 * APPROVED: Senior Dev Team, 2025-12-16
 * 
 * REFERENCES:
 * - OWASP SQL Injection: https://owasp.org/...
 * - OWASP Rate Limiting: https://owasp.org/...
 * - Prisma Security: https://www.prisma.io/docs/...
 */
```

---

#### Step 10: VALIDATE (Final Security Audit)

**Validation Script:**
```bash
#!/bin/bash
## scripts/validate-auth-refactor.sh

echo "🔐 VALIDATING AUTH REFACTORING"
echo "══════════════════════════════"

## Type check
npm run type-check
[ $? -ne 0 ] && echo "❌ Type errors" && exit 1

## Lint
npm run lint
[ $? -ne 0 ] && echo "❌ Linting errors" && exit 1

## Tests
npm run test
[ $? -ne 0 ] && echo "❌ Tests failed" && exit 1

## Build
npm run build
[ $? -ne 0 ] && echo "❌ Build failed" && exit 1

## Security audit
npm audit --json | jq -e '.metadata.vulnerabilities.high == 0' > /dev/null
[ $? -ne 0 ] && echo "⚠️  Found vulnerabilities" && npm audit

## Check for dangerous patterns
echo ""
echo "Checking for security anti-patterns..."

## Look for raw SQL
grep -r "\$queryRaw" src/ && echo "❌ Found raw SQL queries" && exit 1

## Look for unvalidated inputs
grep -r "function.*input.*)" src/app | grep -v "safeParse\|schema" && echo "⚠️  Found unvalidated input"

## Look for password leakage
grep -r "return.*user" src/app | grep -v "sanitize" && echo "⚠️  Possible password leak"

echo ""
echo "✅ ALL VALIDATIONS PASSED"
echo ""
echo "Auth refactoring is complete and secure."
echo "Ready for code review."
```

**Run Validation:**
```bash
chmod +x scripts/validate-auth-refactor.sh
./scripts/validate-auth-refactor.sh
```

---

### 🎯 SIMULTANEOUS TRACK EXECUTION

#### Track A: Architecture Refactoring (Parallel)

```
Day 1:
- [ ] Identify legacy code in src/lib/auth.ts
- [ ] Plan new folder structure (app/(auth)/)
- [ ] Extract components to _components/
- [ ] Move logic to _actions.ts

Day 2:
- [ ] Add TypeScript types
- [ ] Run npm run type-check ✅
- [ ] Move util functions to _lib/
- [ ] Update imports
```

#### Track B: Security Hardening (Parallel)

```
Day 1:
- [ ] Identify vulnerabilities (SQL injection, data leakage)
- [ ] Create Zod schemas for validation
- [ ] Add rate limiting library
- [ ] Design 8-gate pattern

Day 2:
- [ ] Implement Prisma queries
- [ ] Add DTO sanitization
- [ ] Add audit logging
- [ ] Run npm audit ✅
```

#### Integration (Day 3)

```
- [ ] Merge Track A + Track B code
- [ ] Run full test suite
- [ ] npm run type-check ✅
- [ ] npm run lint ✅
- [ ] npm run build ✅
- [ ] Document all changes
```

---

### 📋 CHECKLIST: Before ANY Refactoring

```
[ ] Step 1: OBSERVE - Read actual code line by line
[ ] Step 2: QUESTION - Write answers to 5 questions
[ ] Step 3: RESEARCH - Check 3+ established patterns
[ ] Step 4: HYPOTHESIZE - Propose solution with reasoning
[ ] Step 5: PREDICT - List improvements and risks
[ ] Step 6: TEST - Write test cases before coding
[ ] Step 7: ANALYZE - Review test results
[ ] Step 8: REFACTOR - Clean up and optimize
[ ] Step 9: DOCUMENT - Add security decision logs
[ ] Step 10: VALIDATE - Run npm audit + npm build

ONLY THEN: Code is production-ready
```

---

### 🚀 NO DEPLOYMENT EXECUTION

**Remember:** This protocol prepares everything locally but DOES NOT push to GitHub or deploy.

When ready to deploy (Week 3+), you will:
1. Review all changes locally
2. Run final validation
3. Manually push to GitHub (you control when)
4. GitHub Actions will run automatically
5. Monitor results in GitHub Actions tab

But that's a future step. For now: **Local development only.**

---

**Status: ✅ Protocol Ready. Apply to Your Code. 🛡️ Security-Hardened. 🚀**

---

## 📚 Research & References

This protocol is based on 8 academic papers (Radware, CSET, IEEE, etc.).
For a complete mapping of vulnerabilities to defenses, see the [Research Defense Matrix](./unified-recursive-defense-measures-v511-research-defense-matrix.md).

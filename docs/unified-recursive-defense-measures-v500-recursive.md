# Unified Recursive Security

## 🌌 Unified Recursive Security PROTOCOL 5.0.0
### PRODUCTION-GRADE RECURSIVE REFACTORING + SECURITY HARDENING
#### Simultaneous Architecture Upgrades + Vulnerability Remediation (No Hallucinations)

---

### 📋 MASTER OVERVIEW

**Version:** 5.0.0 (Security Hardened)
**Philosophy:** Senior Developer Methods + Scientific Method
**Constraint:** Local-only, preparation-ready (no git/deployment execution)
**Stack:** React 19 + Next.js 15 + PostgreSQL + Established Libraries Only

---

### 🧪 THE 10-STEP SCIENTIFIC METHOD (Core Methodology)

Every action follows this rigorous framework:

```
1. OBSERVE   → Identify problem in actual code (not assumptions)
2. QUESTION  → What is breaking? Why is it breaking?
3. RESEARCH  → Check established patterns + library docs (NOT AI suggestions)
4. HYPOTHESIZE → Propose solution using proven methods
5. PREDICT   → What will happen after fix? What will break?
6. TEST      → Validate locally (type-check, lint, build)
7. ANALYZE   → Did it work? Did it create new problems?
8. REFACTOR  → Clean up based on findings
9. DOCUMENT  → Record why this fix exists
10. VALIDATE → Final security audit (npm audit, dependency check)
```

**Rule:** Before ANY code generation, explain all 10 steps in writing.


### 🛡️ PART 1: THE 5 SECURITY LOGICS (NEW)

These work **alongside** the 5 Architecture Logics.

#### 1️⃣ **DEPENDENCY SECURITY LOGIC**

**Rule:** Only established, actively maintained libraries. Verify origin.

**When:** Before every `npm install` and during refactoring

**How:**

```bash
## STEP 1: Check for known vulnerabilities
npm audit --json > audit-report.json

## STEP 2: Check package authenticity (not hallucinated)
npm view package-name author maintainers time

## STEP 3: Inspect source for red flags
## - Is maintainer a known person/org?
## - Does GitHub have proper CI/CD?
## - Are tests present?
## - Is it actively maintained (last commit < 6 months)?
## - Does it have extensive usage (npm downloads)?

## STEP 4: High-risk patterns to avoid
## ❌ Single maintainer (dead if maintainer abandons)
## ❌ No tests
## ❌ No GitHub (private, suspicious)
## ❌ <1000 weekly downloads (unpopular = untested)
## ❌ Recently created (<3 months)
## ❌ Requesting root/admin permissions

## STEP 5: Approved Library List (Maintain Locally)
## Keep a vetted-libraries.json of APPROVED packages
```

**Vetted Libraries JSON:**
```json
{
  "react": {
    "version": "^19.0.0",
    "approved_date": "2025-12-16",
    "reason": "Industry standard, active maintenance, 100M+ weekly downloads",
    "security_status": "verified",
    "last_checked": "2025-12-16"
  },
  "prisma": {
    "version": "^5.21.0",
    "approved_date": "2025-12-16",
    "reason": "ORM standard, prepared statements prevent injection",
    "security_status": "verified",
    "last_checked": "2025-12-16"
  },
  "@hookform/resolvers": {
    "version": "^3.9.0",
    "approved_date": "2025-12-16",
    "reason": "Form validation standard",
    "security_status": "verified",
    "last_checked": "2025-12-16"
  }
}
```

---

#### 2️⃣ **INPUT VALIDATION SECURITY LOGIC**

**Rule:** All inputs validated at entry. No exceptions.

**When:** Every Server Action, API route, form submission

**How:**

```typescript
// ❌ WRONG: Trust input
export async function updateUser(id: string, data: any) {
  await db.user.update({ where: { id }, data })
}

// ✅ CORRECT: Validate at entry
import { z } from 'zod'  // Established validation library

const updateUserSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  email: z.string().email('Invalid email'),
  age: z.number().int().min(0).max(150),
  // Explicitly define EVERY field
  // Reject unknown fields
}).strict()

export async function updateUser(input: unknown) {
  // VALIDATION GATE 1: Zod parsing
  const result = updateUserSchema.safeParse(input)
  
  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      details: result.error.flatten()
    }
  }

  const { id, email, age } = result.data

  // VALIDATION GATE 2: Business logic checks
  const user = await db.user.findUnique({ where: { id } })
  if (!user) return { success: false, error: 'User not found' }

  // VALIDATION GATE 3: Authorization
  const session = await auth()
  if (session.user.id !== id && session.user.role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  // VALIDATION GATE 4: Execute with prepared statements
  const updated = await db.user.update({
    where: { id },
    data: { email, age }  // Only validated fields
  })

  // VALIDATION GATE 5: Sanitize output
  return {
    success: true,
    data: {
      id: updated.id,
      email: updated.email,
      age: updated.age
      // Exclude: passwordHash, apiKeys, etc.
    }
  }
}
```

---

#### 3️⃣ **OUTPUT SANITIZATION SECURITY LOGIC**

**Rule:** Never return raw database objects. Always use DTOs.

**When:** Every API response, every Server Action return

**How:**

```typescript
// ❌ WRONG: Raw DB object with sensitive data
const user = await db.user.findUnique({ where: { id } })
return user  // Contains: passwordHash, createdAt internals, secret fields

// ✅ CORRECT: DTO pattern (Data Transfer Object)
interface UserDTO {
  id: string
  name: string
  email: string
  // NO: passwordHash, apiKeys, internalFields
}

function sanitizeUser(user: UserFromDB): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  }
}

const user = await db.user.findUnique({ where: { id } })
return { success: true, data: sanitizeUser(user) }
```

---

#### 4️⃣ **DEPENDENCY INJECTION SECURITY LOGIC**

**Rule:** No dynamic imports. No eval(). All dependencies statically resolvable.

**When:** Every new file, every refactoring

**How:**

```typescript
// ❌ WRONG: Dynamic import (hallucination risk)
const handler = await import(`./handlers/${type}.ts`)

// ❌ WRONG: eval() or dynamic code execution
eval(userProvidedCode)

// ✅ CORRECT: Static imports only
import { handleTypeA } from './handlers/type-a'
import { handleTypeB } from './handlers/type-b'

const handlers = {
  'type-a': handleTypeA,
  'type-b': handleTypeB
}

function getHandler(type: string) {
  const handler = handlers[type]
  if (!handler) throw new Error(`Unknown handler: ${type}`)
  return handler
}
```

---

#### 5️⃣ **DATA FLOW SECURITY LOGIC**

**Rule:** Unidirectional flow. No circular imports. No data leakage.

**When:** Every architecture decision

**How:**

```
CORRECT FLOW:
Server Component (page.tsx)
    ↓ (fetches data via Prisma)
    ↓ (validates with Zod)
    ↓ (sanitizes to DTO)
Client Component (via props - serializable only)
    ↓ (user interaction)
    ↓ (calls Server Action)
Server Action (_actions.ts)
    ↓ (validates input again with Zod)
    ↓ (checks authorization)
    ↓ (executes DB query via Prisma)
    ↓ (sanitizes output to DTO)
Response back to Client

❌ NEVER:
- Client accessing Prisma directly
- Passing non-serializable objects as props
- Circular imports (Component → Action → Util → Component)
- Leaking sensitive data in response
```

---

### 🔧 PART 2: THE 8-GATE FORTRESS PATTERN (EXPANDED)

v4.7.5 had 6 gates. v5.0.0 adds 2 more for security.

```
USER INPUT
    ↓
GATE 1: INPUT VALIDATION (Zod)
        ├─ Check type
        ├─ Check range
        └─ Check format

    ↓
GATE 2: AUTHENTICATION (Session)
        ├─ User logged in?
        └─ Session valid?

    ↓
GATE 3: AUTHORIZATION (Permissions)
        ├─ User owns this resource?
        ├─ User has required role?
        └─ Feature enabled for user?

    ↓
GATE 4: RATE LIMITING (New in v5.0.0)
        ├─ Too many requests?
        ├─ Suspicious pattern?
        └─ DDoS detection?

    ↓
GATE 5: QUERY CONSTRUCTION (Prepared Statements)
        ├─ No string interpolation
        ├─ Use Prisma only
        └─ No raw SQL

    ↓
GATE 6: DATABASE EXECUTION
        ├─ Transaction integrity
        ├─ Foreign key constraints
        └─ Data consistency checks

    ↓
GATE 7: OUTPUT SANITIZATION (DTO)
        ├─ Remove sensitive fields
        ├─ Validate response shape
        └─ No leakage

    ↓
GATE 8: AUDIT LOGGING (New in v5.0.0)
        ├─ Log action
        ├─ Log actor
        ├─ Log result
        └─ Log timestamp

    ↓
RESPONSE TO CLIENT
```

**Gate 4 Implementation (Rate Limiting):**
```typescript
import { Ratelimit } from '@upstash/ratelimit'  // Established library
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h')  // 100 requests per hour
})

export async function protectedAction(userId: string) {
  const { success } = await ratelimit.limit(userId)
  
  if (!success) {
    return { success: false, error: 'Rate limited' }
  }

  // Continue with action...
}
```

**Gate 8 Implementation (Audit Logging):**
```typescript
async function auditLog(
  action: string,
  actor: string,
  resource: string,
  result: 'success' | 'failure',
  details?: Record<string, any>
) {
  await db.auditLog.create({
    data: {
      action,
      actor,
      resource,
      result,
      details: JSON.stringify(details),
      timestamp: new Date(),
      userAgent: headers().get('user-agent'),
      ipAddress: headers().get('x-forwarded-for')
    }
  })
}
```

---

### 🔍 PART 3: 10-STEP SCIENTIFIC METHOD IN PRACTICE

#### Example: Fixing SQL Injection Vulnerability

##### Step 1: OBSERVE
```typescript
// Current problematic code
export async function searchUsers(query: string) {
  const sql = `SELECT * FROM users WHERE name LIKE '%${query}%'`
  const results = await db.$queryRaw(sql)
  return results
}

// OBSERVATION: String interpolation in SQL query
```

##### Step 2: QUESTION
- **What is breaking?** SQL injection vulnerability
- **Why?** User input `query` is directly concatenated into SQL
- **How severe?** Critical - attacker can extract all data or modify database

##### Step 3: RESEARCH
- Check Prisma documentation: "Use prepared statements, never raw SQL"
- Check OWASP: SQL Injection prevention methods
- Conclusion: Use Prisma `findMany()` with `where` clause instead

##### Step 4: HYPOTHESIZE
```typescript
// Proposed fix: Use Prisma's built-in parameterization
export async function searchUsers(query: string) {
  return db.user.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive'  // Case-insensitive search
      }
    }
  })
}
```

**Hypothesis:** Prisma will automatically escape the query parameter.

##### Step 5: PREDICT
- ✅ Will prevent SQL injection (Prisma uses prepared statements)
- ✅ Will still search correctly
- ❓ Might need to validate `query` length (DoS risk if too long)
- ❓ Performance implications for large datasets?

##### Step 6: TEST
```typescript
// Test 1: Normal query
const result = await searchUsers('John')
// Expected: Returns users with name containing 'John'

// Test 2: SQL injection attempt
const result = await searchUsers("' OR '1'='1")
// Expected: Searches for literal string, no injection

// Test 3: Length limit
const result = await searchUsers('a'.repeat(10000))
// Expected: Should handle gracefully (add validation)

// All tests pass locally
npm run build  # ✅ Passes
npm run lint   # ✅ Passes
npm run type-check  # ✅ Passes
```

##### Step 7: ANALYZE
```
Results:
✅ SQL injection prevented
✅ Normal search works
⚠️  Query length not limited (add validation)

New finding: Need to add input length validation
```

##### Step 8: REFACTOR
```typescript
// Add input validation
const searchSchema = z.object({
  query: z.string()
    .min(1, 'Search query required')
    .max(100, 'Search query too long')
})

export async function searchUsers(input: unknown) {
  const { success, data, error } = searchSchema.safeParse(input)
  
  if (!error) {
    return { success: false, error: error.flatten() }
  }

  const results = await db.user.findMany({
    where: {
      name: { contains: data.query, mode: 'insensitive' }
    },
    take: 100  // Limit results
  })

  return { success: true, data: results.map(sanitizeUser) }
}
```

##### Step 9: DOCUMENT
```typescript
// File: src/app/(dashboard)/users/_lib/search.ts

/**
 * SECURITY DECISION LOG: SearchUsers Function
 * 
 * PROBLEM: Previous implementation used raw SQL with string interpolation.
 * Vulnerable to SQL injection (CVE pattern: direct query concatenation).
 * 
 * SOLUTION: Migrated to Prisma ORM with parameterized queries.
 * - Input validated with Zod (max 100 chars)
 * - Prisma handles escaping automatically
 * - Added rate limiting (100 results max)
 * 
 * FIXED BY: Senior Dev, Dec 16 2025
 * TESTED: Unit tests + SQL injection attempts
 * VALIDATION: npm audit clean, npm run build ✅
 * 
 * REFERENCES:
 * - OWASP SQL Injection: https://owasp.org/...
 * - Prisma Docs: https://www.prisma.io/docs/...
 * - Security Review: Issue #42 on GitHub
 */
```

##### Step 10: VALIDATE
```bash
## Security validation
npm audit --json | jq '.metadata.vulnerabilities'
## Expected: No high/critical vulnerabilities

## Dependency check
npm ls prisma
## Expected: Version is current and maintained

## Type check
npm run type-check
## Expected: ✅ All types valid

## Build
npm run build
## Expected: ✅ Production build succeeds

## Security audit
grep -r "queryRaw" src/
## Expected: No raw SQL queries found

## Documentation
grep -r "SECURITY DECISION LOG" src/
## Expected: All security changes documented
```

---

### 📊 PART 4: SIMULTANEOUS REFACTORING + REMEDIATION

#### The Parallel Track Model

Instead of sequential (Refactor THEN Fix), do both simultaneously:

```
TRADITIONAL (SLOW):
Week 1: Identify issues → Week 2: Refactor → Week 3: Fix security → Week 4: Test
                                    ↓
                            Takes 4 weeks

Unified Recursive Defense Measures 5.0.0 (FAST):
Day 1: Identify issues
    ├─ Track A: Architecture Refactoring
    │   ├─ Separate concerns
    │   ├─ Move components to app/(domain)/
    │   └─ Apply 5 Logics
    │
    └─ Track B: Security Hardening (Parallel)
        ├─ Add input validation (Zod)
        ├─ Add DTO sanitization
        ├─ Add audit logging
        └─ Run npm audit + fixes

Day 2: Integration Testing
    ├─ Track A + Track B merge in test environment
    ├─ Run full validation suite
    └─ Document changes

                            Takes 2 days
```

#### Implementation: Two-Track Workflow

**Track A: Architecture Refactoring**
```
1. Identify legacy code (spaghetti structure)
2. Plan folder reorganization (app/(domain)/[feature]/)
3. Extract components to _components/
4. Move logic to _actions.ts and _lib/
5. Add TypeScript types
6. Run: npm run type-check
```

**Track B: Security Hardening (Parallel)**
```
1. Identify vulnerable patterns (string interpolation in SQL, missing validation)
2. Add Zod schemas
3. Implement 8-gate fortress
4. Add audit logging
5. Run: npm audit --fix
6. Run: npm run build
```

**Integration Point:**
```typescript
// Result: Single file that is both refactored AND hardened

// OLD (app/user-profile/page.tsx - Messy)
export default async function Page() {
  const user = await fetch(`/api/user/${id}`)  // No error handling
  return <div>{user.name}</div>  // Raw object
}

// NEW (app/(profile)/settings/_components/user-profile.tsx - Clean + Secure)
'use client'
import { updateUserAction } from '../_actions'
import { updateUserSchema } from '../_lib/validations'

export function UserProfile({ user }: { user: UserDTO }) {
  const [pending, startTransition] = useTransition()

  const onUpdate = (data: unknown) => {
    startTransition(async () => {
      const result = await updateUserAction(data)
      if (!result.success) {
        toast.error(result.error)
      }
    })
  }

  return <form onSubmit={() => onUpdate({...})} />
}

// _actions.ts (NEW - Secure)
'use server'
export async function updateUserAction(input: unknown) {
  // Gate 1: Validate
  const parsed = updateUserSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: '...' }

  // Gate 2: Authenticate
  const session = await auth()
  if (!session) return { success: false, error: 'Unauthorized' }

  // Gate 3: Authorize
  const canUpdate = checkPermission(session.user, parsed.data.userId)
  if (!canUpdate) return { success: false, error: 'Forbidden' }

  // Gate 4: Rate limit
  const rateLimited = await checkRateLimit(session.user.id)
  if (rateLimited) return { success: false, error: 'Rate limited' }

  // Gates 5-6: Execute
  const updated = await db.user.update({
    where: { id: parsed.data.userId },
    data: { ...parsed.data }
  })

  // Gate 7: Sanitize
  const sanitized = sanitizeUser(updated)

  // Gate 8: Audit
  await auditLog('update-user', session.user.id, parsed.data.userId, 'success')

  return { success: true, data: sanitized }
}
```

---

### 🎯 PART 5: DEPENDENCY VALIDATION PROTOCOL

#### When: Every `npm install`, every refactoring, every week

#### How:

```bash
#!/bin/bash
## File: scripts/validate-dependencies.sh

echo "🔐 DEPENDENCY SECURITY VALIDATION"
echo "════════════════════════════════════"

## STEP 1: Audit for known vulnerabilities
echo ""
echo "1️⃣  Checking for known vulnerabilities..."
npm audit --production

## STEP 2: Check outdated packages
echo ""
echo "2️⃣  Checking for outdated packages..."
npm outdated

## STEP 3: Validate package authenticity
echo ""
echo "3️⃣  Validating package authenticity..."

## Read vetted-libraries.json and check each
VETTEDLIBS=$(cat scripts/vetted-libraries.json | jq -r '.[] | .name')

for lib in $VETTEDLIBS; do
  AUTHOR=$(npm view $lib author.name 2>/dev/null)
  DOWNLOADS=$(npm view $lib npm stat.downloads.last-month 2>/dev/null)
  
  echo "  $lib"
  echo "    - Author: $AUTHOR"
  echo "    - Monthly Downloads: $DOWNLOADS"
  
  if [ -z "$AUTHOR" ]; then
    echo "    ❌ WARNING: Could not verify author"
  fi
  
  if [ "$DOWNLOADS" -lt 1000 ]; then
    echo "    ⚠️  WARNING: Low download count (<1000)"
  fi
done

## STEP 4: Check for suspicious patterns
echo ""
echo "4️⃣  Checking for suspicious patterns..."

## Look for packages requesting root
npm audit --json | jq '.vulnerabilities[] | select(.severity == "critical")'

## STEP 5: Verify no hallucinated packages
echo ""
echo "5️⃣  Checking package.json against vetted list..."
PACKAGEJSON=$(cat package.json | jq '.dependencies')

echo "$PACKAGEJSON" | jq 'keys[]' | while read PACKAGE; do
  CLEAN=$(echo "$PACKAGE" | tr -d '"')
  
  # Check if package exists on npm
  npm view "$CLEAN" > /dev/null 2>&1
  
  if [ $? -ne 0 ]; then
    echo "  ❌ PHANTOM PACKAGE: $CLEAN (Does not exist on npm)"
  else
    echo "  ✅ $CLEAN (verified)"
  fi
done

echo ""
echo "════════════════════════════════════"
echo "✅ Dependency validation complete"
```

#### Vetted Libraries List (Maintained Locally)

```json
{
  "dependencies": {
    "react": {
      "version": "^19.0.0",
      "reason": "Core framework, 100M+ weekly downloads, active maintenance",
      "approved_date": "2025-12-16",
      "last_security_check": "2025-12-16",
      "security_status": "verified"
    },
    "next": {
      "version": "^15.1.0",
      "reason": "Framework with built-in security features (CSRF protection, etc.)",
      "approved_date": "2025-12-16",
      "last_security_check": "2025-12-16",
      "security_status": "verified"
    },
    "prisma": {
      "version": "^5.21.0",
      "reason": "ORM with prepared statements (prevents SQL injection)",
      "approved_date": "2025-12-16",
      "last_security_check": "2025-12-16",
      "security_status": "verified"
    },
    "zod": {
      "version": "^3.23.0",
      "reason": "Input validation library, prevents injection attacks",
      "approved_date": "2025-12-16",
      "last_security_check": "2025-12-16",
      "security_status": "verified"
    },
    "react-hook-form": {
      "version": "^7.51.0",
      "reason": "Form handling, works with Zod for validation",
      "approved_date": "2025-12-16",
      "last_security_check": "2025-12-16",
      "security_status": "verified"
    }
  },
  "devDependencies": {
    "typescript": {
      "version": "^5.3.0",
      "reason": "Type safety, catches type errors at compile time",
      "approved_date": "2025-12-16",
      "last_security_check": "2025-12-16",
      "security_status": "verified"
    },
    "eslint": {
      "version": "^8.56.0",
      "reason": "Code quality, security rule detection",
      "approved_date": "2025-12-16",
      "last_security_check": "2025-12-16",
      "security_status": "verified"
    }
  }
}
```

---

### 🏗️ PART 6: BEFORE EVERY REFACTORING/SECURITY FIX

#### The 10-Step Checklist (Mandatory)

**1. OBSERVE**
- [ ] Read the actual code (not assumptions)
- [ ] Identify the specific problem (line number, function name)
- [ ] Verify the problem is real (not imagined)
- [ ] Check: Is this a refactoring task or security fix?

**Example:**
```
File: src/app/api/users/route.ts
Line 42: const sql = `SELECT * FROM users WHERE id = ${req.query.id}`
Problem: SQL Injection vulnerability
Type: Security Fix
```

**2. QUESTION**
- [ ] What specifically is broken?
- [ ] Why is it broken?
- [ ] What is the impact? (Low/Medium/High/Critical)
- [ ] Who is affected?

**Example:**
```
Q: What specifically is broken?
A: User input (id) is directly interpolated into SQL string

Q: Why?
A: Developer used template literal instead of prepared statements

Q: Impact?
A: Critical - attacker can extract all user data or modify database

Q: Who?
A: Any unauthenticated user
```

**3. RESEARCH**
- [ ] Check established library documentation
- [ ] Check OWASP guidelines
- [ ] Check framework best practices
- [ ] Find reference implementations
- [ ] ❌ DO NOT ask AI for code suggestions yet

**Example:**
```
Reference 1: Prisma Docs - Prepared Statements
→ Use db.user.findMany({ where: { id } })

Reference 2: OWASP - SQL Injection Prevention
→ Never concatenate user input into SQL
→ Always use parameterized queries

Reference 3: Next.js Docs - Server Actions
→ Built-in validation layer
```

**4. HYPOTHESIZE**
- [ ] Propose solution using ONLY established patterns
- [ ] Explain why this solution works
- [ ] Identify potential side effects
- [ ] Plan for backward compatibility

**Example:**
```
Solution: Replace raw SQL with Prisma ORM

Why this works:
- Prisma uses parameterized queries
- Automatically escapes user input
- Type-safe query construction

Side effects:
- Might change response structure (need DTO mapping)
- Performance implications unknown (need benchmarking)

Backward compatibility:
- Need database migration if schema changes
```

**5. PREDICT**
- [ ] What will improve? (List specific improvements)
- [ ] What might break? (List potential issues)
- [ ] What new risks might appear?
- [ ] Can you mitigate those risks?

**Example:**
```
Improvements:
✅ SQL injection prevented
✅ Code becomes type-safe
✅ Easier to maintain

Potential issues:
⚠️  Response structure changes (need API versioning)
⚠️  Performance might differ (need testing)
⚠️  Developers unfamiliar with Prisma (need documentation)

Mitigation:
- Add DTO mapping to maintain response structure
- Run performance benchmarks
- Document all changes with comments
```

**6. TEST**
- [ ] Write unit tests for the fix
- [ ] Test with invalid input
- [ ] Test with edge cases
- [ ] Run full validation suite

```typescript
// tests/api-users.test.ts

describe('GET /api/users', () => {
  it('should return users matching ID', async () => {
    const user = await db.user.create({ data: { name: 'John' } })
    const response = await GET({ query: { id: user.id } })
    expect(response.status).toBe(200)
  })

  it('should not allow SQL injection', async () => {
    const response = await GET({ 
      query: { id: "' OR '1'='1" } 
    })
    expect(response.status).toBe(400)  // Should reject
  })

  it('should handle missing ID', async () => {
    const response = await GET({ query: {} })
    expect(response.status).toBe(400)
  })
})
```

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

**7. ANALYZE**
- [ ] Did tests pass?
- [ ] Did performance meet expectations?
- [ ] Did new issues appear?
- [ ] What did we learn?

**Example:**
```
Results:
✅ All tests passed
✅ No type errors
⚠️  Performance: 10ms → 12ms (acceptable)
✅ npm audit: No new vulnerabilities

Learning:
- Prisma ORM is more secure than raw SQL
- DTO mapping is necessary for backwards compatibility
- Need to add rate limiting for list endpoints
```

**8. REFACTOR**
- [ ] Clean up code based on findings
- [ ] Remove temporary workarounds
- [ ] Add error handling
- [ ] Optimize performance if needed

**9. DOCUMENT**
- [ ] Add security decision comments
- [ ] Document why this pattern was chosen
- [ ] Add references to security guidelines
- [ ] Record the date and author

**10. VALIDATE**
- [ ] Run security audit
- [ ] Check dependencies
- [ ] Verify no new vulnerabilities
- [ ] Get code review approval

```bash
## Final validation
npm audit
npm outdated
npm run build
npm run type-check
npm run lint
```

---

### 📋 PART 7: REFACTORING TEMPLATE

Use this template for EVERY refactoring/security fix:

```markdown
## REFACTORING/SECURITY FIX TEMPLATE

### 1. OBSERVE
**File:** src/app/api/users/route.ts
**Problem:** SQL Injection vulnerability on line 42
**Type:** Security Fix (Critical)
**Severity:** Critical

### 2. QUESTION
**What's broken?** User input directly in SQL query
**Why?** Template literal instead of prepared statements
**Impact?** Attacker can steal/modify all user data
**Affected?** Any unauthenticated user

### 3. RESEARCH
**Reference 1:** [Prisma Prepared Statements](url)
**Reference 2:** [OWASP SQL Injection](url)
**Reference 3:** [Next.js Security Best Practices](url)
**Conclusion:** Use Prisma ORM instead of raw SQL

### 4. HYPOTHESIZE
**Solution:** Replace `db.$queryRaw()` with `db.user.findMany()`
**Why works:** Prisma automatically escapes parameters
**Side effects:** Response structure might change
**Mitigation:** Add DTO mapping to maintain API contract

### 5. PREDICT
**Improvements:**
- ✅ SQL injection prevented
- ✅ Type-safe queries
- ✅ Easier maintenance

**Risks:**
- ⚠️ Response structure changes
- ⚠️ Performance unknown
- ⚠️ Breaking API change

### 6. TEST
**Test cases written:** 3
**All tests passing?** ✅ Yes
**Type checking?** ✅ Pass
**Build succeeds?** ✅ Yes
**Lint passes?** ✅ Yes

### 7. ANALYZE
**Results:** ✅ Successful
**Performance:** 10ms → 12ms (acceptable)
**New issues?** None
**Learning:** Prisma is significantly more secure

### 8. REFACTOR
**Code cleanup:** ✅ Done
**Error handling:** ✅ Added
**Comments:** ✅ Added

### 9. DOCUMENT
**Security comments:** ✅ Added
**References:** ✅ Added
**Author:** Senior Dev
**Date:** 2025-12-16

### 10. VALIDATE
**npm audit:** ✅ No vulnerabilities
**Dependencies verified:** ✅ Yes
**Code review:** ⏳ Pending

---

### FILES CHANGED
- src/app/api/users/route.ts (refactored)
- src/app/api/users/_lib/sanitize.ts (new - DTO)
- tests/api-users.test.ts (new - tests)

### BREAKING CHANGES
Yes. Response structure changed from array to object.
Migration guide: [link to migration]
```

---

### 🚀 PART 8: SIMULTANEOUS EXECUTION CHECKLIST

#### Refactoring Track + Security Hardening Track (Parallel)

**Day 1: Preparation**
```
Track A (Refactoring):         Track B (Security):
- [ ] Identify legacy files    - [ ] Run npm audit
- [ ] Plan folder structure    - [ ] Identify vulnerabilities
- [ ] Extract components       - [ ] Plan fixes
- [ ] Move logic to _actions   - [ ] Create Zod schemas
```

**Day 2: Execution**
```
Track A:                                Track B:
- [ ] Move components to _components/  - [ ] Add input validation
- [ ] Extract to _actions.ts           - [ ] Add DTO sanitization
- [ ] Add TypeScript types             - [ ] Add audit logging
- [ ] Run npm run type-check ✅        - [ ] Implement 8-gate pattern
                                       - [ ] Run npm audit --fix ✅
```

**Day 3: Integration & Testing**
```
Combined:
- [ ] Merge Track A + Track B
- [ ] Run full test suite
- [ ] npm run type-check ✅
- [ ] npm run lint ✅
- [ ] npm run build ✅
- [ ] npm audit --final ✅
- [ ] Document all changes ✅
```

---

### 🎯 PART 9: NO AI CODE GENERATION (Validation Process)

#### When an AI suggests code, validate it like this:

```
AI Suggestion:
  import { protect } from '@awesome-auth-lib'
  
  function validateUser(user) {
    return protect(user)
  }

YOUR VALIDATION PROCESS:

1. QUESTION: Does @awesome-auth-lib exist?
   $ npm view @awesome-auth-lib
   → If not found, REJECT (hallucination)

2. RESEARCH: Is this library actually used for this purpose?
   → Check GitHub: How many downloads? Recent updates?
   → Check OWASP: Is this the recommended approach?
   → If low adoption or not recommended, QUESTION the suggestion

3. INSPECT: What does protect() actually do?
   → Read the actual source code
   → Does it match what AI claims?
   → Or is it a hallucination?

4. TEST: Write test case
   validate({ invalid: 'data' })
   → Does it catch errors? Or pass silently?
   → If silent failure, REJECT

5. DECIDE: Is this established pattern?
   → Can you find 10+ production examples?
   → Is it officially documented?
   → Or is it niche/risky?

REJECTION CRITERIA:
❌ Package doesn't exist
❌ Low adoption (<1000 weekly downloads)
❌ No recent maintenance
❌ Not officially recommended for this use case
❌ Fails tests
❌ Unclear source code
```

---

### 📊 PART 10: VALIDATION GATES BEFORE DEPLOYMENT (Preparation Only)

#### You must do this locally. No GitHub push yet.

```bash
#!/bin/bash
## File: scripts/final-validation-before-deployment.sh

echo "🌌 FINAL VALIDATION BEFORE DEPLOYMENT PREPARATION"
echo "══════════════════════════════════════════════════"
echo ""

FAILED=0

## GATE 1: Type Safety
echo "GATE 1: Type Safety (TypeScript Strict Mode)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if npm run type-check; then
  echo "✅ Type checking passed"
else
  echo "❌ Type errors found. Fix and retry."
  FAILED=1
fi
echo ""

## GATE 2: Code Quality
echo "GATE 2: Code Quality (ESLint)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if npm run lint; then
  echo "✅ Linting passed"
else
  echo "❌ Linting errors found. Fix and retry."
  FAILED=1
fi
echo ""

## GATE 3: Security Audit
echo "GATE 3: Security Audit (npm audit)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if npm audit --json | jq -e '.metadata.vulnerabilities.high == 0 and .metadata.vulnerabilities.critical == 0' > /dev/null; then
  echo "✅ No high/critical vulnerabilities"
else
  echo "⚠️  Found vulnerabilities. Review and fix."
  npm audit
  FAILED=1
fi
echo ""

## GATE 4: Build Success
echo "GATE 4: Production Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━"
if npm run build; then
  echo "✅ Production build successful"
  echo "   Build size: $(du -sh .next 2>/dev/null | cut -f1)"
else
  echo "❌ Build failed. Fix errors above."
  FAILED=1
fi
echo ""

## GATE 5: Dependency Verification
echo "GATE 5: Dependency Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Checking all dependencies exist and are legitimate..."

PHANTOMS=0
npm ls --all | grep -i "phantom\|unmet\|missing" && PHANTOMS=1

if [ $PHANTOMS -eq 0 ]; then
  echo "✅ All dependencies legitimate"
else
  echo "❌ Found phantom/missing dependencies"
  FAILED=1
fi
echo ""

## GATE 6: Security Logic Verification
echo "GATE 6: Security Logic Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Checking for security anti-patterns..."

## Look for dangerous patterns
DANGEROUS_PATTERNS=0

## Check for raw SQL
grep -r "\$queryRaw" src/ && DANGEROUS_PATTERNS=1

## Check for eval()
grep -r "eval(" src/ && DANGEROUS_PATTERNS=1

## Check for 'use client' with database imports
grep -l "'use client'" src/**/*.ts* | xargs -I {} sh -c 'grep -l "import.*prisma\|from.*@/lib/db" {} && DANGEROUS_PATTERNS=1'

## Check for missing input validation
## (This is harder, but look for Server Actions without Zod)
ACTIONS_WITHOUT_ZOD=$(find src -name "_actions.ts" | while read f; do
  if ! grep -q "import.*zod" "$f"; then
    echo "$f"
  fi
done | wc -l)

if [ $ACTIONS_WITHOUT_ZOD -gt 0 ]; then
  echo "⚠️  Found $ACTIONS_WITHOUT_ZOD Server Action(s) without Zod validation"
  DANGEROUS_PATTERNS=1
fi

if [ $DANGEROUS_PATTERNS -eq 0 ]; then
  echo "✅ No dangerous patterns detected"
else
  echo "⚠️  Security anti-patterns found. Review and fix."
  FAILED=1
fi
echo ""

## FINAL VERDICT
echo "══════════════════════════════════════════════════"
if [ $FAILED -eq 0 ]; then
  echo ""
  echo "✅ ALL GATES PASSED"
  echo ""
  echo "System is ready for deployment preparation."
  echo "Next steps:"
  echo "  1. Code review by team"
  echo "  2. Document all changes"
  echo "  3. Create deployment plan"
  echo "  4. When ready: git push origin main"
  echo ""
  exit 0
else
  echo ""
  echo "❌ GATES FAILED"
  echo ""
  echo "Fix errors above before proceeding."
  echo ""
  exit 1
fi
```

---

### 📝 PART 11: DOCUMENTATION TEMPLATE (For Every Fix)

```markdown
## SECURITY DECISION LOG
### File: src/app/api/users/route.ts
### Date: 2025-12-16
### Author: Senior Dev Team

#### PROBLEM STATEMENT
SQL Injection vulnerability in user search endpoint.
User input directly concatenated into SQL query.

#### VULNERABILITY DETAILS
- **Type:** SQL Injection
- **Severity:** Critical
- **CVSS Score:** 9.8
- **CWE:** CWE-89
- **OWASP:** A03:2021 – Injection

#### SOLUTION IMPLEMENTED
Migrated from raw SQL to Prisma ORM.

**Before:**
```typescript
const sql = `SELECT * FROM users WHERE id = ${id}`
const result = await db.$queryRaw(sql)
```

**After:**
```typescript
const result = await db.user.findUnique({ where: { id } })
```

#### WHY THIS WORKS
- Prisma uses prepared statements
- User input automatically parameterized
- Database engine handles escaping
- Type-safe query construction

#### TESTING
- Unit tests: ✅ Pass (3 test cases)
- SQL injection tests: ✅ Pass
- Type checking: ✅ Pass
- Build: ✅ Pass

#### REFERENCES
1. OWASP SQL Injection Prevention: https://owasp.org/...
2. Prisma Prepared Statements: https://www.prisma.io/...
3. CWE-89: Improper Neutralization of Special Elements used in an SQL Command: https://cwe.mitre.org/...

#### APPROVAL
- [x] Code review approved
- [x] Security review approved
- [x] Tests passing
- [ ] Deployed (pending)

#### FOLLOW-UP
- Add database query logging for audit trail
- Implement query performance monitoring
- Document security decision in team wiki
```

---

### 🎓 SUMMARY: THE 5 KEY CHANGES FROM v4.7.5 → v5.0.0

| Aspect | v4.7.5 | v5.0.0 |
|--------|--------|--------|
| **Security Focus** | Architecture only | Architecture + Security |
| **Gates** | 6 | 8 (added rate limiting + audit logging) |
| **Input Validation** | Optional | Mandatory (Zod) |
| **Output Sanitization** | Not enforced | DTO pattern mandatory |
| **Dependency Validation** | None | npm audit + originality checks |
| **Simultaneous Processing** | Sequential | Parallel (2 tracks) |
| **Documentation** | Minimal | Decision logs mandatory |
| **Hallucination Defense** | Prevents imports | Validates all 10 steps + library audit |

---

### ✨ FINAL CHECKLIST

Before ANY code generation or refactoring:

```
[ ] Step 1: OBSERVE - Read actual code
[ ] Step 2: QUESTION - Identify the problem
[ ] Step 3: RESEARCH - Check established libraries
[ ] Step 4: HYPOTHESIZE - Propose solution
[ ] Step 5: PREDICT - Identify risks
[ ] Step 6: TEST - Write tests locally
[ ] Step 7: ANALYZE - Review results
[ ] Step 8: REFACTOR - Clean up code
[ ] Step 9: DOCUMENT - Add security comments
[ ] Step 10: VALIDATE - npm audit + build

ONLY THEN: Code is ready
```

---

**Status: 🌌 Unified Recursive Defense Measures PROTOCOL 5.0.0 READY FOR PRODUCTION DEVELOPMENT. 🛡️ Security-Hardened Against Synthetic Vulnerabilities. 🚀**

*Remember: The Build is NOT Always God. Validation of Build + Security + Testing = Truth.*

---

## 📚 Research & References

This protocol is based on 8 academic papers (Radware, CSET, IEEE, etc.).
For a complete mapping of vulnerabilities to defenses, see the [Research Defense Matrix](./unified-recursive-defense-measures-v511-research-defense-matrix.md).

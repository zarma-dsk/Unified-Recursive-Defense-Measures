import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// "Middleware" is now often conceptually replaced by "Proxy" or specific boundary checks in Next 16 logic,
// but for edge handling, the file location convention hasn't fully forced a rename to 'proxy.ts' 
// for the *middleware* functionality universally in all docs yet, 
// though the prompt mentioned proxy.ts replacing middleware.ts.
/**
 * Injects a security header and continues the Next.js response pipeline for an incoming request.
 *
 * @param request - The incoming Next.js request to handle
 * @returns A NextResponse that continues processing with the `X-XSS-Protection: 1; mode=block` header set
 */
// We will export the 'proxy' function as requested by the migration guide pattern analysis.

export function proxy(request: NextRequest) {
  // Accessing request to prevent unused variable error in strict mode
  console.log(`Proxying request: ${request.url}`);

  const response = NextResponse.next();

  // Add security headers that should be present on every response handled by this proxy
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Example: simple logging or auth check could go here
  
  return response;
}

// Config to match all paths except static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
};

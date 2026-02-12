import { NextRequest, NextResponse } from 'next/server';
import { validateSecurity } from '@/utils/validation';

/**
 * Security middleware to validate all incoming requests
 */
export function securityMiddleware(request: NextRequest) {
  // Skip security checks for static files and API routes that don't need it
  if (
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/api/auth/login')
  ) {
    return NextResponse.next();
  }

  // Check URL parameters for malicious content
  const searchParams = request.nextUrl.searchParams;
  for (const [key, value] of searchParams.entries()) {
    const securityCheck = validateSecurity(value);
    if (!securityCheck.isSafe) {
      console.warn(`Security threat detected in URL parameter ${key}:`, securityCheck.threats);
      return NextResponse.json(
        { error: 'Invalid request parameters detected' },
        { status: 400 }
      );
    }
  }

  // Check headers for malicious content (common attack vectors)
  const suspiciousHeaders = ['user-agent', 'referer', 'x-forwarded-for'];
  for (const header of suspiciousHeaders) {
    const value = request.headers.get(header);
    if (value) {
      const securityCheck = validateSecurity(value);
      if (!securityCheck.isSafe) {
        console.warn(`Security threat detected in header ${header}:`, securityCheck.threats);
        return NextResponse.json(
          { error: 'Invalid request headers detected' },
          { status: 400 }
        );
      }
    }
  }

  // Add security headers to response
  const response = NextResponse.next();
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"
  );
  
  // X-Frame-Options
  response.headers.set('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  return response;
}

/**
 * Rate limiting store (in production, use Redis or similar)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiting middleware
 */
export function rateLimitMiddleware(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const now = Date.now();
  
  const clientData = rateLimitStore.get(ip);
  
  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return NextResponse.next();
  }
  
  if (clientData.count >= maxRequests) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
  
  // Increment count
  clientData.count++;
  rateLimitStore.set(ip, clientData);
  
  return NextResponse.next();
}
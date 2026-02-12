import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput, sanitizeForDisplay } from '@/utils/sanitize';
import { validateSecurity } from '@/utils/validation';

/**
 * Test endpoint to demonstrate input sanitization and security validation
 * This endpoint shows before/after examples of XSS and SQL injection prevention
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testInput } = body;

    if (!testInput || typeof testInput !== 'string') {
      return NextResponse.json(
        { error: 'testInput is required and must be a string' },
        { status: 400 }
      );
    }

    // Security validation
    const securityCheck = validateSecurity(testInput);
    
    // Sanitization examples
    const sanitizedStrict = sanitizeInput(testInput);
    const sanitizedDisplay = sanitizeForDisplay(testInput);

    // Common attack examples for demonstration
    const commonAttacks = [
      '<script>alert("XSS Attack!")</script>',
      "'; DROP TABLE users; --",
      '<img src="x" onerror="alert(\'XSS\')">',
      "' OR 1=1 --",
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    ];

    const attackResults = commonAttacks.map(attack => ({
      original: attack,
      sanitized: sanitizeInput(attack),
      securityCheck: validateSecurity(attack),
    }));

    return NextResponse.json({
      input: {
        original: testInput,
        sanitizedStrict,
        sanitizedDisplay,
        securityCheck,
      },
      commonAttackExamples: attackResults,
      explanation: {
        sanitizedStrict: 'Removes all HTML tags and potentially dangerous content',
        sanitizedDisplay: 'Allows basic formatting tags like <b>, <i>, <p>',
        securityCheck: 'Detects potential XSS and SQL injection attempts',
      },
    });

  } catch (error) {
    console.error('Error in security test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to show security headers and configuration
 */
export async function GET() {
  return NextResponse.json({
    message: 'Security test endpoint',
    securityFeatures: [
      'Input sanitization using sanitize-html',
      'XSS detection and prevention',
      'SQL injection detection',
      'Security headers (CSP, X-Frame-Options, etc.)',
      'Input validation with custom schemas',
      'Rate limiting middleware',
    ],
    testInstructions: {
      method: 'POST',
      body: {
        testInput: 'Your test string here (try XSS or SQL injection attempts)',
      },
      examples: [
        '<script>alert("test")</script>',
        "'; DROP TABLE users; --",
        '<img src="x" onerror="alert(\'test\')">',
      ],
    },
  });
}
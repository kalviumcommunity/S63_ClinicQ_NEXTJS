# MediQueue - Secure Queue Management System

A Next.js-based queue management system for medical facilities with comprehensive security features and OWASP compliance.

## Security Features

### Input Sanitization & OWASP Compliance ✅

Our application implements comprehensive security measures to protect against common web vulnerabilities:

#### XSS (Cross-Site Scripting) Prevention
- **HTML Sanitization**: All user inputs are sanitized using `sanitize-html` library
- **Output Encoding**: React's built-in XSS protection with safe rendering components
- **Content Security Policy**: Strict CSP headers prevent script injection

#### SQL Injection Prevention
- **Parameterized Queries**: All database queries use Prisma ORM with parameterized statements
- **Input Validation**: Server-side validation before database operations
- **Type Safety**: TypeScript ensures type-safe database interactions

#### Security Headers
- `Content-Security-Policy`: Prevents XSS and data injection attacks
- `X-Frame-Options: DENY`: Prevents clickjacking attacks
- `X-Content-Type-Options: nosniff`: Prevents MIME type sniffing
- `X-XSS-Protection`: Browser XSS filtering
- `Referrer-Policy`: Controls referrer information
- `Permissions-Policy`: Restricts browser features

#### Input Validation & Sanitization
- **Phone Numbers**: Validates and sanitizes to digits only
- **Names**: Allows only letters, spaces, hyphens, apostrophes
- **Emails**: Validates format and normalizes
- **Text Fields**: HTML tag removal with length limits
- **Numbers**: Type validation and range checking

### Before/After Security Examples

#### XSS Attack Prevention
```javascript
// Before (Vulnerable)
<div>{userInput}</div> // Could execute: <script>alert('XSS')</script>

// After (Secure)
<SafeDisplay content={userInput} /> // Sanitized: alert('XSS')
```

#### SQL Injection Prevention
```javascript
// Before (Vulnerable)
const user = await db.query(`SELECT * FROM users WHERE name = '${name}'`);

// After (Secure)
const user = await prisma.user.findFirst({ where: { name: sanitizedName } });
```

### Security Testing

Visit `/security-demo` to test our security features:
- Input sanitization demonstration
- XSS attack prevention
- SQL injection detection
- Real-time security analysis

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Security Utilities

### Sanitization Functions
- `sanitizeInput()`: Removes all HTML tags
- `sanitizeForDisplay()`: Allows basic formatting tags
- `sanitizeEmail()`: Validates and normalizes emails
- `sanitizePhone()`: Extracts digits only
- `sanitizeName()`: Allows only valid name characters

### Validation Functions
- `validateInput()`: Schema-based validation
- `detectXSS()`: XSS pattern detection
- `detectSQLInjection()`: SQL injection detection
- `validateSecurity()`: Comprehensive threat analysis

### Secure Components
- `SafeDisplay`: XSS-safe content rendering
- `SecureForm`: Built-in sanitization and validation

## API Security

All API endpoints implement:
- Input sanitization before processing
- Validation against defined schemas
- Authentication and authorization checks
- Rate limiting protection
- Security header enforcement

## Ongoing Security Practices

- Regular dependency updates
- Security header monitoring
- Input validation reviews
- Penetration testing
- Code security audits

## Future Security Enhancements

- CSRF token implementation
- Advanced rate limiting with Redis
- Security logging and monitoring
- Automated security testing
- Content Security Policy refinement

---

This is a [Next.js](https://nextjs.org) project with enhanced security features following OWASP best practices.

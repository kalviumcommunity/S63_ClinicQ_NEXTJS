import validator from 'validator';

/**
 * Validation schemas for different data types
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate input against schema
 */
export const validateInput = (data: Record<string, any>, schema: ValidationSchema): ValidationResult => {
  const errors: Record<string, string> = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }

    // Skip validation if field is not required and empty
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    const stringValue = String(value);

    // Check minimum length
    if (rules.minLength && stringValue.length < rules.minLength) {
      errors[field] = `${field} must be at least ${rules.minLength} characters`;
      continue;
    }

    // Check maximum length
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      errors[field] = `${field} must not exceed ${rules.maxLength} characters`;
      continue;
    }

    // Check pattern
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      errors[field] = `${field} format is invalid`;
      continue;
    }

    // Check custom validation
    if (rules.custom && !rules.custom(value)) {
      errors[field] = `${field} is invalid`;
      continue;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  patientToken: {
    patientName: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\-']+$/,
    },
    patientPhone: {
      required: true,
      pattern: /^\d{10,15}$/,
    },
    patientAge: {
      required: false,
      custom: (value: any) => {
        const age = parseInt(value, 10);
        return age >= 0 && age <= 150;
      },
    },
    visitReason: {
      required: false,
      maxLength: 500,
    },
  },
  staff: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\-']+$/,
    },
    email: {
      required: true,
      custom: (value: string) => validator.isEmail(value),
    },
    role: {
      required: true,
      pattern: /^(admin|operator|staff)$/,
    },
  },
  department: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    code: {
      required: true,
      minLength: 2,
      maxLength: 10,
      pattern: /^[A-Z0-9]+$/,
    },
    avgServiceTimeMinutes: {
      required: true,
      custom: (value: any) => {
        const time = parseInt(value, 10);
        return time > 0 && time <= 480; // Max 8 hours
      },
    },
  },
};

/**
 * SQL Injection detection patterns
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  /[';|*%<>^[\]{}()]/,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /((\%27)|(\'))union/i,
];

/**
 * XSS detection patterns
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/gi,
];

/**
 * Check for SQL injection attempts
 */
export const detectSQLInjection = (input: string): boolean => {
  if (!input || typeof input !== 'string') {
    return false;
  }

  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Check for XSS attempts
 */
export const detectXSS = (input: string): boolean => {
  if (!input || typeof input !== 'string') {
    return false;
  }

  return XSS_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Comprehensive security validation
 */
export const validateSecurity = (input: string): { isSafe: boolean; threats: string[] } => {
  const threats: string[] = [];

  if (detectSQLInjection(input)) {
    threats.push('SQL Injection');
  }

  if (detectXSS(input)) {
    threats.push('XSS');
  }

  return {
    isSafe: threats.length === 0,
    threats,
  };
};
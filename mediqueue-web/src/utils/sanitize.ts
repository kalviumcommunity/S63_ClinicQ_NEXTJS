import sanitizeHtml from 'sanitize-html';
import validator from 'validator';

// Client-side DOMPurify (only import when needed)
let DOMPurify: any = null;

/**
 * Initialize DOMPurify for client-side use
 */
const initDOMPurify = async () => {
  if (typeof window !== 'undefined' && !DOMPurify) {
    const { default: DOMPurifyLib } = await import('dompurify');
    DOMPurify = DOMPurifyLib;
  }
};

/**
 * Sanitize HTML input by removing all potentially dangerous tags and attributes
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return sanitizeHtml(input, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
};

/**
 * Sanitize HTML for safe display (allows basic formatting)
 */
export const sanitizeForDisplay = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
};

/**
 * Client-side HTML sanitization using DOMPurify
 */
export const sanitizeHtmlClient = async (input: string): Promise<string> => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  if (typeof window === 'undefined') {
    // Fallback to sanitize-html on server
    return sanitizeInput(input);
  }

  await initDOMPurify();
  
  if (DOMPurify) {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }

  return sanitizeInput(input);
};

/**
 * Validate and sanitize email addresses
 */
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') {
    return '';
  }

  const trimmed = email.trim().toLowerCase();
  return validator.isEmail(trimmed) ? validator.normalizeEmail(trimmed) || '' : '';
};

/**
 * Validate and sanitize phone numbers
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Basic validation for phone length (adjust based on your requirements)
  if (cleaned.length >= 10 && cleaned.length <= 15) {
    return cleaned;
  }
  
  return '';
};

/**
 * Sanitize names (allow only letters, spaces, hyphens, apostrophes)
 */
export const sanitizeName = (name: string): string => {
  if (!name || typeof name !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters but keep valid name characters
  const sanitized = name.replace(/[^a-zA-Z\s\-']/g, '').trim();
  
  // Limit length to prevent buffer overflow attacks
  return sanitized.substring(0, 100);
};

/**
 * Sanitize numeric input
 */
export const sanitizeNumber = (input: string | number): number | null => {
  if (typeof input === 'number') {
    return isFinite(input) ? input : null;
  }

  if (typeof input === 'string') {
    const num = parseFloat(input);
    return isFinite(num) ? num : null;
  }

  return null;
};

/**
 * Sanitize integer input
 */
export const sanitizeInteger = (input: string | number): number | null => {
  if (typeof input === 'number') {
    return Number.isInteger(input) ? input : null;
  }

  if (typeof input === 'string') {
    const num = parseInt(input, 10);
    return Number.isInteger(num) ? num : null;
  }

  return null;
};

/**
 * Sanitize text input with length limits
 */
export const sanitizeText = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags and limit length
  const sanitized = sanitizeInput(input);
  return sanitized.substring(0, maxLength).trim();
};

/**
 * Validate and sanitize UUID
 */
export const sanitizeUUID = (uuid: string): string => {
  if (!uuid || typeof uuid !== 'string') {
    return '';
  }

  return validator.isUUID(uuid) ? uuid : '';
};

/**
 * Sanitize object by applying appropriate sanitization to each field
 */
export const sanitizeObject = <T extends Record<string, any>>(
  obj: T,
  schema: Record<keyof T, 'string' | 'email' | 'phone' | 'name' | 'number' | 'integer' | 'text' | 'uuid'>
): Partial<T> => {
  const sanitized: Partial<T> = {};

  for (const [key, type] of Object.entries(schema)) {
    const value = obj[key];
    
    if (value === undefined || value === null) {
      continue;
    }

    switch (type) {
      case 'string':
        sanitized[key as keyof T] = sanitizeInput(String(value)) as T[keyof T];
        break;
      case 'email':
        sanitized[key as keyof T] = sanitizeEmail(String(value)) as T[keyof T];
        break;
      case 'phone':
        sanitized[key as keyof T] = sanitizePhone(String(value)) as T[keyof T];
        break;
      case 'name':
        sanitized[key as keyof T] = sanitizeName(String(value)) as T[keyof T];
        break;
      case 'number':
        const num = sanitizeNumber(value);
        if (num !== null) {
          sanitized[key as keyof T] = num as T[keyof T];
        }
        break;
      case 'integer':
        const int = sanitizeInteger(value);
        if (int !== null) {
          sanitized[key as keyof T] = int as T[keyof T];
        }
        break;
      case 'text':
        sanitized[key as keyof T] = sanitizeText(String(value)) as T[keyof T];
        break;
      case 'uuid':
        sanitized[key as keyof T] = sanitizeUUID(String(value)) as T[keyof T];
        break;
    }
  }

  return sanitized;
};
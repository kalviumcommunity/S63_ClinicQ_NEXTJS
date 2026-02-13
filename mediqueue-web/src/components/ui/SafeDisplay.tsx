'use client';

import { useEffect, useState } from 'react';
import { sanitizeForDisplay } from '@/utils/sanitize';

interface SafeDisplayProps {
  content: string;
  allowHtml?: boolean;
  className?: string;
}

/**
 * Component for safely displaying user-generated content
 * Prevents XSS attacks by sanitizing content before rendering
 */
export default function SafeDisplay({ content, allowHtml = false, className = '' }: SafeDisplayProps) {
  const [sanitizedContent, setSanitizedContent] = useState('');
  const [DOMPurify, setDOMPurify] = useState<any>(null);

  useEffect(() => {
    // Load DOMPurify only on client side
    const loadDOMPurify = async () => {
      if (typeof window !== 'undefined' && !DOMPurify) {
        const { default: DOMPurifyLib } = await import('dompurify');
        setDOMPurify(DOMPurifyLib);
      }
    };

    loadDOMPurify();
  }, [DOMPurify]);

  useEffect(() => {
    if (allowHtml) {
      if (DOMPurify) {
        // Use DOMPurify for client-side sanitization
        setSanitizedContent(DOMPurify.sanitize(content, {
          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
          ALLOWED_ATTR: [],
        }));
      } else {
        // Fallback to sanitize-html
        setSanitizedContent(sanitizeForDisplay(content));
      }
    } else {
      // Strip all HTML tags
      setSanitizedContent(content.replace(/<[^>]*>/g, ''));
    }
  }, [content, allowHtml, DOMPurify]);

  if (allowHtml) {
    // Use dangerouslySetInnerHTML only with sanitized content
    return (
      <div 
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    );
  }

  // Safe default: React automatically escapes strings
  return <div className={className}>{sanitizedContent}</div>;
}

/**
 * Hook for sanitizing content in components
 */
export function useSafeContent(content: string, allowHtml: boolean = false) {
  const [sanitizedContent, setSanitizedContent] = useState('');

  useEffect(() => {
    if (allowHtml) {
      setSanitizedContent(sanitizeForDisplay(content));
    } else {
      setSanitizedContent(content.replace(/<[^>]*>/g, ''));
    }
  }, [content, allowHtml]);

  return sanitizedContent;
}
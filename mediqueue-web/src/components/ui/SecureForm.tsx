'use client';

import { useState, FormEvent } from 'react';
import { sanitizeObject } from '@/utils/sanitize';
import { validateInput, ValidationSchema } from '@/utils/validation';
import InputField from './InputField';
import Button from './Button';

interface SecureFormProps {
  onSubmit: (data: Record<string, any>) => Promise<void>;
  schema: ValidationSchema;
  sanitizationSchema: Record<string, string>;
  fields: Array<{
    name: string;
    label: string;
    type: "text" | "email" | "password" | "number" | "tel";
    placeholder?: string;
    required?: boolean;
  }>;
  submitLabel?: string;
  className?: string;
}

/**
 * Secure form component with built-in sanitization and validation
 */
export default function SecureForm({
  onSubmit,
  schema,
  sanitizationSchema,
  fields,
  submitLabel = 'Submit',
  className = '',
}: SecureFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Sanitize form data
      const sanitizedData = sanitizeObject(formData, sanitizationSchema as any);

      // Validate sanitized data
      const validation = validateInput(sanitizedData, schema);

      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      // Submit sanitized and validated data
      await onSubmit(sanitizedData);
      
      // Reset form on success
      setFormData({});
      
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: 'An error occurred while submitting the form' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputType = (type: string): "text" | "email" | "password" | "number" => {
    switch (type) {
      case 'email':
        return 'email';
      case 'password':
        return 'password';
      case 'number':
      case 'tel':
        return 'number';
      default:
        return 'text';
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {fields.map((field) => (
        <div key={field.name}>
          <InputField
            id={field.name}
            label={field.label}
            type={getInputType(field.type)}
            value={formData[field.name] || ''}
            onChange={(value) => handleInputChange(field.name, value)}
            placeholder={field.placeholder}
            required={field.required}
            error={errors[field.name]}
          />
        </div>
      ))}

      {errors.submit && (
        <div className="text-red-600 text-sm">{errors.submit}</div>
      )}

      <Button
        label={isSubmitting ? 'Submitting...' : submitLabel}
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      />
    </form>
  );
}
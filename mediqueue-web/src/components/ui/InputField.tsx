"use client";

type InputFieldProps = {
  label: string;
  id: string;
  type?: "text" | "email" | "password" | "number";
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
};

export default function InputField({
  label,
  id,
  type = "text",
  value = "",
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`rounded-lg border px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 dark:bg-zinc-800 dark:text-zinc-100 ${
          error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
            : 'border-zinc-300 focus:border-emerald-500 focus:ring-emerald-500 dark:border-zinc-600'
        }`}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <span id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}

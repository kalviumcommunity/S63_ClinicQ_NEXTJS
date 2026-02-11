"use client";

type ButtonProps = {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary";
  disabled?: boolean;
  className?: string;
};

export default function Button({
  label,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50";
  const styles =
    variant === "primary"
      ? `${base} bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500`
      : `${base} bg-zinc-200 text-zinc-800 hover:bg-zinc-300 focus:ring-zinc-400 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600`;

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${styles} ${className}`.trim()}
      disabled={disabled}
      aria-label={label}
    >
      {label}
    </button>
  );
}

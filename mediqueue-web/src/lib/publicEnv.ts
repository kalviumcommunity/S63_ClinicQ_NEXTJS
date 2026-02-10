// Safe client-side environment configuration.
// Only NEXT_PUBLIC_* variables are read here so this module is safe in React components.

export const publicEnv = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api",
  environment: process.env.NEXT_PUBLIC_MEDIQUEUE_ENV ?? "local",
};


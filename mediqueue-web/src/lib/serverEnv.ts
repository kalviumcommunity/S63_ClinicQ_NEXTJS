// Server-side environment configuration for MediQueue.
// This file must only be imported in server contexts (e.g. API routes, server components).

export const serverEnv = {
  databaseUrl: process.env.DATABASE_URL,
  authSecret: process.env.AUTH_SECRET,
  smsProviderApiKey: process.env.SMS_PROVIDER_API_KEY,
};


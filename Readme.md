## MediQueue – Sprint 1 (2.7, 2.9, 2.10, 2.14, 2.15, 2.16, 2.26, 2.27, 2.28 & 2.35)

**Digital hospital queue management system for Tier-2/3 city hospitals.**

### Folder structure (code)
- **`mediqueue-web/src/app`**: App Router entry (`layout.tsx`, `page.tsx`) and future route groups / API routes.
- **`mediqueue-web/src/components`**: Reusable UI — `layout/` (Header, Sidebar, LayoutWrapper), `ui/` (Button, Card, InputField), barrel `index.ts`.
- **`mediqueue-web/src/context`**: AuthContext, UIContext (theme + sidebar), Providers wrapper.
- **`mediqueue-web/src/hooks`**: useAuth, useUI — consume context and keep components simple.
- **`mediqueue-web/src/lib`**: Shared config, helpers, and type-safe utilities.

### Setup & run (local)
- **Install**: `cd mediqueue-web && npm install`
- **Dev server**: `npm run dev` then open `http://localhost:3000`
- **Build**: `npm run build` (production build + strict TypeScript check)
- **Lint**: `npm run lint` (ESLint + Prettier integration)

### Architecture docs
- **High Level Design**: `HLD.md`
- **Low Level Design**: `LLD.md`

### Environment variables
- **Template**: `mediqueue-web/.env.example` lists all required variables with safe placeholders.
- **Local secrets**: `mediqueue-web/.env.local` (ignored by Git) holds real DATABASE_URL, AUTH_SECRET, SMS keys, etc. used by Prisma and other services.
- **Client vs server**: Only `NEXT_PUBLIC_*` values (see `src/lib/publicEnv.ts`) are read in client code; server-only secrets live in `src/lib/serverEnv.ts`.

### Routes (App Router)
- **Public**: `/` (home), `/login`. **Protected** (JWT cookie): `/dashboard`, `/users`, `/users/[id]`. Middleware: `src/middleware.ts`. Custom 404: `app/not-found.tsx`. Breadcrumbs on `/users/[id]`.

### Database migrations & seed
- **Migrations**: defined via Prisma Migrate in `mediqueue-web/prisma/migrations` using `npx prisma migrate dev --name <change>`.
- **Seed**: `prisma/seed.ts` uses idempotent `upsert` calls to create demo departments, counters, and a default staff user (`npx prisma db seed`).

### Sprint 1 reflection
- **Structure**: Mirrors the HLD/LLD layers (app, components, services) and keeps UI, routing, and helpers clearly separated.
- **TypeScript**: Strict mode with `noImplicitAny`, `noUnusedLocals`, and `noUnusedParameters` to catch bugs before runtime.
- **Linting**: ESLint + Prettier enforce consistent semicolons, double quotes, and formatting on every commit via Husky + lint-staged.
- **Config**: Environment management follows 12-factor principles; secrets stay in `.env.local`, while `.env.example` makes setup reproducible for all teammates.
- **Database**: Prisma ORM (see `prisma/schema.prisma` and `src/lib/prisma.ts`) provides a type-safe bridge between Next.js APIs and the PostgreSQL database described in the HLD/LLD.
- **Performance**: Queue-related queries use Prisma transactions (`src/lib/queueTransactions.ts`) and additional indexes in `schema.prisma` to keep token operations consistent and fast as data grows.
- **Routing**: File-based App Router with public/protected pages, dynamic `/users/[id]`, and middleware (JWT via `jose`) for consistent auth and SEO-friendly structure.
- **Components**: Root layout uses `LayoutWrapper` (Header + Sidebar + main). Shared UI (Button, Card, InputField) use props contracts and barrel `@/components` for consistency and reuse.
- **State**: AuthContext (user, login, logout) and UIContext (theme, sidebar open) wrapped in `Providers`; `useAuth` and `useUI` expose state and actions so layout and pages stay declarative and avoid prop-drilling.
- **RBAC**: Simple role hierarchy (`src/config/roles.ts`) with helpers and logs; JWT payload carries `role`, enforced in `/api/admin/delete-demo` and reflected in the Dashboard buttons (Delete/Edit/View) for clear allow/deny behaviour.

## 🔐 Assignment 28: Authentication APIs (Signup & Login)

### Overview

This project implements secure authentication using bcrypt for password hashing and JWT (JSON Web Token) for session management.

Authentication verifies the identity of a user before granting access to protected routes.

---

### Signup API

**Endpoint:** `POST /api/auth/signup`

**Flow:**

1. Accepts name, email, and password.
2. Checks if user already exists.
3. Hashes password using bcrypt (salt rounds = 10).
4. Stores hashed password in database.
5. Returns success response.

**Sample Request:**

json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "mypassword"
} 

🔐 Assignment 21: Authorization Middleware (RBAC)
Overview

This middleware enforces Role-Based Access Control (RBAC) in our Digital Health Records System to protect sensitive medical data.

It ensures that only authorized users can access specific routes based on their role.

Roles

patient

doctor

admin

Each role has restricted permissions aligned with our healthcare privacy requirements.

How It Works

Verifies JWT from Authorization header.

Extracts user role.

Grants or denies access based on role.

Enforces consent checks when doctors access patient records.

Access Rules

Patients → Access their own dashboard.

Doctors → Access patient records only with consent.

Admin → Access system-level routes.

Unauthorized access → 403 Forbidden.

Security Principles

Least privilege access

Consent-based medical record sharing

Centralized authorization logic

Reflection

Authorization middleware is critical in healthcare systems because medical data is highly sensitive. By centralizing RBAC and consent checks, we ensure secure, controlled, and privacy-first access to patient records.

🚨 Assignment 22: Centralized Error Handling Middleware
Overview

This assignment implements a centralized error handling system for the application. Instead of handling errors separately in every route, all errors are processed through a single reusable layer.

The goal is to ensure:

Consistent error responses

Secure production behavior

Structured logging for debugging

Clean separation between user-facing messages and internal logs

Why Centralized Error Handling?

Modern applications fail in different ways (database issues, API failures, validation errors). Without a unified system:

Error responses become inconsistent

Debugging becomes difficult

Sensitive system details may leak in production

A centralized handler ensures that:

All errors follow the same response format

Stack traces are hidden in production

Detailed logs are preserved internally

Development vs Production Behavior
Environment	What User Sees	Internal Logs
Development	Detailed error message + stack trace	Full details logged
Production	Generic safe message	Detailed error logged (stack redacted externally)

This approach protects user trust while maintaining strong observability for developers.

What Was Implemented

A structured logging system for consistent error tracking

A reusable centralized error handling function

Environment-based behavior (dev vs prod)

Secure, minimal responses for production users

Reflection

Centralized error handling improves debugging efficiency by creating structured, searchable logs. It also prevents accidental exposure of sensitive system information in production.

A professional system does not just run successfully — it fails gracefully. By separating internal logs from user-facing responses, the application becomes more secure, maintainable, and scalable.

⚡ Assignment 23: Caching Layer with Redis
Overview

Implemented Redis as a caching layer to improve API performance and reduce database load. Frequently requested data is stored temporarily in memory and served quickly on repeated requests.

Why Caching?

Reduces database queries

Improves response time

Handles higher traffic efficiently

Cache Strategy

Used the Cache-Aside (Lazy Loading) pattern:

Check Redis for cached data

If cache hit → return data instantly

If cache miss → fetch from database

Store result in Redis with TTL

TTL Policy

Cached data expires automatically after a defined time (e.g., 60 seconds)

Prevents long-term stale data

Cache Invalidation

Cache is cleared whenever data is updated

Ensures consistency between Redis and database

Results

First request → Database hit (slower)

Subsequent requests → Cache hit (significantly faster)

Noticeable reduction in API latency

Reflection

Caching improves scalability and performance but introduces stale data risk. Proper TTL and invalidation strategies are essential to maintain cache coherence and system reliability.

📁 Assignment 24: File Upload with Pre-Signed URLs
Overview

Implemented secure file uploads using pre-signed URLs. Files are uploaded directly to cloud storage (AWS S3 / Azure Blob) without passing through the backend server.

Why Pre-Signed URLs?

Keeps cloud credentials secure

Reduces backend load

Improves upload performance

Scales efficiently

Upload Flow

Client requests pre-signed URL from backend

Backend validates file type and size

Backend generates temporary signed URL

Client uploads file directly to cloud storage

File URL is stored in database

Security Measures

Short URL expiry (30–120 seconds)

File type validation (images / PDFs only)

File size restriction

Private bucket configuration

Lifecycle policy for automatic cleanup

Reflection

Pre-signed URLs improve scalability and security by offloading file transfer to cloud storage while keeping credentials hidden. Short-lived URLs and lifecycle policies reduce long-term security and cost risks.


Assignment 25: Transactional Email Service Integration

Overview
Integrated a transactional email service (AWS SES or SendGrid) to send automated emails such as welcome messages and notifications. The service is securely configured using environment variables and verified sender authentication.

Implementation

Configured email provider and verified sender

Created backend API to send HTML emails

Implemented a reusable email template

Logged message ID for tracking

Email Flow

Client triggers an event (e.g., signup).

Backend sends email through provider.

Provider returns message ID for logging.

Sandbox vs Production

Sandbox allows emails only to verified addresses.

Production requires domain verification for real users.

Security

No hardcoded credentials

Environment variables for API keys

Consideration of rate limits and bounce monitoring

Reflection - Transactional emails improve trust and automation. Proper verification, logging, and monitoring ensure secure and reliable delivery.

Assignment 32: Responsive & Themed Design
Overview

Built a responsive and theme-aware UI using TailwindCSS with custom breakpoints and brand colors.

Implementation

Configured Tailwind theme and screens

Applied responsive utility classes

Enabled light/dark mode toggle

Used dark variants for styling

Testing

Verified layout on mobile, tablet, and desktop

Checked readability and smooth theme switching

Reflection

Ensured consistent design, accessibility, and usability across devices and themes.

Assignment 33: Error & Loading States
Overview

Implemented graceful handling of asynchronous states using loading skeletons and error boundaries in Next.js App Router.

Implementation

Added loading.js with skeleton UI

Added error.js with retry functionality

Simulated network delay and API failures

Testing

Verified loading state under slow network

Tested error fallback and retry behavior

Confirmed successful render after reset

Reflection

Handling loading and error states improves user trust and ensures a resilient, user-friendly application.

Assignment 34: Secure JWT & Session Management
Overview

Implemented secure authentication using access and refresh tokens with expiry handling and token validation.

Implementation

Generated short-lived access tokens

Implemented long-lived refresh tokens

Stored refresh token in HTTP-only cookie

Added middleware for protected routes

Implemented automatic token refresh flow

Security Measures

Avoided storing tokens in localStorage

Used SameSite and secure cookie settings

Implemented token expiry and rotation

Testing

Simulated expired access token

Verified refresh flow

Confirmed protected route security

Reflection

Designed authentication flow to balance security and usability while mitigating XSS, CSRF, and token replay risks.
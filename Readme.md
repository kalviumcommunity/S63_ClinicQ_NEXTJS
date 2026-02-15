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

```json
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
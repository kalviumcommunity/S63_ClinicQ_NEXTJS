## MediQueue – Sprint 1 (2.7, 2.9, 2.10 & 2.14)

**Digital hospital queue management system for Tier-2/3 city hospitals.**

### Folder structure (code)
- **`mediqueue-web/src/app`**: App Router entry (`layout.tsx`, `page.tsx`) and future route groups / API routes.
- **`mediqueue-web/src/components`**: Reusable React components (forms, layouts, display widgets).
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

### Sprint 1 reflection
- **Structure**: Mirrors the HLD/LLD layers (app, components, services) and keeps UI, routing, and helpers clearly separated.
- **TypeScript**: Strict mode with `noImplicitAny`, `noUnusedLocals`, and `noUnusedParameters` to catch bugs before runtime.
- **Linting**: ESLint + Prettier enforce consistent semicolons, double quotes, and formatting on every commit via Husky + lint-staged.
- **Config**: Environment management follows 12-factor principles; secrets stay in `.env.local`, while `.env.example` makes setup reproducible for all teammates.
- **Database**: Prisma ORM (see `prisma/schema.prisma` and `src/lib/prisma.ts`) provides a type-safe bridge between Next.js APIs and the PostgreSQL database described in the HLD/LLD.
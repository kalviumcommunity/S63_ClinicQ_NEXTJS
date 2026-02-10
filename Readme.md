## MediQueue – Sprint 1 (2.7 & 2.9)

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

### Sprint 1 reflection
- **Structure**: Mirrors the HLD/LLD layers (app, components, services) and keeps UI, routing, and helpers clearly separated.
- **TypeScript**: Strict mode with `noImplicitAny`, `noUnusedLocals`, and `noUnusedParameters` to catch bugs before runtime.
- **Linting**: ESLint + Prettier enforce consistent semicolons, double quotes, and formatting on every commit via Husky + lint-staged.
- **Next steps**: Wire Supabase, SMS providers, and real-time subscriptions into this base without changing the overall layout.
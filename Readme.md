## MediQueue – Sprint 1 (2.7)

**Digital hospital queue management system for Tier-2/3 city hospitals.**

### Folder structure (code)
- **`mediqueue-web/src/app`**: App Router entry (`layout.tsx`, `page.tsx`) and future route groups / API routes.
- **`mediqueue-web/src/components`**: Reusable React components (forms, layouts, display widgets).
- **`mediqueue-web/src/lib`**: Shared config, helpers, and type-safe utilities.

### Setup & run (local)
- **Install**: `cd mediqueue-web && npm install`
- **Dev server**: `npm run dev` then open `http://localhost:3000`
- **Build**: `npm run build` (ensures production-ready compilation passes)

### Architecture docs
- **High Level Design**: `HLD.md`
- **Low Level Design**: `LLD.md`

### Sprint 1 reflection
- **Why this structure**: Mirrors the HLD/LLD layers (app, components, services) and keeps UI, routing, and business helpers clearly separated.
- **Scalability**: New portals (Patient/Staff/Admin) become new route groups in `src/app`, while shared UI and queue utilities live in `src/components` and `src/lib` without tight coupling.
- **Next steps**: Wire Supabase, SMS providers, and real-time subscriptions into this base without changing the overall layout.
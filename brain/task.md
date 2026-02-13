# Task Checklist - Centinela Electoral CRM
**Status:** ✅ 100% COMPLETADO Y DESPLEGADO EN PRODUCCIÓN
**URL:** `https://centinelaelectoralsaeeuropa.com`
- [x] Implement "Nueva DM" button with role-based access <!-- id: 1 -->
- [ ] Verify connections to other pages <!-- id: 2 -->
- [ ] Verify "Nueva DM" functionality (creation) <!-- id: 3 -->
- [x] Add "Fecha de nacimiento" and "Email" to "Nueva DM" form <!-- id: 4 -->
- [x] Update form validation (all mandatory except Province & Status) <!-- id: 5 -->
- [x] Integrate "Nueva DM" with `afiliados` table (create full affiliate record) <!-- id: 6 -->
- [x] Make "Celular" field mandatory <!-- id: 7 -->

## Affiliate Modal UI Redesign
- [x] Implement new header with gradient and modern tabs <!-- id: 8 -->
- [x] Refine profile section (avatar, status badge) <!-- id: 9 -->
- [x] Update information grid typography and layout <!-- id: 10 -->
- [x] Group action buttons and restyle "Eliminar" <!-- id: 11 -->

## Data Synchronization
- [x] Implement sync from AffiliateModal to `europa_presidentes_dm` <!-- id: 12 -->

# Phase 2: UI Standardization
## Component Extraction & Redesign
- [x] Refactor `NewAffiliateModal` to match new design system <!-- id: 13 -->
- [x] Extract and Redesign `PresidenteModal` from `europa/page.tsx` <!-- id: 14 -->
- [x] Extract and Redesign `RecintoModal` from `europa/page.tsx` <!-- id: 15 -->
- [x] Standardize Icons and Logos <!-- id: 25 -->
    - [x] Fix logo background in Emails <!-- id: 26 -->
    - [x] Replace icons with logo in Europa, Statutes and Internal Voting pages <!-- id: 27 -->

# Phase 3: Maintenance & Bug Fixes
- [x] Fix Document Upload Issues <!-- id: 28 -->
    - [x] Sanitize filenames (remove accents/special chars) <!-- id: 29 -->
    - [x] Fix RLS policies for `documentos` table and storage <!-- id: 30 -->

# Phase 4: Security Hardening
- [x] Plan security hardening strategy <!-- id: 31 -->
- [x] Create server-side Supabase client (`supabaseAdmin.ts`) <!-- id: 32 -->
- [x] Create generic API write proxy (`/api/db/write`) <!-- id: 33 -->
- [x] Migrate client-side writes to API proxy (11 files) <!-- id: 34 -->
- [x] Create and apply restrictive RLS policies (SELECT-only for anon) <!-- id: 35 -->
- [x] Verify all operations still work <!-- id: 36 -->

# Phase 5: Communications Module Refinement
- [x] Fix `/api/emails/send` database logging <!-- id: 37 -->
- [x] Add mass communication logging to `/api/emails/broadcast` <!-- id: 38 -->
- [x] Verify Communications section functionality <!-- id: 39 -->

# Phase 6: Debug Contact Form
- [x] Align "from" address in `/api/contact` with working broadcast address <!-- id: 40 -->
- [x] Implement dual-delivery (admin + backup) for testing <!-- id: 41 -->
- [x] Verify delivery in Hostinger webmail <!-- id: 42 -->
# Phase 7: Dual View (Grid/List) for Affiliates
    - [x] Implement `viewMode` state and toggle UI
    - [x] Create `ListView` (Table) component
    - [x] Verify Affiliate Modal connectivity from List View
    - [x] Test filtering and pagination in both views
    - [x] Debugging: Clear stale `out` and `.next` cache to force UI update
    - [x] Restore original title "Afiliados"

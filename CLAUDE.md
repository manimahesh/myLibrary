# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# MyLibrary Project Guide

## Project Overview

Full-stack bookstore app: Node.js/Express backend, React (Vite) frontend, PostgreSQL database. Users register/login, browse books via NYT Books and Google Books APIs, manage a wishlist with ratings and personal summaries, track books they've read, and maintain addresses and payment methods.

## Repository Layout

```
backend/   — Express API (port 3001)
frontend/  — React/Vite SPA (port 5173)
```

Both must run simultaneously. Start with `npm run dev` in each directory.

## Dev Commands

**Backend** (`cd backend`):
```bash
npm run dev      # nodemon watch
npm start        # production
```

**Frontend** (`cd frontend`):
```bash
npm run dev        # Vite dev server
npm run build      # production build
npm run lint       # ESLint — must pass before committing
npm run preview    # preview production build
npm test           # Vitest one-shot (run all tests)
npm run test:watch # Vitest watch mode
```

**Lint must pass cleanly** before any frontend commit. CI runs `npm run lint` on every push.

**Backend** (`cd backend`):
```bash
npm test                    # Jest — all tests (unit + integration)
npm run test:integration    # integration tests only (requires DB — see below)
```

### Running a single test file

```bash
# backend
cd backend && npx jest src/__tests__/controllers/authController.test.js

# frontend
cd frontend && npx vitest run src/__tests__/pages/Login.test.jsx
```

### Integration test database

Integration tests require a live PostgreSQL database. They auto-run all migrations and truncate tables between tests. Configure via `backend/.env.test` or env vars:

```env
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=mylibrary_test
TEST_DB_USER=mylibrary_user
TEST_DB_PASSWORD=yourpassword
```

If `TEST_DB_*` vars are absent the helpers fall back to `DB_*`.

## Architecture

### Backend

- `src/app.js` — Express app, mounts all routes under `/api`
- `src/middleware/auth.js` — JWT verification; sets `req.user.userId`
- `src/config/index.js` — all env vars (see `.env` section below)
- `src/config/database.js` — `pg.Pool` instance (separate from `config/index.js`)
- `src/migrations/` — plain SQL files, run manually in order (001–008)
- `src/models/` — thin DB wrappers using `pg` pool, parameterized queries only
- `src/models/Book.js` — books cache table: `upsert()` and `findById()`; used by googleBooksService for write-through caching
- `src/services/nytBooksService.js` — NYT Books API; returns books with IDs `isbn:{isbn13}` or `nyt-rank:{rank}`
- `src/services/googleBooksService.js` — Google Books search + detail; multi-layer cache: in-memory (1hr TTL) → DB (`books` table) → Google API; in-flight deduplication via `Map`; 200ms sequential queue to stay under rate limits; 3-retry exponential backoff on 429s
- `scripts/backfill_books_cache.js` — one-shot script to populate the `books` cache table for existing wishlist/read_books records that predate the cache; runs in batches of 10 with a 15-minute pause between batches

API routes: `/api/auth`, `/api/addresses`, `/api/payments`, `/api/books`, `/api/wishlist`, `/api/summaries`, `/api/read-books`. Route mount order in `app.js` matters for `/api/books` — `/nyt-top` and `/google-search` must come before `/:id`.

Auth routes: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/me` (update first_name/last_name), `PUT /api/auth/change-password`. Controllers: `getMe`, `updateMe`, `changePassword` in `authController.js`. Model methods: `User.updateProfile(id, firstName, lastName)` and `User.updatePassword(id, newHash)` in `User.js`.

Pagination: `GET /api/wishlist` and `GET /api/read-books` both accept `?limit=` (1–25, default 10) and `?offset=` query params. Both return `{ [key]: items, total, limit, offset }`. Models have both `findAllByUser(userId)` (legacy) and `findPageByUser(userId, limit, offset)` (returns `{ items, total }`).

### Frontend

- `src/App.jsx` — `ProtectedLayout` = `ProtectedRoute` + `Layout` wraps all authenticated routes
- `src/components/Layout.jsx` — persistent left sidebar (220px fixed); active link detection via `useLocation`; links: Store, Search (`/store?focus=search`), Wishlist, Books I've Read, Profile
- `src/components/Pagination.jsx` — shared pagination bar: `«‹ X–Y of N ›»`; rendered at both top and bottom of paginated lists
- `src/context/AuthContext.jsx` — token AND user object stored in `localStorage`; auth init is synchronous so `loading` is a plain `false` constant (not state); exposes `updateUser(updates)` to merge profile changes into context + localStorage
- `src/hooks/usePaginatedList.js` — shared hook for Wishlist and ReadBooks pages; manages page state, fetches a single page at a time, exposes `firstPage/prevPage/nextPage/lastPage/setLimit/removeItem`
- `src/pages/Store.jsx` — `useRef` + `useSearchParams` for `?focus=search` auto-focus
- `src/pages/Profile.jsx` — multi-tab page with its own inner sidebar; tabs: Profile Info, Change Password, Addresses, Payment Methods; tab controlled via `?tab=profile|password|addresses|payments`
- `src/pages/BookDetail.jsx` — `active` flag pattern in `useEffect` for stale fetch prevention; DOMPurify for book description HTML
- `src/pages/Wishlist.jsx` — uses `usePaginatedList('/wishlist')`; page-based pagination with per-page picker (10/15/25); read status loaded in a `useEffect` (not useState initializer)
- `src/pages/ReadBooks.jsx` — uses `usePaginatedList('/read-books')`; same pagination pattern; book title/author/thumbnail come from the `item` prop (joined from `books` cache table — no per-item API calls)
- `src/services/api.js` — axios instance with base URL, auto-injects `Authorization: Bearer <token>` from `localStorage`, redirects to `/login` on 401; all API calls go through this, not raw `fetch`
- Forms (address, payment) use `react-hook-form`

### Book ID scheme

| Source | ID format |
|--------|-----------|
| Google Books | Google volume ID (e.g. `zyTCAlFPjgYC`) |
| NYT Books (has ISBN-13) | `isbn:{isbn13}` |
| NYT Books (no ISBN-13) | `nyt-rank:{rank}` |

`GET /api/books/:id` handles all three transparently.

### Books Cache Table

Migration `008_create_books_cache.sql` adds a `books` table keyed by `book_id`. googleBooksService writes through to this table on every successful Google API fetch. On subsequent loads of Wishlist/ReadBooks, the models do a `LEFT JOIN books b ON b.book_id = ...` so book metadata is served entirely from Postgres — no Google API calls on list reads.

## ESLint Rules to Watch

**`react-hooks/set-state-in-effect`** — Do NOT call `setState` directly in the effect body, even via `useCallback`. The pattern that passes: wrap async logic in a `useCallback`, call it from the effect. The effect body should only call the callback and return the cleanup.

**`react-hooks/immutability`** — Do NOT call `setState` inside a `useState` initializer. Use `useEffect` with an `active` flag for side-effect data loading instead.

**`react-refresh/only-export-components`** — Files may only export React components. For hook exports from the same file (e.g. `useAuth` in `AuthContext.jsx`), suppress with `// eslint-disable-next-line react-refresh/only-export-components`.

## Environment Variables

**`backend/.env`:**
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mylibrary
DB_USER=mylibrary_user
DB_PASSWORD=yourpassword
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NYT_API_KEY=your_nyt_api_key
GOOGLE_BOOKS_API_KEY=your_google_books_api_key
```

**`frontend/.env`** (optional):
```env
VITE_API_URL=http://localhost:3001/api
```

## Database

PostgreSQL. Run migrations in order with `psql`:
```bash
psql -U mylibrary_user -d mylibrary -f backend/src/migrations/001_create_users.sql
# ... through 008
```

| Migration | Description |
|-----------|-------------|
| 001 | `users` table |
| 002 | `addresses` table |
| 003 | `payment_methods` table |
| 004 | `wishlists` table |
| 005 | `book_summaries` table |
| 006 | `read_books` table |
| 007 | Add `first_name`, `last_name` columns to `users` |
| 008 | `books` cache table (keyed by `book_id`) |

All IDs are UUIDs (`uuid_generate_v4()`). Wishlists and book_summaries have `UNIQUE(user_id, book_id)` constraints — duplicate inserts return 409 from the API (checked before the DB call, not caught from the constraint).

## CI

GitHub Actions (`.github/workflows/build.yml`) runs on push to `main`/`dev` and on PRs to `main`:
- Backend: `npm ci` + `npm test` (unit tests; integration tests run against a test DB in CI)
- Frontend: `npm ci` + `npm run lint` + `npm run build` + `npm test`

Lint failures block the build. Always run `npm run lint` locally before pushing frontend changes.

## Coding Conventions

- No `setState` calls inside effect bodies directly — wrap in `useCallback`, call from effect
- No `setState` inside `useState` initializers — use `useEffect` with `active` flag instead
- Validate UUIDs with `isValidUUID` from the `uuid` package before DB calls (`const { validate: isValidUUID } = require('uuid')`)
- All DB queries are parameterized — no string interpolation
- `active` flag pattern in effects: `let active = true; ... if (active) setState(...); return () => { active = false; }`
- `activeRef` pattern in hooks using `useCallback`: `const activeRef = useRef(true); useEffect(() => { activeRef.current = true; load(); return () => { activeRef.current = false; }; }, [load, ...])`

## Branding

- Accent color is **Burgundy** (`#800020`); hover: `#6b001a`; light tint: `#fce8ec`; text on light: `#5a0016`
- All accent appearances are driven by `--color-accent*` CSS custom properties in `index.css` — do not hardcode the old purple (`#7c3aed`) anywhere
- `--color-accent-rgb: 128, 0, 32` enables `rgba(var(--color-accent-rgb), 0.x)` usage

## Title Normalisation (BookCard, WishlistItem, ReadBookItem)

Book titles from NYT/Google are normalised before display:
- `isbn:{isbn13}` → `ISBN: {isbn13}`
- `nyt-rank:{n}` → `NYT Rank: {n}`
- ALL_CAPS strings → Title Case (via `.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())`)

`ReadBookItem` reads `item.title` directly from the prop (populated via the `books` cache JOIN) — it does not make a separate API call for book details.

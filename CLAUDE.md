# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# MyLibrary Project Guide

## Project Overview

Full-stack bookstore app: Node.js/Express backend, React (Vite) frontend, PostgreSQL database. Users register/login, browse books via NYT Books and Google Books APIs, manage a wishlist with ratings and personal summaries, and maintain addresses and payment methods.

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
- `src/migrations/` — plain SQL files, run manually in order (001–007)
- `src/models/` — thin DB wrappers using `pg` pool, parameterized queries only
- `src/services/nytBooksService.js` — NYT Books API; returns books with IDs `isbn:{isbn13}` or `nyt-rank:{rank}`
- `src/services/googleBooksService.js` — Google Books search + detail; normalizes volumes to a consistent shape

API routes: `/api/auth`, `/api/addresses`, `/api/payments`, `/api/books`, `/api/wishlist`, `/api/summaries`, `/api/read-books`. Route mount order in `app.js` matters for `/api/books` — `/nyt-top` and `/google-search` must come before `/:id`.

Auth routes added: `GET /api/auth/me` (fetch current user), `PUT /api/auth/me` (update first_name/last_name), `PUT /api/auth/change-password` (verify current + set new password). Controllers: `getMe`, `updateMe`, `changePassword` in `authController.js`. Model: `User.updateProfile(id, firstName, lastName)` and `User.updatePassword(id, newHash)` added to `User.js`.

### Frontend

- `src/App.jsx` — `ProtectedLayout` = `ProtectedRoute` + `Layout` wraps all authenticated routes
- `src/components/Layout.jsx` — persistent left sidebar (220px fixed); active link detection via `useLocation`; links: Store, Search (`/store?focus=search`), Wishlist, Books I've Read, Profile (Payment Methods moved inside Profile page)
- `src/context/AuthContext.jsx` — token AND user object stored in `localStorage`; auth init is synchronous so `loading` is a plain `false` constant (not state); exposes `updateUser(updates)` to merge profile changes into context + localStorage
- `src/pages/Store.jsx` — `useRef` + `useSearchParams` for `?focus=search` auto-focus
- `src/pages/Profile.jsx` — multi-tab page with its own inner sidebar; tabs: Profile Info, Change Password, Addresses, Payment Methods; tab controlled via `?tab=profile|password|addresses|payments`
- `src/pages/BookDetail.jsx` — `active` flag pattern in `useEffect` for stale fetch prevention; DOMPurify for book description HTML
- `src/pages/ReadBooks.jsx` — displays books the user has marked as read; uses the `/api/read-books` endpoint
- `src/services/api.js` — axios instance with base URL, auto-injects `Authorization: Bearer <token>` from `localStorage`, redirects to `/login` on 401; all API calls go through this, not raw `fetch`
- Forms (address, payment) use `react-hook-form`

### Book ID scheme

| Source | ID format |
|--------|-----------|
| Google Books | Google volume ID (e.g. `zyTCAlFPjgYC`) |
| NYT Books (has ISBN-13) | `isbn:{isbn13}` |
| NYT Books (no ISBN-13) | `nyt-rank:{rank}` |

`GET /api/books/:id` handles all three transparently.

## ESLint Rules to Watch

**`react-hooks/set-state-in-effect`** — Do NOT call external functions that contain `setState` from an effect body, even via `useCallback`. Fix: inline `.then()/.catch()` with a `refreshKey` counter state if re-fetch is needed.

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
# ... through 006
```

Tables: `users`, `addresses`, `payment_methods`, `wishlists`, `book_summaries`, `read_books`. Migration `007_add_user_name.sql` adds `first_name VARCHAR(100)` and `last_name VARCHAR(100)` to `users`.

All IDs are UUIDs (`uuid_generate_v4()`). Wishlists and book_summaries have `UNIQUE(user_id, book_id)` constraints — duplicate inserts return 409 from the API (checked before the DB call, not caught from the constraint).

## CI

GitHub Actions (`.github/workflows/build.yml`) runs on push to `main`/`dev` and on PRs to `main`:
- Backend: `npm ci` + `npm test` (unit tests; integration tests run against a test DB in CI)
- Frontend: `npm ci` + `npm run lint` + `npm run build` + `npm test`

Lint failures block the build. Always run `npm run lint` locally before pushing frontend changes.

## Coding Conventions

- No `setState` calls inside effect bodies via external functions — inline the fetch logic or use `refreshKey`
- Validate UUIDs with `isValidUUID` from the `uuid` package before DB calls (`const { validate: isValidUUID } = require('uuid')`)
- All DB queries are parameterized — no string interpolation
- `AbortController` for fetch cancellation on unmount in effects that trigger on mount
- `active` flag pattern when a single effect triggers an async function: `let active = true; ... if (active) setState(...); return () => { active = false; }`

## Branding

- Accent color is **Burgundy** (`#800020`); hover: `#6b001a`; light tint: `#fce8ec`; text on light: `#5a0016`
- All accent appearances are driven by `--color-accent*` CSS custom properties in `index.css` — do not hardcode the old purple (`#7c3aed`) anywhere

## Title Normalisation (BookCard, WishlistItem, ReadBookItem)

Book titles from NYT/Google are normalised before display:
- `isbn:{isbn13}` → `ISBN: {isbn13}`
- `nyt-rank:{n}` → `NYT Rank: {n}`
- ALL_CAPS strings → Title Case (via `.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())`)

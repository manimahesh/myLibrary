# CLAUDE.md — MyLibrary Project Guide

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
npm run dev      # Vite dev server
npm run build    # production build
npm run lint     # ESLint — must pass before committing
npm run preview  # preview production build
```

**Lint must pass cleanly** before any frontend commit. CI runs `npm run lint` on every push.

## Architecture

### Backend

- `src/app.js` — Express app, mounts all routes under `/api`
- `src/middleware/auth.js` — JWT verification; sets `req.user.userId`
- `src/config/index.js` — all env vars (see `.env` section below)
- `src/migrations/` — plain SQL files, run manually in order (001–005)
- `src/models/` — thin DB wrappers using `pg` pool, parameterized queries only
- `src/services/nytBooksService.js` — NYT Books API; returns books with IDs `isbn:{isbn13}` or `nyt-rank:{rank}`
- `src/services/googleBooksService.js` — Google Books search + detail; normalizes volumes to a consistent shape

Route mount order in `app.js` matters for `/api/books` — `/nyt-top` and `/google-search` must come before `/:id`.

### Frontend

- `src/App.jsx` — `ProtectedLayout` = `ProtectedRoute` + `Layout` wraps all authenticated routes
- `src/components/Layout.jsx` — persistent left sidebar (220px fixed); active link detection via `useLocation`; links: Store, Search (`/store?focus=search`), Wishlist, Profile, Payment Methods (`/profile?tab=payments`)
- `src/context/AuthContext.jsx` — token stored in `localStorage`; auth init is synchronous so `loading` is a plain `false` constant (not state)
- `src/pages/Store.jsx` — `useRef` + `useSearchParams` for `?focus=search` auto-focus
- `src/pages/Profile.jsx` — `useSearchParams` for `?tab=payments` tab switching; no internal sidebar
- `src/pages/BookDetail.jsx` — `active` flag pattern in `useEffect` for stale fetch prevention; DOMPurify for book description HTML

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
# ... through 005
```

Tables: `users`, `addresses`, `payment_methods`, `wishlists`, `book_summaries`.

All IDs are UUIDs (`uuid_generate_v4()`). Wishlists and book_summaries have `UNIQUE(user_id, book_id)` constraints — duplicate inserts return 409 from the API (checked before the DB call, not caught from the constraint).

## CI

GitHub Actions runs on push to all branches:
- Backend: `npm install` + `node -e "require('./src/app')"` smoke test
- Frontend: `npm install` + `npm run lint` + `npm run build`

Lint failures block the build. Always run `npm run lint` locally before pushing frontend changes.

## Coding Conventions

- No `setState` calls inside effect bodies via external functions — inline the fetch logic or use `refreshKey`
- Validate UUIDs with `isValidUUID` from the `uuid` package before DB calls (`const { validate: isValidUUID } = require('uuid')`)
- All DB queries are parameterized — no string interpolation
- `AbortController` for fetch cancellation on unmount in effects that trigger on mount
- `active` flag pattern when a single effect triggers an async function: `let active = true; ... if (active) setState(...); return () => { active = false; }`

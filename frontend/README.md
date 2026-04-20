# MyLibrary — Frontend

React (Vite) SPA. See the root [`getting-started.md`](../getting-started.md) for full setup instructions.

## Dev

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint       # ESLint — must pass before every commit
npm test           # Vitest
npm run build      # Production build
```

## Key conventions

- All API calls go through `src/services/api.js` (Axios instance, auto-injects JWT)
- Page-based pagination is handled by `src/hooks/usePaginatedList.js`
- Accent colour is Burgundy (`--color-accent: #800020`) — do not hardcode the old purple `#7c3aed`
- Book titles are normalised at render time: `isbn:` → `ISBN: `, `nyt-rank:` → `NYT Rank: `, ALL_CAPS → Title Case

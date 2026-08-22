# gorb — ToadOS, rebuilt in React

A React + TypeScript + Vite rebuild of the ToadOS desktop at
[thetoadmeme.com](https://thetoadmeme.com/). It recreates the Windows-XP-style
desktop shell (login, wallpaper, icons, taskbar, tray clock, start menu,
draggable windows) and all 16 app windows.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

## How it was built

The content and styling come straight from the original site so the look
matches:

- `public/xp.css` — the original stylesheet, served verbatim (the browser
  parses it leniently, exactly as the source site does).
- `src/data/templates.ts` — the original `<template id="app-*">` blocks, used
  as-is for the static windows.
- `src/data/sprite.ts` — the original SVG icon sprite.
- `src/data/toados.json` — extracted config: links, contract address, the
  Canal 88 tape list, and the 51-item meme list.

Images, posters, and tape videos are loaded from `https://thetoadmeme.com`
rather than bundled, so nothing large is copied into the repo.

## App windows

| App | Behaviour |
|---|---|
| Toad Archivo (explorer) | Original markup, sidebar links wired via `data-open` / `data-cfg` |
| Canal 88 Player | Video player cycling the real tape list (picks the "on air" tape by clock) |
| Evidence + Toad Viewer | 51-item meme grid, opens a prev/next viewer |
| Live chart | Embeds the live Dexscreener chart |
| Terminal | Best-effort live price/mcap/liquidity from the Dexscreener API |
| Toad Gallery / Messenger | Read-only views of the public Supabase gallery / chat |
| Toad Paint | Working canvas (colors, brush size, clear) |
| Tokenomics, HowToBuy, Lore, ReadMe, Contract, Leaderboard, Recycle Bin | Original static content |

## Backend (Supabase)

Gallery, Messenger and the online-count use a Supabase (Postgres) backend.

Setup:

1. Create a free project at supabase.com.
2. Open **SQL Editor → New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql), and Run. This creates `gorb_gallery`, `gorb_chat`, `gorb_presence` with public read/write policies.
3. Copy `.env.example` to `.env` and fill in your **Project URL** and **anon / publishable key** (Project Settings → API). Both are safe in the browser.
4. Restart `npm run dev`.

Once the schema is applied:

- **Gorb Paint → Save to Gallery** writes a PNG into `gorb_gallery`.
- **Gorb Gallery** lists the drawings and lets you vote (♥).
- **Gorb Messenger** reads and posts messages in `gorb_chat`, and shows a live online count from `gorb_presence`.

No server to run. The frontend talks to Supabase's REST API directly with the
public key, guarded by row-level-security policies in the SQL.

## Scope notes

Live external data (price, chart) comes from Dexscreener. Wallet connect and
the Gorb Run game are out of scope.

Not affiliated with the original — a study rebuild.

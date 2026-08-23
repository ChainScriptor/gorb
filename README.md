# gorb — GorbOS

A React + TypeScript + Vite desktop for $GORB. It is a Windows-XP-style shell
(login, wallpaper, icons, taskbar, tray clock, start menu, draggable windows)
with every app window rendered inside it.

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

The shell keeps a period-accurate look, so a few assets are used as-is:

- `public/xp.css` — the stylesheet, served verbatim rather than through Vite
  (it contains a malformed rule that PostCSS rejects but browsers parse
  leniently).
- `src/data/templates.ts` — the `<template id="app-*">` markup blocks used for
  the static windows.
- `src/data/sprite.ts` — the SVG icon sprite.
- `src/data/gorbos.json` — config: links, contract address, the Canal 88
  channel list and the meme list.

All images, posters and tape videos live in `public/` and ship with the site.

## App windows

| App | Behaviour |
|---|---|
| Gorb Archivo (explorer) | Sidebar links wired via `data-open` / `data-cfg` |
| Canal 88 Player | Video player cycling the real tape list (picks the "on air" tape by clock) |
| Evidence + Gorb Viewer | Meme grid, opens a prev/next viewer |
| Live chart | Embeds the live Dexscreener chart |
| Terminal | Best-effort live price/mcap/liquidity from the Dexscreener API |
| Gorb Gallery / Messenger | Poster wall plus the public Supabase gallery / chat |
| Gorb Paint | Working canvas (colors, brush size, clear) |
| Tokenomics, HowToBuy, Lore, ReadMe, Contract, Leaderboard, Recycle Bin | Static content |

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

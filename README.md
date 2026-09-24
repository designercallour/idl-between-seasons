# IDL — Between Seasons (ticket waitlist concepts)

Off-season redesign of the **app.idl.pro** page: the 2026 voting page becomes a
next-season **ticket waitlist**, same URL, same one-field capture (email → CTA → done).

## Round 2 — current

**→ [`v2/index.html`](v2/index.html)** — overview: rationale, copy, visual / interaction /
asset direction, and live previews of all three concepts.

| # | Concept | File |
|---|---------|------|
| 01 | **In the Books** — cinematic post-season, tilting checkered surface, broadcast lower-third | [`v2/01-in-the-books.html`](v2/01-in-the-books.html) |
| 02 | **The Next Round** — "SEASON 02" kinetic editorial, 2026 as six chapters + a seventh | [`v2/02-next-round.html`](v2/02-next-round.html) |
| 03 | **Your Ticket Is Next** — the form *is* a Season 02 credential; locked → active → issued | [`v2/03-your-ticket.html`](v2/03-your-ticket.html) |

Shared: [`v2/shared/idl.css`](v2/shared/idl.css) (tokens + form states),
[`v2/shared/waitlist.js`](v2/shared/waitlist.js) (email-capture state machine).

Round 1 (concepts A / B / C) is archived at [`index.html`](index.html).

## Notes

- **Submit is a stub.** `IDLWaitlist.submit(email)` in `v2/shared/waitlist.js` resolves after
  1.3s — wire it to the voting-app capture endpoint once a direction is picked. Add `?fail`
  to any concept URL to preview the network-error state.
- **Real assets & facts only.** Fonts and the checkered video come from app.idl.pro; team
  marks, flags, skylines and event photography from idl.pro's own CDN. Copy uses IDL's own
  facts (0.43-point final, Shrine Expo Hall, five sold-out events, tiered pricing). Next-season
  dates are unannounced, so pages say "next season" / "Season 02 · TBA".
- Fonts (Neue Haas Display, Carbon Plus) are IDL's licensed brand kit, included here only to
  match the live site 1:1.

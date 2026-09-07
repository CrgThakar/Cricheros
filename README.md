# CricHeroes — Practical Test for Web Designer

Two assignments, built as plain HTML, CSS and JavaScript. No build step, no
framework, no dependencies — every folder is self-contained and uses only
relative paths, so you can open its `index.html` directly from disk.

Start at [`index.html`](index.html) for the landing page that links all five
deliverables.

## Assignment 1 — Match Summary

| Deliverable | Folder |
|---|---|
| Match Summary redesign | [`scorecard-option-1/`](scorecard-option-1/) |

Result-first hero, eight views under a single tab bar, per-breakpoint density
rather than shrinking, and a lazy-loaded WebP gallery.

## Assignment 2 — Live Score Ticker

Four takes on what a streamer's ticker should be, all driven by the same match
model.

| Option | Folder | Footprint |
|---|---|---|
| 1 — Broadcast Bar | [`ticker-option-1-broadcast-bar/`](ticker-option-1-broadcast-bar/) | Full-width lower third, 266px tall |
| 2 — Corner Card | [`ticker-option-2-corner-card/`](ticker-option-2-corner-card/) | Compact left bug, 720×276 |
| 3 — Baseline Strip | [`ticker-option-3-baseline-strip/`](ticker-option-3-baseline-strip/) | Full-width strip, 92px tall |
| 4 — Replay Wall | [`ticker-option-4-replay-wall/`](ticker-option-4-replay-wall/) | Slim at rest; full frame during a replay |

Each ticker opens with an event panel in the top right: fire individual events,
or tick **Auto-play demo**. Press **H** to hide the panel for a clean overlay.

## Design notes

The reasoning behind each decision is in
[`docs/EXPLANATION.md`](docs/EXPLANATION.md) (or `explanation.html` for the
formatted version).

## Repository layout

```
index.html                     Landing page linking every deliverable
explanation.html               Design notes, formatted
docs/                          Design notes and submission copy
scorecard-option-1/            Assignment 1
ticker-option-*/               Assignment 2, four options
scripts/                       Packaging helpers
```

Each deliverable folder holds its own `index.html`, `css/`, `js/` and `assets/`.

## Scripts

Both are plain Python 3, standard library only.

```bash
python scripts/build.py       # stage the landing page + deliverables into public/
python scripts/make-zips.py   # write one ZIP per deliverable into dist/
```

`public/` and `dist/` are generated output and are not tracked in this
repository.

# CricHeroes — Design Notes

Two assignments: a redesigned match summary, and a live score ticker for streamers.

---

## Assignment 1 — Match Summary

**Live page:** `scorecard-option-1/index.html` (built copy: `public/scorecard-option-1/index.html`)

- **The result is settled before anything else loads.** The page opens on a single dark card carrying a red result banner, both innings at 43px, the Player of the Match and the toss/format/date strip. Nothing above it competes — the "recent matches" rail was moved below the match content, because four other scorelines sitting above the hero were the first thing the eye landed on.

- **One tab bar, eight views, one scroll position.** Summary, Scorecard, Commentary, Analysis, Heroes, MVP, Teams and Gallery all swap in place under a sticky bar rather than stacking into one long page. Selecting a tab scrolls the bar to just under the header so every panel opens at its own top, with column headings visible.

- **Density is handled per-breakpoint, not by shrinking.** The desktop scorecard is a full ten-column table. On phones the same table collapses to the three columns that matter — runs, balls, strike rate — and every other statistic moves behind a per-player "More stats" disclosure. The data is never removed, only deferred.

- **Colour carries meaning, not decoration.** One red (`#e21c28`) appears on exactly one element: the result banner. Teal is the accent for links, ranks and icons; everything else is a neutral. That is what keeps a page this dense from feeling loud.

- **Navigation degrades in two stages.** The full bar shows above 1180px — measured, because the bar needs 1152px of layout width. Below that it collapses into a drawer, and below 768px a bottom dock takes over the match sections. The drawer reuses the same DOM as the desktop bar, so the links can never drift apart.

- **Weight was designed out, not accepted.** The gallery ships as WebP and loads only when opened: the page went from pulling 17 MB of images on every visit to 0 until the Gallery tab is selected.

---

## Assignment 2 — Live Score Ticker

Four options. All run from the same match model; they differ in what a ticker *is* and in how much of the stream it is allowed to cover.

| | Option 1 — Broadcast Bar | Option 2 — Corner Card | Option 3 — Baseline Strip | Option 4 — Replay Wall |
|---|---|---|---|---|
| File | `ticker-option-1-broadcast-bar/index.html` | `ticker-option-2-corner-card/index.html` | `ticker-option-3-baseline-strip/index.html` | `ticker-option-4-replay-wall/index.html` |
| Footprint | Full-width lower third, 266px tall | Compact left bug, 720×276 | Full-width strip, **92px** tall | Slim live bar; full frame during a replay |
| Stream coverage | Bottom quarter | Bottom-left corner | A thin band; nothing above it | None at rest; the whole frame for ~4s on an event |
| Idea | Everything visible, always | Compact at rest, unfolds on events | Thin at rest, the band itself becomes the event | The event triggers a broadcast replay, not a graphic |
| Palette | Navy, crimson, team caps | Graphite, one acid accent | Charcoal, white, one cyan accent | Near-black, event colour owns the wipe |
| Signature | Angled score wedge, full-bar sheen | Chamfered bug, unfolding card | Score tab above the strip, colour takeover | Wipe transition hiding a cut between two feeds |

### Option 4 — Replay Wall

**Why a fourth option.** Options 1–3 answer the event with a *graphic*. Real broadcast answers it with a *replay* — the director cuts away, shows the shot again, then cuts back. Option 4 does that: the ticker becomes the trigger for a sequence, not the sequence itself.

- **The wipe exists to hide a cut.** On a four, six or wicket a full-screen panel in the event colour crosses the frame carrying the 3D word. Halfway across — while the picture is fully covered — the feed cuts from the live source to the replay source. The viewer never sees the switch, only the word. That is the whole trick, and it is the reason the wipe is 1100ms rather than something shorter.
- **The replay is graded, not just swapped.** It comes back scaled 1.06, slightly desaturated, with scanlines and a vignette, so it reads as *footage of the past* rather than a second live camera.
- **Furniture, not decoration.** A pulsing REPLAY badge sits top-left with the event name; a shot bar sits bottom with the 3D word, the batter, the shot or dismissal, and the score at the moment it happened. The live score bar steps aside for the duration and returns with the live feed.
- **Nothing can strand the stage.** Every step of the sequence is a tracked timer. A second event mid-replay cancels the first cleanly, so the stage always returns to live — the failure mode of a sequence this long is being stuck in it, and that is designed out rather than hoped for.
- **Timing.** Wipe 1100ms, cut at the 550ms midpoint, replay holds 3.4s, then the same wipe carries "LIVE" back. About 5.5s end to end — a real broadcast replay length, and the demo's auto-play leaves room around it.
- **Same engine.** Match model, odometer rolls, strike rotation and the reduced-motion path are shared with options 2 and 3.

### Option 3 — Baseline Strip

**Why a third option.** Option 2 solves footprint by shrinking, but it still parks a block on one corner of the stream — and a streamer's own overlays, or the action itself, may live there. Option 3 solves it differently: it spans the full width so there is no side to collide with, and it stays thin enough (92px of 1080) that the frame above it is untouched.

- **One band, six modules.** Team, score, batters, bowler, this over, chase — left to right in the order a viewer asks the questions. Hairlines separate them; nothing stacks.
- **The score stands up.** The strip is 92px but the score module is 126px: it rises 34px above the band as a tab with a cyan top edge. The eye lands there first without the whole strip getting taller.
- **The event word repeats as a moving texture.** Behind the big centred word, the same word runs edge to edge across the band and drifts right to left. It is outlined rather than filled, so it reads at both ends of the gradient without competing with the solid word in the middle; a soft centre vignette keeps that word clear. The track is two identical halves so the loop is seamless, and the repeat count is measured against the band — "SIX" needs far more repeats than "WICKET" to overrun 1840px.

- **The strip itself becomes the event.** Covering the middle of a full-screen stream is exactly what a streamer does not want, so nothing floats over the picture. On a boundary or wicket the band grows from 92px to 150px, floods edge to edge with the event colour — gold for six, cyan for four, red for a wicket — the six detail modules clear away, and the 3D word lands dead centre of the strip. It holds, then the colour drains and the full scorecard comes back. 2.2s for a boundary, 2.6s for a wicket, which lands harder and with wider tracking.
- **Numerals you can read from the sofa.** The this-over pills are 44×30 with an 18px numeral — the smallest live number on screen is still legible at a glance.
- **Same engine, same guarantees.** Odometer rolls, strike rotation, run rates and the reduced-motion path are shared with Option 2. On phones the strip stacks into four short rows; the takeover band is 110px with a 46px word. Nothing is ever left mid-takeover — the restore runs off the same timer.

### Option 2 — Corner Card

**Layout**

- **A bug, not a bar.** Anchored bottom-left at 720×266, it covers about a fifth of the frame instead of the full width, so the stream stays the subject. A thin chase line above it carries target, need, CRR and RRR in small caps — present but quiet.
- **Hierarchy in one glance.** Team header, then the score at 92px, then the two batters, then the over ribbon. The bowler sits beside the score so the two active protagonists — batter on strike and bowler — are both in the top half.
- **The accent means "live".** One acid green marks the striker's arrow and runs, the current ball, and the numbers that decide the chase. Wickets, totals and names stay white so the accent never lies.
- **One signature shape.** A 45° chamfer on the bug's top-right corner, echoed in reverse on the event card's bottom-right, so the two panels read as one object when the card unfolds.

**Animation**

- **Numbers roll.** Every changing figure — score, wickets, overs, each batter's runs — rolls like an odometer: the old value slides up and out while the new one slides in beneath it, clipped to one line. A viewer sees *change*, not a swap.
- **Events unfold rather than flash.** A boundary or wicket slides a card out of the bug's right edge: kicker, a 3D-extruded event word, the batter's figures and the shot or dismissal. It holds for 2.6s (3s for a wicket) and folds back. The bug itself kicks on a boundary and slams on a wicket.
- **Centre-screen moment with 3D type.** The event word lands at screen centre in the event colour, extruded in two deeper tones of the same hue with a perspective tilt on entry, an accent rule that wipes beneath it, and the context line. Legible over any footage because the extrusion and scrim give it a hard edge.
- **Wickets are heavier by design.** Larger entry scale with rotation, a red wash across the bug, a longer hold, and only then does the dismissed batter's row slide out and the new one in — on strike, partnership reset.
- **Timing.** Rolls 460ms, kicks 420–520ms, card 550ms out and 350ms content fade, moment 1.6s (2s for a wicket).

**Responsiveness and craft**

- **Scaled above 760px, reflowed below.** Same approach as Option 1: the 1080p stage scales to fit; on phones the bug becomes a full-width bar, the chase line moves to the top, and the event card unfolds *upward* instead of sideways.
- **One state, one renderer.** Adding an outcome is one line in a table. Both tickers share the same match arithmetic, so run rates, strike rotation and the chase stay correct through any sequence.
- **Entrance and reaction animations live on different elements.** Changing an element's `animation-name` restarts whatever it falls back to; keeping the entrance on `.bug-body` and reactions on `.bug` means a boundary never replays the intro.

### Option 1 — Broadcast Bar

**Source:** `ticker-option-1-broadcast-bar/index.html`, `css/style.css`, `js/script.js`

### Layout and hierarchy

- **A three-band bug, read middle-out.** The crimson wedge holds the score and overs and is the largest element on screen by a wide margin. Batters sit left, bowler and this-over sit right, and a full-width band underneath carries the chase maths — target, need, CRR, RRR, partnership, last wicket. A viewer joining mid-broadcast gets the score first and the context second.

- **Team identity lives above the data, never on it.** The two team caps peek above the deck as tabs so the crest and name are always readable without ever overlapping a number.

- **Opaque by design.** Every panel is solid rather than translucent. Tested against a bright, busy frame, the ticker holds full contrast — a glassy treatment would have looked better on the dark stadium mock and failed over real footage.

### Animation

- **Every event is data-driven, not hand-wired.** One state object holds the match; each outcome mutates state, the renderer writes it to the DOM, and the animation plays on top of the change. Adding an outcome is a line in a table, not a new branch — which is why the score, strike rotation, bowler figures, run rates and partnership all stay correct after any sequence of events.

- **A boundary or wicket moves the whole ticker, not one number.** A tinted sheen sweeps the full width of the bar — cyan, gold or red to match the event — while the bar itself lifts and settles. The sheen is screen-blended at low opacity so the score stays readable as it passes over, rather than wiping the bar out. The event word lands dead centre of screen at the same moment.

- **The reaction is scaled to the event.** A single bumps the score and drops a marker into the over. A boundary adds a coloured burst — cyan for four, gold for six — and flares the wedge. A wicket is deliberately heavier: the bar drops and darkens instead of lifting, the word lands from a larger scale with a rotation, the wedge shakes, both tiers flood red, it holds 400ms longer than a boundary, and only then does the dismissed batter slide out and the new one walk in. A viewer can tell what happened from across the room without reading a word.

- **Timing follows broadcast convention.** Entry animations run 420–700ms, per-ball feedback 380–600ms, burst overlays 1.5s (1.9s for a wicket). Long enough to register on a stream, short enough never to hide the score.

- **Legibility over video is built into the burst.** The overlay words carry a hard dark edge plus a radial scrim, so "SIX" stays readable whether the frame behind it is a floodlit night sky or a white sightscreen.

### Responsiveness and craft

- **Two layouts, one source.** Above 760px the 1920×1080 stage is scaled to fit, which is how a broadcast overlay is actually composited. Below that, scaling would put the batter names at roughly 6px — so the ticker stops scaling and reflows into a two-row bar with the score leading, the chase trimmed to its three most important figures, and type sized for the real viewport.

- **It is still a clean overlay.** The event controls sit outside the scaled stage and hide with one click or the `H` key, so the ticker can be captured or keyed into OBS with nothing extra in frame.

- **Motion is optional.** Everything is gated behind `prefers-reduced-motion`; with motion reduced, events still register through colour and state change rather than movement.

---

## Notes for review

- **Try either ticker with the event buttons top-right**, or tick *Auto-play demo* to watch a scripted passage of play. Press `H` to hide the controls.
- Two numbers differ from the original static reference: CRR and RRR are now computed from live state rather than typed in, so they stay correct as the match moves. `Need` is derived from a 50-over innings.
- Both pages are static — no framework, no build step beyond `python3 scripts/build.py`, which stages everything into `public/`.

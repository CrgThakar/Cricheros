# Submission email - CricHeroes Practical Test (Web Designer)

> Fill the bracketed placeholders before sending:
> `[YOUR NAME]`, `[LIVE DEMO LINK]`, `[SOURCE CODE LINK]`, `[ZIP LINK]`, `[YOUR PHONE]`.
> If you attach the ZIP instead of linking it, delete the ZIP line and say "attached".

---

**Subject:** Both innings played - Web Designer practical test, [YOUR NAME]

---

Hi Team,

Thanks for the brief. Both innings are done: Assignment 1 played straight through, and
Assignment 2 played four different ways, because one shot was never going to answer the
question.

**Live demo:** [LIVE DEMO LINK]
**Source code:** [SOURCE CODE LINK]
**ZIP:** [ZIP LINK]

Everything is static HTML, CSS and JavaScript. No framework, no install, no external
services. The ZIP opens offline: unzip it and open `index.html`.

---

### First innings: match summary

[LIVE DEMO LINK]/scorecard-option-1/

- **The result is read off the scoreboard first.** The page opens on one dark card carrying
  the result banner, both innings, the Player of the Match, and the toss and format line. I
  pushed the recent matches rail below the match content, because four other scorelines
  sitting above the hero were the first thing the eye landed on, and that is the wrong answer
  to "what happened here".
- **Eight views, one tab bar, one scroll position.** Summary, Scorecard, Commentary,
  Analysis, Heroes, MVP, Teams and Gallery swap in place under a sticky bar, rather than
  stacking into an innings nobody sits through.
- **Nothing is left out of the scorebook on a phone, it is just not all read out at once.**
  The ten column scorecard keeps runs, balls and strike rate on show, and every other figure
  goes behind a "More stats" toggle for each player. The gallery only pads up when someone
  opens it.

### Second innings: live score ticker

Four options, because "how much of a streamer's frame is a score allowed to cover" turned out
to be the real question, and every answer builds a different product. All four run off one
match engine, so run rates, strike rotation and the chase stay correct through any sequence of
events you throw at them.

- **Option 1, broadcast bar:** [LIVE DEMO LINK]/ticker-option-1-broadcast-bar/
  The full-width lower third. Everything on show at all times, and it costs the bottom quarter
  of the frame.
- **Option 2, corner card:** [LIVE DEMO LINK]/ticker-option-2-corner-card/
  A compact panel at bottom left holding about a fifth of the frame. Quiet between
  deliveries, and it opens when something happens.
- **Option 3, baseline strip:** [LIVE DEMO LINK]/ticker-option-3-baseline-strip/
  A 92px band across the full width, so there is no corner left to collide with a streamer's
  own overlays. On a boundary or a wicket, the band itself does the celebrating.
- **Option 4, replay wall:** [LIVE DEMO LINK]/ticker-option-4-replay-wall/
  The one a director would recognise. The ticker calls for the replay instead of drawing over
  the action, and a full-screen wipe hides the cut between the live feed and the replay.

A few of the calls behind them:

- **Opaque, not glassy.** The translucent version looked lovely on a dark stadium still and
  fell apart over real footage, so all four are shown against a still from an actual match
  rather than a flat colour.
- **A wicket is heavier than a boundary, on purpose.** It drops and darkens instead of
  lifting, holds longer, and only then does the dismissed batter walk off and the new one come
  to the middle.
- **Numbers roll, they do not swap.** Every changing figure moves like a scoreboard odometer,
  so you see the run being scored rather than noticing afterwards that a number changed.
- **Motion is optional.** Everything sits behind `prefers-reduced-motion`, and with motion
  reduced events still register through colour and state. Nobody misses a wicket.

Each ticker has an event panel top right: fire individual balls, or tick **Auto-play demo**
and let a scripted passage of play run. Press **H** to hide the panel, and what is left is a
clean overlay, ready to key into OBS.

---

These are working builds, not net practice. What you are reviewing is the real thing at full
pace: real timing, real reflow, real legibility over footage. The design notes for both
innings are in `explanation.html`, at the top level of the ZIP and linked from the landing
page.

Happy to talk through any of it, or to take whichever ticker is closest to your line and
length a good deal further.

Thanks for the opportunity.

Best regards,
[YOUR NAME]
[YOUR PHONE]

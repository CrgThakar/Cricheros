/* =============================================================================
   Baseline Strip controller
   Same match model and odometer approach as option 2; the difference is the
   event surface, and covering the middle of a full-screen stream is exactly
   what a streamer does not want - so the strip itself takes over: it floods
   with the event colour, clears its modules, lands the word in its own centre,
   then returns to the full scorecard.
   ============================================================================= */
(function () {
  'use strict';

  var TOTAL_OVERS = 50;
  var BENCH = ['Rohit Sharma', 'Kunal Mehta', 'Devang Patel', 'Aarav Shah', 'Nikhil Rana', 'Imran Qureshi'];
  var SHOTS = {
    four: ['Driven through the covers', 'Pulled through midwicket', 'Cut past point', 'Flicked fine'],
    six: ['Over long-on', 'Into the stands at cow corner', 'Straight down the ground', 'Over the keeper']
  };

  var state = {
    runs: 129, wickets: 5, overs: 23, balls: 2, target: 229, striker: 0,
    batters: [{ name: 'Mayur Vasyani', runs: 23, balls: 41 }, { name: 'Vinay Vasyani', runs: 47, balls: 36 }],
    bowler: { name: 'Abhay Tomar', runs: 32, wickets: 0, balls: 32 },
    thisOver: ['1', '0'], partnership: { runs: 70, balls: 77 }, benchAt: 0, shotAt: 0
  };
  var initial = JSON.parse(JSON.stringify(state));

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    stage: $('stage'), strip: $('strip'), takeover: $('takeover'), toWord: $('toWord'), toTrack: $('toTrack'),
    runs: $('runs'), wkts: $('wkts'), overs: $('overs'), bats: [$('bat0'), $('bat1')],
    bowlName: $('bowlName'), bowlFigs: $('bowlFigs'), bowlOv: $('bowlOv'), pills: $('pills'),
    need: $('need'), left: $('left'), crr: $('crr'), rrr: $('rrr'),
    rail: $('rail'), railHide: $('railHide'), railShow: $('railShow'), autoPlay: $('autoPlay')
  };

  function ballsBowled() { return state.overs * 6 + state.balls; }
  function ballsLeft() { return TOTAL_OVERS * 6 - ballsBowled(); }
  function needed() { return Math.max(0, state.target - state.runs); }
  function crr() { var b = ballsBowled(); return b ? (state.runs / (b / 6)).toFixed(2) : '0.00'; }
  function rrr() { var b = ballsLeft(); return b ? (needed() / (b / 6)).toFixed(2) : '0.00'; }
  function ov(o, b) { return o + '.' + b; }

  function roll(odo, text) {
    var v = odo.querySelector('.odo-v'); text = String(text);
    if (v.textContent === text) return;
    // Drop any ghost still in flight, or fast events stack them on top of each other.
    odo.querySelectorAll('.odo-v.out').forEach(function (g) { g.remove(); });
    var ghost = v.cloneNode(true); ghost.className = 'odo-v out'; odo.appendChild(ghost);
    v.textContent = text; v.classList.remove('in'); void v.offsetWidth; v.classList.add('in');
    setTimeout(function () { ghost.remove(); v.classList.remove('in'); }, 500);
  }
  function flash(node, cls, ms) {
    if (!node) return;
    node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls);
    setTimeout(function () { node.classList.remove(cls); }, ms || 800);
  }

  function render(changed) {
    changed = changed || {};
    roll(el.runs, state.runs); roll(el.wkts, state.wickets); roll(el.overs, ov(state.overs, state.balls));
    state.batters.forEach(function (b, i) {
      var row = el.bats[i];
      row.querySelector('.bat-name').textContent = b.name;
      roll(row.querySelector('.bat-runs'), b.runs);
      row.querySelector('.bat-balls').textContent = b.balls;
      row.classList.toggle('on-strike', i === state.striker);
    });
    el.bowlName.textContent = state.bowler.name;
    el.bowlFigs.textContent = state.bowler.runs + '-' + state.bowler.wickets;
    el.bowlOv.textContent = ov(Math.floor(state.bowler.balls / 6), state.bowler.balls % 6);
    el.pills.innerHTML = '';
    for (var i = 0; i < 6; i++) {
      var m = state.thisOver[i]; var d = document.createElement('span');
      d.className = 'pill' + (m === undefined ? '' : ' f' + m);
      d.textContent = m === undefined ? '' : m;
      if (changed.newBall && i === state.thisOver.length - 1) d.classList.add('land');
      el.pills.appendChild(d);
    }
    el.need.textContent = needed(); el.left.textContent = ballsLeft();
    el.crr.textContent = crr(); el.rrr.textContent = rrr();
  }

  /* The strip carries the event itself: it grows, floods with the event colour,
     the detail modules clear and the word lands in the centre of the band.
     Everything is restored on the same timer, so the strip always comes back to
     the full scorecard even if events overlap. */
  var toTimer = null;
  var TAKE = ['take-four', 'take-six', 'take-wicket', 'take-fifty', 'take-over'];

  /* The marquee is two identical halves of the same word, so shifting by -50%
     lands on the same frame and the loop is seamless. Each half has to be wider
     than the band or the shift would expose a gap - and a short word like SIX
     needs far more repeats than WICKET, so the count is measured, not fixed. */
  function fillMarquee(word) {
    el.toTrack.textContent = '';
    var probe = document.createElement('span');
    probe.textContent = word;
    el.toTrack.appendChild(probe);
    var one = probe.getBoundingClientRect().width || 160;
    var band = el.strip.getBoundingClientRect().width || 1840;
    var perHalf = Math.max(4, Math.ceil(band / one) + 2);
    el.toTrack.textContent = '';
    for (var i = 0; i < perHalf * 2; i++) {
      var span = document.createElement('span');
      span.textContent = word;
      el.toTrack.appendChild(span);
    }
  }

  function takeover(kind, word, ms) {
    clearTimeout(toTimer);
    el.strip.classList.remove('taken');
    TAKE.forEach(function (c) { el.strip.classList.remove(c); });
    el.toWord.textContent = word;
    fillMarquee(word);
    void el.strip.offsetWidth;
    el.strip.classList.add('taken', 'take-' + kind);
    toTimer = setTimeout(function () {
      el.strip.classList.remove('taken');
      // Hold the colour until the band has finished shrinking, then drain it.
      setTimeout(function () { TAKE.forEach(function (c) { el.strip.classList.remove(c); }); }, 420);
    }, ms || 2200);
  }

  function stripReact(kind) {
    el.strip.classList.remove('ev-four', 'ev-six', 'ev-wicket');
    el.strip.classList.add('ev-' + kind);
    flash(el.strip, 'wash-' + kind, 950);
    flash(el.strip, kind === 'wicket' ? 'slam' : 'kick', kind === 'wicket' ? 800 : 550);
    if (kind !== 'wicket') flash(el.strip, 'flare', 650);
  }

  var OUTCOMES = {
    dot: { runs: 0, mark: '0' }, run1: { runs: 1, mark: '1' }, run2: { runs: 2, mark: '2' },
    four: { runs: 4, mark: '4', kind: 'four', word: 'Four' }, six: { runs: 6, mark: '6', kind: 'six', word: 'Six' },
    wicket: { runs: 0, mark: 'W', kind: 'wicket', word: 'Wicket', wicket: true }
  };
  function advanceBall() { state.balls += 1; state.bowler.balls += 1; if (state.balls === 6) { state.overs += 1; state.balls = 0; } }

  function playBall(key) {
    var o = OUTCOMES[key]; if (!o) return;
    var before = state.striker, bat = state.batters[before];
    state.runs += o.runs; state.bowler.runs += o.runs; bat.balls += 1; state.partnership.balls += 1;
    if (o.wicket) { state.wickets += 1; state.bowler.wickets += 1; }
    else { bat.runs += o.runs; state.partnership.runs += o.runs; if (o.runs % 2 === 1) state.striker = before === 0 ? 1 : 0; }
    if (state.thisOver.length >= 6) state.thisOver = [];
    state.thisOver.push(o.mark); advanceBall();
    render({ newBall: true });

    if (o.wicket) {
      stripReact('wicket');
      takeover('wicket', 'WICKET', 2600);
      setTimeout(function () { newBatter(before); }, 1250);
    } else if (o.runs >= 4) {
      var shot = SHOTS[o.kind][state.shotAt % SHOTS[o.kind].length]; state.shotAt += 1;
      stripReact(o.kind);
      takeover(o.kind, o.runs === 6 ? 'SIX' : 'FOUR', 2200);
      if (bat.runs >= 50 && bat.runs - o.runs < 50) {
        setTimeout(function () { takeover('fifty', 'FIFTY', 2200); }, 2500);
      }
    } else {
      if (o.runs) flash(el.strip, 'kick', 420);
      if (o.runs && bat.runs >= 50 && bat.runs - o.runs < 50) takeover('fifty', 'FIFTY', 2200);
    }
  }

  function newBatter(slot) {
    var row = el.bats[slot];
    flash(row, 'out', 420);
    setTimeout(function () {
      state.batters[slot] = { name: BENCH[state.benchAt % BENCH.length], runs: 0, balls: 0 };
      state.benchAt += 1; state.striker = slot; state.partnership = { runs: 0, balls: 0 };
      render({}); flash(row, 'in', 700);
    }, 410);
  }

  function endOver() {
    if (state.balls !== 0) { state.overs += 1; state.bowler.balls += 6 - state.balls; state.balls = 0; }
    var runsThisOver = state.thisOver.reduce(function (a, m) { return a + (m === 'W' ? 0 : Number(m)); }, 0);
    var completed = state.overs;
    el.pills.classList.add('clear');
    setTimeout(function () {
      el.pills.classList.remove('clear');
      state.thisOver = []; state.striker = state.striker === 0 ? 1 : 0;
      state.bowler = { name: BENCH[(state.benchAt + 2) % BENCH.length], runs: 0, wickets: 0, balls: 0 };
      render({});
      takeover('over', 'OVER ' + completed, 2000);
    }, 380);
  }

  function reset() {
    clearTimeout(toTimer);
    el.strip.classList.remove('taken');
    TAKE.forEach(function (c) { el.strip.classList.remove(c); });
    state = JSON.parse(JSON.stringify(initial)); render({});
  }

  document.querySelectorAll('.rail-grid [data-ev]').forEach(function (b) {
    b.addEventListener('click', function () {
      var ev = b.dataset.ev;
      if (ev === 'reset') return reset(); if (ev === 'over') return endOver(); playBall(ev);
    });
  });
  function setRail(show) { el.rail.hidden = !show; el.railShow.hidden = show; try { localStorage.setItem('stripRail', show ? '1' : '0'); } catch (e) {} }
  el.railHide.addEventListener('click', function () { setRail(false); });
  el.railShow.addEventListener('click', function () { setRail(true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'h' || e.key === 'H') setRail(el.rail.hidden); });
  var pref = '1'; try { pref = localStorage.getItem('stripRail') || '1'; } catch (e) {}
  setRail(pref === '1');

  var DEMO = ['run1', 'dot', 'four', 'run1', 'dot', 'six', 'run2', 'wicket', 'dot', 'run1', 'four', 'over', 'run1', 'dot', 'six', 'dot'];
  var demoAt = 0, demoTimer = null;
  function demoStep() {
    var ev = DEMO[demoAt % DEMO.length]; demoAt += 1;
    if (ev === 'over') endOver(); else playBall(ev);
    demoTimer = setTimeout(demoStep, ev === 'wicket' ? 3600 : (ev === 'four' || ev === 'six' || ev === 'over') ? 3000 : 1700);
  }
  el.autoPlay.addEventListener('change', function () { clearTimeout(demoTimer); if (el.autoPlay.checked) demoTimer = setTimeout(demoStep, 600); });

  function fit() {
    var compact = window.innerWidth <= 760;
    document.body.classList.toggle('compact', compact);
    el.stage.style.transform = compact ? '' : 'scale(' + Math.min(window.innerWidth / 1920, window.innerHeight / 1080) + ')';
  }
  window.addEventListener('resize', fit);
  fit(); render({});
})();

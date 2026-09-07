/* =============================================================================
   Replay Wall controller
   Same match model as options 2 and 3. What differs is that a boundary or a
   wicket runs a broadcast replay sequence rather than a graphic: wipe across ->
   cut the feed to replay while covered -> wipe off -> hold the replay with the
   badge and shot detail -> wipe across -> cut back to live -> wipe off.
   ============================================================================= */
(function () {
  'use strict';

  var TOTAL_OVERS = 50;
  var BENCH = ['Rohit Sharma', 'Kunal Mehta', 'Devang Patel', 'Aarav Shah', 'Nikhil Rana', 'Imran Qureshi'];
  var SHOTS = {
    four: ['Driven through the covers', 'Pulled through midwicket', 'Cut past point', 'Flicked fine'],
    six: ['Over long-on', 'Into the stands at cow corner', 'Straight down the ground', 'Over the keeper']
  };

  /* Sequence timing. WIPE must match --wipe in the stylesheet; the cut happens
     at the midpoint, while the panel covers the frame. */
  var WIPE = 1100, COVER = WIPE * 0.5, HOLD = 3400;

  var state = {
    runs: 129, wickets: 5, overs: 23, balls: 2, target: 229, striker: 0,
    batters: [{ name: 'Mayur Vasyani', runs: 23, balls: 41 }, { name: 'Vinay Vasyani', runs: 47, balls: 36 }],
    bowler: { name: 'Abhay Tomar', runs: 32, wickets: 0, balls: 32 },
    thisOver: ['1', '0'], partnership: { runs: 70, balls: 77 }, benchAt: 0, shotAt: 0
  };
  var initial = JSON.parse(JSON.stringify(state));

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    stage: $('stage'), wipe: $('wipe'), wipeWord: $('wipeWord'), bar: $('bar'),
    rpKind: $('rpKind'), rpShotWord: $('rpShotWord'), rpName: $('rpName'), rpSub: $('rpSub'), rpScore: $('rpScore'),
    runs: $('runs'), wkts: $('wkts'), overs: $('overs'), bats: [$('bat0'), $('bat1')],
    pills: $('pills'), need: $('need'), left: $('left'),
    rail: $('rail'), railHide: $('railHide'), railShow: $('railShow'), autoPlay: $('autoPlay')
  };
  el.stage.style.setProperty('--wipe', WIPE + 'ms');

  function ballsBowled() { return state.overs * 6 + state.balls; }
  function ballsLeft() { return TOTAL_OVERS * 6 - ballsBowled(); }
  function needed() { return Math.max(0, state.target - state.runs); }
  function ov(o, b) { return o + '.' + b; }

  function roll(odo, text) {
    var v = odo.querySelector('.odo-v'); text = String(text);
    if (v.textContent === text) return;
    odo.querySelectorAll('.odo-v.out').forEach(function (g) { g.remove(); });
    var ghost = v.cloneNode(true); ghost.className = 'odo-v out'; odo.appendChild(ghost);
    v.textContent = text; v.classList.remove('in'); void v.offsetWidth; v.classList.add('in');
    setTimeout(function () { ghost.remove(); v.classList.remove('in'); }, 500);
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
    el.pills.innerHTML = '';
    for (var i = 0; i < 6; i++) {
      var m = state.thisOver[i], d = document.createElement('span');
      d.className = 'pill' + (m === undefined ? '' : ' f' + m);
      d.textContent = m === undefined ? '' : m;
      if (changed.newBall && i === state.thisOver.length - 1) d.classList.add('land');
      el.pills.appendChild(d);
    }
    el.need.textContent = needed();
    el.left.textContent = ballsLeft();
  }

  /* ---------- replay sequence ------------------------------------------------
     Every step is tracked so a second event mid-sequence cancels the first
     cleanly rather than leaving the stage stuck in replay. */
  var timers = [];
  var EV = ['ev-four', 'ev-six', 'ev-wicket', 'ev-fifty', 'ev-over'];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function cancelSequence() {
    timers.forEach(clearTimeout); timers = [];
    el.wipe.classList.remove('on');
    el.stage.classList.remove('is-replay');
  }

  function wipe(word) {
    el.wipeWord.textContent = word;
    el.wipe.classList.remove('on');
    void el.wipe.offsetWidth;
    el.wipe.classList.add('on');
    later(function () { el.wipe.classList.remove('on'); }, WIPE);
  }

  function replay(kind, word, name, sub) {
    cancelSequence();
    EV.forEach(function (c) { el.stage.classList.remove(c); });
    el.stage.classList.add('ev-' + kind);

    el.rpKind.textContent = word;
    el.rpShotWord.textContent = word.toUpperCase();
    el.rpName.textContent = name;
    el.rpSub.textContent = sub;
    el.rpScore.textContent = state.runs + '/' + state.wickets + ' · ' + ov(state.overs, state.balls);

    wipe(word.toUpperCase());
    // Cut to replay while the panel covers the frame.
    later(function () { el.stage.classList.add('is-replay'); }, COVER);
    // Wipe back and return to live, again cutting under cover.
    later(function () { wipe('Live'); }, COVER + HOLD);
    later(function () { el.stage.classList.remove('is-replay'); }, COVER + HOLD + COVER);
  }

  /* ---------- outcomes ------------------------------------------------------ */
  var OUTCOMES = {
    dot: { runs: 0, mark: '0' }, run1: { runs: 1, mark: '1' }, run2: { runs: 2, mark: '2' },
    four: { runs: 4, mark: '4', kind: 'four', word: 'Four' },
    six: { runs: 6, mark: '6', kind: 'six', word: 'Six' },
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
      replay('wicket', 'Wicket', bat.name, 'b ' + state.bowler.name + ' · ' + bat.runs + ' (' + bat.balls + ')');
      later(function () { newBatter(before); }, COVER + HOLD + COVER + 200);
    } else if (o.runs >= 4) {
      var shot = SHOTS[o.kind][state.shotAt % SHOTS[o.kind].length]; state.shotAt += 1;
      replay(o.kind, o.word, bat.name, shot + ' · ' + bat.runs + ' (' + bat.balls + ')');
    }
  }

  function newBatter(slot) {
    state.batters[slot] = { name: BENCH[state.benchAt % BENCH.length], runs: 0, balls: 0 };
    state.benchAt += 1; state.striker = slot; state.partnership = { runs: 0, balls: 0 };
    render({});
  }

  function endOver() {
    if (state.balls !== 0) { state.overs += 1; state.bowler.balls += 6 - state.balls; state.balls = 0; }
    el.pills.classList.add('clear');
    later(function () {
      el.pills.classList.remove('clear');
      state.thisOver = []; state.striker = state.striker === 0 ? 1 : 0;
      state.bowler = { name: BENCH[(state.benchAt + 2) % BENCH.length], runs: 0, wickets: 0, balls: 0 };
      render({});
    }, 340);
  }

  function reset() {
    cancelSequence();
    EV.forEach(function (c) { el.stage.classList.remove(c); });
    state = JSON.parse(JSON.stringify(initial));
    render({});
  }

  /* ---------- controls ------------------------------------------------------ */
  document.querySelectorAll('.rail-grid [data-ev]').forEach(function (b) {
    b.addEventListener('click', function () {
      var ev = b.dataset.ev;
      if (ev === 'reset') return reset();
      if (ev === 'over') return endOver();
      playBall(ev);
    });
  });
  function setRail(show) {
    el.rail.hidden = !show; el.railShow.hidden = show;
    try { localStorage.setItem('replayRail', show ? '1' : '0'); } catch (e) {}
  }
  el.railHide.addEventListener('click', function () { setRail(false); });
  el.railShow.addEventListener('click', function () { setRail(true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'h' || e.key === 'H') setRail(el.rail.hidden); });
  var pref = '1'; try { pref = localStorage.getItem('replayRail') || '1'; } catch (e) {}
  setRail(pref === '1');

  /* The replay owns the screen for ~5s, so the demo leaves room around it. */
  var SEQ = COVER + HOLD + COVER + WIPE;
  var DEMO = ['run1', 'dot', 'four', 'run1', 'dot', 'six', 'run2', 'wicket', 'dot', 'run1', 'four', 'over', 'dot', 'six'];
  var demoAt = 0, demoTimer = null;
  function demoStep() {
    var ev = DEMO[demoAt % DEMO.length]; demoAt += 1;
    if (ev === 'over') endOver(); else playBall(ev);
    var big = (ev === 'four' || ev === 'six' || ev === 'wicket');
    demoTimer = setTimeout(demoStep, big ? SEQ + 900 : 1700);
  }
  el.autoPlay.addEventListener('change', function () {
    clearTimeout(demoTimer);
    if (el.autoPlay.checked) demoTimer = setTimeout(demoStep, 600);
  });

  function fit() {
    var compact = window.innerWidth <= 760;
    document.body.classList.toggle('compact', compact);
    el.stage.style.transform = compact ? '' : 'scale(' + Math.min(window.innerWidth / 1920, window.innerHeight / 1080) + ')';
  }
  window.addEventListener('resize', fit);
  fit(); render({});
})();

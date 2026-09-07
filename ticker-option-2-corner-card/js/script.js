/* =============================================================================
   Corner Card controller
   Same idea as option 1: one state object, one renderer, animation layered on
   top of the data change. What differs is how change is shown — every number
   rolls like an odometer, and events unfold a card from the card instead of
   flashing the whole bar.
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
    runs: 129, wickets: 5, overs: 23, balls: 2, target: 229,
    striker: 0,
    batters: [
      { name: 'Mayur Vasyani', runs: 23, balls: 41 },
      { name: 'Vinay Vasyani', runs: 47, balls: 36 }
    ],
    bowler: { name: 'Abhay Tomar', runs: 32, wickets: 0, balls: 32 },
    thisOver: ['1', '0'],
    partnership: { runs: 70, balls: 77 },
    benchAt: 0, shotAt: 0
  };
  var initial = JSON.parse(JSON.stringify(state));

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    stage: $('stage'), card: $('card'), event: $('event'), moment: $('moment'),
    runs: $('runs'), wkts: $('wkts'), overs: $('overs'),
    bats: [$('bat0'), $('bat1')],
    bowlName: $('bowlName'), bowlFigs: $('bowlFigs'), bowlOv: $('bowlOv'),
    dots: $('dots'),
    target: $('target'), need: $('need'), left: $('left'), crr: $('crr'), rrr: $('rrr'), pship: $('pship'),
    evKicker: $('evKicker'), evWord: $('evWord'), evLine: $('evLine'), evSub: $('evSub'),
    momentWord: $('momentWord'), momentSub: $('momentSub'),
    rail: $('rail'), railHide: $('railHide'), railShow: $('railShow'), autoPlay: $('autoPlay')
  };

  /* ---------- derived -------------------------------------------------------- */
  function ballsBowled() { return state.overs * 6 + state.balls; }
  function ballsLeft() { return TOTAL_OVERS * 6 - ballsBowled(); }
  function needed() { return Math.max(0, state.target - state.runs); }
  function crr() { var b = ballsBowled(); return b ? (state.runs / (b / 6)).toFixed(2) : '0.00'; }
  function rrr() { var b = ballsLeft(); return b ? (needed() / (b / 6)).toFixed(2) : '0.00'; }
  function ov(o, b) { return o + '.' + b; }

  /* ---------- odometer -------------------------------------------------------- */
  /* The visible value is a single .odo-v inside a 1em-high clipped grid cell.
     To roll, a clone of the old value is left behind to slide out while the
     real element takes the new text and slides in. */
  function roll(odo, text) {
    var v = odo.querySelector('.odo-v');
    text = String(text);
    if (v.textContent === text) return;
    var ghost = v.cloneNode(true);
    ghost.className = 'odo-v out';
    odo.appendChild(ghost);
    v.textContent = text;
    v.classList.remove('in'); void v.offsetWidth; v.classList.add('in');
    setTimeout(function () { ghost.remove(); v.classList.remove('in'); }, 500);
  }

  function flash(node, cls, ms) {
    if (!node) return;
    node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls);
    setTimeout(function () { node.classList.remove(cls); }, ms || 800);
  }

  /* ---------- render ---------------------------------------------------------- */
  function render(changed) {
    changed = changed || {};

    roll(el.runs, state.runs);
    roll(el.wkts, state.wickets);
    roll(el.overs, ov(state.overs, state.balls));

    state.batters.forEach(function (b, i) {
      var row = el.bats[i];
      row.querySelector('.bat-name').textContent = b.name;
      roll(row.querySelector('.bat-runs'), b.runs);
      row.querySelector('.bat-balls').textContent = '(' + b.balls + ')';
      row.classList.toggle('on-strike', i === state.striker);
    });

    el.bowlName.textContent = state.bowler.name;
    el.bowlFigs.textContent = state.bowler.runs + '-' + state.bowler.wickets;
    el.bowlOv.textContent = ov(Math.floor(state.bowler.balls / 6), state.bowler.balls % 6);

    // Over ribbon: six pills, filled left to right
    el.dots.innerHTML = '';
    for (var i = 0; i < 6; i++) {
      var m = state.thisOver[i];
      var d = document.createElement('span');
      d.className = 'dot' + (m === undefined ? '' : ' f' + m);
      d.textContent = m === undefined ? '' : m;
      if (changed.newBall && i === state.thisOver.length - 1) d.classList.add('land');
      el.dots.appendChild(d);
    }

    el.target.textContent = state.target;
    el.need.textContent = needed();
    el.left.textContent = ballsLeft();
    el.crr.textContent = crr();
    el.rrr.textContent = rrr();
    el.pship.textContent = state.partnership.runs + ' (' + state.partnership.balls + ')';
  }

  /* ---------- event card + centre moment ------------------------------------ */
  var evTimer = null;
  function showEvent(kind, kicker, word, line, sub, ms) {
    clearTimeout(evTimer);
    el.card.classList.remove('is-event', 'ev-four', 'ev-six', 'ev-wicket', 'ev-over', 'ev-fifty');
    el.evKicker.textContent = kicker;
    el.evWord.textContent = word;
    el.evLine.textContent = line;
    el.evSub.textContent = sub || '';
    void el.card.offsetWidth;
    el.card.classList.add('is-event', 'ev-' + kind);
    evTimer = setTimeout(function () { el.card.classList.remove('is-event'); }, ms || 2600);
  }

  var moTimer = null;
  function moment(word, sub, kind, ms) {
    clearTimeout(moTimer);
    el.moment.className = 'moment';
    void el.moment.offsetWidth;
    el.momentWord.textContent = word;
    el.momentSub.textContent = sub || '';
    el.moment.classList.add('show', kind);
    moTimer = setTimeout(function () { el.moment.className = 'moment'; }, ms || 1600);
  }

  /* ---------- outcomes ------------------------------------------------------- */
  var OUTCOMES = {
    dot:    { runs: 0, mark: '0' },
    run1:   { runs: 1, mark: '1' },
    run2:   { runs: 2, mark: '2' },
    four:   { runs: 4, mark: '4', kind: 'four', word: 'Four' },
    six:    { runs: 6, mark: '6', kind: 'six',  word: 'Six' },
    wicket: { runs: 0, mark: 'W', kind: 'wicket', word: 'Wicket', wicket: true }
  };

  function advanceBall() {
    state.balls += 1; state.bowler.balls += 1;
    if (state.balls === 6) { state.overs += 1; state.balls = 0; }
  }

  function playBall(key) {
    var o = OUTCOMES[key]; if (!o) return;
    var before = state.striker;
    var bat = state.batters[before];
    var changed = { newBall: true };

    state.runs += o.runs; state.bowler.runs += o.runs;
    bat.balls += 1; state.partnership.balls += 1;

    if (o.wicket) {
      state.wickets += 1; state.bowler.wickets += 1;
    } else {
      bat.runs += o.runs; state.partnership.runs += o.runs;
      if (o.runs % 2 === 1) state.striker = before === 0 ? 1 : 0;
    }
    if (state.thisOver.length >= 6) state.thisOver = [];
    state.thisOver.push(o.mark);
    advanceBall();
    render(changed);

    if (o.wicket) {
      flash(el.card, 'slam', 900);
      moment('Wicket', bat.name + ' b ' + state.bowler.name, 'wicket', 2000);
      showEvent('wicket', 'Wicket', 'OUT', bat.name + ' · ' + bat.runs + ' (' + bat.balls + ')',
                'b ' + state.bowler.name + ' · ' + state.runs + '-' + state.wickets, 3000);
      setTimeout(function () { newBatter(before); }, 1250);
    } else if (o.runs >= 4) {
      var shot = SHOTS[o.kind][state.shotAt % SHOTS[o.kind].length]; state.shotAt += 1;
      flash(el.card, 'kick', 520);
      flash(el.card, 'flare', 620);
      moment(o.word, shot, o.kind, 1600);
      showEvent(o.kind, 'Boundary', o.runs === 6 ? 'SIX' : 'FOUR', bat.name + ' · ' + bat.runs + ' (' + bat.balls + ')', shot, 2600);
      if (bat.runs >= 50 && bat.runs - o.runs < 50) {
        setTimeout(function () {
          moment('50', bat.name, 'fifty', 1600);
          showEvent('fifty', 'Milestone', '50', bat.name, bat.balls + ' balls', 2600);
        }, 1700);
      }
    } else {
      if (o.runs) flash(el.card, 'kick', 420);
      if (bat.runs >= 50 && bat.runs - o.runs < 50 && o.runs) {
        moment('50', bat.name, 'fifty', 1600);
        showEvent('fifty', 'Milestone', '50', bat.name, bat.balls + ' balls', 2600);
      }
    }
  }

  function newBatter(slot) {
    var row = el.bats[slot];
    flash(row, 'out', 420);
    setTimeout(function () {
      state.batters[slot] = { name: BENCH[state.benchAt % BENCH.length], runs: 0, balls: 0 };
      state.benchAt += 1;
      state.striker = slot;
      state.partnership = { runs: 0, balls: 0 };
      render({});
      flash(row, 'in', 700);
    }, 410);
  }

  function endOver() {
    if (state.balls !== 0) { state.overs += 1; state.bowler.balls += 6 - state.balls; state.balls = 0; }
    var runsThisOver = state.thisOver.reduce(function (a, m) { return a + (m === 'W' ? 0 : Number(m)); }, 0);
    var completed = state.overs;
    el.dots.classList.add('clear');
    setTimeout(function () {
      el.dots.classList.remove('clear');
      state.thisOver = [];
      state.striker = state.striker === 0 ? 1 : 0;
      state.bowler = { name: BENCH[(state.benchAt + 2) % BENCH.length], runs: 0, wickets: 0, balls: 0 };
      render({});
      showEvent('over', 'End of over ' + completed, runsThisOver + ' runs', state.bowler.name + ' to bowl', needed() + ' needed off ' + ballsLeft(), 2600);
    }, 380);
  }

  function reset() {
    clearTimeout(evTimer); clearTimeout(moTimer);
    el.card.classList.remove('is-event'); el.moment.className = 'moment';
    state = JSON.parse(JSON.stringify(initial));
    render({});
  }

  /* ---------- controls -------------------------------------------------------- */
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
    try { localStorage.setItem('acidRail', show ? '1' : '0'); } catch (e) {}
  }
  el.railHide.addEventListener('click', function () { setRail(false); });
  el.railShow.addEventListener('click', function () { setRail(true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'h' || e.key === 'H') setRail(el.rail.hidden); });
  var pref = '1'; try { pref = localStorage.getItem('acidRail') || '1'; } catch (e) {}
  setRail(pref === '1');

  var DEMO = ['run1', 'dot', 'four', 'run1', 'dot', 'six', 'run2', 'wicket', 'dot', 'run1', 'four', 'over', 'run1', 'dot', 'six', 'dot'];
  var demoAt = 0, demoTimer = null;
  function demoStep() {
    var ev = DEMO[demoAt % DEMO.length]; demoAt += 1;
    if (ev === 'over') endOver(); else playBall(ev);
    var wait = ev === 'wicket' ? 3600 : (ev === 'four' || ev === 'six' || ev === 'over') ? 3000 : 1700;
    demoTimer = setTimeout(demoStep, wait);
  }
  el.autoPlay.addEventListener('change', function () {
    clearTimeout(demoTimer);
    if (el.autoPlay.checked) demoTimer = setTimeout(demoStep, 600);
  });

  /* ---------- sizing ---------------------------------------------------------- */
  function fit() {
    var compact = window.innerWidth <= 760;
    document.body.classList.toggle('compact', compact);
    el.stage.style.transform = compact ? '' : 'scale(' + Math.min(window.innerWidth / 1920, window.innerHeight / 1080) + ')';
  }
  window.addEventListener('resize', fit);
  fit();
  render({});
})();

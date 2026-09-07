/* =============================================================================
   Live ticker controller
   One state object is the single source of truth. Every event mutates state,
   render() writes state to the DOM, and the animation is played on top of the
   change rather than being hand-wired per event. Adding an outcome means adding
   a line to OUTCOMES, not a new branch.
   ============================================================================= */
(function () {
  'use strict';

  var TOTAL_OVERS = 50;
  var BENCH = ['Rohit Sharma', 'Kunal Mehta', 'Devang Patel', 'Aarav Shah', 'Nikhil Rana', 'Imran Qureshi'];

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
    lastWkt: '59-5',
    benchAt: 0
  };

  var initial = JSON.parse(JSON.stringify(state));

  var el = {};
  ['score', 'overs', 'bowlName', 'bowlFig', 'bowlOv', 'overRow', 'batting',
   'tier2', 'hero', 'burst', 'scorebar', 'rail', 'railHide', 'railShow', 'autoPlay'].forEach(function (id) {
    el[id] = document.getElementById(id);
  });
  el.stage = document.querySelector('.stage');
  el.tier1 = document.querySelector('.tier1');
  el.burstWord = el.burst.querySelector('.burst-word');
  el.burstSub = el.burst.querySelector('.burst-sub');

  /* ---------- derived numbers ---------------------------------------------- */
  function ballsBowled() { return state.overs * 6 + state.balls; }
  function ballsLeft() { return TOTAL_OVERS * 6 - ballsBowled(); }
  function runsNeeded() { return Math.max(0, state.target - state.runs); }
  function crr() { var b = ballsBowled(); return b ? (state.runs / (b / 6)).toFixed(2) : '0.00'; }
  function rrr() { var b = ballsLeft(); return b ? (runsNeeded() / (b / 6)).toFixed(2) : '0.00'; }
  function strikeRate(b) { return b.balls ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0'; }
  function oversText(o, b) { return o + '.' + b; }

  /* ---------- animation helper --------------------------------------------- */
  /* Re-adding a class does not restart a CSS animation, so it is removed first
     and the layout is flushed before it goes back on. */
  function flash(node, cls, ms) {
    if (!node) return;
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
    setTimeout(function () { node.classList.remove(cls); }, ms || 900);
  }

  /* The whole bar reacts to a boundary or a wicket, not just the score wedge. */
  var reactTimer = null;
  function reactBar(kind, ms) {
    clearTimeout(reactTimer);
    el.scorebar.classList.remove('react', 'react-four', 'react-six', 'react-wicket');
    void el.scorebar.offsetWidth;
    el.scorebar.classList.add('react', 'react-' + kind);
    reactTimer = setTimeout(function () {
      el.scorebar.classList.remove('react', 'react-four', 'react-six', 'react-wicket');
    }, ms);
  }

  var burstTimer = null;
  function burst(word, sub, kind, ms) {
    clearTimeout(burstTimer);
    el.burst.className = 'burst';
    void el.burst.offsetWidth;
    el.burstWord.textContent = word;
    el.burstSub.textContent = sub || '';
    el.burst.classList.add('show');
    if (kind) el.burst.classList.add('is-' + kind);
    burstTimer = setTimeout(function () { el.burst.className = 'burst'; }, ms || 1500);
  }

  /* ---------- render -------------------------------------------------------- */
  function render(changed) {
    changed = changed || {};

    el.score.textContent = state.runs + '/' + state.wickets;
    el.overs.textContent = oversText(state.overs, state.balls);

    // Batters
    var rows = el.batting.querySelectorAll('.bat-row');
    state.batters.forEach(function (b, i) {
      var row = rows[i];
      if (!row) return;
      row.querySelector('.bat-name').textContent = b.name;
      var runsEl = row.querySelector('.bat-runs');
      runsEl.textContent = b.runs;
      row.querySelector('.bat-balls').textContent = '(' + b.balls + ')';
      row.querySelector('.bat-sr').textContent = 'SR ' + strikeRate(b);
      var strike = row.querySelector('.strike');
      strike.classList.toggle('hidden', i !== state.striker);
      if (changed.strikeMoved && i === state.striker) flash(strike, 'pass', 600);
      if (changed.scoringBatter === i) flash(runsEl, 'tick', 520);
    });

    // Bowler
    el.bowlName.textContent = state.bowler.name;
    el.bowlFig.innerHTML = state.bowler.runs + '<small>-' + state.bowler.wickets + '</small>';
    el.bowlOv.textContent = '(' + oversText(Math.floor(state.bowler.balls / 6), state.bowler.balls % 6) + ')';

    // This over — six slots, filled left to right
    var lab = el.overRow.querySelector('.olab');
    el.overRow.innerHTML = '';
    el.overRow.appendChild(lab);
    for (var i = 0; i < 6; i++) {
      var v = state.thisOver[i];
      var d = document.createElement('div');
      if (v === undefined) {
        d.className = 'ball empty';
      } else {
        d.className = 'ball ' + (v === 'W' ? 'bw' : v === '4' ? 'b4' : v === '6' ? 'b6' : 'b' + v);
        d.textContent = v;
        if (changed.newBall && i === state.thisOver.length - 1) d.classList.add('land');
      }
      el.overRow.appendChild(d);
    }

    // Stat band
    var vals = el.tier2.querySelectorAll('.seg .val');
    var chase = runsNeeded();
    vals[0].textContent = state.target;
    vals[1].innerHTML = '<b>' + chase + '</b> <small>off</small> ' + ballsLeft();
    vals[2].textContent = crr();
    vals[3].textContent = rrr();
    vals[4].innerHTML = state.partnership.runs + ' <small>(' + state.partnership.balls + ')</small>';
    vals[5].textContent = state.lastWkt;
    if (changed.stats) {
      [1, 2, 3, 4].forEach(function (i) { flash(vals[i], 'refresh', 520); });
    }
  }

  /* ---------- outcomes ------------------------------------------------------ */
  /* Each entry describes what a ball does. `after` runs once the burst has had
     its moment, which is where the batter swap for a wicket happens. */
  var OUTCOMES = {
    dot:    { runs: 0, mark: '0' },
    run1:   { runs: 1, mark: '1' },
    run2:   { runs: 2, mark: '2' },
    four:   { runs: 4, mark: '4', word: 'Four', kind: 'four' },
    six:    { runs: 6, mark: '6', word: 'Six',  kind: 'six' },
    wicket: { runs: 0, mark: 'W', word: 'Wicket', kind: 'wicket', wicket: true }
  };

  function advanceBall() {
    state.balls += 1;
    state.bowler.balls += 1;
    if (state.balls === 6) { state.overs += 1; state.balls = 0; }
  }

  function playBall(key) {
    var o = OUTCOMES[key];
    if (!o) return;

    var before = state.striker;
    var bat = state.batters[state.striker];
    var changed = { newBall: true, stats: true };

    state.runs += o.runs;
    state.bowler.runs += o.runs;
    bat.balls += 1;
    state.partnership.balls += 1;

    if (o.wicket) {
      state.wickets += 1;
      state.bowler.wickets += 1;
      state.lastWkt = state.runs + '-' + state.wickets;
    } else {
      bat.runs += o.runs;
      state.partnership.runs += o.runs;
      if (o.runs) changed.scoringBatter = state.striker;
      // Odd runs rotate the strike.
      if (o.runs % 2 === 1) state.striker = state.striker === 0 ? 1 : 0;
    }

    if (state.thisOver.length >= 6) state.thisOver = [];
    state.thisOver.push(o.mark);
    advanceBall();

    changed.strikeMoved = state.striker !== before;
    render(changed);

    // Reactions layered on top of the data change.
    if (o.wicket) {
      burst('Wicket', state.batters[before].name + ' b ' + state.bowler.name, 'wicket', 1900);
      reactBar('wicket', 1200);
      flash(el.hero, 'shake', 620);
      flash(el.tier1, 'wicket-flash', 1000);
      flash(el.tier2, 'wicket-flash', 1000);
      setTimeout(function () { newBatter(before); }, 1150);
    } else {
      flash(el.hero, 'bump', 520);
      if (o.runs >= 4) {
        burst(o.word, o.runs === 6 ? 'Over the ropes' : 'Through the gap', o.kind, 1500);
        reactBar(o.kind, 900);
        flash(el.hero, 'hit', 580);
      }
      // A fifty is worth its own moment.
      if (o.runs && bat.runs >= 50 && bat.runs - o.runs < 50) {
        setTimeout(function () { burst('50', bat.name, 'fifty', 1500); }, 620);
      }
    }
  }

  function newBatter(slot) {
    var row = el.batting.querySelectorAll('.bat-row')[slot];
    flash(row, 'out', 430);
    setTimeout(function () {
      state.batters[slot] = {
        name: BENCH[state.benchAt % BENCH.length],
        runs: 0,
        balls: 0
      };
      state.benchAt += 1;
      state.striker = slot;                 // new batter takes strike
      state.partnership = { runs: 0, balls: 0 };
      render({ stats: true, strikeMoved: true });
      flash(row, 'in', 700);
    }, 420);
  }

  function endOver() {
    // Finish the over if it is mid-way, then reset the markers and change bowler.
    if (state.balls !== 0) {
      state.overs += 1;
      state.bowler.balls += 6 - state.balls;
      state.balls = 0;
    }
    el.overRow.classList.add('sweep');
    setTimeout(function () {
      el.overRow.classList.remove('sweep');
      state.thisOver = [];
      state.striker = state.striker === 0 ? 1 : 0;   // ends change
      state.bowler = { name: BENCH[(state.benchAt + 2) % BENCH.length], runs: 0, wickets: 0, balls: 0 };
      render({ stats: true, strikeMoved: true });
      burst('Over ' + state.overs, state.bowler.name + ' comes on', null, 1300);
    }, 430);
  }

  function reset() {
    clearTimeout(burstTimer);
    el.burst.className = 'burst';
    state = JSON.parse(JSON.stringify(initial));
    render({ stats: true });
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
    el.rail.hidden = !show;
    el.railShow.hidden = show;
    try { localStorage.setItem('tickerRail', show ? '1' : '0'); } catch (e) {}
  }
  el.railHide.addEventListener('click', function () { setRail(false); });
  el.railShow.addEventListener('click', function () { setRail(true); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'h' || e.key === 'H') setRail(el.rail.hidden);
  });
  var railPref = '1';
  try { railPref = localStorage.getItem('tickerRail') || '1'; } catch (e) {}
  setRail(railPref === '1');

  /* Auto-play walks a weighted sequence so the demo looks like real play. */
  var DEMO = ['run1', 'dot', 'four', 'run1', 'dot', 'six', 'run2', 'wicket',
              'dot', 'run1', 'four', 'over', 'run1', 'dot', 'six', 'dot'];
  var demoAt = 0, demoTimer = null;
  function demoStep() {
    var ev = DEMO[demoAt % DEMO.length];
    demoAt += 1;
    if (ev === 'over') endOver(); else playBall(ev);
    // Big moments get room to breathe before the next ball.
    var wait = (ev === 'wicket') ? 3200 : (ev === 'four' || ev === 'six' || ev === 'over') ? 2600 : 1700;
    demoTimer = setTimeout(demoStep, wait);
  }
  el.autoPlay.addEventListener('change', function () {
    clearTimeout(demoTimer);
    if (el.autoPlay.checked) demoTimer = setTimeout(demoStep, 700);
  });

  /* ---------- sizing -------------------------------------------------------- */
  /* Above 760px the whole 1920x1080 stage is scaled to fit, which is how a
     broadcast overlay is composited. Below that, scaling would make the type
     unreadable, so the compact stylesheet reflows it instead. */
  function fit() {
    var compact = window.innerWidth <= 760;
    document.body.classList.toggle('compact', compact);
    el.stage.style.transform = compact
      ? ''
      : 'scale(' + Math.min(window.innerWidth / 1920, window.innerHeight / 1080) + ')';
  }
  window.addEventListener('resize', fit);
  fit();
  render({});
})();

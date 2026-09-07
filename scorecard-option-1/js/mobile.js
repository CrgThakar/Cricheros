document.addEventListener('DOMContentLoaded', () => {
  const mobile = matchMedia('(max-width: 767px)');
  // .global-nav is hidden from 1180px down, so the drawer has to take over there
  // too - not just on phones - or the site navigation becomes unreachable.
  const compactNav = matchMedia('(max-width: 1180px)');
  const originalTabs = [...document.querySelectorAll('.match-nav [data-tab]')];
  const names = { summary: ['summarize', 'Summary'], scorecard: ['sports_cricket', 'Scorecard'], commentary: ['format_list_bulleted', 'Commentary'], analysis: ['analytics', 'Analysis'], heroes: ['workspace_premium', 'Heroes'], mvp: ['emoji_events', 'MVP'], teams: ['groups', 'Teams'], gallery: ['photo_library', 'Gallery'] };
  const icon = name => `<span class="material-symbols-rounded" aria-hidden="true">${name}</span>`;
  document.querySelector('.topbar')?.insertAdjacentHTML('beforeend', '<span class="mobile-context">Match centre</span>');
  // Reuse the main navigation so mobile retains the same links and actions.
  const header = document.querySelector('.topbar');
  const globalNav = header.querySelector('.global-nav');
  const globalActions = header.querySelector('.global-actions');
  const siteMenu = document.createElement('dialog');
  siteMenu.className = 'mobile-site-menu'; siteMenu.id = 'mobile-site-menu';
  siteMenu.setAttribute('aria-labelledby', 'site-menu-title');
  siteMenu.innerHTML = `<header><h2 id="site-menu-title"><img src="assets/logos/horizontal_logo.svg" alt="CricHeroes" width="134" height="26"></h2><button type="button" class="icon" aria-label="Close navigation">${icon('close')}</button></header><div class="site-menu-content"></div>`;
  document.body.append(siteMenu);
  const siteToggle = document.createElement('button');
  siteToggle.type = 'button'; siteToggle.className = 'mobile-site-toggle icon';
  siteToggle.setAttribute('aria-label', 'Open main navigation');
  siteToggle.setAttribute('aria-haspopup', 'dialog');
  siteToggle.setAttribute('aria-controls', siteMenu.id);
  siteToggle.setAttribute('aria-expanded', 'false');
  siteToggle.innerHTML = icon('menu');
  header.prepend(siteToggle);
  siteToggle.addEventListener('click', () => { siteMenu.showModal(); siteToggle.setAttribute('aria-expanded', 'true'); });
  siteMenu.querySelector('.icon').addEventListener('click', () => siteMenu.close());
  siteMenu.addEventListener('close', () => siteToggle.setAttribute('aria-expanded', 'false'));
  siteMenu.addEventListener('click', event => {
    if (event.target === siteMenu && event.clientX > siteMenu.getBoundingClientRect().right) siteMenu.close();
    if (event.target.closest('a')) siteMenu.close();
  });
  // The site navigation points at match sections. Route those links through the
  // matching tab wherever the navigation currently lives, so they behave the
  // same in the desktop bar as in the drawer instead of dead-ending on an
  // anchor whose panel is hidden.
  document.addEventListener('click', event => {
    const link = event.target.closest('.global-nav a[href^="#"]');
    if (!link) return;
    const tab = originalTabs.find(item => item.dataset.tab === link.getAttribute('href').slice(1));
    if (!tab) return;
    event.preventDefault();
    tab.click();
  });
  const placeNavigation = () => {
    if (compactNav.matches) siteMenu.querySelector('.site-menu-content').append(globalNav, globalActions);
    else {
      if (siteMenu.open) siteMenu.close();
      header.insertBefore(globalNav, header.querySelector('.mobile-context'));
      globalNav.after(globalActions);
    }
  };
  placeNavigation(); compactNav.addEventListener('change', placeNavigation);
  const dock = document.createElement('nav');
  dock.className = 'mobile-dock';
  dock.setAttribute('aria-label', 'Match navigation');
  dock.innerHTML = ['summary', 'scorecard', 'commentary'].map(key => `<button type="button" data-mobile-section="${key}">${icon(names[key][0])}<span>${names[key][1]}</span></button>`).join('') + `<button type="button" class="mobile-more" aria-haspopup="dialog" aria-controls="mobile-menu">${icon('grid_view')}<span>More</span></button>`;
  document.body.append(dock);
  const menu = document.createElement('dialog');
  menu.id = 'mobile-menu';
  menu.className = 'mobile-menu';
  menu.setAttribute('aria-labelledby', 'mobile-menu-title');
  menu.innerHTML = `<header><h2 id="mobile-menu-title">Explore this match</h2><button class="icon" type="button" aria-label="Close menu">${icon('close')}</button></header><div class="mobile-menu-grid">${Object.keys(names).slice(3).map(key => `<button type="button" data-mobile-section="${key}">${icon(names[key][0])}${names[key][1]}</button>`).join('')}</div>`;
  document.body.append(menu);
  const more = dock.querySelector('.mobile-more');
  more.addEventListener('click', () => menu.showModal());
  menu.querySelector('.icon').addEventListener('click', () => menu.close());
  menu.addEventListener('click', event => { if (event.target === menu && event.clientY < menu.getBoundingClientRect().top) menu.close(); });
  const sync = key => {
    document.querySelectorAll('[data-mobile-section]').forEach(button => {
      if (button.dataset.mobileSection === key) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    if (!['summary', 'scorecard', 'commentary'].includes(key)) more.setAttribute('aria-current', 'page');
    else more.removeAttribute('aria-current');
    originalTabs.forEach(tab => { if (tab.dataset.tab === key) tab.setAttribute('aria-current', 'page'); else tab.removeAttribute('aria-current'); });
  };
  document.querySelectorAll('[data-mobile-section]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.mobileSection;
    if (menu.open) menu.close();
    originalTabs.find(tab => tab.dataset.tab === key)?.click();
  }));
  originalTabs.forEach(tab => tab.addEventListener('click', () => {
    const key = tab.dataset.tab;
    sync(key);
    if (!mobile.matches) return;
    // Wait for all section handlers and dialog closing to finish before measuring.
    requestAnimationFrame(() => {
      const panel = [...document.querySelectorAll('[data-section]')].find(element =>
        element.dataset.section.split(' ').includes(key) &&
        !element.hidden && element.getClientRects().length
      );
      if (!panel) return;
      const headerBottom = header.getBoundingClientRect().bottom;
      window.scrollTo({ top: Math.max(0, window.scrollY + panel.getBoundingClientRect().top - headerBottom - 12), behavior: 'instant' });
    });
  }));
  sync(document.querySelector('.match-nav .active')?.dataset.tab || 'summary');
  const stream = document.querySelector('.stream-card');
  const toggle = document.createElement('button');
  toggle.type = 'button'; toggle.className = 'mobile-stream-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'match-video');
  stream.querySelector('.stream-frame').id = 'match-video';
  toggle.innerHTML = `${icon('play_circle')}Watch match video${icon('expand_more')}`;
  stream.prepend(toggle);
  toggle.addEventListener('click', () => {
    const expanded = stream.classList.toggle('mobile-expanded');
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.lastElementChild.textContent = expanded ? 'expand_less' : 'expand_more';
  });
  document.querySelectorAll('a[href="#stream"]').forEach(link => link.addEventListener('click', () => {
    stream.classList.add('mobile-expanded'); toggle.setAttribute('aria-expanded', 'true'); toggle.lastElementChild.textContent = 'expand_less';
  }));
  document.querySelectorAll('.result-card .overs').forEach(overs => {
    const details = overs.textContent.trim().split(' · ');
    if (details.length === 3) overs.innerHTML = details.map(detail => `<span>${detail}</span>`).join('');
  });
  // Keep a real table for comparison; secondary statistics expand below each player.
  const colspanCells = [];
  document.querySelectorAll('.scorecard-panel table').forEach((table, tableIndex) => {
    const headings = [...table.querySelectorAll('thead th')].map(cell => cell.textContent.trim());
    const bowling = headings[0] === 'Bowler';
    const visible = bowling ? [0, 1, 3, 4, 10] : [0, 1, 2, 5];
    table.classList.add('mobile-fit-table');
    table.dataset.mobileColumns = visible.length;
    table.querySelectorAll('thead th').forEach((cell, index) => {
      if (!visible.includes(index)) cell.classList.add('mobile-extra-stat');
    });
    [...table.querySelectorAll('tbody tr')].forEach((row, rowIndex) => {
      const cells = [...row.cells];
      if (cells.length !== headings.length) {
        cells.filter(cell => cell.colSpan > 1).forEach(cell => colspanCells.push([cell, cell.colSpan, visible.length - 1]));
        return;
      }
      cells.forEach((cell, index) => { if (!visible.includes(index)) cell.classList.add('mobile-extra-stat'); });
      const player = cells[0].querySelector('.player-profile')?.textContent.trim() || cells[0].textContent.trim();
      const button = document.createElement('button');
      const id = `player-stats-${tableIndex}-${rowIndex}`;
      button.type = 'button'; button.className = 'mobile-stat-toggle';
      button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', id);
      button.setAttribute('aria-label', `More stats for ${player}`);
      button.innerHTML = `More stats ${icon('expand_more')}`;
      cells[0].append(button);
      const detail = document.createElement('tr'); detail.className = 'mobile-stat-row'; detail.id = id; detail.hidden = true;
      const cell = detail.insertCell(); cell.colSpan = visible.length;
      const labels = { '4s': 'Fours', '6s': 'Sixes', 'Min': 'Minutes', 'M': 'Maidens', '0s': 'Dot balls', 'WD': 'Wides', 'NB': 'No balls' };
      cell.innerHTML = '<dl class="mobile-stat-grid">' + headings.map((name, index) => visible.includes(index) ? '' : `<div><dt>${labels[name] || name}</dt><dd>${cells[index].textContent.trim()}</dd></div>`).join('') + '</dl>';
      row.after(detail);
      button.addEventListener('click', () => {
        const expanded = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(expanded)); detail.hidden = !expanded;
        button.innerHTML = `${expanded ? 'Less' : 'More'} stats ${icon(expanded ? 'expand_less' : 'expand_more')}`;
        button.setAttribute('aria-label', `${expanded ? 'Less' : 'More'} stats for ${player}`);
      });
    });
  });
  const syncColspans = () => colspanCells.forEach(([cell, desktop, phone]) => { cell.colSpan = mobile.matches ? phone : desktop; });
  syncColspans(); mobile.addEventListener('change', syncColspans);
  document.querySelectorAll('.mvp-list-row').forEach(row => ['Batting', 'Bowling', 'Fielding'].forEach((name, index) => row.children[index + 2].dataset.stat = name));
  mobile.addEventListener('change', () => { if (!mobile.matches && menu.open) menu.close(); });
});

// ============================================================
// Wedding 2027 — main app
// ============================================================
import { ACCESS_PIN, WEDDING_DATE } from './firebase-config.js';
import { init as initStore, mutate, getState, subscribe, getSyncStatus, isFirebaseOn, uploadPhoto, exportData, importData, resetToSeeds } from './store.js';

// ============================================================
// DOM helpers
// ============================================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(c));
  }
  return el;
}
function fmtUSD(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
}
function fmtDate(iso, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', opts);
}
function daysBetween(from, to) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((new Date(to) - new Date(from)) / msPerDay);
}
function toast(msg, ms = 2000) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.hidden = true, ms);
}

// ============================================================
// PIN GATE
// ============================================================
function initPinGate() {
  const unlockedAt = localStorage.getItem('pin-ok');
  if (unlockedAt && (Date.now() - Number(unlockedAt)) < 1000 * 60 * 60 * 24 * 30) {
    return unlockApp();
  }
  $('#pin-input').focus();
  const tryUnlock = () => {
    const val = $('#pin-input').value;
    if (val === ACCESS_PIN) {
      localStorage.setItem('pin-ok', Date.now());
      unlockApp();
    } else {
      $('#pin-error').hidden = false;
      $('#pin-input').value = '';
      $('#pin-input').focus();
    }
  };
  $('#pin-submit').addEventListener('click', tryUnlock);
  $('#pin-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryUnlock(); });
  $('#pin-input').addEventListener('input', () => { $('#pin-error').hidden = true; });
}

async function unlockApp() {
  $('#pin-gate').hidden = true;
  $('#app').hidden = false;
  await initStore();
  subscribe(() => render());
  subscribe(updateSyncIndicator);
  updateSyncIndicator();
  wireTabs();
  wireSettings();
  navigate(location.hash.slice(1) || 'home');
}

function updateSyncIndicator() {
  const dot = $('#sync-indicator');
  const s = getSyncStatus();
  dot.classList.toggle('offline', s === 'offline');
  dot.classList.toggle('syncing', s === 'syncing');
  const titles = { online: 'Live-sync on', offline: 'Offline — will sync when reconnected', syncing: 'Syncing…', local: 'Local-only (Firebase not configured)' };
  dot.title = titles[s] || '';
}

// ============================================================
// ROUTER
// ============================================================
const ROUTES = ['home', 'budget', 'venues', 'trip', 'checklist', 'photos', 'timeline', 'packing', 'inspiration', 'more'];
let currentView = 'home';

function navigate(view) {
  if (!ROUTES.includes(view)) view = 'home';
  currentView = view;
  location.hash = view;
  render();
  window.scrollTo(0, 0);
  // tab bar highlight
  const tabMap = { home: 'home', budget: 'budget', venues: 'venues', trip: 'trip' };
  $$('.tab').forEach(t => t.classList.toggle('active', tabMap[view] === t.dataset.view || (t.dataset.view === 'more' && !tabMap[view])));
}

function wireTabs() {
  $$('.tab').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });
  window.addEventListener('hashchange', () => navigate(location.hash.slice(1) || 'home'));
}

function render() {
  const v = $('#view');
  v.innerHTML = '';
  const state = getState();
  if (!state) return;
  const fn = VIEWS[currentView];
  if (fn) fn(v, state);
}

// ============================================================
// VIEWS
// ============================================================
const VIEWS = {};

// -------- HOME --------
VIEWS.home = (root, s) => {
  const wedDate = s.meta?.weddingDate || WEDDING_DATE;
  const hero = h('div', { class: 'hero' });
  hero.append(
    h('h1', {}, 'Ordy & Devan'),
    h('div', { class: 'names' }, 'Saint Lucia, 2027'),
  );
  if (wedDate) {
    const days = Math.max(0, daysBetween(new Date(), wedDate));
    const hrs = Math.max(0, Math.floor((new Date(wedDate) - new Date()) / 3600000) % 24);
    hero.append(h('div', { class: 'countdown' },
      h('div', { class: 'cd-unit' }, h('div', { class: 'cd-num' }, String(days)), h('div', { class: 'cd-label' }, 'Days')),
      h('div', { class: 'cd-unit' }, h('div', { class: 'cd-num' }, String(hrs)), h('div', { class: 'cd-label' }, 'Hours')),
    ));
    hero.append(h('div', { class: 'note' }, `${fmtDate(wedDate)} · `, h('button', { onclick: openDateModal }, 'Change date')));
  } else {
    hero.append(h('div', { class: 'note' }, 'Date TBD — ', h('button', { onclick: openDateModal }, 'set wedding date')));
  }
  root.append(hero);

  // Quick stats row
  const totals = categoryTotals(s);
  const spent = totals.reduce((a, c) => a + c.spent, 0);
  const budget = s.meta?.budgetTotal || 20000;
  const tripSoon = s.tripDays?.length && new Date(s.tripDays[0].date) > new Date();
  const nextMs = [...(s.milestones || [])].filter(m => !m.done).sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  root.append(h('div', { class: 'section-title' }, 'At a glance'));
  const grid = h('div', { class: 'card' });
  grid.append(
    h('div', { class: 'card-row' }, h('div', {}, h('strong', {}, fmtUSD(spent)), h('span', { class: 'muted' }, ` of ${fmtUSD(budget)} spent`)), h('button', { class: 'btn btn-sm btn-ghost', onclick: () => navigate('budget') }, 'Budget →')),
    h('div', { class: 'budget-bar' }, h('div', { class: 'budget-bar-fill' + (spent > budget ? ' over' : ''), style: `width:${Math.min(100, (spent / budget) * 100)}%` })),
  );
  root.append(grid);

  if (tripSoon) {
    const days = daysBetween(new Date(), s.tripDays[0].date);
    root.append(h('div', { class: 'card' },
      h('div', { class: 'card-row' },
        h('div', {}, h('strong', {}, days > 0 ? `${days} days` : 'Started'), h('span', { class: 'muted' }, ' until scouting trip')),
        h('button', { class: 'btn btn-sm btn-ghost', onclick: () => navigate('trip') }, 'Itinerary →')
      )));
  }
  if (nextMs) {
    root.append(h('div', { class: 'card' },
      h('div', { class: 'card-row' },
        h('div', {}, h('strong', {}, nextMs.title), h('div', { class: 'muted' }, fmtDate(nextMs.date))),
        h('button', { class: 'btn btn-sm btn-ghost', onclick: () => navigate('timeline') }, 'Timeline →')
      )));
  }

  // Venue leader
  const rankedVenues = rankVenues(s);
  if (rankedVenues[0]) {
    const top = rankedVenues[0];
    root.append(h('div', { class: 'section-title' }, 'Venue leader', h('a', { href: '#venues', onclick: (e) => { e.preventDefault(); navigate('venues'); } }, 'All venues →')));
    root.append(h('div', { class: 'venue-card top' },
      h('div', { class: 'venue-rank' }, '#1 so far'),
      h('div', { class: 'venue-head' },
        h('div', {}, h('div', { class: 'venue-name' }, top.name), h('div', { class: 'venue-area' }, top.area)),
        h('div', { class: 'venue-score' }, String(top.score), h('small', {}, 'weighted'))
      )
    ));
  }

  // Shortcuts grid
  root.append(h('div', { class: 'section-title' }, 'Jump in'));
  const links = [
    { v: 'checklist', label: 'Site-visit checklist' },
    { v: 'photos', label: 'Photo shoot list' },
    { v: 'packing', label: 'Packing' },
    { v: 'inspiration', label: 'Inspiration' },
  ];
  const shortcutGrid = h('div', { class: 'cat-list' });
  links.forEach(l => shortcutGrid.append(
    h('div', { class: 'cat-card', onclick: () => navigate(l.v) },
      h('div', { class: 'cat-head' },
        h('div', { class: 'cat-name' }, l.label),
        h('span', { class: 'muted' }, '→')
      ))
  ));
  root.append(shortcutGrid);
};

// -------- BUDGET --------
VIEWS.budget = (root, s) => {
  const totals = categoryTotals(s);
  const spent = totals.reduce((a, c) => a + c.spent, 0);
  const budget = s.meta?.budgetTotal || 20000;
  const pct = Math.min(100, (spent / budget) * 100);

  root.append(h('div', { class: 'view-header' },
    h('div', { class: 'eyebrow' }, 'Budget'),
    h('h2', {}, fmtUSD(budget) + ' target'),
    h('p', { class: 'lede' }, 'Tap a category for line items. Add a new item anytime.')
  ));

  const summary = h('div', { class: 'budget-total' });
  summary.append(
    h('div', {}, h('span', { class: 'big' }, fmtUSD(spent)), h('span', { class: 'of' }, ` / ${fmtUSD(budget)}`)),
    h('div', { class: 'budget-bar' }, h('div', { class: 'budget-bar-fill' + (spent > budget ? ' over' : ''), style: `width:${pct}%` })),
    h('div', { class: 'budget-meta' }, h('span', {}, `${pct.toFixed(0)}% committed`), h('span', {}, fmtUSD(Math.max(0, budget - spent)) + ' remaining'))
  );
  root.append(summary);

  root.append(h('button', { class: 'btn btn-primary btn-full', onclick: () => openLineItemModal(null) }, '+ Add a line item'));

  const list = h('div', { class: 'cat-list', style: 'margin-top:16px' });
  totals.forEach(c => {
    const pct = Math.min(100, (c.spent / c.target) * 100);
    const cls = c.spent > c.target ? 'over' : c.spent > c.target * 0.9 ? 'near' : '';
    list.append(h('div', { class: 'cat-card', onclick: () => openCategoryModal(c.id) },
      h('div', { class: 'cat-head' },
        h('div', { class: 'cat-name' }, c.name),
        h('div', { class: 'cat-amt' }, fmtUSD(c.spent), h('span', { class: 'muted', style: 'font-size:0.8rem' }, ` / ${fmtUSD(c.target)}`))
      ),
      h('div', { class: 'cat-bar' }, h('div', { class: 'cat-bar-fill ' + cls, style: `width:${pct}%` })),
      h('div', { class: 'cat-meta' }, `${c.itemCount} item${c.itemCount === 1 ? '' : 's'}`)
    ));
  });
  root.append(list);
};

function categoryTotals(s) {
  return (s.budgetCategories || []).map(cat => {
    const items = (s.budgetLineItems || []).filter(i => i.categoryId === cat.id);
    const spent = items.reduce((a, i) => a + (Number(i.estimate) || 0), 0);
    return { ...cat, spent, itemCount: items.length };
  });
}

function openLineItemModal(itemId) {
  const s = getState();
  const item = itemId ? (s.budgetLineItems || []).find(i => i.id === itemId) : { id: 'li-' + Date.now(), categoryId: s.budgetCategories[0].id, vendor: '', estimate: 0, paid: 0, dueDate: '', notes: '' };
  const content = h('div', { class: 'modal-content' });
  content.append(h('div', { class: 'modal-head' },
    h('h2', {}, itemId ? 'Edit line item' : 'Add line item'),
    h('button', { class: 'modal-close', onclick: closeModal }, '×')
  ));
  const f = h('form', { onsubmit: (e) => { e.preventDefault(); save(); } });

  const catSel = h('select', { id: 'li-cat' });
  s.budgetCategories.forEach(c => catSel.append(h('option', { value: c.id, selected: c.id === item.categoryId }, c.name)));

  f.append(
    h('div', { class: 'field' }, h('label', {}, 'Category'), catSel),
    h('div', { class: 'field' }, h('label', {}, 'Vendor / item'), h('input', { id: 'li-vendor', value: item.vendor || '', placeholder: 'e.g. Villa Capri catering' })),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', {}, 'Estimate (USD)'), h('input', { id: 'li-est', type: 'number', min: '0', step: '1', value: item.estimate || '' })),
      h('div', { class: 'field' }, h('label', {}, 'Paid (USD)'), h('input', { id: 'li-paid', type: 'number', min: '0', step: '1', value: item.paid || '' }))
    ),
    h('div', { class: 'field' }, h('label', {}, 'Due date'), h('input', { id: 'li-due', type: 'date', value: item.dueDate || '' })),
    h('div', { class: 'field' }, h('label', {}, 'Notes'), h('textarea', { id: 'li-notes' }, item.notes || '')),
    h('div', { style: 'display:flex;gap:8px;margin-top:14px' },
      h('button', { type: 'submit', class: 'btn btn-primary', style: 'flex:1' }, 'Save'),
      itemId ? h('button', { type: 'button', class: 'btn btn-danger', onclick: () => { if (confirm('Delete this line item?')) { mutate(st => { st.budgetLineItems = st.budgetLineItems.filter(i => i.id !== itemId); }); closeModal(); toast('Deleted'); } } }, 'Delete') : null
    )
  );
  content.append(f);
  showModal(content);

  function save() {
    const next = {
      id: item.id,
      categoryId: catSel.value,
      vendor: $('#li-vendor').value.trim(),
      estimate: Number($('#li-est').value) || 0,
      paid: Number($('#li-paid').value) || 0,
      dueDate: $('#li-due').value,
      notes: $('#li-notes').value.trim(),
    };
    mutate(st => {
      st.budgetLineItems = st.budgetLineItems || [];
      const idx = st.budgetLineItems.findIndex(i => i.id === item.id);
      if (idx >= 0) st.budgetLineItems[idx] = next;
      else st.budgetLineItems.push(next);
    });
    closeModal();
    toast(itemId ? 'Updated' : 'Added');
  }
}

function openCategoryModal(catId) {
  const s = getState();
  const cat = s.budgetCategories.find(c => c.id === catId);
  const items = (s.budgetLineItems || []).filter(i => i.categoryId === catId);
  const content = h('div', { class: 'modal-content' });
  content.append(h('div', { class: 'modal-head' },
    h('h2', {}, cat.name),
    h('button', { class: 'modal-close', onclick: closeModal }, '×')
  ));
  content.append(h('p', { class: 'muted' }, `Target: ${fmtUSD(cat.target)} · Spent: ${fmtUSD(items.reduce((a, i) => a + (Number(i.estimate) || 0), 0))}`));
  if (!items.length) {
    content.append(h('div', { class: 'empty' }, h('p', {}, 'No line items yet.')));
  } else {
    items.forEach(i => {
      content.append(h('div', { class: 'cat-card', style: 'margin-top:10px', onclick: () => { closeModal(); setTimeout(() => openLineItemModal(i.id), 100); } },
        h('div', { class: 'cat-head' },
          h('div', { class: 'cat-name' }, i.vendor || '(no name)'),
          h('div', { class: 'cat-amt' }, fmtUSD(i.estimate))
        ),
        h('div', { class: 'cat-meta' }, i.paid ? `Paid ${fmtUSD(i.paid)}` : 'Unpaid', i.dueDate ? ` · due ${fmtDate(i.dueDate)}` : '')
      ));
    });
  }
  content.append(h('button', { class: 'btn btn-primary btn-full', style: 'margin-top:14px', onclick: () => { closeModal(); setTimeout(() => { openLineItemModal(null); $('#li-cat').value = catId; }, 100); } }, '+ Add to this category'));
  showModal(content);
}

// -------- VENUES --------
VIEWS.venues = (root, s) => {
  const ranked = rankVenues(s);
  root.append(h('div', { class: 'view-header' },
    h('div', { class: 'eyebrow' }, 'Venues'),
    h('h2', {}, 'Shortlist & scoring'),
    h('p', { class: 'lede' }, 'Tap a venue to score it. Ranked live by weighted total.')
  ));

  ranked.forEach((v, idx) => {
    const visited = v.status === 'visited';
    const skip = v.status === 'skip';
    const card = h('div', { class: 'venue-card' + (idx === 0 && v.score > 0 ? ' top' : ''), onclick: () => openVenueModal(v.id) });
    if (idx === 0 && v.score > 0) card.append(h('div', { class: 'venue-rank' }, '#1'));
    card.append(h('div', { class: 'venue-head' },
      h('div', {}, h('div', { class: 'venue-name' }, v.name), h('div', { class: 'venue-area' }, v.area)),
      h('div', { class: 'venue-score' }, v.score > 0 ? String(v.score) : '—', h('small', {}, v.score > 0 ? 'weighted' : 'not scored'))
    ));
    const chips = h('div', { class: 'venue-chips' });
    if (visited) chips.append(h('span', { class: 'chip visited' }, '✓ Visited'));
    if (skip) chips.append(h('span', { class: 'chip skip' }, 'Skipped'));
    (v.tags || []).forEach(t => chips.append(h('span', { class: 'chip' }, t)));
    card.append(chips);
    root.append(card);
  });
};

function rankVenues(s) {
  const criteria = s.scoreCriteria || [];
  const weightedScore = (venue) => {
    let total = 0;
    criteria.forEach(c => {
      const val = (venue.scores || {})[c.id];
      if (typeof val === 'number') total += val * c.weight;
    });
    return total;
  };
  return (s.venues || []).map(v => ({ ...v, score: weightedScore(v) })).sort((a, b) => b.score - a.score);
}

function openVenueModal(venueId) {
  const s = getState();
  const v = s.venues.find(v => v.id === venueId);
  const content = h('div', { class: 'modal-content' });
  content.append(h('div', { class: 'modal-head' },
    h('div', {}, h('h2', {}, v.name), h('div', { class: 'muted' }, v.area)),
    h('button', { class: 'modal-close', onclick: closeModal }, '×')
  ));

  // status chips
  const statusRow = h('div', { style: 'display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap' });
  [['shortlist', 'Shortlist'], ['visited', 'Visited ✓'], ['skip', 'Skip'], ['top', 'Top choice ★']].forEach(([val, lbl]) => {
    statusRow.append(h('button', {
      class: 'chip' + (v.status === val ? ' visited' : ''),
      style: 'cursor:pointer;border:none;padding:6px 12px',
      onclick: () => { mutate(st => { st.venues.find(x => x.id === venueId).status = val; }); openVenueModal(venueId); toast('Updated'); }
    }, lbl));
  });
  content.append(statusRow);

  // scoring
  content.append(h('h3', { style: 'margin-bottom:10px' }, 'Score criteria'));
  s.scoreCriteria.forEach(c => {
    const row = h('div', { class: 'score-row' });
    row.append(h('div', {}, h('div', { class: 'score-row-label' }, c.label), h('div', { class: 'score-row-weight' }, `Weight ×${c.weight}`)));
    const inp = h('div', { class: 'score-input' });
    [1, 2, 3, 4, 5].forEach(n => {
      const selected = (v.scores || {})[c.id] === n;
      inp.append(h('button', {
        class: selected ? 'selected' : '',
        onclick: () => { mutate(st => { const vv = st.venues.find(x => x.id === venueId); vv.scores = vv.scores || {}; vv.scores[c.id] = n; }); openVenueModal(venueId); }
      }, String(n)));
    });
    row.append(inp);
    content.append(row);
  });

  // notes
  content.append(h('div', { class: 'field', style: 'margin-top:18px' },
    h('label', {}, 'Notes'),
    h('textarea', { id: 'venue-notes', rows: 4 }, v.notes || '')
  ));
  content.append(h('button', {
    class: 'btn btn-primary btn-full',
    onclick: () => { const val = $('#venue-notes').value; mutate(st => { st.venues.find(x => x.id === venueId).notes = val; }); toast('Saved'); }
  }, 'Save notes'));

  showModal(content);
}

// -------- TRIP ITINERARY --------
VIEWS.trip = (root, s) => {
  root.append(h('div', { class: 'view-header' },
    h('div', { class: 'eyebrow' }, 'Scouting Trip'),
    h('h2', {}, 'Apr 18 – 27, 2026'),
    h('p', { class: 'lede' }, 'Day-by-day plan. Tap for details.')
  ));
  const today = new Date().toISOString().slice(0, 10);
  (s.tripDays || []).forEach(d => {
    const past = d.date < today;
    const isToday = d.date === today;
    root.append(h('div', {
      class: 'day-card' + (isToday ? ' today' : '') + (past ? ' past' : ''),
      onclick: () => openTripDayModal(d.date)
    },
      h('div', { class: 'day-head' },
        h('div', { class: 'day-date' }, fmtDate(d.date, { month: 'short', day: 'numeric', weekday: 'short' })),
        h('div', { class: 'day-label' }, isToday ? 'Today' : d.label)
      ),
      h('div', { class: 'day-title' }, d.title),
      h('div', { class: 'day-sub' }, d.sub)
    ));
  });
};

function openTripDayModal(date) {
  const s = getState();
  const day = s.tripDays.find(d => d.date === date);
  const content = h('div', { class: 'modal-content' });
  content.append(h('div', { class: 'modal-head' },
    h('div', {}, h('h2', {}, day.title), h('div', { class: 'muted' }, fmtDate(date, { weekday: 'long', month: 'long', day: 'numeric' }))),
    h('button', { class: 'modal-close', onclick: closeModal }, '×')
  ));
  content.append(h('p', { class: 'muted', style: 'margin-bottom:14px' }, day.sub));
  const list = h('div', { class: 'check-list' });
  (day.items || []).forEach((it, i) => {
    const checked = (day.done || []).includes(i);
    list.append(h('div', {
      class: 'check-item' + (checked ? ' done' : ''),
      onclick: () => { mutate(st => { const d = st.tripDays.find(x => x.date === date); d.done = d.done || []; if (checked) d.done = d.done.filter(x => x !== i); else d.done.push(i); }); openTripDayModal(date); }
    },
      h('div', { class: 'check-box' }, h('svg', { viewBox: '0 0 24 24', html: '<polyline points="4,12 10,18 20,6"/>' })),
      h('div', { class: 'check-text' }, h('div', { class: 'check-title' }, it))
    ));
  });
  content.append(list);
  content.append(h('div', { class: 'field', style: 'margin-top:14px' },
    h('label', {}, 'Notes / journal'),
    h('textarea', { id: 'day-notes', rows: 4 }, day.notes || '')
  ));
  content.append(h('button', { class: 'btn btn-primary btn-full', onclick: () => { const val = $('#day-notes').value; mutate(st => { st.tripDays.find(x => x.date === date).notes = val; }); toast('Saved'); } }, 'Save notes'));
  showModal(content);
}

// -------- SITE CHECKLIST --------
VIEWS.checklist = (root, s) => {
  root.append(h('div', { class: 'view-header' },
    h('div', { class: 'eyebrow' }, 'Site Visit'),
    h('h2', {}, 'Checklist'),
    h('p', { class: 'lede' }, 'Pick a venue to walk through. Progress saved per venue.')
  ));

  const cklChoose = h('div', { class: 'field' });
  cklChoose.append(h('label', {}, 'Active venue'));
  const sel = h('select', { id: 'ckl-venue', onchange: () => render() });
  sel.append(h('option', { value: '' }, '— Choose a venue —'));
  (s.venues || []).forEach(v => sel.append(h('option', { value: v.id, selected: (s.meta?.activeChecklistVenue || '') === v.id }, v.name)));
  cklChoose.append(sel);
  root.append(cklChoose);
  sel.addEventListener('change', () => mutate(st => { st.meta = st.meta || {}; st.meta.activeChecklistVenue = sel.value; }));

  const venueId = s.meta?.activeChecklistVenue;
  if (!venueId) {
    root.append(h('div', { class: 'empty' }, h('p', {}, 'Choose a venue above to start ticking items.')));
    return;
  }
  const checks = (s.siteChecklistProgress || {})[venueId] || {};

  (s.siteChecklist || []).forEach(group => {
    root.append(h('div', { class: 'checklist-group-head' }, group.group));
    const gdiv = h('div', { class: 'check-list' });
    group.items.forEach(item => {
      const key = item;
      const done = !!checks[key];
      gdiv.append(h('div', {
        class: 'check-item' + (done ? ' done' : ''),
        onclick: () => mutate(st => {
          st.siteChecklistProgress = st.siteChecklistProgress || {};
          st.siteChecklistProgress[venueId] = st.siteChecklistProgress[venueId] || {};
          st.siteChecklistProgress[venueId][key] = !done;
        })
      },
        h('div', { class: 'check-box' }, h('svg', { viewBox: '0 0 24 24', html: '<polyline points="4,12 10,18 20,6"/>' })),
        h('div', { class: 'check-text' }, h('div', { class: 'check-title' }, item))
      ));
    });
    root.append(gdiv);
  });

  root.append(h('button', {
    class: 'btn btn-ghost btn-full', style: 'margin-top:18px',
    onclick: () => { if (confirm('Reset checklist for this venue?')) mutate(st => { if (st.siteChecklistProgress) delete st.siteChecklistProgress[venueId]; }); toast('Reset'); }
  }, 'Reset for this venue'));
};

// -------- PHOTO SHOOT --------
VIEWS.photos = (root, s) => {
  root.append(h('div', { class: 'view-header' },
    h('div', { class: 'eyebrow' }, 'Photo Shoot'),
    h('h2', {}, 'Shot list'),
    h('p', { class: 'lede' }, 'Tick shots as you go. Mark keepers on the day.')
  ));

  (s.photoShots || []).forEach((plan, pi) => {
    root.append(h('div', { class: 'checklist-group-head' }, plan.plan));
    plan.shots.forEach((shot, si) => {
      const key = `${pi}:${si}`;
      const pg = (s.photoProgress || {})[key] || {};
      root.append(h('div', {
        class: 'shot-card' + (pg.done ? ' done' : '') + (pg.got ? ' got' : ''),
      },
        h('div', { class: 'shot-check', onclick: () => mutate(st => { st.photoProgress = st.photoProgress || {}; st.photoProgress[key] = { ...(st.photoProgress[key] || {}), done: !pg.done }; }) },
          h('div', { class: 'check-box' + (pg.done ? ' check-box-active' : ''), style: `border-color:${pg.done ? '#2A9D8F' : ''};background:${pg.done ? '#2A9D8F' : ''}` },
            h('svg', { viewBox: '0 0 24 24', html: '<polyline points="4,12 10,18 20,6"/>', style: `opacity:${pg.done ? '1' : '0'}` }))
        ),
        h('div', { class: 'shot-body' },
          h('div', { class: 'shot-title' }, shot),
          h('button', {
            class: 'shot-keeper' + (pg.got ? ' got' : ''),
            onclick: (e) => { e.stopPropagation(); mutate(st => { st.photoProgress = st.photoProgress || {}; st.photoProgress[key] = { ...(st.photoProgress[key] || {}), got: !pg.got }; }); }
          }, pg.got ? '★ Got the keeper' : 'Mark as keeper')
        )
      ));
    });
  });
};

// -------- TIMELINE / MILESTONES --------
VIEWS.timeline = (root, s) => {
  root.append(h('div', { class: 'view-header' },
    h('div', { class: 'eyebrow' }, 'Milestones'),
    h('h2', {}, 'Timeline to 2027'),
    h('p', { class: 'lede' }, 'Tap a milestone to mark done. Add your own anytime.')
  ));
  const today = new Date();
  const sorted = [...(s.milestones || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
  sorted.forEach(m => {
    const d = new Date(m.date);
    const days = daysBetween(today, d);
    let status = '';
    if (m.done) status = 'done';
    else if (days < 0) status = 'overdue';
    else if (days <= 14) status = 'soon';
    const mon = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    root.append(h('div', { class: 'tl-item', onclick: () => {
      mutate(st => { const mm = st.milestones.find(x => x.id === m.id); mm.done = !mm.done; });
      toast(m.done ? 'Reopened' : 'Marked done');
    }},
      h('div', { class: 'tl-date' }, h('div', { class: 'd-mon' }, mon), h('div', { class: 'd-day' }, String(day))),
      h('div', { class: 'tl-body' },
        h('div', {}, h('span', { class: 'tl-title' }, m.title), status ? h('span', { class: 'tl-status ' + status }, status === 'done' ? 'Done' : status === 'overdue' ? 'Overdue' : 'Soon') : null),
        h('div', { class: 'tl-sub' }, m.sub)
      )
    ));
  });
  root.append(h('button', { class: 'btn btn-primary btn-full', style: 'margin-top:18px', onclick: () => openMilestoneModal(null) }, '+ Add a milestone'));
};

function openMilestoneModal(id) {
  const s = getState();
  const m = id ? s.milestones.find(x => x.id === id) : { id: 'ms-' + Date.now(), date: '', title: '', sub: '', done: false };
  const content = h('div', { class: 'modal-content' });
  content.append(h('div', { class: 'modal-head' }, h('h2', {}, id ? 'Edit milestone' : 'New milestone'), h('button', { class: 'modal-close', onclick: closeModal }, '×')));
  content.append(h('div', { class: 'field' }, h('label', {}, 'Title'), h('input', { id: 'ms-title', value: m.title })));
  content.append(h('div', { class: 'field' }, h('label', {}, 'Date'), h('input', { id: 'ms-date', type: 'date', value: m.date })));
  content.append(h('div', { class: 'field' }, h('label', {}, 'Note (optional)'), h('input', { id: 'ms-sub', value: m.sub || '' })));
  content.append(h('button', { class: 'btn btn-primary btn-full', onclick: () => {
    const title = $('#ms-title').value.trim(); const date = $('#ms-date').value; const sub = $('#ms-sub').value.trim();
    if (!title || !date) { toast('Title + date required'); return; }
    mutate(st => { st.milestones = st.milestones || []; const idx = st.milestones.findIndex(x => x.id === m.id); const next = { ...m, title, date, sub }; if (idx >= 0) st.milestones[idx] = next; else st.milestones.push(next); });
    closeModal(); toast('Saved');
  }}, 'Save'));
  if (id) content.append(h('button', { class: 'btn btn-danger btn-full', style: 'margin-top:8px', onclick: () => { if (confirm('Delete?')) { mutate(st => { st.milestones = st.milestones.filter(x => x.id !== id); }); closeModal(); toast('Deleted'); }}}, 'Delete'));
  showModal(content);
}

// -------- PACKING --------
VIEWS.packing = (root, s) => {
  root.append(h('div', { class: 'view-header' },
    h('div', { class: 'eyebrow' }, 'Packing'),
    h('h2', {}, 'What to bring')
  ));
  (s.packingList || []).forEach((group, gi) => {
    root.append(h('div', { class: 'checklist-group-head' }, group.group));
    const list = h('div', { class: 'check-list' });
    group.items.forEach((item, ii) => {
      const key = `${gi}:${ii}`;
      const done = !!(s.packingProgress || {})[key];
      list.append(h('div', {
        class: 'check-item' + (done ? ' done' : ''),
        onclick: () => mutate(st => { st.packingProgress = st.packingProgress || {}; st.packingProgress[key] = !done; })
      },
        h('div', { class: 'check-box' }, h('svg', { viewBox: '0 0 24 24', html: '<polyline points="4,12 10,18 20,6"/>' })),
        h('div', { class: 'check-text' }, h('div', { class: 'check-title' }, item))
      ));
    });
    root.append(list);
  });
};

// -------- INSPIRATION SCRATCHPAD --------
VIEWS.inspiration = (root, s) => {
  root.append(h('div', { class: 'view-header' },
    h('div', { class: 'eyebrow' }, 'Inspiration'),
    h('h2', {}, 'Scratchpad'),
    h('p', { class: 'lede' }, 'Upload photos, paste links, drop notes. Synced live with Devan.')
  ));

  const active = s.meta?.inspirationFilter || 'All';
  const tabsEl = h('div', { class: 'pad-tabs' });
  (s.inspirationCategories || ['All']).forEach(c => {
    tabsEl.append(h('div', {
      class: 'pad-tab' + (c === active ? ' active' : ''),
      onclick: () => { mutate(st => { st.meta = st.meta || {}; st.meta.inspirationFilter = c; }); }
    }, c));
  });
  root.append(tabsEl);

  const items = (s.inspirationItems || []).filter(i => active === 'All' || i.tag === active);
  const grid = h('div', { class: 'pad-grid' });

  // Add button (always first)
  grid.append(h('div', { class: 'pad-add', onclick: () => openInspirationModal(null) },
    h('div', { style: 'font-size:1.4rem' }, '+'),
    h('div', {}, 'Add')
  ));

  items.forEach(item => {
    const card = h('div', { class: 'pad-item', onclick: () => openInspirationModal(item.id) });
    if (item.image) card.append(h('img', { src: item.image, alt: item.note || '' }));
    card.append(h('div', { class: 'pad-note' }, item.note || item.link || ''));
    if (item.tag) card.append(h('span', { class: 'pad-tag' }, item.tag));
    grid.append(card);
  });
  root.append(grid);
};

function openInspirationModal(id) {
  const s = getState();
  const item = id ? s.inspirationItems.find(i => i.id === id) : { id: 'ip-' + Date.now(), note: '', link: '', image: '', tag: 'Ceremony' };
  const content = h('div', { class: 'modal-content' });
  content.append(h('div', { class: 'modal-head' }, h('h2', {}, id ? 'Inspiration' : 'New inspiration'), h('button', { class: 'modal-close', onclick: closeModal }, '×')));
  if (item.image) content.append(h('img', { src: item.image, style: 'width:100%;max-height:320px;object-fit:cover;border-radius:12px;margin-bottom:14px' }));

  const fileIn = h('input', { type: 'file', accept: 'image/*', id: 'ip-file', style: 'display:none' });
  fileIn.addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    toast('Uploading…');
    try {
      const url = await uploadPhoto(file);
      mutate(st => {
        st.inspirationItems = st.inspirationItems || [];
        const next = { ...item, image: url };
        const idx = st.inspirationItems.findIndex(x => x.id === item.id);
        if (idx >= 0) st.inspirationItems[idx] = next; else st.inspirationItems.push(next);
      });
      closeModal(); toast('Uploaded');
    } catch (err) { console.error(err); toast('Upload failed'); }
  });

  content.append(fileIn);
  content.append(h('button', { class: 'btn btn-ghost btn-full', style: 'margin-bottom:14px', onclick: () => fileIn.click() }, item.image ? '↻ Replace photo' : '📷 Add a photo'));
  content.append(h('div', { class: 'field' }, h('label', {}, 'Note'), h('textarea', { id: 'ip-note', rows: 3 }, item.note || '')));
  content.append(h('div', { class: 'field' }, h('label', {}, 'Link (Pinterest, Instagram, etc.)'), h('input', { id: 'ip-link', value: item.link || '', placeholder: 'https://' })));
  const tagSel = h('select', { id: 'ip-tag' });
  (s.inspirationCategories || []).filter(c => c !== 'All').forEach(c => tagSel.append(h('option', { value: c, selected: item.tag === c }, c)));
  content.append(h('div', { class: 'field' }, h('label', {}, 'Category'), tagSel));
  content.append(h('button', { class: 'btn btn-primary btn-full', onclick: () => {
    const next = { ...item, note: $('#ip-note').value, link: $('#ip-link').value, tag: tagSel.value };
    mutate(st => {
      st.inspirationItems = st.inspirationItems || [];
      const idx = st.inspirationItems.findIndex(x => x.id === item.id);
      if (idx >= 0) st.inspirationItems[idx] = next; else st.inspirationItems.push(next);
    });
    closeModal(); toast('Saved');
  }}, 'Save'));
  if (id) content.append(h('button', { class: 'btn btn-danger btn-full', style: 'margin-top:8px', onclick: () => { if (confirm('Delete?')) { mutate(st => { st.inspirationItems = st.inspirationItems.filter(x => x.id !== id); }); closeModal(); toast('Deleted'); }}}, 'Delete'));
  showModal(content);
}

// -------- MORE (sub-nav) --------
VIEWS.more = (root, s) => {
  root.append(h('div', { class: 'view-header' }, h('div', { class: 'eyebrow' }, 'More'), h('h2', {}, 'Sections')));
  const list = [
    { v: 'checklist', label: 'Site-visit checklist', sub: 'Walk-through items per venue' },
    { v: 'photos', label: 'Photo shoot list', sub: 'Plans A–D from the playbook' },
    { v: 'timeline', label: 'Timeline & milestones', sub: 'Save-the-dates, deposits, RSVPs' },
    { v: 'packing', label: 'Packing list', sub: 'For the scouting trip' },
    { v: 'inspiration', label: 'Inspiration scratchpad', sub: 'Photos, links, ideas' },
  ];
  const grid = h('div', { class: 'cat-list' });
  list.forEach(l => grid.append(
    h('div', { class: 'cat-card', onclick: () => navigate(l.v) },
      h('div', { class: 'cat-head' }, h('div', { class: 'cat-name' }, l.label), h('span', { class: 'muted' }, '→')),
      h('div', { class: 'cat-meta' }, l.sub)
    )
  ));
  root.append(grid);
};

// ============================================================
// MODALS
// ============================================================
function showModal(content) {
  const m = $('#modal');
  m.innerHTML = '';
  m.append(content);
  m.hidden = false;
  m.addEventListener('click', backdropClose);
}
function closeModal() {
  const m = $('#modal');
  m.hidden = true;
  m.innerHTML = '';
  m.removeEventListener('click', backdropClose);
}
function backdropClose(e) {
  if (e.target.id === 'modal') closeModal();
}

// ============================================================
// SETTINGS
// ============================================================
function wireSettings() {
  $('#settings-btn').addEventListener('click', openSettings);
}
function openSettings() {
  const s = getState();
  const content = h('div', { class: 'modal-content' });
  content.append(h('div', { class: 'modal-head' }, h('h2', {}, 'Settings'), h('button', { class: 'modal-close', onclick: closeModal }, '×')));
  content.append(h('div', { class: 'field' },
    h('label', {}, 'Wedding date'),
    h('input', { id: 'set-date', type: 'date', value: (s.meta?.weddingDate || '').slice(0,10) })
  ));
  content.append(h('div', { class: 'field' },
    h('label', {}, 'Budget target (USD)'),
    h('input', { id: 'set-budget', type: 'number', value: s.meta?.budgetTotal || 20000 })
  ));
  content.append(h('button', { class: 'btn btn-primary btn-full', onclick: () => {
    mutate(st => { st.meta = st.meta || {}; st.meta.weddingDate = $('#set-date').value ? $('#set-date').value + 'T16:00:00' : null; st.meta.budgetTotal = Number($('#set-budget').value) || 20000; });
    closeModal(); toast('Saved');
  }}, 'Save'));

  content.append(h('hr', { style: 'margin:20px 0;border:none;border-top:1px solid var(--line)' }));
  content.append(h('p', { class: 'muted' }, `Sync: ${isFirebaseOn() ? 'Firebase (live)' : 'local only'} — ${getSyncStatus()}`));
  content.append(h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px' },
    h('button', { class: 'btn btn-ghost btn-sm', onclick: () => {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `wedding-2027-export-${new Date().toISOString().slice(0,10)}.json`; a.click();
    }}, 'Export JSON'),
    h('button', { class: 'btn btn-ghost btn-sm', onclick: () => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json';
      inp.onchange = async (e) => { const f = e.target.files[0]; if (!f) return; const text = await f.text(); try { await importData(text); toast('Imported'); closeModal(); } catch { toast('Invalid file'); } };
      inp.click();
    }}, 'Import JSON'),
    h('button', { class: 'btn btn-danger btn-sm', onclick: () => { if (confirm('Reset everything to defaults? This wipes all data.')) { resetToSeeds(); closeModal(); toast('Reset'); }}}, 'Reset to defaults'),
    h('button', { class: 'btn btn-ghost btn-sm', onclick: () => { localStorage.removeItem('pin-ok'); location.reload(); } }, 'Lock'),
  ));
  showModal(content);
}

function openDateModal() {
  openSettings();
  setTimeout(() => $('#set-date')?.focus(), 50);
}

// ============================================================
// BOOT
// ============================================================
initPinGate();

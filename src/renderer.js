'use strict';
/* Twiking renderer — plain DOM, no framework, no build step. */

const api = window.twiking;

const state = {
  data: null,
  route: { name: 'explore', id: null },
  query: '',
  category: 'All',
  appQuery: '',
  appCategory: 'All',
  tab: 'settings',
  draft: null,
  plan: null,
  changes: null,
  source: null,
  busy: false,
  confirmRevert: false,
};

/* ---------------------------------------------------------------- icons --- */
const ICONS = {
  explore: '<circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.4l-2 5.2-5.2 2 2-5.2z"/>',
  installed: '<path d="M4 7l8-4 8 4v10l-8 4-8-4z"/><path d="M4 7l8 4 8-4M12 21V11"/>',
  apps: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
  bell: '<path d="M18 15V10a6 6 0 10-12 0v5l-2 2h16z"/><path d="M10 20a2 2 0 004 0"/>',
  volume: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 010 6"/>',
  mouse: '<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M12 7v3"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M8 14h8"/>',
  dock: '<rect x="2.5" y="14" width="19" height="6" rx="2"/><path d="M6 17h.01M9 17h.01M12 17h.01M15 17h.01M18 17h.01"/>',
  image: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M4 17l5-5 4 4 3-2 4 3"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  scaling: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/><path d="M11 7h4a2 2 0 012 2v4"/>',
  switch: '<path d="M4 8h13M13 4l4 4-4 4M20 16H7M11 12l-4 4 4 4"/>',
  settings: '<path d="M5 7h14M5 12h14M5 17h14"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="17" r="2"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  window: '<rect x="3" y="4.5" width="18" height="15" rx="2.2"/><path d="M3 9h18"/><path d="M15.5 6.7h3M12.5 6.7h3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  bolt: '<path d="M13 3L5.5 13.5H11l-1 7.5 8-11h-5.5z"/>',
  palette: '<path d="M12 3.5a8.5 8.5 0 100 17c1.4 0 2-1 2-2s-.7-1.7-.7-2.6c0-1 .8-1.7 1.9-1.7h1.6c2 0 3.7-1.6 3.7-3.6C20.5 6 16.7 3.5 12 3.5z"/><circle cx="8.2" cy="9.5" r="1.1"/><circle cx="12" cy="7.6" r="1.1"/><circle cx="15.8" cy="9.5" r="1.1"/>',
  type: '<path d="M5 6.5V5h14v1.5M12 5v14M9 19h6"/>',
  corner: '<path d="M4 4h7a9 9 0 019 9v7"/><circle cx="4.6" cy="4.6" r="1.4"/>',
  battery: '<rect x="2.5" y="7.5" width="16" height="9" rx="2"/><path d="M21 11v2"/><rect x="4.5" y="9.5" width="7" height="5" rx="1"/>',
  touchpad: '<rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M4 15.5h16M12 15.5V20"/>',
  focus: '<rect x="3" y="4.5" width="10" height="8" rx="1.6"/><rect x="11" y="11.5" width="10" height="8" rx="1.6"/>',
  grid: '<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.4"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.4"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.4"/><path d="M13 16.7h7.5M16.7 13v7.5"/>',
  folder: '<path d="M3.5 6.5A2 2 0 015.5 4.5h4l2 2.5h7a2 2 0 012 2v8.5a2 2 0 01-2 2h-13a2 2 0 01-2-2z"/>',
  css: '<path d="M4 5h16l-1.6 14H5.6z"/><path d="M8 9.5h8M8.4 13h7.2M9 16.2h6"/>',
  app: '<rect x="3" y="3.5" width="18" height="17" rx="2.4"/><path d="M3 8.5h18M6.5 6h.01M9.2 6h.01"/>',
  qt: '<circle cx="12" cy="12" r="8.5"/><path d="M9 15.5L15 8.5M15 8.5l.01 4M15 8.5h-4"/>',
  mod: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  warning: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.2v.01"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  close: '<path d="M5 5l14 14M19 5L5 19"/>',
  external: '<path d="M14 4h6v6M20 4l-8 8"/><path d="M18 14.5V19a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 19V7.5A1.5 1.5 0 015 6h4.5"/>',
  folderOpen: '<path d="M3.5 8V6.5a1.5 1.5 0 011.5-1.5h4l2 2.5h6a1.5 1.5 0 011.5 1.5V10"/><path d="M3 10h18l-2 9H5z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  refresh: '<path d="M20 12a8 8 0 11-2.6-5.9"/><path d="M20 4v4h-4"/>',
  shield: '<path d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 9.5-4.1-1.9-7-5.3-7-9.5V6z"/><path d="M8.8 12l2.3 2.3 4.1-4.3"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.01"/>',
  code: '<path d="M8.5 8L4 12l4.5 4M15.5 8L20 12l-4.5 4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0014.5 4h-9A1.5 1.5 0 004 5.5v9A1.5 1.5 0 005.5 16H8"/>',
  power: '<path d="M12 3.5v8"/><path d="M6.8 6.4a8 8 0 109.4 0"/>',
  history: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/><path d="M3.5 12H1.5l2.3-3"/>',
  storage: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  down: '<path d="M12 4v12M6.5 11l5.5 5.5L17.5 11M4 20h16"/>',
};

function svg(name, size = 18, cls = '') {
  const body = ICONS[name] || ICONS.mod;
  return `<svg class="${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/* --------------------------------------------------------------- helpers --- */
function esc(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function catColor(cat) {
  const map = {
    Shell: '#4c8dff', Windows: '#a78bfa', Input: '#34d399', Appearance: '#f472b6',
    Files: '#f59e0b', Performance: '#fb923c', Applications: '#38bdf8', Experimental: '#94a3b8',
    Taskbar: '#22d3ee', Displays: '#e879f9', Power: '#a3e635', Accessibility: '#facc15',
  };
  return map[cat] || '#4c8dff';
}

function iconTile(m, size = 36) {
  const color = catColor(m.category);
  return `<div class="card-icon" style="background:${color}1f;color:${color};width:${size}px;height:${size}px">${svg(m.icon, Math.round(size * 0.55))}</div>`;
}

function relTime(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

const ACTION_LABEL = {
  enable: 'enabled', reapply: 're-applied', revert: 'disabled', 'apply-failed': 'failed',
  'reapply-previous': 'updated',
};

function toast(message, kind = 'info', ms = 5200) {
  const host = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `${svg(kind === 'ok' ? 'check' : kind === 'err' ? 'warning' : 'info', 16)}<span>${esc(message)}</span>`;
  host.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .2s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 220);
  }, ms);
}

/* Re-render on both edges: buttons are disabled while busy, so clearing the
 * flag without repainting left them looking (and behaving) disabled. */
function busyMark(on) {
  state.busy = on;
  if (state.data) render();
}

/* ------------------------------------------------------------------ data --- */
async function refresh() {
  const res = await api.bootstrap();
  if (!res.ok) {
    toast(res.error, 'err', 9000);
    return;
  }
  state.data = res.value;
  render();
}

function modById(id) {
  return state.data ? state.data.mods.find((m) => m.id === id) : null;
}

function go(name, id = null) {
  const hash = id ? `#/${name}/${id}` : `#/${name}`;
  if (location.hash === hash) {
    state.route = { name, id };
    resetDetailState();
    render();
  } else {
    location.hash = hash;
  }
}

function resetDetailState() {
  state.draft = null;
  state.plan = null;
  state.changes = null;
  state.source = null;
  state.tab = 'settings';
}

/* --------------------------------------------------------------- sidebar --- */
function renderSidebar() {
  const nav = document.getElementById('sidebar-nav');
  const foot = document.getElementById('sidebar-foot');
  const d = state.data;
  const enabled = d ? d.mods.filter((m) => m.enabled).length : 0;

  const item = (name, label, icon, count) => `
    <button class="nav-item ${state.route.name === name ? 'active' : ''}" data-nav="${name}">
      ${svg(icon, 17)}<span class="label">${label}</span>
      ${count !== undefined && count !== null ? `<span class="nav-count">${count}</span>` : ''}
    </button>`;

  nav.innerHTML = [
    item('explore', 'Explore', 'explore', d ? d.mods.length : null),
    item('installed', 'Installed', 'installed', enabled || null),
    item('apps', 'Apps', 'apps', d ? d.apps.filter((a) => a.installed).length : null),
    '<div class="nav-section">System</div>',
    item('settings', 'Settings', 'settings'),
  ].join('');

  if (!d) {
    foot.innerHTML = '';
    return;
  }

  const ok = d.session.gsettings && d.session.desktop.raw.toLowerCase().includes('gnome');
  foot.innerHTML = `
    <div class="session-chip" title="${esc(d.session.osPretty)}">
      <span class="dot ${ok ? '' : 'warn'}"></span>
      <span>${esc(d.session.desktop.primary)} · ${esc(d.session.sessionType)}</span>
    </div>
    <div class="foot-actions">
      <button data-action="open-mods" title="Open the folder where your own mods live">${'Mods folder'}</button>
      <button data-action="new-mod" title="Create a new mod file">${'New mod'}</button>
    </div>`;
}

/* ------------------------------------------------------------ explore page --- */
function modCard(m) {
  const badges = [];
  if (m.enabled) badges.push('<span class="pill on">Enabled</span>');
  if (!m.compat.ok && m.loadError) badges.push('<span class="pill danger">Error</span>');
  else if (!m.compat.ok) badges.push('<span class="pill warn">Not compatible</span>');

  return `
    <article class="card" data-open="${esc(m.id)}" tabindex="0" role="button" aria-label="${esc(m.name)}">
      <div class="card-top">
        ${iconTile(m, 38)}
        <div class="card-head">
          <h3>${esc(m.name)} ${badges.join(' ')}</h3>
          <div class="card-author">${esc(m.author)}${m.builtin ? ' · bundled' : ' · your mod'}</div>
        </div>
      </div>
      <p class="card-desc">${esc(m.description)}</p>
      <div class="card-foot">
        <span class="card-cat" style="color:${catColor(m.category)}">${esc(m.category)}</span>
        <span class="spacer"></span>
        <span class="card-ver">v${esc(m.version)}</span>
        <button class="btn sm ${m.enabled ? 'ghost' : ''}" data-toggle="${esc(m.id)}" ${m.compat.ok ? '' : 'disabled title="Not compatible with this system"'}>
          ${m.enabled ? 'Disable' : 'Enable'}
        </button>
      </div>
    </article>`;
}

function filteredMods(list) {
  const q = state.query.trim().toLowerCase();
  return list.filter((m) => {
    if (state.category !== 'All' && m.category !== state.category) return false;
    if (!q) return true;
    return `${m.name} ${m.description} ${m.category} ${m.tags.join(' ')} ${m.author}`.toLowerCase().includes(q);
  });
}

function exploreGridHtml() {
  const list = filteredMods(state.data.mods);
  if (!list.length) {
    return `<div class="empty"><h3>No mods match</h3><p>Try a different search or category.</p></div>`;
  }
  return `<div class="grid">${list.map(modCard).join('')}</div>`;
}

function categoriesBar(categories, active, kind) {
  return `<div class="chips">${['All', ...categories]
    .map((c) => `<button class="chip ${active === c ? 'active' : ''}" data-${kind}-cat="${esc(c)}">${esc(c)}</button>`)
    .join('')}</div>`;
}

function pageExplore() {
  const used = [...new Set(state.data.mods.map((m) => m.category))].sort();
  return `
    <div class="view-inner">
      <div class="page-head">
        <div class="head-row">
          <div>
            <h1>Explore mods</h1>
            <p>Small, reversible changes to your desktop. Enable one, tweak its settings, and if you don't like it, switch it off — Twiking puts every value back the way it was.</p>
          </div>
          <button class="btn" data-action="rescan" title="Reload mod files from disk">${svg('refresh', 15)} Rescan</button>
        </div>
      </div>
      <div class="toolbar">
        <div class="search">
          ${svg('search', 15)}
          <input id="search" type="text" placeholder="Search mods…" value="${esc(state.query)}" autocomplete="off" spellcheck="false" />
          <kbd>Ctrl F</kbd>
        </div>
      </div>
      ${categoriesBar(used, state.category, 'mod')}
      <div id="grid">${exploreGridHtml()}</div>
    </div>`;
}

/* ---------------------------------------------------------- installed page --- */
function pageInstalled() {
  const enabled = state.data.mods.filter((m) => m.enabled);
  const changes = enabled.reduce((n, m) => n + m.changeCount, 0);

  if (!enabled.length) {
    return `
      <div class="view-inner">
        <div class="page-head"><h1>Installed</h1><p>Nothing is enabled right now, so every setting on your desktop is exactly as you left it.</p></div>
        <div class="empty">
          <h3>No mods enabled</h3>
          <p>Pick something from Explore — each mod shows you exactly what it changes before you commit.</p>
          <button class="btn primary" data-nav="explore">Browse mods</button>
        </div>
      </div>`;
  }

  return `
    <div class="view-inner">
      <div class="page-head">
        <div class="head-row">
          <div>
            <h1>Installed</h1>
            <p>${enabled.length} mod${enabled.length === 1 ? '' : 's'} active, holding ${changes} journalled change${changes === 1 ? '' : 's'}. Disabling a mod replays those in reverse.</p>
          </div>
          <button class="btn ${state.confirmRevert ? 'danger' : ''}" data-action="revert-all">
            ${state.confirmRevert ? `Really revert all ${enabled.length}?` : 'Revert everything'}
          </button>
        </div>
      </div>
      <div class="grid">${enabled.map(modCard).join('')}</div>
    </div>`;
}

/* --------------------------------------------------------------- apps page --- */
function appCard(a) {
  const cats = a.categories.join(' · ');
  const color = catColor(a.categories[0] === 'Themes' ? 'Appearance' : a.categories[0] === 'Effects' ? 'Performance' : 'Shell');
  return `
    <article class="app-card">
      <div class="app-top">
        <div class="app-letter" style="background:${color}1f;color:${color}">${esc(a.name.charAt(0))}</div>
        <div style="flex:1;min-width:0">
          <h3>${esc(a.name)}</h3>
          <div class="cats">${esc(cats)}</div>
        </div>
        ${a.installed ? '<span class="pill on">Installed</span>' : '<span class="pill off">Not installed</span>'}
      </div>
      <p class="app-desc">${esc(a.description)}</p>
      ${a.note ? `<p class="app-note">${esc(a.note)}</p>` : ''}
      <div class="app-foot">
        ${a.installed
          ? `<button class="btn sm" data-launch="${esc(a.id)}">${svg('power', 13)} Open</button>`
          : `<button class="btn sm primary" data-install="${esc(a.id)}" title="${esc(a.installCommand)}">${svg('down', 13)} Install</button>
             <button class="icon-btn" data-copy="${esc(a.installCommand)}" title="Copy: ${esc(a.installCommand)}">${svg('copy', 13)}</button>`}
        <span class="spacer"></span>
        ${a.website ? `<button class="icon-btn" data-link="${esc(a.website)}" title="Project website">${svg('external', 13)}</button>` : ''}
      </div>
    </article>`;
}

function projectCard(p) {
  return `
    <article class="app-card">
      <div class="app-top">
        <div class="app-letter" style="background:#a78bfa1f;color:#a78bfa">${esc(p.name.charAt(0))}</div>
        <div style="flex:1;min-width:0">
          <h3>${esc(p.name)}</h3>
          <div class="cats">Your project</div>
        </div>
        ${p.installed ? '<span class="pill on">Installed</span>' : '<span class="pill info">Source only</span>'}
      </div>
      <p class="app-desc">${esc(p.description)}</p>
      ${p.note ? `<p class="app-note">${esc(p.note)}</p>` : ''}
      <div class="app-foot">
        ${p.installed ? `<button class="btn sm" data-launch="${esc(p.id)}">${svg('power', 13)} Open</button>` : ''}
        <button class="btn sm ghost" data-link="${esc(p.repo)}">${svg('external', 13)} GitHub</button>
        <span class="spacer"></span>
      </div>
    </article>`;
}

function appsGridHtml() {
  const q = state.appQuery.trim().toLowerCase();
  const list = state.data.apps.filter((a) => {
    if (state.appCategory !== 'All' && !a.categories.includes(state.appCategory)) return false;
    if (!q) return true;
    return `${a.name} ${a.description} ${a.categories.join(' ')}`.toLowerCase().includes(q);
  });
  if (!list.length) return `<div class="empty"><h3>No apps match</h3><p>Try another category.</p></div>`;
  const sorted = [...list].sort((a, b) => Number(b.installed) - Number(a.installed) || a.name.localeCompare(b.name));
  return `<div class="apps-grid">${sorted.map(appCard).join('')}</div>`;
}

function pageApps() {
  const installed = state.data.apps.filter((a) => a.installed).length;
  const projects = state.data.projects || [];
  const cats = state.data.apps.reduce((set, a) => {
    a.categories.forEach((c) => set.add(c));
    return set;
  }, new Set());
  return `
    <div class="view-inner">
      <div class="page-head">
        <div class="head-row">
          <div>
            <h1>Customization apps</h1>
            <p>Every program here exists only to change how your desktop looks or behaves — no editors, browsers or utilities. ${installed} of ${state.data.apps.length} are already installed. Press <b>Install</b> and Twiking runs the package manager for you, after your authorisation.</p>
          </div>
        </div>
      </div>
      <div class="toolbar">
        <div class="search">
          ${svg('search', 15)}
          <input id="app-search" type="text" placeholder="Search apps…" value="${esc(state.appQuery)}" autocomplete="off" spellcheck="false" />
        </div>
      </div>
      ${categoriesBar([...cats].sort(), state.appCategory, 'app')}
      <div id="apps-grid">${appsGridHtml()}</div>
      ${state.data.appErrors.length ? `<div class="banner warn">${svg('warning', 15)}<div><b>Catalog entries rejected</b><ul>${state.data.appErrors.map((e) => `<li>${esc(e.id)}: ${esc(e.problems.join(', '))}</li>`).join('')}</ul></div></div>` : ''}
      ${projects.length ? `
        <div class="section-head">
          <h2>Your projects</h2>
          <p>Your own applications, listed here for quick access. They are not customization apps, so they are kept out of the catalogue above and labelled as yours.</p>
        </div>
        <div class="apps-grid">${projects.map(projectCard).join('')}</div>` : ''}
    </div>`;
}

/* ----------------------------------------------------------------- detail --- */
function settingControl(spec, value) {
  const id = `set-${spec.key}`;
  if (spec.type === 'bool') {
    return `<label class="switch"><input type="checkbox" data-setting="${esc(spec.key)}" ${value ? 'checked' : ''} aria-label="${esc(spec.name)}" /><span class="switch-track"></span></label>`;
  }
  if (spec.type === 'int') {
    return `
      <input type="range" id="${id}" min="${spec.min}" max="${spec.max}" step="${spec.step}" value="${Number(value)}" data-setting="${esc(spec.key)}" />
      <span class="range-value">${Number(value)}${esc(spec.suffix || '')}</span>`;
  }
  if (spec.type === 'select' || spec.type === 'app') {
    const options = spec.options || [];
    if (!options.length) {
      return `<select id="${id}" disabled><option>${esc(spec.emptyHint || 'No options available')}</option></select>`;
    }
    const current = String(value);
    /* Thousands of installed fonts would make a dropdown unusable; offer a
     * type-to-search field with the same values instead. */
    if (options.length > 200) {
      return `<input type="text" id="${id}" list="dl-${esc(spec.key)}" data-setting="${esc(spec.key)}" value="${esc(current)}" placeholder="Type to search ${options.length} options…" spellcheck="false" style="min-width:240px" />
        <datalist id="dl-${esc(spec.key)}">${options.map((o) => `<option value="${esc(o.value)}"></option>`).join('')}</datalist>`;
    }
    const known = options.some((o) => String(o.value) === current);
    const opts = [
      !known ? `<option value="${esc(current)}" selected>${esc(current || '— choose —')}</option>` : '',
      ...options.map((o) => `<option value="${esc(o.value)}" ${String(o.value) === current ? 'selected' : ''}>${esc(o.label)}</option>`),
    ].join('');
    return `<select id="${id}" data-setting="${esc(spec.key)}">${opts}</select>`;
  }
  if (spec.type === 'text') {
    return `<textarea id="${id}" data-setting="${esc(spec.key)}" placeholder="${esc(spec.placeholder || '')}" style="min-width:340px">${esc(value)}</textarea>`;
  }
  if (spec.type === 'file') {
    return `<div class="file-picker">
      <input type="text" id="${id}" data-setting="${esc(spec.key)}" value="${esc(value)}" placeholder="${esc(spec.placeholder || 'Choose a file…')}" spellcheck="false" />
      <button class="btn sm" data-browse="${esc(spec.key)}" type="button">Browse…</button>
    </div>`;
  }
  return `<input type="text" id="${id}" data-setting="${esc(spec.key)}" value="${esc(value)}" />`;
}

function settingsTab(mod) {
  const draft = state.draft.values;
  return `
    <div class="form">
      ${mod.settings.map((spec) => `
        <div class="form-row ${spec.advanced ? 'advanced' : ''}">
          <div class="form-text">
            <label for="set-${esc(spec.key)}">${esc(spec.name)}</label>
            ${spec.description ? `<div class="hint">${esc(spec.description)}</div>` : ''}
          </div>
          <div class="form-control">${settingControl(spec, draft[spec.key])}</div>
        </div>`).join('') || '<p class="hint">This mod has no settings.</p>'}
    </div>
    ${footerBar(mod)}`;
}

function isDirty(mod) {
  return JSON.stringify(state.draft.values) !== JSON.stringify(mod.settingsValues);
}

function footerBar(mod) {
  if (!isDirty(mod)) {
    return `<div class="form-footer"><span class="msg clean">${mod.enabled ? 'Settings match what is applied.' : 'Saved settings — this mod is off.'}</span></div>`;
  }
  return `
    <div class="form-footer">
      <span class="msg">Unsaved changes</span>
      <button class="btn ghost sm" data-action="discard">Discard</button>
      ${mod.enabled
        ? `<button class="btn primary sm" data-action="apply-draft" ${state.busy ? 'disabled' : ''}>${svg('refresh', 14)} Apply changes</button>`
        : `<button class="btn sm" data-action="save-draft">Save settings</button>
           <button class="btn primary sm" data-action="enable-draft" ${state.busy ? 'disabled' : ''}>Enable with these settings</button>`}
    </div>`;
}

function changeRow(item) {
  const delta = [];
  if (item.from !== undefined && item.to !== undefined && (item.from !== '' || item.to !== '')) {
    delta.push(`<span class="from">${esc(item.from || '(unset)')}</span><span class="arrow">→</span><span class="to">${esc(item.to || '(unset)')}</span>`);
  }
  return `
    <div class="change">
      <span class="kind">${esc(item.kind)}</span>
      <div class="body">
        <div class="desc">${esc(item.desc)}</div>
        ${delta.length ? `<div class="delta">${delta.join('')}</div>` : ''}
        ${item.path ? `<div class="path">${esc(item.path)}</div>` : ''}
      </div>
    </div>`;
}

function changesTab(mod) {
  if (state.plan && !state.plan.ok) {
    return `<div class="banner danger">${svg('warning', 15)}<div><b>Preview failed</b><br/>${esc(state.plan.error)}</div></div>`;
  }
  const draft = isDirty(mod) || !mod.enabled;
  const planned = state.plan && state.plan.ok ? state.plan.intents : null;

  /* While the enabled settings are exactly what is applied, show the journal
   * (what is actually on disk) rather than a plan that matches it. */
  if (planned && draft) {
    const list = planned;
    if (!list.length) {
      return `<div class="empty"><h3>Nothing to change</h3><p>These settings would not modify anything on your system.</p></div>`;
    }
    return `
      <div class="banner info">${svg('info', 15)}<div>These are the exact changes Twiking would make${mod.enabled ? ' if you re-apply' : ' when you enable this mod'}. Nothing has been written yet.</div></div>
      <div class="changes">${list.map(changeRow).join('')}</div>`;
  }

  if (state.changes && state.changes.length) {
    return `
      <div class="banner info">${svg('check', 15)}<div>Applied and journalled. Disabling this mod replays these in reverse.</div></div>
      <div class="changes">${state.changes.map(changeRow).join('')}</div>`;
  }

  return `<div class="empty"><h3>No changes recorded</h3><p>Enable the mod to see what it does, or open the Settings tab and press “Apply changes”.</p></div>`;
}

function sourceTab(mod) {
  if (!state.source) return `<div class="empty"><p>Loading source…</p></div>`;
  const code = state.source.source || mod.loadError || '// source unavailable';
  return `
    <div class="code-head">
      <span class="path">${esc(state.source.file)}</span>
      <button class="btn sm ghost" data-action="copy-source">${svg('copy', 13)} Copy</button>
      <button class="btn sm ghost" data-action="open-mods">${svg('folderOpen', 13)} Folder</button>
    </div>
    <pre class="code">${esc(code)}</pre>
    <div class="banner info" style="margin-top:14px">${svg('shield', 15)}<div>The source is always visible and never compiled. Bundled mods live in <code>mods/</code> inside the app; your own live in the mods folder above.</div></div>`;
}

function capabilityBadges(mod) {
  const map = {
    settings: ['Desktop settings', 'Changes gsettings keys'],
    files: ['Writes files', 'Adds managed blocks to config files'],
    apps: ['Per-app wrappers', 'Overrides launcher entries for one app'],
    exec: ['Runs commands', 'Cannot be undone automatically'],
  };
  return mod.capabilities.map((c) => {
    const [label, title] = map[c] || [c, c];
    return `<span class="pill ${c === 'exec' ? 'warn' : 'plain'}" title="${esc(title)}">${esc(label)}</span>`;
  }).join('');
}

function pageMod(mod) {
  state.draft = state.draft && state.draft.id === mod.id ? state.draft : { id: mod.id, values: { ...mod.settingsValues } };

  const statePill = mod.enabled
    ? `<span class="pill on">Enabled</span>`
    : `<span class="pill off">Disabled</span>`;
  const changeCount = mod.enabled ? mod.changeCount : 0;

  const tabs = [
    ['settings', 'Settings', mod.settings.length || ''],
    ['changes', 'Changes', changeCount || ''],
    ['source', 'Source', ''],
  ];

  let banner = '';
  if (!mod.compat.ok) {
    banner = `<div class="banner warn">${svg('warning', 15)}<div><b>Not available on this system</b><ul>${mod.compat.problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div></div>`;
  } else if (mod.lastError) {
    banner = `<div class="banner danger">${svg('warning', 15)}<div><b>Last attempt failed</b><br/>${esc(mod.lastError)}</div></div>`;
  }

  return `
    <div class="view-inner">
      <button class="back" data-nav="explore">${svg('back', 14)} All mods</button>
      <div class="detail-head">
        <div class="detail-icon" style="background:${catColor(mod.category)}1f;color:${catColor(mod.category)}">${svg(mod.icon, 26)}</div>
        <div class="detail-title">
          <h1>${esc(mod.name)} <span class="ver">v${esc(mod.version)}</span></h1>
          <div class="byline">
            ${statePill}
            <span>${esc(mod.author)}</span>
            <span>·</span>
            <span>${esc(mod.category)}</span>
            ${mod.builtin ? '<span>·</span><span>bundled</span>' : '<span>·</span><span>your mod</span>'}
            ${capabilityBadges(mod)}
          </div>
          <p class="lead">${esc(mod.description)}</p>
        </div>
        <div class="detail-actions">
          ${mod.enabled
            ? `<button class="btn danger" data-action="disable" ${state.busy ? 'disabled' : ''}>Disable &amp; revert</button>
               <button class="btn ghost sm" data-action="reapply" ${state.busy ? 'disabled' : ''}>${svg('refresh', 13)} Re-apply</button>`
            : `<button class="btn primary" data-action="enable" ${mod.compat.ok && !state.busy ? '' : 'disabled'}>Enable mod</button>`}
          <span class="state">${mod.enabled ? `Applied ${relTime(mod.appliedAt)} · ${changeCount} change${changeCount === 1 ? '' : 's'}` : 'No changes on disk'}</span>
        </div>
      </div>
      ${banner}
      <div class="tabs">
        ${tabs.map(([id, label, count]) => `<button class="tab ${state.tab === id ? 'active' : ''}" data-tab="${id}">${label}${count ? `<span class="count">${count}</span>` : ''}</button>`).join('')}
      </div>
      ${state.tab === 'settings' ? settingsTab(mod) : ''}
      ${state.tab === 'changes' ? changesTab(mod) : ''}
      ${state.tab === 'source' ? sourceTab(mod) : ''}
    </div>`;
}

/* ------------------------------------------------------------ settings page --- */
function pageSettings() {
  const d = state.data;
  const s = d.session;
  const enabled = d.mods.filter((m) => m.enabled);
  const changes = enabled.reduce((n, m) => n + m.changeCount, 0);
  const history = d.history || [];

  return `
    <div class="view-inner">
      <div class="page-head">
        <h1>Settings</h1>
        <p>What Twiking knows about this machine, where it keeps its books, and how to undo everything.</p>
      </div>

      <div class="blocks">
        <section class="block">
          <h2>${svg('info', 16)} This system</h2>
          <dl class="kv">
            <dt>Distribution</dt><dd>${esc(s.osPretty || 'unknown')}</dd>
            <dt>Desktop</dt><dd>${esc(s.desktop.raw || s.desktop.primary)}</dd>
            <dt>Session</dt><dd>${esc(s.sessionType)}${s.wayland && s.sessionType !== 'wayland' ? ' (Wayland)' : ''}</dd>
            <dt>gsettings</dt><dd>${s.gsettings ? 'available' : 'missing'}</dd>
            <dt>Managers</dt><dd>${s.dconf ? 'dconf + gsettings' : 'gsettings only'}</dd>
            <dt>GTK themes</dt><dd>${s.themes.length} installed</dd>
            <dt>Shell extensions</dt><dd>${s.shellExtensions.length} in ~/.local</dd>
          </dl>
        </section>

        <section class="block">
          <h2>${svg('shield', 16)} Safety</h2>
          <p>Every change is written down before it happens. Reverting replays the journal backwards, so values you had before Twiking — even ones it doesn't understand — come back exactly.</p>
          <dl class="kv">
            <dt>Enabled mods</dt><dd>${enabled.length}</dd>
            <dt>Live changes</dt><dd>${changes}</dd>
            <dt>Journal entries</dt><dd>${(d.history || []).length}</dd>
            <dt>Backups</dt><dd>${esc(d.paths.backups)}</dd>
          </dl>
          <div class="actions">
            <button class="btn ${state.confirmRevert ? 'danger' : ''}" data-action="revert-all" ${enabled.length ? '' : 'disabled'}>
              ${state.confirmRevert ? `Really revert ${enabled.length} mod${enabled.length === 1 ? '' : 's'}?` : 'Revert everything'}
            </button>
            <button class="btn ghost" data-action="revert-stuck" title="Revert journal entries for mods whose file no longer exists">Revert orphaned entries</button>
          </div>
        </section>

        <section class="block">
          <h2>${svg('storage', 16)} Files</h2>
          <dl class="kv">
            <dt>Your mods</dt><dd>${esc(d.paths.mods)}</dd>
            <dt>State</dt><dd>${esc(d.paths.state)}</dd>
            <dt>GTK 3 CSS</dt><dd>${esc(d.paths.gtkCss['3'])}</dd>
            <dt>GTK 4 CSS</dt><dd>${esc(d.paths.gtkCss['4'])}</dd>
            <dt>Version</dt><dd>${esc(d.version)}</dd>
          </dl>
          <div class="actions">
            <button class="btn" data-action="open-mods">${svg('folderOpen', 14)} Open mods folder</button>
            <button class="btn ghost" data-action="rescan">${svg('refresh', 14)} Rescan</button>
          </div>
        </section>

        <section class="block">
          <h2>${svg('code', 16)} Add your own mod</h2>
          <p>A mod is a single <code>.twmod.js</code> file: metadata, a settings schema, and an <code>apply(ctx)</code> function. Every <code>ctx</code> call is journalled, so you never write an undo — disabling does it for you.</p>
          <div class="actions">
            <button class="btn primary" data-action="new-mod">${svg('plus', 14)} Create mod</button>
            <button class="btn" data-action="import-mod">${svg('down', 14)} Import mod file</button>
            <button class="btn ghost" data-action="open-mods">${svg('folderOpen', 14)} Mods folder</button>
          </div>
          <p style="margin:12px 0 0;font-size:11.5px">Mods run with your user privileges — read a mod before you enable it, exactly like a Windhawk mod's source.</p>
        </section>
      </div>

      <section class="block" style="margin-top:14px">
        <h2>${svg('history', 16)} Recent activity</h2>
        ${history.length
          ? `<div class="history">${history.map((h) => {
              const mod = d.mods.find((m) => m.id === h.modId);
              return `<div class="history-row">
                <span class="when">${relTime(h.ts)}</span>
                <span class="what"><b>${esc(mod ? mod.name : h.modId)}</b> ${esc(ACTION_LABEL[h.action] || h.action)}${h.changes !== undefined ? ` · ${h.changes} change${h.changes === 1 ? '' : 's'}` : ''}${h.error ? ` · ${esc(h.error)}` : ''}</span>
              </div>`;
            }).join('')}</div>`
          : '<p style="margin:0;color:var(--faint);font-size:12.5px">Nothing yet — enable a mod and it will show up here.</p>'}
      </section>
    </div>`;
}

/* ----------------------------------------------------------------- render --- */
function render() {
  renderSidebar();
  const view = document.getElementById('view');
  if (!state.data) return;
  const scrollTop = view.scrollTop;
  const { name, id } = state.route;

  if (name === 'mod' && id) {
    const mod = modById(id);
    view.innerHTML = mod
      ? pageMod(mod)
      : `<div class="view-inner"><button class="back" data-nav="explore">${svg('back', 14)} All mods</button><div class="empty"><h3>Mod not found</h3><p>It may have been removed from disk. Rescan to refresh.</p></div></div>`;
  } else if (name === 'installed') view.innerHTML = pageInstalled();
  else if (name === 'apps') view.innerHTML = pageApps();
  else if (name === 'settings') view.innerHTML = pageSettings();
  else view.innerHTML = pageExplore();

  view.scrollTop = name === 'mod' ? 0 : scrollTop;
}

/* ---------------------------------------------------------------- actions --- */
async function runAction(fn, { silent = false } = {}) {
  if (state.busy) return;
  busyMark(true);
  try {
    await fn();
  } catch (e) {
    if (!silent) toast(String(e.message || e), 'err');
  } finally {
    busyMark(false);
  }
}

async function enableMod(id, settings) {
  const res = await api.apply(id, settings);
  if (!res.ok) {
    toast(res.error, 'err', 10000);
    await refresh();
    return;
  }
  const { changes, warnings, logs } = res.value;
  toast(`Enabled · ${changes.length} change${changes.length === 1 ? '' : 's'} applied`, 'ok');
  for (const w of warnings) toast(w, 'info', 7000);
  for (const l of logs) if (l) toast(l, 'info', 5000);
  await refresh();
}

async function disableMod(id) {
  const mod = modById(id);
  const res = await api.disable(id);
  if (!res.ok) {
    toast(res.error, 'err', 9000);
  } else {
    toast(`Disabled${res.value.reverted ? ` · ${res.value.reverted} change${res.value.reverted === 1 ? '' : 's'} reverted` : ''}`, 'ok');
    for (const w of res.value.warnings) toast(w, 'info', 7000);
  }
  if (state.draft && state.draft.id === id) state.draft = null;
  await refresh();
}

function toggleMod(id) {
  const mod = modById(id);
  if (!mod) return;
  runAction(() => (mod.enabled ? disableMod(id) : enableMod(id, mod.settingsValues)));
}

async function loadChanges(mod) {
  state.plan = null;
  state.changes = null;
  const plan = await api.plan(mod.id, state.draft ? state.draft.values : mod.settingsValues);
  state.plan = plan.ok ? plan.value : { ok: false, error: plan.error };
  if (mod.enabled) {
    const ch = await api.changes(mod.id);
    if (ch.ok) state.changes = ch.value.changes;
  }
  render();
}

async function openTab(tab) {
  state.tab = tab;
  render();
  const mod = modById(state.route.id);
  if (!mod) return;
  if (tab === 'changes') await loadChanges(mod);
  if (tab === 'source' && !state.source) {
    const res = await api.source(mod.id);
    state.source = res.ok ? res.value : { source: '', file: 'unavailable' };
    render();
  }
}

function updateDraftFrom(input) {
  const key = input.dataset.setting;
  if (!key) return;
  let value;
  if (input.type === 'checkbox') value = input.checked;
  else if (input.type === 'range') value = Number(input.value);
  else value = input.value;
  state.draft.values[key] = value;

  if (input.type === 'range') {
    const out = input.parentElement.querySelector('.range-value');
    if (out) {
      const spec = (modById(state.route.id) || { settings: [] }).settings.find((s) => s.key === key);
      out.textContent = `${value}${(spec && spec.suffix) || ''}`;
    }
  }
  // refresh footer without nuking focus
  const footer = document.querySelector('.form-footer');
  const mod = modById(state.route.id);
  if (footer && mod) footer.outerHTML = footerBar(mod);
}

/* Electron implements no window.prompt, so ask with real DOM. */
function modalAsk({ title, label, value = '', placeholder = '', confirm = 'Create' }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <h2>${esc(title)}</h2>
        <label class="hint" for="modal-input">${esc(label)}</label>
        <input id="modal-input" type="text" value="${esc(value)}" placeholder="${esc(placeholder)}" spellcheck="false" />
        <div class="modal-actions">
          <button class="btn ghost" data-cancel>Cancel</button>
          <button class="btn primary" data-confirm>${esc(confirm)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const input = overlay.querySelector('#modal-input');
    input.focus();
    input.select();
    const done = (v) => {
      overlay.remove();
      resolve(v);
    };
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.hasAttribute('data-cancel')) done(null);
      else if (e.target.hasAttribute('data-confirm')) done(input.value.trim() || null);
    });
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') done(input.value.trim() || null);
      if (e.key === 'Escape') done(null);
    });
  });
}

/* ------------------------------------------------------- one-click install --- */
function installModal(app) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal install-modal" role="dialog" aria-modal="true" aria-label="Installing ${esc(app.name)}">
      <h2>Installing ${esc(app.name)}</h2>
      <p class="hint">Running <code>${esc(app.installCommand)}</code>. You may be asked to authenticate — Twiking never stores your password.</p>
      <pre class="install-log" id="install-log"></pre>
      <div class="modal-actions">
        <button class="btn ghost" data-copy="${esc(app.installCommand)}">Copy command</button>
        <button class="btn primary" data-close disabled>Close</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  return overlay;
}

function appendInstallLog(overlay, line) {
  const log = overlay.querySelector('#install-log');
  if (!log) return;
  log.textContent += `${line}\n`;
  if (log.textContent.length > 20000) log.textContent = log.textContent.slice(-20000);
  log.scrollTop = log.scrollHeight;
}

async function installApp(id) {
  const app = state.data.apps.find((a) => a.id === id);
  if (!app) return;
  const overlay = installModal(app);
  const close = overlay.querySelector('[data-close]');
  appendInstallLog(overlay, `$ ${app.installCommand}`);

  const off = api.onInstallOutput(({ id: forId, line }) => {
    if (forId === id) appendInstallLog(overlay, line);
  });
  try {
    const res = await api.installApp(id);
    const value = res.ok ? res.value : { ok: false, error: res.error };
    if (value.ok) {
      appendInstallLog(overlay, '\n✔ Installed.');
      toast(`${app.name} installed`, 'ok', 6000);
      await refresh();
    } else {
      const msg = value.error || 'Install failed.';
      appendInstallLog(overlay, `\n✖ ${msg}`);
      toast(msg, 'err', 9000);
    }
  } catch (e) {
    appendInstallLog(overlay, `\n✖ ${String(e.message || e)}`);
    toast(String(e.message || e), 'err', 9000);
  } finally {
    off();
    close.disabled = false;
  }
}

async function browseSetting(key) {
  const res = await api.pickImage();
  if (!res.ok || !res.value) return;
  const input = document.querySelector(`[data-setting="${key}"]`);
  if (!input) return;
  input.value = res.value;
  state.draft.values[key] = res.value;
  const footer = document.querySelector('.form-footer');
  const mod = modById(state.route.id);
  if (footer && mod) footer.outerHTML = footerBar(mod);
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(
    () => toast('Copied to clipboard', 'ok', 1800),
    () => toast('Could not access the clipboard', 'err')
  );
}

/* ------------------------------------------------------------ event wiring --- */
function handleClick(event) {
  const target = event.target.closest('button, [data-open], [data-nav]');
  if (!target) return;

  if (target.hasAttribute('data-close')) {
    const overlay = target.closest('.overlay');
    if (overlay) overlay.remove();
    return;
  }
  if (target.dataset.install) {
    installApp(target.dataset.install);
    return;
  }
  if (target.dataset.browse) {
    browseSetting(target.dataset.browse);
    return;
  }
  if (target.dataset.nav) {
    go(target.dataset.nav);
    return;
  }
  if (target.dataset.open) {
    if (event.target.closest('[data-toggle]')) return;
    go('mod', target.dataset.open);
    return;
  }
  if (target.dataset.toggle) {
    event.stopPropagation();
    toggleMod(target.dataset.toggle);
    return;
  }
  if (target.dataset.tab) {
    openTab(target.dataset.tab);
    return;
  }
  if (target.dataset.modCat) {
    state.category = target.dataset.modCat;
    render();
    return;
  }
  if (target.dataset.appCat) {
    state.appCategory = target.dataset.appCat;
    const host = document.getElementById('apps-grid');
    if (host) {
      host.innerHTML = appsGridHtml();
      document.querySelectorAll('[data-app-cat]').forEach((c) => c.classList.toggle('active', c.dataset.appCat === state.appCategory));
    }
    return;
  }
  if (target.dataset.launch) {
    api.launchApp(target.dataset.launch).then((r) => {
      if (!r.ok) toast(r.error, 'err', 9000);
    });
    return;
  }
  if (target.dataset.copy) {
    copyText(target.dataset.copy);
    return;
  }
  if (target.dataset.link) {
    api.openExternal(target.dataset.link).then((r) => {
      if (!r.ok) toast(r.error, 'err');
    });
    return;
  }

  const action = target.dataset.action;
  if (!action) return;
  const mod = state.route.id ? modById(state.route.id) : null;

  switch (action) {
    case 'rescan':
      runAction(async () => {
        const res = await api.rescan();
        if (!res.ok) return toast(res.error, 'err');
        state.data = res.value;
        render();
        toast(`Rescanned · ${state.data.mods.length} mods available`, 'ok', 2200);
      });
      break;
    case 'new-mod':
      runAction(async () => {
        const name = await modalAsk({
          title: 'Create a mod',
          label: 'A scaffolded .twmod.js file will be written to your mods folder and opened here.',
          value: 'My first mod',
          placeholder: 'My first mod',
          confirm: 'Create mod',
        });
        if (!name) return;
        const res = await api.createMod(name);
        if (!res.ok) return toast(res.error, 'err');
        toast(`Created ${res.value.file.split('/').pop()} — edit it and hit Rescan`, 'ok', 7000);
        const refreshed = await api.rescan();
        if (refreshed.ok) state.data = refreshed.value;
        state.route = { name: 'mod', id: res.value.id };
        location.hash = `#/mod/${res.value.id}`;
        resetDetailState();
        render();
      });
      break;
    case 'import-mod':
      runAction(async () => {
        const res = await api.importMod();
        if (!res.ok) return toast(res.error, 'err', 9000);
        if (res.value.canceled) return;
        toast(`Imported ${res.value.id}`, 'ok');
        const refreshed = await api.rescan();
        if (refreshed.ok) state.data = refreshed.value;
        state.route = { name: 'mod', id: res.value.id };
        location.hash = `#/mod/${res.value.id}`;
        resetDetailState();
        render();
      });
      break;
    case 'open-mods':
      api.openModsFolder().then((r) => {
        if (!r.ok) toast(r.error, 'err');
      });
      break;
    case 'enable':
      if (mod) runAction(() => enableMod(mod.id, state.draft.values));
      break;
    case 'enable-draft':
      if (mod) runAction(() => enableMod(mod.id, state.draft.values));
      break;
    case 'disable':
      if (mod) runAction(() => disableMod(mod.id));
      break;
    case 'reapply':
      if (mod) runAction(() => enableMod(mod.id, mod.settingsValues));
      break;
    case 'apply-draft':
      if (mod) runAction(async () => {
        const saved = await api.saveSettings(mod.id, state.draft.values);
        if (!saved.ok) return toast(saved.error, 'err');
        await enableMod(mod.id, saved.value.settings);
        state.draft = { id: mod.id, values: { ...saved.value.settings } };
        state.tab = 'changes';
        render();
        const fresh = modById(mod.id);
        if (fresh) await loadChanges(fresh);
      });
      break;
    case 'save-draft':
      if (mod) runAction(async () => {
        const saved = await api.saveSettings(mod.id, state.draft.values);
        if (!saved.ok) return toast(saved.error, 'err');
        toast('Settings saved', 'ok', 2200);
        await refresh();
        state.draft = { id: mod.id, values: { ...saved.value.settings } };
        render();
      });
      break;
    case 'discard':
      if (mod) {
        state.draft = { id: mod.id, values: { ...mod.settingsValues } };
        render();
      }
      break;
    case 'revert-all':
      if (!state.confirmRevert) {
        state.confirmRevert = true;
        render();
        setTimeout(() => { state.confirmRevert = false; render(); }, 6000);
        return;
      }
      state.confirmRevert = false;
      runAction(async () => {
        const res = await api.revertAll();
        if (!res.ok) return toast(res.error, 'err', 9000);
        toast(`Reverted ${res.value.reverted} change${res.value.reverted === 1 ? '' : 's'} across ${res.value.mods.length} mod${res.value.mods.length === 1 ? '' : 's'}`, 'ok');
        await refresh();
      });
      break;
    case 'revert-stuck':
      runAction(async () => {
        let count = 0;
        const journal = state.data.journal || {};
        for (const [id, entry] of Object.entries(journal)) {
          if (entry.ops > 0 && !modById(id)) {
            const res = await api.disable(id);
            if (res.ok) count++;
          }
        }
        toast(count ? `Reverted ${count} orphaned entr${count === 1 ? 'y' : 'ies'}` : 'No orphaned entries found', count ? 'ok' : 'info');
        await refresh();
      });
      break;
    case 'copy-source':
      if (state.source) copyText(state.source.source);
      break;
    default:
      break;
  }
}

function handleKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
    event.preventDefault();
    const input = document.getElementById('search') || document.getElementById('app-search');
    if (input) input.focus();
    else go('explore');
    return;
  }
  if (event.key === 'Escape') {
    if (state.route.name === 'mod') go('explore');
    return;
  }
  if (event.key === 'Enter' && event.target.dataset && event.target.dataset.open) {
    go('mod', event.target.dataset.open);
  }
}

/* ------------------------------------------------------------------- boot --- */
document.addEventListener('click', handleClick);
document.addEventListener('keydown', handleKeydown);

document.addEventListener('input', (event) => {
  const el = event.target;
  if (el.id === 'search') {
    state.query = el.value;
    const grid = document.getElementById('grid');
    if (grid) grid.innerHTML = exploreGridHtml();
    return;
  }
  if (el.id === 'app-search') {
    state.appQuery = el.value;
    const grid = document.getElementById('apps-grid');
    if (grid) grid.innerHTML = appsGridHtml();
    return;
  }
  if (el.dataset.setting) updateDraftFrom(el);
});

document.addEventListener('change', (event) => {
  if (event.target.dataset.setting) updateDraftFrom(event.target);
});

window.addEventListener('hashchange', () => {
  const raw = location.hash.replace(/^#\/?/, '');
  const [name, id] = raw.split('/');
  const changed = name !== state.route.name || id !== state.route.id;
  state.route = { name: name || 'explore', id: id || null };
  if (changed) resetDetailState();
  state.query = state.data ? state.query : '';
  render();
  const mod = state.route.name === 'mod' ? modById(state.route.id) : null;
  if (mod && state.tab === 'source' && !state.source) openTab('source');
});

document.getElementById('win-min').addEventListener('click', () => api.window.minimize());
document.getElementById('win-max').addEventListener('click', () => api.window.toggleMaximize());
document.getElementById('win-close').addEventListener('click', () => api.window.close());
api.window.onState(({ maximized }) => {
  document.getElementById('win-max').title = maximized ? 'Restore' : 'Maximise';
});

(async function boot() {
  const res = await api.bootstrap();
  if (!res.ok) {
    document.getElementById('view').innerHTML = `<div class="empty"><h3>Could not read this system</h3><p>${esc(res.error)}</p></div>`;
    return;
  }
  state.data = res.value;
  const raw = location.hash.replace(/^#\/?/, '');
  if (!raw) location.hash = '#/explore';
  const [name, id] = raw.split('/');
  state.route = { name: name || 'explore', id: id || null };
  render();
  if (state.route.name === 'mod') {
    const mod = modById(state.route.id);
    if (mod && state.tab === 'source') openTab('source');
  }
})();

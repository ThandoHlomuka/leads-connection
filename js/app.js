const App = {
  currentView: 'browse',
  profile: null,

  init() {
    Storage.seed();
    this.profile = Storage.getProfile();
    this.applyTheme();
    this.render();
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  getTheme() { return localStorage.getItem('lc_theme') || 'light'; },

  applyTheme() {
    document.body.classList.toggle('dark', this.getTheme() === 'dark');
  },

  toggleTheme() {
    const next = this.getTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem('lc_theme', next);
    this.applyTheme();
    this.renderNav();
    this.showToast(next === 'dark' ? '🌙' : '☀️', `${next === 'dark' ? 'Dark' : 'Light'} mode`, 'info');
  },

  showToast(icon, msg, type = 'info') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 300); }, 3000);
  },

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'browse';
    this.currentView = hash;
    this.renderView();
    this.updateActiveTab();
  },

  updateActiveTab() {
    document.querySelectorAll('.bottom-tab').forEach(tab => {
      const v = tab.dataset.view;
      const subs = ['saved', 'profile'];
      const isActive = v === this.currentView || (v === 'more' && subs.includes(this.currentView));
      tab.classList.toggle('active', isActive);
    });
  },

  navigate(view) { window.location.hash = view; },

  render() {
    this.renderNav();
    this.renderBottomTabs();
    this.renderView();
  },

  renderNav() {
    const themeIcon = this.getTheme() === 'dark' ? '🌙' : '☀️';
    document.getElementById('main-nav').innerHTML = `
      <div class="nav-inner">
        <div class="nav-brand" onclick="App.navigate('browse')">
          <span class="nav-logo">🔗</span>
          <span class="nav-title">Leads Connection</span>
        </div>
        <div class="nav-spacer"></div>
        <div class="nav-actions">
          <button class="theme-toggle" onclick="App.toggleTheme()" title="Toggle theme">${themeIcon}</button>
        </div>
      </div>
    `;
  },

  renderBottomTabs() {
    const tabs = [
      { view: 'dashboard', label: 'Dashboard', icon: '📊' },
      { view: 'browse', label: 'Browse', icon: '🔍' },
      { view: 'saved', label: 'Saved', icon: '⭐' },
      { view: 'more', label: 'More', icon: '⚙️' },
    ];
    document.getElementById('bottom-tabs').innerHTML = tabs.map(t => `
      <button class="bottom-tab${t.view === 'browse' ? ' active' : ''}" data-view="${t.view}" onclick="App.navigate('${t.view}')">
        <span class="tab-icon">${t.icon}</span>
        <span>${t.label}</span>
      </button>
    `).join('');
  },

  renderView() {
    const main = document.getElementById('main-content');
    if (!main) return;
    main.innerHTML = '';
    switch (this.currentView) {
      case 'dashboard': this.renderDashboard(main); break;
      case 'browse': this.renderBrowse(main); break;
      case 'saved': this.renderSaved(main); break;
      case 'profile': this.renderProfile(main); break;
      case 'more': this.renderMore(main); break;
      default: this.renderBrowse(main);
    }
  },

  // ─── DASHBOARD ───
  renderDashboard(main) {
    const stats = SEED.getStats();
    const opps = Storage.getOpportunities();
    const recent = opps.slice().sort((a, b) => new Date(b.posted) - new Date(a.posted)).slice(0, 4);
    const hot = opps.filter(o => o.status === 'hot');

    main.innerHTML = `
      <div class="welcome-banner">
        <h2>👋 Welcome to Leads Connection</h2>
        <p>Your gateway to RFQs, RFPs, tenders, leads, and funding opportunities</p>
      </div>

      <div class="stat-row">
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-label">Total Opportunities</div>
          <div class="stat-value">${stats.total}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-label">Hot Leads</div>
          <div class="stat-value text-success">${stats.hotLeads}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-label">Total Value</div>
          <div class="stat-value">R${(stats.totalValue / 1000000).toFixed(1)}M</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🆕</div>
          <div class="stat-label">New Today</div>
          <div class="stat-value">${stats.newToday}</div>
        </div>
      </div>

      <div class="two-col">
        <div class="card">
          <div class="card-header">
            <strong>📂 By Category</strong>
          </div>
          <div style="padding: 0.25rem 0;">
            <div class="flex flex-between" style="padding: 0.35rem 0; font-size: 0.85rem;"><span>🔥 Sales Leads</span><span style="font-weight: 600;">${stats.leads}</span></div>
            <div class="flex flex-between" style="padding: 0.35rem 0; font-size: 0.85rem;"><span>📄 RFQs</span><span style="font-weight: 600;">${stats.rfqs}</span></div>
            <div class="flex flex-between" style="padding: 0.35rem 0; font-size: 0.85rem;"><span>📋 RFPs</span><span style="font-weight: 600;">${stats.rfps}</span></div>
            <div class="flex flex-between" style="padding: 0.35rem 0; font-size: 0.85rem;"><span>🏗️ Tenders</span><span style="font-weight: 600;">${stats.tenders}</span></div>
            <div class="flex flex-between" style="padding: 0.35rem 0; font-size: 0.85rem;"><span>💰 Funders</span><span style="font-weight: 600;">${stats.funders}</span></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <strong>🔥 Hot Leads</strong>
            <span class="badge badge-danger">${hot.length} urgent</span>
          </div>
          ${hot.length === 0 ? '<p class="text-muted">No hot leads right now</p>' :
            hot.slice(0, 3).map(o => `
              <div class="flex flex-between" style="padding: 0.4rem 0; font-size: 0.85rem; border-bottom: 1px solid var(--border-light); cursor: pointer;" onclick="App.showDetail('${o.id}')">
                <span>${o.orgLogo} ${o.title.substring(0, 30)}…</span>
                <span class="text-success" style="font-weight: 600;">R${(o.value / 1000).toFixed(0)}k</span>
              </div>
            `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <strong>📌 Recent Opportunities</strong>
          <span class="badge badge-primary">${stats.total} total</span>
        </div>
        ${recent.map(o => `
          <div class="flex flex-between" style="padding: 0.45rem 0; font-size: 0.85rem; border-bottom: 1px solid var(--border-light); cursor: pointer;" onclick="App.showDetail('${o.id}')">
            <div class="flex gap-1" style="align-items: center;">
              <span>${o.orgLogo}</span>
              <div>
                <div style="font-weight: 500;">${o.title.substring(0, 40)}${o.title.length > 40 ? '…' : ''}</div>
                <small class="text-muted">${o.org} · ${this.typeLabel(o.type)}</small>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 600;">${this.fmtVal(o.value)}</div>
              <small class="text-muted">${this.timeAgo(o.posted)}</small>
            </div>
          </div>
        `).join('')}
        <div style="margin-top: 0.5rem;">
          <button class="btn btn-primary btn-block" onclick="App.navigate('browse')">Browse All Opportunities →</button>
        </div>
      </div>
    `;
  },

  // ─── BROWSE ───
  renderBrowse(main) {
    const opps = Storage.getOpportunities();
    const filterType = this._filter || 'all';
    const searchQ = (this._search || '').toLowerCase();

    let filtered = opps;
    if (filterType !== 'all') filtered = filtered.filter(o => o.type === filterType);
    if (searchQ) filtered = filtered.filter(o =>
      o.title.toLowerCase().includes(searchQ) ||
      o.org.toLowerCase().includes(searchQ) ||
      o.sector.toLowerCase().includes(searchQ) ||
      o.description.toLowerCase().includes(searchQ)
    );

    const typeCounts = {
      all: opps.length,
      lead: opps.filter(o => o.type === 'lead').length,
      rfq: opps.filter(o => o.type === 'rfq').length,
      rfp: opps.filter(o => o.type === 'rfp').length,
      tender: opps.filter(o => o.type === 'tender').length,
      funder: opps.filter(o => o.type === 'funder').length,
    };

    main.innerHTML = `
      <div class="view-header">
        <h2>🔍 Browse Opportunities</h2>
        <span class="badge badge-primary">${filtered.length} results</span>
      </div>

      <div class="search-bar">
        <span class="search-icon">🔎</span>
        <input type="text" id="search-input" placeholder="Search opportunities, companies, sectors…" value="${this._search || ''}"
          oninput="App._search=this.value; App.renderView()">
      </div>

      <div class="filter-bar">
        <button class="filter-btn ${filterType === 'all' ? 'active' : ''}" onclick="App.setFilter('all')">All (${typeCounts.all})</button>
        <button class="filter-btn ${filterType === 'lead' ? 'active' : ''}" onclick="App.setFilter('lead')">🔥 Leads (${typeCounts.lead})</button>
        <button class="filter-btn ${filterType === 'rfq' ? 'active' : ''}" onclick="App.setFilter('rfq')">📄 RFQs (${typeCounts.rfq})</button>
        <button class="filter-btn ${filterType === 'rfp' ? 'active' : ''}" onclick="App.setFilter('rfp')">📋 RFPs (${typeCounts.rfp})</button>
        <button class="filter-btn ${filterType === 'tender' ? 'active' : ''}" onclick="App.setFilter('tender')">🏗️ Tenders (${typeCounts.tender})</button>
        <button class="filter-btn ${filterType === 'funder' ? 'active' : ''}" onclick="App.setFilter('funder')">💰 Funders (${typeCounts.funder})</button>
      </div>

      ${filtered.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h2>No opportunities found</h2>
          <p>Try adjusting your filters or search terms</p>
          <button class="btn btn-outline" onclick="App._search=''; App._filter='all'; App.renderView()">Clear Filters</button>
        </div>
      ` : filtered.map(o => this.oppCardHTML(o)).join('')}
    `;

    // Focus search
    setTimeout(() => {
      const inp = document.getElementById('search-input');
      if (inp) inp.focus();
    }, 50);
  },

  setFilter(type) {
    this._filter = type;
    this.renderView();
  },

  oppCardHTML(o) {
    const isSaved = Storage.isSaved(o.id);
    const typeIcons = { lead: '🔥', rfq: '📄', rfp: '📋', tender: '🏗️', funder: '💰' };
    const statusColors = { hot: 'badge-danger', new: 'badge-success', open: 'badge-primary' };
    return `
      <div class="opp-card" onclick="App.showDetail('${o.id}')">
        <div class="opp-top">
          <div class="opp-icon" style="background: rgba(45,49,250,0.08);">${o.orgLogo}</div>
          <div style="flex: 1; min-width: 0;">
            <div class="opp-title">${o.title}</div>
            <div class="opp-org">${o.org} · ${o.location} · ${o.sector}</div>
            <div class="opp-meta">
              <span>${typeIcons[o.type] || '📌'} ${this.typeLabel(o.type)}</span>
              <span>📅 ${this.timeAgo(o.posted)}</span>
              <span>📍 ${o.location}</span>
              <span class="badge ${statusColors[o.status] || 'badge-primary'}">${o.status}</span>
              ${isSaved ? '<span>⭐ Saved</span>' : ''}
            </div>
          </div>
        </div>
        <div class="opp-footer">
          <div>
            <div class="opp-value">${this.fmtVal(o.value)}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">estimated value</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.78rem; font-weight: 500;">Deadline: ${new Date(o.deadline).toLocaleDateString('en-ZA')}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${this.daysLeft(o.deadline)} days left</div>
          </div>
        </div>
      </div>
    `;
  },

  // ─── SAVED ───
  renderSaved(main) {
    const opps = Storage.getOpportunities();
    const savedIds = Storage.getSaved();
    const saved = opps.filter(o => savedIds.includes(o.id));

    main.innerHTML = `
      <div class="view-header">
        <h2>⭐ Saved Opportunities</h2>
        <span class="badge badge-primary">${saved.length} saved</span>
      </div>
      ${saved.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">⭐</div>
          <h2>No saved opportunities yet</h2>
          <p>Tap the star on any opportunity to save it here</p>
          <button class="btn btn-primary" onclick="App.navigate('browse')">Browse Opportunities →</button>
        </div>
      ` : saved.map(o => this.oppCardHTML(o)).join('')}
    `;
  },

  // ─── DETAIL ───
  showDetail(id) {
    const opp = Storage.getOpportunities().find(o => o.id === id);
    if (!opp) return;
    const isSaved = Storage.isSaved(id);
    const typeIcons = { lead: '🔥', rfq: '📄', rfp: '📋', tender: '🏗️', funder: '💰' };

    App.showModal(`
      <div class="flex flex-between" style="margin-bottom: 0.75rem;">
        <span style="font-size: 2rem;">${opp.orgLogo}</span>
        <button class="btn btn-sm ${isSaved ? 'btn-success' : 'btn-outline'}" onclick="App.toggleSaveDetail('${opp.id}')">
          ${isSaved ? '⭐ Saved' : '☆ Save'}
        </button>
      </div>
      <h2>${opp.title}</h2>
      <div class="flex flex-wrap gap-1" style="margin-bottom: 1rem;">
        <span class="badge badge-primary">${this.typeLabel(opp.type)}</span>
        <span class="badge ${opp.status === 'hot' ? 'badge-danger' : opp.status === 'new' ? 'badge-success' : 'badge-info'}">${opp.status}</span>
        <span class="badge badge-info">${opp.sector}</span>
      </div>

      <div class="detail-section">
        <h3>📋 Opportunity Details</h3>
        <div class="detail-row"><span class="label">Organization</span><span class="value">${opp.org}</span></div>
        <div class="detail-row"><span class="label">Location</span><span class="value">${opp.location}</span></div>
        <div class="detail-row"><span class="label">Estimated Value</span><span class="value text-success" style="font-weight: 700;">${this.fmtVal(opp.value)}</span></div>
        <div class="detail-row"><span class="label">Deadline</span><span class="value">${new Date(opp.deadline).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} <span class="text-muted">(${this.daysLeft(opp.deadline)} days left)</span></span></div>
        <div class="detail-row"><span class="label">Posted</span><span class="value">${this.timeAgo(opp.posted)}</span></div>
      </div>

      <div class="detail-section">
        <h3>📝 Description</h3>
        <p style="font-size: 0.88rem; line-height: 1.7; color: var(--text-secondary);">${opp.description}</p>
      </div>

      <div class="detail-section">
        <h3>✅ Requirements</h3>
        ${opp.requirements.map(r => `<div style="display: flex; gap: 0.5rem; padding: 0.3rem 0; font-size: 0.85rem;"><span style="color: var(--success);">✓</span><span>${r}</span></div>`).join('')}
      </div>

      <div class="detail-section">
        <h3>📞 Contact Information</h3>
        <div class="contact-info">
          <div><strong>${opp.contact.name}</strong></div>
          <div>📧 ${opp.contact.email}</div>
          <div>📞 ${opp.contact.phone}</div>
        </div>
      </div>

      <button class="btn btn-primary btn-block" onclick="App.closeModal()">Close</button>
    `);
  },

  toggleSaveDetail(id) {
    const nowSaved = Storage.toggleSave(id);
    this.closeModal();
    this.showDetail(id);
    this.showToast(nowSaved ? '⭐' : '💔', nowSaved ? 'Opportunity saved!' : 'Removed from saved', nowSaved ? 'success' : 'info');
  },

  // ─── PROFILE ───
  renderProfile(main) {
    const p = this.profile;

    main.innerHTML = `
      <div class="view-header">
        <h2>👤 My Profile</h2>
      </div>
      <div class="card">
        <form id="profile-form" onsubmit="App.saveProfile(event)">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value="${p.name || ''}" required>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" value="${p.email || ''}">
          </div>
          <div class="form-group">
            <label>I am a…</label>
            <select name="businessType">
              <option value="freelancer" ${p.businessType === 'freelancer' ? 'selected' : ''}>Freelancer / Independent</option>
              <option value="business" ${p.businessType === 'business' ? 'selected' : ''}>Business / Agency</option>
              <option value="startup" ${p.businessType === 'startup' ? 'selected' : ''}>Startup</option>
            </select>
          </div>
          <div class="form-group">
            <label>Skills / Services (comma separated)</label>
            <input type="text" name="skills" value="${(p.skills || []).join(', ')}" placeholder="Web Development, Graphic Design, Content Writing">
          </div>
          <button type="submit" class="btn btn-primary btn-block">Save Profile</button>
        </form>
      </div>
      <div class="card">
        <strong style="display: block; margin-bottom: 0.5rem;">Appearance</strong>
        <div class="flex flex-between">
          <span>Dark Mode</span>
          <label class="toggle">
            <input type="checkbox" ${this.getTheme() === 'dark' ? 'checked' : ''} onchange="App.toggleTheme()">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    `;
  },

  saveProfile(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    this.profile.name = fd.get('name');
    this.profile.email = fd.get('email');
    this.profile.businessType = fd.get('businessType');
    this.profile.skills = (fd.get('skills') || '').split(',').map(s => s.trim()).filter(Boolean);
    Storage.saveProfile(this.profile);
    this.showToast('✅', 'Profile saved', 'success');
  },

  // ─── MORE ───
  renderMore(main) {
    const items = [
      { view: 'profile', icon: '👤', label: 'My Profile', desc: 'Manage your profile and preferences' },
      { view: 'dashboard', icon: '📊', label: 'Dashboard', desc: 'View stats and recent opportunities' },
    ];
    main.innerHTML = `
      <div class="view-header">
        <h2>⚙️ More</h2>
      </div>
      ${items.map(item => `
        <div class="card" style="cursor: pointer;" onclick="App.navigate('${item.view}')">
          <div class="flex gap-1" style="align-items: center;">
            <span style="font-size: 2rem;">${item.icon}</span>
            <div>
              <strong>${item.label}</strong>
              <div class="text-muted" style="font-size: 0.85rem;">${item.desc}</div>
            </div>
          </div>
        </div>
      `).join('')}
    `;
  },

  // ─── MODAL ───
  showModal(html) {
    this.closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal">${html}</div>`;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.closeModal(); });
    document.body.appendChild(overlay);
  },

  closeModal() {
    const el = document.querySelector('.modal-overlay');
    if (el) el.remove();
  },

  // ─── UTILITIES ───
  typeLabel(type) {
    const labels = { lead: 'Sales Lead', rfq: 'RFQ', rfp: 'RFP', tender: 'Tender', funder: 'Funder' };
    return labels[type] || type;
  },

  fmtVal(n) {
    if (!n) return 'R0';
    if (n >= 1000000) return 'R' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return 'R' + (n / 1000).toFixed(0) + 'k';
    return 'R' + n.toLocaleString('en-ZA');
  },

  timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return diff + ' days ago';
  },

  daysLeft(dateStr) {
    return Math.max(0, Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000));
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
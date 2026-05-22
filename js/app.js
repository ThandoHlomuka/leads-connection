const App = {
  currentView: 'browse',
  profile: null,
  config: null,
  _adminAuthenticated: false,

  init() {
    Storage.seed();
    this.profile = Storage.getProfile();
    this.config = Storage.getConfig();
    this._adminAuthenticated = sessionStorage.getItem('lc_admin_auth') === 'true';
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

  confirmDialog(msg) {
    return confirm(msg);
  },

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'browse';
    this.currentView = hash;
    if (hash.startsWith('admin') && !this._adminAuthenticated) {
      this.showAdminLogin();
      return;
    }
    this.renderView();
    this.updateActiveTab();
  },

  showAdminLogin() {
    const main = document.getElementById('main-content');
    if (!main) return;
    main.innerHTML = '';
    this.updateActiveTab();

    const loginHTML = `
      <div class="login-overlay">
        <div class="login-box">
          <div class="login-header">
            <div class="login-icon">🛡️</div>
            <h2>Admin Login</h2>
            <div class="login-subtitle">Enter your credentials to access the admin panel</div>
          </div>
          <form id="admin-login-form" onsubmit="App.adminLogin(event)">
            <div class="form-group">
              <label>Username</label>
              <input type="text" name="username" placeholder="admin" required autocomplete="off">
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" name="password" placeholder="••••••••" required>
            </div>
            <div id="login-error" class="login-error">Invalid username or password</div>
            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 0.5rem;">Sign In</button>
          </form>
          <div class="login-hint">Default: <strong>admin</strong> / <strong>admin123</strong></div>
        </div>
      </div>
    `;

    const mainNav = document.getElementById('main-nav');
    if (mainNav) mainNav.style.display = 'none';
    const bottomTabs = document.getElementById('bottom-tabs');
    if (bottomTabs) bottomTabs.style.display = 'none';
    const sideNav = document.getElementById('side-nav');
    if (sideNav) sideNav.style.display = 'none';

    main.innerHTML = loginHTML;
  },

  adminLogin(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const username = fd.get('username');
    const password = fd.get('password');

    if (username === 'admin' && password === 'admin123') {
      this._adminAuthenticated = true;
      sessionStorage.setItem('lc_admin_auth', 'true');
      document.getElementById('main-nav').style.display = '';
      document.getElementById('bottom-tabs').style.display = '';
      document.getElementById('side-nav').style.display = '';
      this.showToast('✅', 'Welcome to the admin panel', 'success');
      this.handleRoute();
    } else {
      const err = document.getElementById('login-error');
      if (err) {
        err.classList.add('show');
        err.closest('form').querySelector('input[name="password"]').value = '';
        err.closest('form').querySelector('input[name="password"]').focus();
      }
    }
  },

  adminLogout() {
    if (!this.confirmDialog('Are you sure you want to log out?')) return;
    this._adminAuthenticated = false;
    sessionStorage.removeItem('lc_admin_auth');
    this.showToast('🔒', 'Logged out of admin panel', 'info');
    this.navigate('browse');
  },

  requireAdminAuth() {
    if (!this._adminAuthenticated) {
      this.showAdminLogin();
      return false;
    }
    return true;
  },

  updateActiveTab() {
    document.querySelectorAll('.bottom-tab, .side-tab').forEach(tab => {
      const v = tab.dataset.view;
      const moreViews = ['admin', 'profile', 'submit'];
      const isActive = v === this.currentView || (v === 'more' && moreViews.includes(this.currentView));
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
          <span class="nav-title">${this.config?.appName || 'Leads Connection'}</span>
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
      { view: 'submit', label: 'Submit', icon: '➕' },
      { view: 'saved', label: 'Saved', icon: '⭐' },
      { view: 'more', label: 'More', icon: '⚙️' },
    ];
    const tabHTML = tabs.map(t => `
      <button class="bottom-tab${t.view === 'browse' ? ' active' : ''}" data-view="${t.view}" onclick="App.navigate('${t.view}')">
        <span class="tab-icon">${t.icon}</span>
        <span>${t.label}</span>
      </button>
    `).join('');
    document.getElementById('bottom-tabs').innerHTML = tabHTML;
    document.getElementById('side-nav').innerHTML = tabs.map(t => `
      <button class="side-tab${t.view === this.currentView ? ' active' : ''}" data-view="${t.view}" onclick="App.navigate('${t.view}')">
        <span class="side-icon">${t.icon}</span>
        <span class="side-label">${t.label}</span>
      </button>
    `).join('');
  },

  renderView() {
    const main = document.getElementById('main-content');
    if (!main) return;
    document.getElementById('main-nav').style.display = '';
    document.getElementById('bottom-tabs').style.display = '';
    document.getElementById('side-nav').style.display = '';
    main.innerHTML = '';
    switch (this.currentView) {
      case 'dashboard': this.renderDashboard(main); break;
      case 'browse': this.renderBrowse(main); break;
      case 'saved': this.renderSaved(main); break;
      case 'submit': this.renderSubmit(main); break;
      case 'profile': this.renderProfile(main); break;
      case 'admin': this.renderAdmin(main); break;
      case 'admin-opps': this.renderAdminOpps(main); break;
      case 'admin-users': this.renderAdminUsers(main); break;
      case 'admin-submissions': this.renderAdminSubmissions(main); break;
      case 'admin-categories': this.renderAdminCategories(main); break;
      case 'admin-settings': this.renderAdminSettings(main); break;
      case 'more': this.renderMore(main); break;
      default: this.renderBrowse(main);
    }
  },

  // ─── DASHBOARD ───
  renderDashboard(main) {
    const stats = SEED.getStats();
    const opps = Storage.getOpportunities();
    const recent = opps.slice().sort((a, b) => new Date(b.posted) - new Date(a.posted)).slice(0, 5);
    const hot = opps.filter(o => o.status === 'hot');

    main.innerHTML = `
      <div class="welcome-banner">
        <h2>👋 Welcome to Leads Connection</h2>
        <p>Your gateway to RFQs, RFPs, tenders, leads, funding, and business opportunities</p>
      </div>

      <div class="stat-row">
        <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-label">Total Opportunities</div><div class="stat-value">${stats.total}</div></div>
        <div class="stat-card"><div class="stat-icon">🔥</div><div class="stat-label">Hot Leads</div><div class="stat-value text-success">${stats.hotLeads}</div></div>
        <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">Total Value</div><div class="stat-value">R${(stats.totalValue / 1000000).toFixed(1)}M</div></div>
        <div class="stat-card"><div class="stat-icon">🆕</div><div class="stat-label">New Today</div><div class="stat-value">${stats.newToday}</div></div>
      </div>

      <div class="two-col">
        <div class="card">
          <div class="card-header"><strong>📂 By Category</strong></div>
          <div style="padding: 0.25rem 0;">
            <div class="flex flex-between" style="padding: 0.35rem 0; font-size: 0.85rem;"><span>🔥 Sales Leads</span><span style="font-weight: 600;">${stats.leads}</span></div>
            <div class="flex flex-between" style="padding: 0.35rem 0; font-size: 0.85rem;"><span>📄 RFQs</span><span style="font-weight: 600;">${stats.rfqs}</span></div>
            <div class="flex flex-between" style="padding: 0.35rem 0; font-size: 0.85rem;"><span>📋 RFPs</span><span style="font-weight: 600;">${stats.rfps}</span></div>
            <div class="flex flex-between" style="padding: 0.35rem 0; font-size: 0.85rem;"><span>🏗️ Tenders</span><span style="font-weight: 600;">${stats.tenders}</span></div>
            <div class="flex flex-between" style="padding: 0.35rem 0; font-size: 0.85rem;"><span>💰 Funders</span><span style="font-weight: 600;">${stats.funders}</span></div>
            <div class="flex flex-between" style="padding: 0.35rem 0; font-size: 0.85rem;"><span>🤝 Business Opps</span><span style="font-weight: 600;">${stats.business}</span></div>
            <div class="flex flex-between" style="padding: 0.35rem 0; font-size: 0.85rem;"><span>📋 Projects</span><span style="font-weight: 600;">${stats.projects}</span></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><strong>🔥 Hot Leads</strong><span class="badge badge-danger">${hot.length} urgent</span></div>
          ${hot.length === 0 ? '<p class="text-muted">No hot leads right now</p>' :
            hot.slice(0, 3).map(o => `
              <div class="flex flex-between" style="padding: 0.4rem 0; font-size: 0.85rem; border-bottom: 1px solid var(--border-light); cursor: pointer;" onclick="App.showDetail('${o.id}')">
                <span>${o.orgLogo} ${o.title.substring(0, 30)}…</span>
                <span class="text-success" style="font-weight: 600;">${this.fmtVal(o.value)}</span>
              </div>
            `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><strong>📌 Recent Opportunities</strong><span class="badge badge-primary">${stats.total} total</span></div>
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
    const filterLoc = this._filterLocation || '';
    const filterSector = this._filterSector || '';
    const filterStatus = this._filterStatus || '';
    const filterValMin = parseFloat(this._filterValMin) || 0;
    const filterValMax = parseFloat(this._filterValMax) || 0;
    const sortBy = this._sortBy || 'newest';
    const showFilters = this._showFilters || false;

    const locations = [...new Set(opps.map(o => o.location))].sort();
    const sectors = [...new Set(opps.map(o => o.sector))].sort();
    const statuses = [...new Set(opps.map(o => o.status))].sort();

    let filtered = opps;
    if (filterType !== 'all') filtered = filtered.filter(o => o.type === filterType);
    if (searchQ) filtered = filtered.filter(o =>
      o.title.toLowerCase().includes(searchQ) ||
      o.org.toLowerCase().includes(searchQ) ||
      o.sector.toLowerCase().includes(searchQ) ||
      o.description.toLowerCase().includes(searchQ) ||
      o.location.toLowerCase().includes(searchQ)
    );
    if (filterLoc) filtered = filtered.filter(o => o.location === filterLoc);
    if (filterSector) filtered = filtered.filter(o => o.sector === filterSector);
    if (filterStatus) filtered = filtered.filter(o => o.status === filterStatus);
    if (filterValMin > 0) filtered = filtered.filter(o => o.value >= filterValMin);
    if (filterValMax > 0) filtered = filtered.filter(o => o.value <= filterValMax);

    if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.posted) - new Date(a.posted));
    else if (sortBy === 'deadline') filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    else if (sortBy === 'value_high') filtered.sort((a, b) => b.value - a.value);
    else if (sortBy === 'value_low') filtered.sort((a, b) => a.value - b.value);

    const typeCounts = { all: opps.length };
    ['lead', 'rfq', 'rfp', 'tender', 'funder', 'business', 'project'].forEach(t => {
      typeCounts[t] = opps.filter(o => o.type === t).length;
    });

    const activeFilterCount = [filterType !== 'all', filterLoc, filterSector, filterStatus, filterValMin > 0, filterValMax > 0].filter(Boolean).length;

    main.innerHTML = `
      <div class="view-header">
        <h2>🔍 Browse Opportunities</h2>
        <span class="badge badge-primary">${filtered.length} results</span>
      </div>

      <div class="search-bar">
        <span class="search-icon">🔎</span>
        <input type="text" id="search-input" placeholder="Search opportunities, companies, sectors, locations…" value="${this._search || ''}"
          oninput="App._search=this.value; App.renderView()">
      </div>

      <div class="filter-bar">
        <button class="filter-btn ${filterType === 'all' ? 'active' : ''}" onclick="App.setFilter('all')">All (${typeCounts.all})</button>
        <button class="filter-btn ${filterType === 'lead' ? 'active' : ''}" onclick="App.setFilter('lead')">🔥 Leads (${typeCounts.lead})</button>
        <button class="filter-btn ${filterType === 'rfq' ? 'active' : ''}" onclick="App.setFilter('rfq')">📄 RFQs (${typeCounts.rfq})</button>
        <button class="filter-btn ${filterType === 'rfp' ? 'active' : ''}" onclick="App.setFilter('rfp')">📋 RFPs (${typeCounts.rfp})</button>
        <button class="filter-btn ${filterType === 'tender' ? 'active' : ''}" onclick="App.setFilter('tender')">🏗️ Tenders (${typeCounts.tender})</button>
        <button class="filter-btn ${filterType === 'funder' ? 'active' : ''}" onclick="App.setFilter('funder')">💰 Funders (${typeCounts.funder})</button>
        <button class="filter-btn ${filterType === 'business' ? 'active' : ''}" onclick="App.setFilter('business')">🤝 Business (${typeCounts.business})</button>
        <button class="filter-btn ${filterType === 'project' ? 'active' : ''}" onclick="App.setFilter('project')">📋 Projects (${typeCounts.project})</button>
      </div>

      <div class="filter-toolbar">
        <button class="filter-toggle-btn ${showFilters ? 'active' : ''}" onclick="App.toggleFilters()">
          <span>⚙️</span> Filters ${activeFilterCount > 0 ? `<span class="badge badge-primary">${activeFilterCount}</span>` : ''}
        </button>
        <div class="sort-select-wrapper">
          <select class="sort-select" onchange="App._sortBy=this.value; App.renderView()">
            <option value="newest" ${sortBy === 'newest' ? 'selected' : ''}>📅 Newest</option>
            <option value="deadline" ${sortBy === 'deadline' ? 'selected' : ''}>⏰ Deadline</option>
            <option value="value_high" ${sortBy === 'value_high' ? 'selected' : ''}>💰 Value ↑</option>
            <option value="value_low" ${sortBy === 'value_low' ? 'selected' : ''}>💰 Value ↓</option>
          </select>
        </div>
      </div>

      ${showFilters ? `
        <div class="filter-panel">
          <div class="filter-group">
            <div class="filter-group-label">📍 Location</div>
            <div class="filter-pills">
              <button class="filter-pill ${!filterLoc ? 'active' : ''}" onclick="App._filterLocation=''; App.renderView()">All</button>
              ${locations.map(l => `
                <button class="filter-pill ${filterLoc === l ? 'active' : ''}" onclick="App._filterLocation='${l}'; App.renderView()">${l}</button>
              `).join('')}
            </div>
          </div>
          <div class="filter-group">
            <div class="filter-group-label">🏷️ Sector</div>
            <div class="filter-pills">
              <button class="filter-pill ${!filterSector ? 'active' : ''}" onclick="App._filterSector=''; App.renderView()">All</button>
              ${sectors.map(s => `
                <button class="filter-pill ${filterSector === s ? 'active' : ''}" onclick="App._filterSector='${s}'; App.renderView()">${s}</button>
              `).join('')}
            </div>
          </div>
          <div class="filter-group">
            <div class="filter-group-label">📊 Status</div>
            <div class="filter-pills">
              <button class="filter-pill ${!filterStatus ? 'active' : ''}" onclick="App._filterStatus=''; App.renderView()">All</button>
              ${statuses.map(s => `
                <button class="filter-pill ${filterStatus === s ? 'active' : ''}" onclick="App._filterStatus='${s}'; App.renderView()">${s}</button>
              `).join('')}
            </div>
          </div>
          <div class="filter-group">
            <div class="filter-group-label">💰 Value Range (ZAR)</div>
            <div class="filter-value-range">
              <input type="number" class="filter-value-input" placeholder="Min" value="${filterValMin > 0 ? filterValMin : ''}" oninput="App._filterValMin=this.value; App.renderView()">
              <span style="color: var(--text-muted);">—</span>
              <input type="number" class="filter-value-input" placeholder="Max" value="${filterValMax > 0 ? filterValMax : ''}" oninput="App._filterValMax=this.value; App.renderView()">
            </div>
          </div>
          ${activeFilterCount > 0 ? `
            <button class="btn btn-xs btn-outline btn-block" onclick="App.clearFilters()">✕ Clear All Filters</button>
          ` : ''}
        </div>
      ` : ''}

      ${filtered.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h2>No opportunities found</h2>
          <p>Try adjusting your filters or search terms</p>
          <button class="btn btn-outline" onclick="App.clearFilters()">Clear All Filters</button>
        </div>
      ` : filtered.map(o => this.oppCardHTML(o)).join('')}
    `;

    setTimeout(() => {
      const inp = document.getElementById('search-input');
      if (inp) inp.focus();
    }, 50);
  },

  setFilter(type) {
    this._filter = type;
    this.renderView();
  },

  toggleFilters() {
    this._showFilters = !this._showFilters;
    this.renderView();
  },

  clearFilters() {
    this._search = '';
    this._filter = 'all';
    this._filterLocation = '';
    this._filterSector = '';
    this._filterStatus = '';
    this._filterValMin = '';
    this._filterValMax = '';
    this._sortBy = 'newest';
    this.renderView();
  },

  oppCardHTML(o) {
    const isSaved = Storage.isSaved(o.id);
    const typeIcons = { lead: '🔥', rfq: '📄', rfp: '📋', tender: '🏗️', funder: '💰', business: '🤝', project: '📋' };
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
    const typeIcons = { lead: '🔥', rfq: '📄', rfp: '📋', tender: '🏗️', funder: '💰', business: '🤝', project: '📋' };

    App.showModal(`
      <div class="flex flex-between" style="margin-bottom: 0.75rem;">
        <span style="font-size: 2rem;">${opp.orgLogo}</span>
        <div class="flex gap-1">
          <button class="btn btn-sm ${isSaved ? 'btn-success' : 'btn-outline'}" onclick="App.toggleSaveDetail('${opp.id}')">
            ${isSaved ? '⭐ Saved' : '☆ Save'}
          </button>
          <button class="btn btn-sm btn-outline" onclick="App.shareByEmail('${opp.id}')">📧 Share</button>
        </div>
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

  shareByEmail(id) {
    const opp = Storage.getOpportunityById(id);
    if (!opp) return;
    const subj = encodeURIComponent(`Opportunity: ${opp.title}`);
    const body = encodeURIComponent(`Hi,\n\nI found this opportunity on Leads Connection:\n\n${opp.title}\n${opp.org} - ${this.fmtVal(opp.value)}\nLocation: ${opp.location}\nDeadline: ${new Date(opp.deadline).toLocaleDateString('en-ZA')}\n\nDescription: ${opp.description.substring(0, 200)}...\n\nCheck it out!`);
    window.open(`mailto:?subject=${subj}&body=${body}`, '_blank');
  },

  toggleSaveDetail(id) {
    const nowSaved = Storage.toggleSave(id);
    this.closeModal();
    this.showDetail(id);
    this.showToast(nowSaved ? '⭐' : '💔', nowSaved ? 'Opportunity saved!' : 'Removed from saved', nowSaved ? 'success' : 'info');
  },

  // ─── SUBMIT ───
  renderSubmit(main) {
    const sectors = ['Technology', 'Marketing', 'Infrastructure', 'Creative', 'Content Writing', 'Business Consulting', 'Funding', 'Franchising', 'Logistics', 'Renewable Energy', 'Education', 'Insurance', 'HR & Wellness', 'Security', 'Social Media', 'Administration', 'Corporate Services', 'Fintech', 'Other'];
    const types = [
      { value: 'lead', label: '🔥 Sales Lead' },
      { value: 'rfq', label: '📄 RFQ (Request for Quote)' },
      { value: 'rfp', label: '📋 RFP (Request for Proposal)' },
      { value: 'tender', label: '🏗️ Tender' },
      { value: 'funder', label: '💰 Funder / Grant' },
      { value: 'business', label: '🤝 Business Opportunity' },
    ];

    main.innerHTML = `
      <div class="view-header">
        <h2>➕ Submit Opportunity</h2>
      </div>
      <div class="card">
        <p class="text-muted" style="margin-bottom: 1rem;">Submit a new opportunity to share with the community. ${this.config?.requireApproval ? 'Your submission will be reviewed by an admin before it goes live.' : 'Your submission will be published immediately.'}</p>
        <form id="submit-form" onsubmit="App.handleSubmit(event)">
          <div class="form-row">
            <div class="form-group" style="flex: 2;">
              <label>Opportunity Title *</label>
              <input type="text" name="title" placeholder="e.g. Website Development for E-Commerce Platform" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label>Type *</label>
              <select name="type" required>
                ${types.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Organization *</label>
              <input type="text" name="org" placeholder="e.g. Takealot Group" required>
            </div>
            <div class="form-group">
              <label>Org Logo Emoji</label>
              <input type="text" name="orgLogo" placeholder="e.g. 🏦" value="🏢" maxlength="2" style="text-align:center;font-size:1.2rem;">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Location *</label>
              <input type="text" name="location" placeholder="e.g. Cape Town, Remote, National" required>
            </div>
            <div class="form-group">
              <label>Sector *</label>
              <select name="sector" required>
                ${sectors.map(s => `<option value="${s}">${s}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Estimated Value (ZAR) *</label>
              <input type="number" name="value" placeholder="e.g. 450000" min="0" required>
            </div>
            <div class="form-group">
              <label>Deadline *</label>
              <input type="date" name="deadline" required>
            </div>
          </div>
          <div class="form-group">
            <label>Description *</label>
            <textarea name="description" rows="4" placeholder="Describe the opportunity in detail…" required></textarea>
          </div>
          <div class="form-group">
            <label>Requirements (one per line)</label>
            <textarea name="requirements" rows="3" placeholder="e.g. 5+ years experience&#10;React/Angular&#10;E-commerce experience"></textarea>
          </div>
          <div style="margin: 1rem 0 0.5rem; padding: 0.75rem; background: var(--bg); border-radius: var(--radius-xs);">
            <strong style="font-size: 0.85rem;">📞 Contact Information</strong>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Contact Name *</label>
              <input type="text" name="contactName" placeholder="Full name" required>
            </div>
            <div class="form-group">
              <label>Contact Email *</label>
              <input type="email" name="contactEmail" placeholder="email@example.com" required>
            </div>
          </div>
          <div class="form-group">
            <label>Contact Phone</label>
            <input type="text" name="contactPhone" placeholder="+27 XX XXX XXXX">
          </div>
          <button type="submit" class="btn btn-primary btn-block" style="margin-top: 0.5rem;">Submit Opportunity</button>
        </form>
      </div>
    `;
  },

  handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const reqs = (fd.get('requirements') || '').split('\n').map(s => s.trim()).filter(Boolean);
    const sub = {
      title: fd.get('title'),
      type: fd.get('type'),
      org: fd.get('org'),
      orgLogo: fd.get('orgLogo') || '🏢',
      location: fd.get('location'),
      sector: fd.get('sector'),
      value: parseFloat(fd.get('value')) || 0,
      deadline: fd.get('deadline'),
      description: fd.get('description'),
      requirements: reqs.length ? reqs : ['General requirements apply'],
      contact: {
        name: fd.get('contactName'),
        email: fd.get('contactEmail'),
        phone: fd.get('contactPhone') || 'Not provided',
      },
    };
    Storage.addSubmission(sub);
    this.showToast('✅', this.config?.requireApproval ? 'Submitted for review!' : 'Published!', 'success');
    e.target.reset();
    if (!this.config?.requireApproval) this.navigate('browse');
  },

  // ─── PROFILE ───
  renderProfile(main) {
    const p = this.profile;
    const types = ['freelancer', 'business', 'startup'];

    main.innerHTML = `
      <div class="view-header">
        <h2>👤 My Profile</h2>
      </div>
      <div class="card">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
          <div style="font-size: 3rem; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; background: var(--bg); border-radius: 16px;">${p.avatar || '🧑‍💻'}</div>
          <div>
            <div style="font-weight: 700; font-size: 1.15rem;">${p.name || 'Your Name'}</div>
            <div class="text-muted" style="font-size: 0.85rem;">${p.email || ''} · ${types.find(t => t === p.businessType) || 'Freelancer'}</div>
          </div>
        </div>
        <form id="profile-form" onsubmit="App.saveProfile(event)">
          <div class="form-row">
            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" name="name" value="${p.name || ''}" required>
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input type="email" name="email" value="${p.email || ''}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Phone</label>
              <input type="text" name="phone" value="${p.phone || ''}" placeholder="+27 XX XXX XXXX">
            </div>
            <div class="form-group">
              <label>Location</label>
              <input type="text" name="location" value="${p.location || ''}" placeholder="e.g. Johannesburg">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>I am a…</label>
              <select name="businessType">
                <option value="freelancer" ${p.businessType === 'freelancer' ? 'selected' : ''}>Freelancer / Independent</option>
                <option value="business" ${p.businessType === 'business' ? 'selected' : ''}>Business / Agency</option>
                <option value="startup" ${p.businessType === 'startup' ? 'selected' : ''}>Startup</option>
              </select>
            </div>
            <div class="form-group">
              <label>Company Name (optional)</label>
              <input type="text" name="company" value="${p.company || ''}" placeholder="Your company name">
            </div>
          </div>
          <div class="form-group">
            <label>Website</label>
            <input type="url" name="website" value="${p.website || ''}" placeholder="https://yourwebsite.com">
          </div>
          <div class="form-group">
            <label>Bio / About You</label>
            <textarea name="bio" rows="3" placeholder="Tell others about yourself and what you do…">${p.bio || ''}</textarea>
          </div>
          <div class="form-group">
            <label>Skills / Services (comma separated)</label>
            <input type="text" name="skills" value="${(p.skills || []).join(', ')}" placeholder="Web Development, Graphic Design, Content Writing">
          </div>
          <div style="margin: 1rem 0 0.5rem; padding: 0.5rem 0; border-top: 1px solid var(--border);">
            <strong style="font-size: 0.85rem;">🌐 Social Links</strong>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>LinkedIn</label>
              <input type="url" name="socialLinkedin" value="${(p.social?.linkedin) || ''}" placeholder="https://linkedin.com/in/...">
            </div>
            <div class="form-group">
              <label>Twitter / X</label>
              <input type="url" name="socialTwitter" value="${(p.social?.twitter) || ''}" placeholder="https://twitter.com/...">
            </div>
          </div>
          <div class="form-group">
            <label>GitHub</label>
            <input type="url" name="socialGithub" value="${(p.social?.github) || ''}" placeholder="https://github.com/...">
          </div>
          <div style="margin: 1rem 0 0.5rem; padding: 0.5rem 0; border-top: 1px solid var(--border);">
            <strong style="font-size: 0.85rem;">🔔 Notification Preferences</strong>
          </div>
          <div class="flex flex-between" style="padding: 0.4rem 0;"><span style="font-size: 0.85rem;">Email notifications</span>
            <label class="toggle"><input type="checkbox" name="notifEmail" ${p.notifications?.email !== false ? 'checked' : ''}><span class="toggle-slider"></span></label>
          </div>
          <div class="flex flex-between" style="padding: 0.4rem 0;"><span style="font-size: 0.85rem;">Push notifications</span>
            <label class="toggle"><input type="checkbox" name="notifPush" ${p.notifications?.push !== false ? 'checked' : ''}><span class="toggle-slider"></span></label>
          </div>
          <div class="flex flex-between" style="padding: 0.4rem 0; margin-bottom: 0.5rem;"><span style="font-size: 0.85rem;">Weekly digest</span>
            <label class="toggle"><input type="checkbox" name="notifDigest" ${p.notifications?.weeklyDigest ? 'checked' : ''}><span class="toggle-slider"></span></label>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Save Profile</button>
        </form>
      </div>
      <div class="card">
        <strong style="display: block; margin-bottom: 0.75rem;">Appearance</strong>
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
    const social = {
      linkedin: fd.get('socialLinkedin') || '',
      twitter: fd.get('socialTwitter') || '',
      github: fd.get('socialGithub') || '',
    };
    const notifications = {
      email: fd.get('notifEmail') === 'on',
      push: fd.get('notifPush') === 'on',
      weeklyDigest: fd.get('notifDigest') === 'on',
    };
    this.profile = {
      ...this.profile,
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone') || '',
      location: fd.get('location') || '',
      businessType: fd.get('businessType'),
      company: fd.get('company') || '',
      website: fd.get('website') || '',
      bio: fd.get('bio') || '',
      skills: (fd.get('skills') || '').split(',').map(s => s.trim()).filter(Boolean),
      social,
      notifications,
    };
    Storage.saveProfile(this.profile);
    this.showToast('✅', 'Profile saved successfully', 'success');
  },

  // ─── MORE ───
  renderMore(main) {
    const subs = Storage.getSubmissions();
    const pendingCount = subs.filter(s => s.status === 'pending').length;

    const items = [
      { view: 'profile', icon: '👤', label: 'My Profile', desc: 'Manage your profile, skills, and preferences' },
      { view: 'submit', icon: '➕', label: 'Submit Opportunity', desc: 'Share a new opportunity with the community' },
      { view: 'dashboard', icon: '📊', label: 'Dashboard', desc: 'View stats and recent opportunities' },
      { view: 'admin', icon: '🛡️', label: 'Admin Panel', desc: `Manage the platform ${pendingCount > 0 ? `· ${pendingCount} pending` : ''}`, badge: pendingCount > 0 ? pendingCount : 0 },
    ];
    main.innerHTML = `
      <div class="view-header">
        <h2>⚙️ More</h2>
      </div>
      ${items.map(item => `
        <div class="card link-card" onclick="App.navigate('${item.view}')">
          <div class="flex gap-1" style="align-items: center;">
            <span style="font-size: 2rem;">${item.icon}</span>
            <div style="flex: 1;">
              <strong>${item.label}</strong>
              <div class="text-muted" style="font-size: 0.85rem;">${item.desc}</div>
            </div>
            ${item.badge ? `<span class="badge badge-danger">${item.badge}</span>` : ''}
            <span style="color: var(--text-muted);">→</span>
          </div>
        </div>
      `).join('')}
    `;
  },

  // ─── ADMIN ───
  renderAdmin(main) {
    const opps = Storage.getOpportunities();
    const subs = Storage.getSubmissions();
    const users = Storage.getUsers();
    const cats = Storage.getCategories();
    const pending = subs.filter(s => s.status === 'pending').length;
    const approved = subs.filter(s => s.status === 'approved').length;
    const totalVal = opps.reduce((s, o) => s + o.value, 0);

    main.innerHTML = `
      <div class="view-header">
        <h2>🛡️ Admin Panel</h2>
        <div class="view-actions">
          <button class="btn btn-sm btn-outline" onclick="App.adminLogout()">🔒 Logout</button>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-label">Total Opportunities</div><div class="stat-value">${opps.length}</div></div>
        <div class="stat-card"><div class="stat-icon">⏳</div><div class="stat-label">Pending Review</div><div class="stat-value text-warning">${pending}</div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-label">Approved</div><div class="stat-value text-success">${approved}</div></div>
        <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Users</div><div class="stat-value">${users.length}</div></div>
      </div>

      <div class="two-col">
        <div class="card">
          <div class="card-header"><strong>📂 Categories</strong><span class="badge badge-primary">${cats.length}</span></div>
          ${cats.map(c => `<div class="flex flex-between" style="padding: 0.35rem 0; font-size: 0.85rem;"><span>${c.icon} ${c.name}</span><span class="text-muted">${c.count} items</span></div>`).join('')}
        </div>
        <div class="card">
          <div class="card-header"><strong>💰 Value Summary</strong></div>
          <div class="flex flex-between" style="padding: 0.35rem 0; font-size: 0.85rem;"><span>Total Value</span><span style="font-weight: 700;">${this.fmtVal(totalVal)}</span></div>
          <div class="flex flex-between" style="padding: 0.35rem 0; font-size: 0.85rem;"><span>Average Value</span><span style="font-weight: 600;">${this.fmtVal(Math.round(totalVal / opps.length))}</span></div>
          <div class="flex flex-between" style="padding: 0.35rem 0; font-size: 0.85rem;"><span>Highest Value</span><span style="font-weight: 600;">${this.fmtVal(Math.max(...opps.map(o => o.value)))}</span></div>
        </div>
      </div>

      <div class="admin-menu-grid">
        <div class="card admin-menu-card" onclick="App.navigate('admin-opps')">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
          <strong>Manage Opportunities</strong>
          <div class="text-muted" style="font-size: 0.78rem;">View, edit, delete all opportunities</div>
        </div>
        <div class="card admin-menu-card" onclick="App.navigate('admin-submissions')">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">⏳</div>
          <strong>Pending Submissions</strong>
          <div class="text-muted" style="font-size: 0.78rem;">${pending} submissions awaiting review</div>
        </div>
        <div class="card admin-menu-card" onclick="App.navigate('admin-users')">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">👥</div>
          <strong>Manage Users</strong>
          <div class="text-muted" style="font-size: 0.78rem;">${users.length} registered users</div>
        </div>
        <div class="card admin-menu-card" onclick="App.navigate('admin-categories')">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏷️</div>
          <strong>Categories</strong>
          <div class="text-muted" style="font-size: 0.78rem;">${cats.length} categories configured</div>
        </div>
        <div class="card admin-menu-card" onclick="App.navigate('admin-settings')">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚙️</div>
          <strong>Settings</strong>
          <div class="text-muted" style="font-size: 0.78rem;">Platform configuration & data management</div>
        </div>
      </div>
    `;
  },

  // ─── ADMIN: OPPORTUNITIES ───
  renderAdminOpps(main) {
    const opps = Storage.getOpportunities();
    const searchQ = (this._adminSearch || '').toLowerCase();
    let filtered = opps;
    if (searchQ) filtered = filtered.filter(o =>
      o.title.toLowerCase().includes(searchQ) || o.org.toLowerCase().includes(searchQ)
    );

    main.innerHTML = `
      <div class="view-header">
        <button class="btn btn-sm btn-outline" onclick="App.navigate('admin')">← Back</button>
        <h2>📋 All Opportunities</h2>
        <span class="badge badge-primary">${filtered.length}</span>
      </div>
      <div class="search-bar">
        <span class="search-icon">🔎</span>
        <input type="text" placeholder="Search opportunities…" value="${this._adminSearch || ''}"
          oninput="App._adminSearch=this.value; App.renderView()">
      </div>
      ${filtered.map(o => `
        <div class="opp-card" style="border-left: 4px solid var(--primary);">
          <div class="flex flex-between" style="align-items: flex-start;">
            <div style="flex: 1; min-width: 0;" onclick="App.showDetail('${o.id}')">
              <div class="opp-title">${o.title}</div>
              <div class="opp-org">${o.org} · ${this.typeLabel(o.type)} · ${this.fmtVal(o.value)}</div>
              <div class="opp-meta">
                <span class="badge ${o.status === 'hot' ? 'badge-danger' : o.status === 'new' ? 'badge-success' : 'badge-primary'}">${o.status}</span>
                <span>📅 ${this.timeAgo(o.posted)}</span>
              </div>
            </div>
            <div class="flex gap-1">
              <button class="btn btn-xs btn-outline" onclick="event.stopPropagation(); App.editOpportunity('${o.id}')">✏️</button>
              <button class="btn btn-xs btn-danger" onclick="event.stopPropagation(); App.deleteOpportunity('${o.id}')">🗑️</button>
            </div>
          </div>
        </div>
      `).join('')}
    `;
  },

  deleteOpportunity(id) {
    const opp = Storage.getOpportunityById(id);
    if (!opp) return;
    if (!this.confirmDialog(`Delete "${opp.title}"? This cannot be undone.`)) return;
    Storage.deleteOpportunity(id);
    this.showToast('🗑️', 'Opportunity deleted', 'info');
    this.renderView();
  },

  editOpportunity(id) {
    const opp = Storage.getOpportunityById(id);
    if (!opp) return;
    this.showModal(`
      <h2>✏️ Edit Opportunity</h2>
      <form id="edit-opp-form" onsubmit="App.saveEditOpportunity(event, '${id}')">
        <div class="form-group"><label>Title</label><input type="text" name="title" value="${opp.title.replace(/"/g, '&quot;')}" required></div>
        <div class="form-row">
          <div class="form-group"><label>Organization</label><input type="text" name="org" value="${opp.org}" required></div>
          <div class="form-group"><label>Location</label><input type="text" name="location" value="${opp.location}" required></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Value (ZAR)</label><input type="number" name="value" value="${opp.value}" required></div>
          <div class="form-group"><label>Status</label>
            <select name="status">
              <option value="open" ${opp.status === 'open' ? 'selected' : ''}>Open</option>
              <option value="new" ${opp.status === 'new' ? 'selected' : ''}>New</option>
              <option value="hot" ${opp.status === 'hot' ? 'selected' : ''}>Hot</option>
              <option value="closed" ${opp.status === 'closed' ? 'selected' : ''}>Closed</option>
            </select>
          </div>
        </div>
        <div class="form-group"><label>Deadline</label><input type="date" name="deadline" value="${opp.deadline}" required></div>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `);
  },

  saveEditOpportunity(e, id) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const opp = Storage.getOpportunityById(id);
    if (!opp) return;
    opp.title = fd.get('title');
    opp.org = fd.get('org');
    opp.location = fd.get('location');
    opp.value = parseFloat(fd.get('value')) || 0;
    opp.status = fd.get('status');
    opp.deadline = fd.get('deadline');
    Storage.saveOpportunity(opp);
    this.closeModal();
    this.showToast('✅', 'Opportunity updated', 'success');
    this.renderView();
  },

  // ─── ADMIN: SUBMISSIONS ───
  renderAdminSubmissions(main) {
    const subs = Storage.getSubmissions();

    main.innerHTML = `
      <div class="view-header">
        <button class="btn btn-sm btn-outline" onclick="App.navigate('admin')">← Back</button>
        <h2>⏳ Pending Submissions</h2>
        <span class="badge badge-primary">${subs.length}</span>
      </div>
      ${subs.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h2>No submissions yet</h2>
          <p>User-submitted opportunities will appear here</p>
        </div>
      ` : subs.map(s => `
        <div class="opp-card" style="border-left: 4px solid ${s.status === 'pending' ? 'var(--warning)' : s.status === 'approved' ? 'var(--success)' : 'var(--danger)'};">
          <div class="flex flex-between" style="align-items: flex-start;">
            <div style="flex: 1; min-width: 0;">
              <div class="opp-title">${s.title}</div>
              <div class="opp-org">${s.org} · ${this.typeLabel(s.type)} · ${this.fmtVal(s.value)}</div>
              <div class="opp-meta">
                <span class="badge ${s.status === 'pending' ? 'badge-warning' : s.status === 'approved' ? 'badge-success' : 'badge-danger'}">${s.status}</span>
                <span>📅 ${this.timeAgo(s.submittedAt)}</span>
                <span>📧 ${s.contact?.email}</span>
              </div>
            </div>
            <div class="flex gap-1">
              ${s.status === 'pending' ? `
                <button class="btn btn-xs btn-success" onclick="App.approveSubmission('${s.id}')">✅ Approve</button>
                <button class="btn btn-xs btn-danger" onclick="App.rejectSubmission('${s.id}')">❌ Reject</button>
              ` : ''}
              <button class="btn btn-xs btn-outline" onclick="App.deleteSubmission('${s.id}')">🗑️</button>
            </div>
          </div>
        </div>
      `).join('')}
    `;
  },

  approveSubmission(id) {
    const opp = Storage.approveSubmission(id);
    if (opp) {
      this.showToast('✅', `"${opp.title}" approved and published`, 'success');
      this.renderView();
    }
  },

  rejectSubmission(id) {
    const sub = Storage.rejectSubmission(id);
    if (sub) {
      this.showToast('❌', `"${sub.title}" rejected`, 'info');
      this.renderView();
    }
  },

  deleteSubmission(id) {
    if (!this.confirmDialog('Delete this submission?')) return;
    Storage.deleteSubmission(id);
    this.showToast('🗑️', 'Submission deleted', 'info');
    this.renderView();
  },

  // ─── ADMIN: USERS ───
  renderAdminUsers(main) {
    const users = Storage.getUsers();

    main.innerHTML = `
      <div class="view-header">
        <button class="btn btn-sm btn-outline" onclick="App.navigate('admin')">← Back</button>
        <h2>👥 Users</h2>
        <span class="badge badge-primary">${users.length}</span>
      </div>
      <div class="card">
        ${users.map(u => `
          <div class="flex flex-between" style="padding: 0.6rem 0; border-bottom: 1px solid var(--border-light); align-items: center;">
            <div class="flex gap-1" style="align-items: center;">
              <span style="font-size: 1.5rem;">${u.avatar || '👤'}</span>
              <div>
                <div style="font-weight: 600; font-size: 0.9rem;">${u.name}</div>
                <div class="text-muted" style="font-size: 0.78rem;">${u.email} · ${u.role} · Joined ${this.timeAgo(u.joined)}</div>
              </div>
            </div>
            <div class="flex gap-1">
              <span class="badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}">${u.status}</span>
              <button class="btn btn-xs btn-outline" onclick="App.toggleUserStatus('${u.id}')">${u.status === 'active' ? '🔒' : '🔓'}</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  toggleUserStatus(id) {
    const users = Storage.getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return;
    user.status = user.status === 'active' ? 'suspended' : 'active';
    Storage.saveUser(user);
    this.showToast('🔄', `${user.name} ${user.status === 'active' ? 'activated' : 'suspended'}`, 'info');
    this.renderView();
  },

  // ─── ADMIN: CATEGORIES ───
  renderAdminCategories(main) {
    const cats = Storage.getCategories();

    main.innerHTML = `
      <div class="view-header">
        <button class="btn btn-sm btn-outline" onclick="App.navigate('admin')">← Back</button>
        <h2>🏷️ Categories</h2>
        <span class="badge badge-primary">${cats.length}</span>
      </div>
      ${cats.map(c => `
        <div class="card">
          <div class="flex flex-between" style="align-items: center;">
            <div class="flex gap-1" style="align-items: center;">
              <span style="font-size: 1.5rem;">${c.icon}</span>
              <div>
                <strong>${c.name}</strong>
                <div class="text-muted" style="font-size: 0.78rem;">Type: ${c.type} · ${c.count} items</div>
              </div>
            </div>
            <button class="btn btn-xs btn-outline" onclick="App.editCategory('${c.id}')">✏️</button>
          </div>
        </div>
      `).join('')}
      <button class="btn btn-outline btn-block" onclick="App.addCategory()">+ Add Category</button>
    `;
  },

  editCategory(id) {
    const cats = Storage.getCategories();
    const cat = cats.find(c => c.id === id);
    if (!cat) return;
    this.showModal(`
      <h2>✏️ Edit Category</h2>
      <form onsubmit="App.saveCategory(event, '${id}')">
        <div class="form-group"><label>Name</label><input type="text" name="name" value="${cat.name}" required></div>
        <div class="form-group"><label>Type key</label><input type="text" name="type" value="${cat.type}" required></div>
        <div class="form-group"><label>Icon emoji</label><input type="text" name="icon" value="${cat.icon}" maxlength="2" style="text-align:center;font-size:1.2rem;"></div>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    `);
  },

  saveCategory(e, id) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const cats = Storage.getCategories();
    const cat = cats.find(c => c.id === id);
    if (!cat) return;
    cat.name = fd.get('name');
    cat.type = fd.get('type');
    cat.icon = fd.get('icon');
    Storage.saveCategory(cat);
    this.closeModal();
    this.showToast('✅', 'Category updated', 'success');
    this.renderView();
  },

  addCategory() {
    this.showModal(`
      <h2>➕ New Category</h2>
      <form onsubmit="App.addCategorySubmit(event)">
        <div class="form-group"><label>Name</label><input type="text" name="name" placeholder="e.g. Grants" required></div>
        <div class="form-group"><label>Type key</label><input type="text" name="type" placeholder="e.g. grant" required></div>
        <div class="form-group"><label>Icon emoji</label><input type="text" name="icon" placeholder="🎁" maxlength="2" style="text-align:center;font-size:1.2rem;"></div>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Add</button>
        </div>
      </form>
    `);
  },

  addCategorySubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const cat = { id: 'cat_' + Date.now(), name: fd.get('name'), type: fd.get('type'), icon: fd.get('icon'), count: 0 };
    Storage.saveCategory(cat);
    this.closeModal();
    this.showToast('✅', 'Category added', 'success');
    this.renderView();
  },

  // ─── ADMIN: SETTINGS ───
  renderAdminSettings(main) {
    const cfg = this.config;

    main.innerHTML = `
      <div class="view-header">
        <button class="btn btn-sm btn-outline" onclick="App.navigate('admin')">← Back</button>
        <h2>⚙️ Settings</h2>
      </div>
      <div class="card">
        <strong style="display: block; margin-bottom: 1rem;">Platform Configuration</strong>
        <form id="settings-form" onsubmit="App.saveSettings(event)">
          <div class="form-group"><label>App Name</label><input type="text" name="appName" value="${cfg.appName || 'Leads Connection'}" required></div>
          <div class="form-group"><label>Contact Email</label><input type="email" name="contactEmail" value="${cfg.contactEmail || ''}"></div>
          <div class="form-group"><label>Items Per Page</label><input type="number" name="itemsPerPage" value="${cfg.itemsPerPage || 20}" min="5" max="100"></div>
          <div class="flex flex-between" style="padding: 0.5rem 0;"><span style="font-size: 0.85rem;">Allow Submissions</span>
            <label class="toggle"><input type="checkbox" name="allowSubmissions" ${cfg.allowSubmissions !== false ? 'checked' : ''}><span class="toggle-slider"></span></label>
          </div>
          <div class="flex flex-between" style="padding: 0.5rem 0; margin-bottom: 0.5rem;"><span style="font-size: 0.85rem;">Require Approval for Submissions</span>
            <label class="toggle"><input type="checkbox" name="requireApproval" ${cfg.requireApproval !== false ? 'checked' : ''}><span class="toggle-slider"></span></label>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Save Settings</button>
        </form>
      </div>
      <div class="card">
        <strong style="display: block; margin-bottom: 0.5rem;">Data Management</strong>
        <p class="text-muted" style="font-size: 0.82rem; margin-bottom: 1rem;">Export or reset all application data.</p>
        <div class="flex gap-1">
          <button class="btn btn-outline" onclick="App.exportData()" style="flex: 1;">📤 Export Data</button>
          <button class="btn btn-danger" onclick="App.resetData()" style="flex: 1;">🔄 Reset All Data</button>
        </div>
      </div>
      <div class="card">
        <div class="flex flex-between">
          <div><strong>Version</strong><div class="text-muted" style="font-size: 0.78rem;">Leads Connection v2.0</div></div>
          <span class="badge badge-success">Running</span>
        </div>
      </div>
    `;
  },

  saveSettings(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    this.config = {
      appName: fd.get('appName'),
      contactEmail: fd.get('contactEmail'),
      itemsPerPage: parseInt(fd.get('itemsPerPage')) || 20,
      allowSubmissions: fd.get('allowSubmissions') === 'on',
      requireApproval: fd.get('requireApproval') === 'on',
    };
    Storage.saveConfig(this.config);
    this.renderNav();
    this.showToast('✅', 'Settings saved', 'success');
  },

  exportData() {
    const data = Storage.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-connection-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('📤', 'Data exported successfully', 'success');
  },

  resetData() {
    if (!this.confirmDialog('⚠️ This will permanently delete ALL data! Are you sure?')) return;
    if (!this.confirmDialog('This cannot be undone. Type "confirm" to proceed.')) return;
    Storage.resetAll();
    this.profile = Storage.getProfile();
    this.config = Storage.getConfig();
    this.showToast('🔄', 'All data has been reset', 'warning');
    this.render();
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
    const labels = { lead: 'Sales Lead', rfq: 'RFQ', rfp: 'RFP', tender: 'Tender', funder: 'Funder', business: 'Business Opp', project: 'Project' };
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
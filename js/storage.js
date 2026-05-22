const Storage = {
  prefix: 'lc_',

  get(key) {
    try { return JSON.parse(localStorage.getItem(this.prefix + key)); } catch { return null; }
  },

  set(key, data) {
    localStorage.setItem(this.prefix + key, JSON.stringify(data));
  },

  seed() {
    if (!this.get('seeded')) {
      this.set('opportunities', SEED.opportunities);
      this.set('savedOpps', []);
      this.set('submissions', []);
      this.set('users', SEED.users);
      this.set('categories', SEED.categories);
      this.set('config', SEED.config);
      this.set('profile', { name: 'Thando Hlomuka', email: 'thando@example.com', phone: '+27 82 123 4567', businessType: 'freelancer', company: '', location: 'Johannesburg', website: '', bio: 'Experienced freelancer specializing in web development, graphic design, and content writing.', skills: ['Web Development', 'Graphic Design', 'Content Writing'], social: { linkedin: '', twitter: '', github: '' }, avatar: '🧑‍💻', notifications: { email: true, push: true, weeklyDigest: false } });
      this.set('seeded', true);
    }
  },

  // ── Opportunities ──
  getOpportunities() {
    return this.get('opportunities') || SEED.opportunities;
  },

  saveOpportunity(opp) {
    const opps = this.getOpportunities();
    const idx = opps.findIndex(o => o.id === opp.id);
    if (idx >= 0) { opps[idx] = opp; } else { opps.unshift(opp); }
    this.set('opportunities', opps);
  },

  deleteOpportunity(id) {
    const opps = this.getOpportunities().filter(o => o.id !== id);
    this.set('opportunities', opps);
  },

  getOpportunityById(id) {
    return this.getOpportunities().find(o => o.id === id) || null;
  },

  // ── Saved ──
  getSaved() { return this.get('savedOpps') || []; },

  toggleSave(oppId) {
    const saved = this.getSaved();
    const idx = saved.indexOf(oppId);
    if (idx >= 0) { saved.splice(idx, 1); return false; }
    else { saved.push(oppId); return true; }
  },

  isSaved(oppId) { return this.getSaved().includes(oppId); },

  // ── Submissions ──
  getSubmissions() { return this.get('submissions') || []; },

  addSubmission(sub) {
    const subs = this.getSubmissions();
    sub.id = 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    sub.submittedAt = new Date().toISOString();
    sub.status = 'pending';
    subs.unshift(sub);
    this.set('submissions', subs);
    return sub;
  },

  approveSubmission(id) {
    const subs = this.getSubmissions();
    const sub = subs.find(s => s.id === id);
    if (!sub) return null;
    sub.status = 'approved';
    this.set('submissions', subs);
    const opp = { ...sub, posted: new Date().toISOString().split('T')[0], status: 'new' };
    delete opp.submittedAt; delete opp.id; delete opp.status;
    opp.id = 'opp_' + Date.now();
    this.saveOpportunity(opp);
    return opp;
  },

  rejectSubmission(id) {
    const subs = this.getSubmissions();
    const sub = subs.find(s => s.id === id);
    if (!sub) return null;
    sub.status = 'rejected';
    this.set('submissions', subs);
    return sub;
  },

  deleteSubmission(id) {
    this.set('submissions', this.getSubmissions().filter(s => s.id !== id));
  },

  // ── Profile ──
  getProfile() {
    return this.get('profile') || { name: 'User', email: '', businessType: 'freelancer', skills: [] };
  },

  saveProfile(p) {
    this.set('profile', p);
  },

  // ── Users (admin) ──
  getUsers() { return this.get('users') || []; },

  saveUser(user) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) { users[idx] = user; } else { users.push(user); }
    this.set('users', users);
  },

  deleteUser(id) {
    this.set('users', this.getUsers().filter(u => u.id !== id));
  },

  // ── Categories ──
  getCategories() { return this.get('categories') || []; },

  saveCategory(cat) {
    const cats = this.getCategories();
    const idx = cats.findIndex(c => c.id === cat.id);
    if (idx >= 0) { cats[idx] = cat; } else { cats.push(cat); }
    this.set('categories', cats);
  },

  deleteCategory(id) {
    this.set('categories', this.getCategories().filter(c => c.id !== id));
  },

  // ── Config ──
  getConfig() { return this.get('config') || SEED.config; },

  saveConfig(cfg) {
    this.set('config', cfg);
  },

  // ── Export / Reset ──
  exportData() {
    return {
      opportunities: this.getOpportunities(),
      submissions: this.getSubmissions(),
      users: this.getUsers(),
      categories: this.getCategories(),
      config: this.getConfig(),
      saved: this.getSaved(),
      exportedAt: new Date().toISOString(),
    };
  },

  importData(data) {
    if (data.opportunities) this.set('opportunities', data.opportunities);
    if (data.submissions) this.set('submissions', data.submissions);
    if (data.users) this.set('users', data.users);
    if (data.categories) this.set('categories', data.categories);
    if (data.config) this.set('config', data.config);
    if (data.saved) this.set('savedOpps', data.saved);
  },

  resetAll() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
    keys.forEach(k => localStorage.removeItem(k));
    this.seed();
  },
};
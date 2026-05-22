const Storage = {
  prefix: 'lc_',

  get(key) {
    try { return JSON.parse(localStorage.getItem(this.prefix + key)); } catch { return null; }
  },

  set(key, data) {
    localStorage.setItem(this.prefix + key, JSON.stringify(data));
  },

  getOpportunities() {
    return this.get('opportunities') || SEED.opportunities;
  },

  seed() {
    if (!this.get('seeded')) {
      this.set('opportunities', SEED.opportunities);
      this.set('savedOpps', []);
      this.set('profile', { name: 'Thando Hlomuka', email: 'thando@example.com', businessType: 'freelancer', skills: ['Web Development', 'Graphic Design', 'Content Writing'] });
      this.set('seeded', true);
    }
  },

  saveOpportunity(opp) {
    const opps = this.getOpportunities();
    const idx = opps.findIndex(o => o.id === opp.id);
    if (idx >= 0) { opps[idx] = opp; } else { opps.push(opp); }
    this.set('opportunities', opps);
  },

  getSaved() {
    return this.get('savedOpps') || [];
  },

  toggleSave(oppId) {
    const saved = this.getSaved();
    const idx = saved.indexOf(oppId);
    if (idx >= 0) { saved.splice(idx, 1); return false; }
    else { saved.push(oppId); return true; }
  },

  isSaved(oppId) {
    return this.getSaved().includes(oppId);
  },

  getProfile() {
    return this.get('profile') || { name: 'User', email: '', businessType: 'freelancer', skills: [] };
  },

  saveProfile(p) {
    this.set('profile', p);
  },
};
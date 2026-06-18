/* ===== The Moon Estate — data layer =====
   One small API (Store) used by the app. Talks to Supabase when
   configured in config.js, otherwise falls back to localStorage.
   Shape stored: { id, data:<listing>, created_at }. */
(function () {
  'use strict';

  var LS_KEY = 'tme_listings_v1';
  var LS_LEADS = 'tme_leads_v1';
  var localAuthed = false;
  var cfg = window.TME_CONFIG || {};
  var hasSupa = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    window.supabase && window.supabase.createClient);
  var client = hasSupa ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

  /* ---------- Imaginary seed listings ---------- */
  var SEED = [
    { id: 's1', listingType: 'sale', ptype: 'Residential Plot', title: '200 Sq.Yd Corner Plot on GT Road', bhk: '', bath: '', furnish: '', area: 200, areaUnit: 'Sq. Yd.', price: 2800000, city: 'Etah', locality: 'Vidya Vihar Colony, GT Road', address: 'Near Mandi Samiti, GT Road, Etah 207001', desc: 'Prime corner residential plot on the GT Road growth corridor. Clear title, 30ft road, ready for registry. Walking distance to market and school.', owner: 'The Moon Estate', phone: '9719910070', email: 'sales@themoonestate.in', postedBy: 'Builder', images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80'], ts: Date.now() - 864e5 * 2 },
    { id: 's2', listingType: 'sale', ptype: 'Independent House / Villa', title: '3 BHK Independent Villa with Garden', bhk: '3', bath: '3', furnish: 'Semi-Furnished', area: 1800, areaUnit: 'Sq. Ft.', price: 6500000, city: 'Aligarh', locality: 'Ramghat Road', address: 'Sector 4, Ramghat Road, Aligarh 202001', desc: 'Spacious 3 BHK villa with private garden, modular kitchen, car parking and 24x7 water supply in a gated community.', owner: 'Rajeev Sharma', phone: '9876543210', email: 'rajeev@example.com', postedBy: 'Owner', images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80'], ts: Date.now() - 864e5 * 5 },
    { id: 's3', listingType: 'sale', ptype: 'Apartment / Flat', title: '2 BHK Ready-to-Move Flat', bhk: '2', bath: '2', furnish: 'Unfurnished', area: 1050, areaUnit: 'Sq. Ft.', price: 3900000, city: 'Agra', locality: 'Kamla Nagar', address: 'Tower B, Kamla Nagar, Agra 282005', desc: 'Bright 2 BHK on the 4th floor with lift, covered parking and power backup. Close to schools and the bypass.', owner: 'Sunita Verma', phone: '9001122334', email: 'sunita@example.com', postedBy: 'Owner', images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80'], ts: Date.now() - 864e5 * 1 },
    { id: 's4', listingType: 'sale', ptype: 'Agricultural Land', title: '1 Acre Agricultural Land near Highway', bhk: '', bath: '', furnish: '', area: 1, areaUnit: 'Acre', price: 4500000, city: 'Etah', locality: 'Shitalpur', address: 'Shitalpur, off GT Road, Etah 207001', desc: 'Fertile 1-acre farmland with tube-well and road access. Ideal for farmhouse or future investment.', owner: 'Mahesh Yadav', phone: '9123456780', email: 'mahesh@example.com', postedBy: 'Agent / Dealer', images: ['https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80'], ts: Date.now() - 864e5 * 8 },
    { id: 'r1', listingType: 'rent', ptype: 'Apartment / Flat', title: '2 BHK Semi-Furnished Flat for Rent', bhk: '2', bath: '2', furnish: 'Semi-Furnished', area: 950, areaUnit: 'Sq. Ft.', rent: 12000, deposit: 50000, availFrom: '', tenants: 'Family', city: 'Etah', locality: 'Civil Lines', address: 'Civil Lines, Etah 207001', desc: 'Well-maintained 2 BHK with wardrobes, geyser and covered parking. Family preferred. Market and bus stand nearby.', owner: 'Anil Gupta', phone: '9988776655', email: 'anil@example.com', postedBy: 'Owner', images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'], ts: Date.now() - 864e5 * 3 },
    { id: 'r2', listingType: 'rent', ptype: 'Independent House / Villa', title: '3 BHK House for Rent with Parking', bhk: '3', bath: '3', furnish: 'Fully Furnished', area: 1600, areaUnit: 'Sq. Ft.', rent: 22000, deposit: 100000, availFrom: '', tenants: 'Anyone', city: 'Aligarh', locality: 'Marris Road', address: 'Marris Road, Aligarh 202001', desc: 'Fully furnished independent house with 2 car parking, modular kitchen and inverter backup. Prime location.', owner: 'Pooja Singh', phone: '9090909090', email: 'pooja@example.com', postedBy: 'Owner', images: ['https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=900&q=80'], ts: Date.now() - 864e5 * 4 },
    { id: 'r3', listingType: 'rent', ptype: 'Commercial / Shop', title: 'Shop / Showroom for Rent on Main Road', bhk: '', bath: '1', furnish: 'Unfurnished', area: 400, areaUnit: 'Sq. Ft.', rent: 18000, deposit: 90000, availFrom: '', tenants: 'Company / Lease', city: 'Agra', locality: 'Sanjay Place', address: 'Sanjay Place, Agra 282002', desc: 'Ground-floor commercial shop with glass front on a busy main road. High footfall, ideal for retail or office.', owner: 'Imran Khan', phone: '9811122233', email: 'imran@example.com', postedBy: 'Agent / Dealer', images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80'], ts: Date.now() - 864e5 * 6 }
  ];

  /* ---------- localStorage helpers ---------- */
  function localList() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) { localStorage.setItem(LS_KEY, JSON.stringify(SEED)); return SEED.slice(); }
      return JSON.parse(raw);
    } catch (e) { return SEED.slice(); }
  }
  function localSave(list) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); return true; }
    catch (e) { return false; }
  }
  function localLeads() {
    try { return JSON.parse(localStorage.getItem(LS_LEADS)) || []; } catch (e) { return []; }
  }
  function localLeadsSave(list) {
    try { localStorage.setItem(LS_LEADS, JSON.stringify(list)); return true; } catch (e) { return false; }
  }

  /* ---------- Public API ---------- */
  var Store = {
    mode: client ? 'supabase' : 'local',
    SEED: SEED,

    // make sure a fresh Supabase project has the sample data
    seedIfEmpty: async function () {
      // On a LIVE Supabase database we never auto-insert sample data — the
      // business shows real listings only. Auto-seed applies to local demo.
      if (!client) { localList(); return; }
    },

    list: async function () {
      if (!client) return localList();
      var res = await client.from('listings').select('id,data,created_at').order('created_at', { ascending: false });
      if (res.error) throw res.error;
      return (res.data || []).map(function (r) { return r.data; });
    },

    add: async function (listing) {
      if (!client) {
        var list = localList(); list.unshift(listing);
        if (!localSave(list)) throw new Error('Browser storage is full — try fewer or smaller photos.');
        return listing;
      }
      var res = await client.from('listings').insert({ id: listing.id, data: listing });
      if (res.error) throw res.error;
      return listing;
    },

    remove: async function (id) {
      if (!client) {
        var list = localList().filter(function (x) { return x.id !== id; });
        localSave(list); return;
      }
      var res = await client.from('listings').delete().eq('id', id);
      if (res.error) throw res.error;
    },

    /* ---------- Admin authentication ---------- */
    signIn: async function (email, password) {
      if (!client) {
        // local demo mode: accept the passcode in the password field
        if (password === (cfg.ADMIN_PASSCODE || 'moon-admin')) { localAuthed = true; return { email: 'admin (local)' }; }
        throw new Error('Incorrect passcode.');
      }
      var res = await client.auth.signInWithPassword({ email: email, password: password });
      if (res.error) throw res.error;
      return res.data.user;
    },
    signOut: async function () {
      if (!client) { localAuthed = false; return; }
      await client.auth.signOut();
    },
    currentUser: async function () {
      if (!client) return localAuthed ? { email: 'admin (local)' } : null;
      var res = await client.auth.getSession();
      return (res.data && res.data.session) ? res.data.session.user : null;
    },

    /* ---------- Leads (buyer enquiries) ---------- */
    addLead: async function (lead) {
      if (!client) { var l = localLeads(); l.unshift(lead); localLeadsSave(l); return lead; }
      var res = await client.from('leads').insert({ id: lead.id, data: lead });
      if (res.error) throw res.error;
      return lead;
    },
    listLeads: async function () {
      if (!client) return localLeads();
      var res = await client.from('leads').select('id,data,created_at').order('created_at', { ascending: false });
      if (res.error) throw res.error;
      return (res.data || []).map(function (r) { return r.data; });
    },
    removeLead: async function (id) {
      if (!client) { localLeadsSave(localLeads().filter(function (x) { return x.id !== id; })); return; }
      var res = await client.from('leads').delete().eq('id', id);
      if (res.error) throw res.error;
    }
  };

  window.Store = Store;
})();

/* ===== The Moon Estate — Property Marketplace UI =====
   Buy / Rent browse, Sell / Rent-out posting, favourites, admin, maps.
   Data goes through window.Store (Supabase or localStorage). */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var FAV_KEY = 'tme_favs_v1';
  var cfg = window.TME_CONFIG || {};

  var listings = [];          // in-memory cache
  var currentMode = 'buy';
  var showSavedOnly = false;
  var me = null;              // logged-in user (or null)
  var pendingPost = false;    // user clicked Post while logged out
  var editingId = null;       // id of the listing being edited (or null)

  /* ---------- formatting helpers ---------- */
  function inr(n) {
    n = Number(n) || 0;
    if (n >= 1e7) return '₹ ' + (n / 1e7).toFixed(n % 1e7 ? 2 : 0) + ' Cr';
    if (n >= 1e5) return '₹ ' + (n / 1e5).toFixed(n % 1e5 ? 2 : 0) + ' Lakh';
    if (n >= 1e3) return '₹ ' + (n / 1e3).toFixed(0) + 'K';
    return '₹ ' + n;
  }
  function priceLabel(l) { return l.listingType === 'rent' ? inr(l.rent) + ' /mo' : inr(l.price); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function placeholderImg(l) {
    var em = l.listingType === 'rent' ? '🔑' : '🏠';
    return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280"><rect width="100%" height="100%" fill="#eef3f7"/><text x="50%" y="52%" font-size="64" text-anchor="middle">' + em + '</text></svg>');
  }
  function firstImg(l) { return (l.images && l.images[0]) || placeholderImg(l); }

  /* ---------- favourites ---------- */
  function getFavs() { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; } }
  function isFav(id) { return getFavs().indexOf(id) > -1; }
  function toggleFav(id) {
    var f = getFavs(), i = f.indexOf(id);
    if (i > -1) f.splice(i, 1); else f.push(id);
    localStorage.setItem(FAV_KEY, JSON.stringify(f));
    updateFavCount();
  }
  function updateFavCount() {
    var b = $('#favToggle'); if (b) b.querySelector('.fav-n').textContent = getFavs().length;
  }

  /* ---------- tabs / panes ---------- */
  var browsePane = $('#browsePane'), postPane = $('#postPane');
  function setMode(mode, scroll, keepEdit) {
    // Posting requires a logged-in account
    if (mode === 'post' && !me) { pendingPost = true; openAuth(); return; }
    if (!keepEdit) clearEdit();
    currentMode = mode;
    $$('#portalTabs .ptab').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-mode') === mode);
    });
    if (mode === 'post') {
      browsePane.classList.add('hidden'); postPane.classList.remove('hidden');
      if (!editingId) freshPostForm();
    }
    else { postPane.classList.add('hidden'); browsePane.classList.remove('hidden'); renderResults(); }
    if (scroll) {
      var top = $('#portal').getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }
  $$('#portalTabs .ptab').forEach(function (b) {
    b.addEventListener('click', function () { setMode(b.getAttribute('data-mode'), false); });
  });
  $$('[data-mode]').forEach(function (el) {
    if (el.closest('#portalTabs')) return;
    el.addEventListener('click', function () { var m = el.getAttribute('data-mode'); if (m) setMode(m, true); });
  });

  /* ---------- budget options ---------- */
  (function () {
    var sel = $('#budgetSelect');
    var opts = [['', 'Any budget'], [1000000, 'Up to ₹10 Lakh'], [2500000, 'Up to ₹25 Lakh'],
      [5000000, 'Up to ₹50 Lakh'], [10000000, 'Up to ₹1 Cr'], [30000000, 'Up to ₹3 Cr']];
    sel.innerHTML = opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('');
  })();

  /* ---------- State / City dropdowns (India) ---------- */
  (function () {
    var IN = window.INDIA || { states: [], cities: {} };
    var stateOpts = IN.states.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('');
    var ps = $('#postState'); if (ps) ps.innerHTML = '<option value="">Select state</option>' + stateOpts;
    var ss = $('#searchState'); if (ss) ss.innerHTML = '<option value="">All India</option>' + stateOpts;
    function fillCities(listEl, state) {
      if (!listEl) return;
      listEl.innerHTML = (IN.cities[state] || []).map(function (c) { return '<option value="' + esc(c) + '"></option>'; }).join('');
    }
    if (ps) ps.addEventListener('change', function () { fillCities($('#postCityList'), ps.value); var pc = $('#postCity'); if (pc) pc.value = ''; });
    if (ss) ss.addEventListener('change', function () { fillCities($('#searchCityList'), ss.value); renderResults(); });
  })();

  /* ---------- search ---------- */
  var searchForm = $('#searchForm');
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  searchForm.addEventListener('submit', function (e) { e.preventDefault(); renderResults(); });
  $('#searchQ').addEventListener('input', debounce(renderResults, 250));
  searchForm.querySelector('[name="ptype"]').addEventListener('change', renderResults);
  searchForm.querySelector('[name="bhk"]').addEventListener('change', renderResults);
  $('#budgetSelect').addEventListener('change', renderResults);
  $('#favToggle').addEventListener('click', function () {
    showSavedOnly = !showSavedOnly;
    $('#favToggle').classList.toggle('on', showSavedOnly);
    renderResults();
  });

  function renderResults() {
    var wantType = currentMode === 'rent' ? 'rent' : 'sale';
    var fd = new FormData(searchForm);
    var q = (fd.get('q') || '').trim().toLowerCase();
    var state = fd.get('state') || '';
    var ptype = fd.get('ptype') || '', bhk = fd.get('bhk') || '', budget = Number(fd.get('budget')) || 0;
    var favs = getFavs();

    var pool = listings.filter(function (l) {
      if (l.listingType !== wantType) return false;
      if (state && l.state !== state) return false;
      if (showSavedOnly && favs.indexOf(l.id) < 0) return false;
      if (ptype && l.ptype !== ptype) return false;
      if (bhk) { var b = parseInt(l.bhk, 10) || 0; if (bhk === '4' ? b < 4 : b !== parseInt(bhk, 10)) return false; }
      if (budget) { var val = wantType === 'rent' ? l.rent : l.price; if (Number(val) > budget) return false; }
      return true;
    });

    var exact = pool, nearby = [];
    if (q) {
      var cities = {};
      exact = pool.filter(function (l) {
        var hit = (l.locality || '').toLowerCase().indexOf(q) > -1 ||
                  (l.city || '').toLowerCase().indexOf(q) > -1 ||
                  (l.title || '').toLowerCase().indexOf(q) > -1;
        if (hit) cities[(l.city || '').toLowerCase()] = true;
        return hit;
      });
      nearby = pool.filter(function (l) { return exact.indexOf(l) < 0 && cities[(l.city || '').toLowerCase()]; });
    }
    var byNew = function (a, b) { return b.ts - a.ts; };
    exact.sort(byNew); nearby.sort(byNew);

    var label = wantType === 'rent' ? 'rentals' : 'properties for sale';
    if (showSavedOnly) label = 'saved ' + label;
    var meta = $('#resultsMeta');
    meta.innerHTML = '<strong>' + exact.length + '</strong> ' + label + (q ? ' in “' + esc(q) + '”' : ' available');

    $('#resultsExact').innerHTML = exact.map(cardHTML).join('');
    var nh = $('#nearbyHead');
    if (nearby.length) { nh.hidden = false; $('#resultsNearby').innerHTML = nearby.map(cardHTML).join(''); }
    else { nh.hidden = true; $('#resultsNearby').innerHTML = ''; }
    $('#emptyState').hidden = (exact.length + nearby.length) > 0;
    bindCards();
  }

  function cardHTML(l) {
    var badge = l.listingType === 'rent' ? 'For Rent' : 'For Sale';
    var specs = [];
    if (l.bhk) specs.push('🛏 ' + l.bhk + ' BHK');
    if (l.area) specs.push('📐 ' + l.area + ' ' + l.areaUnit);
    if (l.furnish) specs.push('🛋 ' + l.furnish);
    return '' +
      '<article class="card listing tilt" data-id="' + l.id + '">' +
        '<div class="card-img">' +
          '<img loading="lazy" src="' + esc(firstImg(l)) + '" alt="' + esc(l.title) + '" onerror="this.src=\'' + placeholderImg(l) + '\'" />' +
          '<span class="tag">' + badge + '</span>' +
          '<button class="fav-btn' + (isFav(l.id) ? ' on' : '') + '" data-fav="' + l.id + '" aria-label="Save">' + (isFav(l.id) ? '♥' : '♡') + '</button>' +
          (l.images && l.images.length > 1 ? '<span class="imgcount">📷 ' + l.images.length + '</span>' : '') +
        '</div>' +
        '<div class="card-body">' +
          '<div class="price-row"><span class="price">' + priceLabel(l) + '</span><span class="ptype-pill">' + esc(l.ptype) + '</span></div>' +
          '<h3>' + esc(l.title) + '</h3>' +
          '<p class="loc">📍 ' + esc(l.locality) + ', ' + esc(l.city) + (l.state ? ', ' + esc(l.state) : '') + '</p>' +
          '<div class="card-meta">' + specs.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</div>' +
          '<div class="card-foot">' +
            '<span class="posted">by ' + esc(l.owner) + ' · ' + esc(l.postedBy || 'Owner') + '</span>' +
            '<a class="card-link" data-view="' + l.id + '">View →</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function bindCards() {
    $$('.listing').forEach(function (c) {
      c.addEventListener('click', function (e) {
        var fav = e.target.closest('[data-fav]');
        if (fav) {
          e.stopPropagation();
          toggleFav(fav.getAttribute('data-fav'));
          fav.classList.toggle('on'); fav.textContent = fav.classList.contains('on') ? '♥' : '♡';
          if (showSavedOnly) renderResults();
          return;
        }
        openModal(c.getAttribute('data-id'));
      });
    });
    if (window.applyTilt) window.applyTilt('.listing.tilt');
  }

  /* ---------- detail modal ---------- */
  var modal = $('#modal'), modalBody = $('#modalBody');
  function openModal(id) {
    var l = listings.filter(function (x) { return x.id === id; })[0];
    if (!l) return;
    var imgs = (l.images && l.images.length) ? l.images : [firstImg(l)];
    var rows = [['Type', l.ptype]];
    if (l.bhk) rows.push(['Configuration', l.bhk + ' BHK']);
    if (l.bath) rows.push(['Bathrooms', l.bath]);
    if (l.area) rows.push(['Area', l.area + ' ' + l.areaUnit]);
    if (l.furnish) rows.push(['Furnishing', l.furnish]);
    if (l.listingType === 'rent') {
      if (l.deposit) rows.push(['Security Deposit', inr(l.deposit)]);
      if (l.availFrom) rows.push(['Available From', l.availFrom]);
      if (l.tenants) rows.push(['Preferred Tenants', l.tenants]);
    }
    rows.push(['Posted By', l.postedBy || 'Owner']);
    if (l.address) rows.push(['Address', l.address]);

    var place = encodeURIComponent((l.address || (l.locality + ', ' + l.city + (l.state ? ', ' + l.state : ''))) + ', India');
    var msg = encodeURIComponent('Hi, I am interested in your property "' + l.title + '" (' + l.locality + ', ' + l.city + ') listed on The Moon Estate. Is it available?');
    var phone = String(l.phone || '').replace(/\D/g, '');
    var wa = phone ? '91' + phone.slice(-10) : '919719910070';

    modalBody.innerHTML = '' +
      '<div class="m-gallery" id="mGallery">' +
        '<img id="mMain" src="' + esc(imgs[0]) + '" alt="' + esc(l.title) + '" onerror="this.src=\'' + placeholderImg(l) + '\'" />' +
        (imgs.length > 1 ? '<div class="m-thumbs">' + imgs.map(function (s, i) { return '<img src="' + esc(s) + '" class="' + (i === 0 ? 'on' : '') + '" />'; }).join('') + '</div>' : '') +
      '</div>' +
      '<div class="m-info">' +
        '<span class="tag ' + (l.listingType === 'rent' ? 'rent' : '') + '">' + (l.listingType === 'rent' ? 'For Rent' : 'For Sale') + '</span>' +
        '<h2>' + esc(l.title) + '</h2>' +
        '<p class="m-loc">📍 ' + esc(l.locality) + ', ' + esc(l.city) + (l.state ? ', ' + esc(l.state) : '') + '</p>' +
        '<div class="m-price">' + priceLabel(l) + '</div>' +
        (l.desc ? '<p class="m-desc">' + esc(l.desc) + '</p>' : '') +
        '<div class="m-table">' + rows.map(function (r) { return '<div><span>' + esc(r[0]) + '</span><strong>' + esc(r[1]) + '</strong></div>'; }).join('') + '</div>' +
        '<div class="m-mapwrap"><iframe class="m-map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=' + place + '&z=13&output=embed"></iframe></div>' +
        '<div class="m-owner">' +
          '<div class="m-avatar">' + esc((l.owner || 'O').charAt(0).toUpperCase()) + '</div>' +
          '<div><strong>' + esc(l.owner) + '</strong><span>' + esc(l.postedBy || 'Owner') + '</span></div>' +
        '</div>' +
        '<div class="m-actions">' +
          '<a class="btn btn-primary" href="tel:+' + wa + '">📞 Call</a>' +
          '<a class="btn btn-ghost" href="https://wa.me/' + wa + '?text=' + msg + '" target="_blank" rel="noopener">💬 WhatsApp</a>' +
          (l.email ? '<a class="btn btn-ghost" href="mailto:' + esc(l.email) + '?subject=' + encodeURIComponent('Enquiry: ' + l.title) + '">✉️ Email</a>' : '') +
        '</div>' +
        '<form class="m-enq" id="mEnq">' +
          '<h4>📞 Request a callback</h4>' +
          '<div class="m-enq-row"><input name="name" placeholder="Your name" required />' +
          '<input name="phone" type="tel" placeholder="Your phone" required /></div>' +
          '<input name="message" placeholder="Message (optional)" />' +
          '<button class="btn btn-primary full" type="submit">Send enquiry</button>' +
          '<p class="form-note" id="mEnqNote"></p>' +
        '</form>' +
      '</div>';

    var enq = $('#mEnq');
    if (enq) enq.addEventListener('submit', async function (e) {
      e.preventDefault();
      var note = $('#mEnqNote'); note.style.color = '';
      var fd = new FormData(enq);
      var ph = (fd.get('phone') || '').replace(/\D/g, '');
      if (!(fd.get('name') || '').trim() || ph.length < 10) {
        note.style.color = '#c0392b'; note.textContent = 'Please enter your name and a valid 10-digit phone.'; return;
      }
      var lead = {
        id: 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        name: (fd.get('name') || '').trim(), phone: ph, message: (fd.get('message') || '').trim(),
        propertyId: l.id, propertyTitle: l.title, city: l.city, ts: Date.now()
      };
      var btn = enq.querySelector('button'); btn.disabled = true; note.textContent = 'Sending…';
      try { await Store.addLead(lead); note.style.color = ''; note.textContent = '✅ Thank you! The owner will contact you soon.'; enq.reset(); }
      catch (err) { note.style.color = '#c0392b'; note.textContent = '⚠️ Could not send — please call instead.'; }
      finally { btn.disabled = false; }
    });

    $$('#mGallery .m-thumbs img').forEach(function (t) {
      t.addEventListener('click', function () {
        $('#mMain').src = t.src;
        $$('#mGallery .m-thumbs img').forEach(function (x) { x.classList.remove('on'); });
        t.classList.add('on');
      });
    });
    openOverlay(modal);
  }

  /* ---------- overlay helpers ---------- */
  function openOverlay(el) { el.hidden = false; document.body.style.overflow = 'hidden'; }
  function closeOverlay(el) { el.hidden = true; if (!$$('.modal:not([hidden])').length) document.body.style.overflow = ''; }
  $$('[data-close]', modal).forEach(function (el) { el.addEventListener('click', function () { closeOverlay(modal); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $$('.modal').forEach(closeOverlay); });

  /* ---------- post form: type toggle ---------- */
  var postForm = $('#postForm');
  function syncListingType() {
    var rent = postForm.querySelector('[name="listingType"]:checked').value === 'rent';
    $$('.rentOnly', postForm).forEach(function (el) { el.hidden = !rent; el.querySelectorAll('input,select').forEach(function (i) { i.disabled = !rent; }); });
    $$('.saleOnly', postForm).forEach(function (el) { el.hidden = rent; el.querySelectorAll('input,select').forEach(function (i) { i.disabled = rent; }); });
    var price = postForm.querySelector('[name="price"]'); if (price) price.required = !rent;
    var rentF = postForm.querySelector('[name="rent"]'); if (rentF) rentF.required = rent;
  }
  $$('[name="listingType"]', postForm).forEach(function (r) { r.addEventListener('change', syncListingType); });
  syncListingType();

  function prefillOwner() {
    if (!me) return;
    var p = profileOf(me);
    var setIf = function (name, val) { var el = postForm.querySelector('[name="' + name + '"]'); if (el && !el.value && val) el.value = val; };
    setIf('owner', p.name); setIf('phone', p.phone); setIf('email', me.email);
  }

  var POST_BTN_DEFAULT = '🚀 Post My Property — Free';
  function setPostBtn(txt) { var b = postForm.querySelector('button[type="submit"]'); if (b) b.textContent = txt; }
  function clearEdit() {
    if (!editingId) return;
    editingId = null; setPostBtn(POST_BTN_DEFAULT);
    var pn = $('#postNote'); if (pn) pn.textContent = '';
  }
  function freshPostForm() {
    postForm.reset(); pendingImages = []; renderThumbs();
    var cl = $('#postCityList'); if (cl) cl.innerHTML = '';
    syncListingType(); setPostBtn(POST_BTN_DEFAULT); prefillOwner();
  }
  function setF(name, val) { var el = postForm.querySelector('[name="' + name + '"]'); if (el) el.value = (val == null ? '' : val); }
  function fillFormFromListing(l) {
    var rt = postForm.querySelector('[name="listingType"][value="' + (l.listingType || 'sale') + '"]');
    if (rt) rt.checked = true;
    syncListingType();
    setF('ptype', l.ptype); setF('title', l.title); setF('bhk', l.bhk); setF('bath', l.bath);
    setF('furnish', l.furnish); setF('area', l.area); setF('areaUnit', l.areaUnit);
    setF('state', l.state);
    var IN = window.INDIA || { cities: {} };
    var cl = $('#postCityList'); if (cl) cl.innerHTML = (IN.cities[l.state] || []).map(function (c) { return '<option value="' + esc(c) + '"></option>'; }).join('');
    setF('city', l.city); setF('locality', l.locality); setF('address', l.address); setF('desc', l.desc);
    setF('owner', l.owner); setF('phone', l.phone); setF('email', l.email); setF('postedBy', l.postedBy);
    if (l.listingType === 'rent') { setF('rent', l.rent); setF('deposit', l.deposit); setF('availFrom', l.availFrom); setF('tenants', l.tenants); }
    else { setF('price', l.price); }
    pendingImages = (l.images || []).slice(); renderThumbs();
    var ag = postForm.querySelector('[name="agree"]'); if (ag) ag.checked = true;
  }
  function startEdit(id) {
    var l = listings.filter(function (x) { return x.id === id; })[0];
    if (!l || !me) return;
    editingId = id;
    setMode('post', true, true);   // keepEdit = true
    fillFormFromListing(l);
    setPostBtn('💾 Update property');
    var pn = $('#postNote'); if (pn) { pn.style.color = ''; pn.textContent = 'Editing your listing — make changes and click Update.'; }
  }

  /* ---------- image upload (compressed) ---------- */
  var pendingImages = [];
  var thumbs = $('#thumbs');
  $('#photoInput').addEventListener('change', function (e) {
    Array.prototype.slice.call(e.target.files).forEach(function (f) {
      if (pendingImages.length >= 6 || !/^image\//.test(f.type)) return;
      compress(f, function (dataUrl) { pendingImages.push(dataUrl); renderThumbs(); });
    });
    e.target.value = '';
  });
  function renderThumbs() {
    thumbs.innerHTML = pendingImages.map(function (src, i) {
      return '<div class="thumb"><img src="' + src + '" /><button type="button" data-rm="' + i + '">×</button></div>';
    }).join('');
    $$('[data-rm]', thumbs).forEach(function (b) {
      b.addEventListener('click', function () { pendingImages.splice(parseInt(b.getAttribute('data-rm'), 10), 1); renderThumbs(); });
    });
  }
  function compress(file, cb) {
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var max = 1000, w = img.width, h = img.height;
        if (w > h && w > max) { h = h * max / w; w = max; } else if (h > max) { w = w * max / h; h = max; }
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(c.toDataURL('image/jpeg', 0.72));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- post submit ---------- */
  postForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var note = $('#postNote');
    if (!me) { pendingPost = true; openAuth(); return; }
    var fd = new FormData(postForm);
    var phone = (fd.get('phone') || '').replace(/\D/g, '');
    if (phone.length < 10) { note.style.color = '#c0392b'; note.textContent = 'Please enter a valid 10-digit phone number.'; return; }

    var type = fd.get('listingType');
    var editing = editingId ? listings.filter(function (x) { return x.id === editingId; })[0] : null;
    var l = {
      id: editingId || ('u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      listingType: type, ptype: fd.get('ptype'), title: (fd.get('title') || '').trim(),
      bhk: fd.get('bhk') || '', bath: fd.get('bath') || '', furnish: fd.get('furnish') || '',
      area: Number(fd.get('area')) || '', areaUnit: fd.get('areaUnit'),
      state: (fd.get('state') || '').trim(),
      city: (fd.get('city') || '').trim(), locality: (fd.get('locality') || '').trim(),
      address: (fd.get('address') || '').trim(), desc: (fd.get('desc') || '').trim(),
      owner: (fd.get('owner') || '').trim(), phone: phone, email: (fd.get('email') || '').trim(),
      postedBy: fd.get('postedBy') || 'Owner', images: pendingImages.slice(),
      ownerUid: (editing && editing.ownerUid) || me.id,
      ts: editing ? editing.ts : Date.now()
    };
    if (type === 'rent') { l.rent = Number(fd.get('rent')) || 0; l.deposit = Number(fd.get('deposit')) || 0; l.availFrom = fd.get('availFrom') || ''; l.tenants = fd.get('tenants') || 'Anyone'; }
    else { l.price = Number(fd.get('price')) || 0; }

    var isEdit = !!editingId;
    var btn = $('#postForm button[type="submit"]');
    btn.disabled = true; note.style.color = ''; note.textContent = isEdit ? 'Updating…' : 'Publishing…';
    try {
      if (isEdit) {
        await Store.update(l);
        for (var i = 0; i < listings.length; i++) { if (listings[i].id === l.id) { listings[i] = l; break; } }
        note.textContent = '✅ Listing updated!';
      } else {
        await Store.add(l);
        listings.unshift(l);
        note.textContent = '✅ Your property is now live! Redirecting to your listing…';
      }
      clearEdit();
      postForm.reset(); pendingImages = []; renderThumbs(); syncListingType();
      setTimeout(function () {
        setMode(type === 'rent' ? 'rent' : 'buy', true);
        $('#searchQ').value = l.city; renderResults();
        setTimeout(function () { openModal(l.id); }, 400);
        note.textContent = '';
      }, 900);
    } catch (err) {
      note.style.color = '#c0392b'; note.textContent = '⚠️ ' + (err.message || 'Could not save. Please try again.');
    } finally { btn.disabled = false; }
  });

  /* ---------- User accounts: login / sign-up / profile ---------- */
  var authModal = $('#authModal'), authBody = $('#authBody');
  var accountModal = $('#accountModal'), accountBody = $('#accountBody');
  var authBtn = $('#authBtn');
  var profileOf = function (u) { return (u && u.user_metadata) ? u.user_metadata : {}; };

  function updateAuthUI() {
    if (!authBtn) return;
    if (me) {
      var nm = (profileOf(me).name || me.email || 'Account').split(' ')[0];
      authBtn.textContent = '👤 ' + nm;
      authBtn.classList.add('signedin');
    } else {
      authBtn.textContent = 'Login';
      authBtn.classList.remove('signedin');
    }
  }
  if (authBtn) authBtn.addEventListener('click', function (e) {
    e.preventDefault();
    if (me) openAccount(); else openAuth();
  });
  $$('[data-close]', authModal).forEach(function (el) { el.addEventListener('click', function () { closeOverlay(authModal); }); });
  $$('[data-close]', accountModal).forEach(function (el) { el.addEventListener('click', function () { closeOverlay(accountModal); }); });

  function openAuth(tab) { renderAuth(tab || 'otp'); openOverlay(authModal); }

  function bindAuthSwitches() {
    $$('[data-authtab]', authBody).forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); renderAuth(a.getAttribute('data-authtab')); }); });
  }

  function renderAuth(tab) {
    $$('.auth-tab').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-authtab') === tab); });
    if (tab === 'otp') { renderOtpEmail(); return; }
    if (tab === 'signup') {
      authBody.innerHTML =
        '<form class="auth-form" id="authForm">' +
          (pendingPost ? '<p class="auth-note-top">Create a free account to post your property.</p>' : '') +
          '<input name="name" placeholder="Full name" required />' +
          '<input name="phone" type="tel" placeholder="Phone (10-digit)" required />' +
          '<input name="email" type="email" placeholder="Email" required />' +
          '<input name="password" type="password" placeholder="Password (min 6 chars)" minlength="6" required />' +
          '<button class="btn btn-primary full" type="submit">Create account</button>' +
          '<p class="form-note" id="authNote"></p>' +
          '<p class="auth-switch">Already have an account? <a href="#" data-authtab="login">Login</a></p>' +
        '</form>';
    } else {
      authBody.innerHTML =
        '<form class="auth-form" id="authForm">' +
          (pendingPost ? '<p class="auth-note-top">Please log in to post your property.</p>' : '') +
          '<input name="email" type="email" placeholder="Email" required />' +
          '<input name="password" type="password" placeholder="Password" required />' +
          '<button class="btn btn-primary full" type="submit">Login</button>' +
          '<p class="form-note" id="authNote"></p>' +
          '<p class="auth-switch">New here? <a href="#" data-authtab="signup">Create an account</a></p>' +
        '</form>';
    }
    $$('[data-authtab]', authBody).forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); renderAuth(a.getAttribute('data-authtab')); }); });
    $('#authForm').addEventListener('submit', tab === 'signup' ? handleSignup : handleLogin);
  }
  $$('.auth-tab').forEach(function (b) { b.addEventListener('click', function () { renderAuth(b.getAttribute('data-authtab')); }); });

  /* ----- Email OTP flow ----- */
  function renderOtpEmail(prefill) {
    authBody.innerHTML =
      '<form class="auth-form" id="authForm">' +
        (pendingPost ? '<p class="auth-note-top">Log in to post your property.</p>' : '') +
        '<p class="auth-sub">We\'ll email you a 6-digit code — no password needed.</p>' +
        '<input name="email" type="email" placeholder="Your email" value="' + esc(prefill || '') + '" required />' +
        '<button class="btn btn-primary full" type="submit">Send code</button>' +
        '<p class="form-note" id="authNote"></p>' +
        '<p class="auth-switch">Prefer a password? <a href="#" data-authtab="login">Password login</a></p>' +
      '</form>';
    bindAuthSwitches();
    $('#authForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var note = $('#authNote'); note.style.color = ''; note.textContent = 'Sending code…';
      var email = (new FormData(e.target).get('email') || '').trim();
      try { await Store.sendOtp(email); renderOtpCode(email); }
      catch (err) { note.style.color = '#c0392b'; note.textContent = '⚠️ ' + friendlyAuthErr(err); }
    });
  }
  function renderOtpCode(email) {
    authBody.innerHTML =
      '<form class="auth-form" id="authForm">' +
        '<p class="auth-sub">We emailed <strong>' + esc(email) + '</strong>.<br>👉 Click the <strong>login link</strong> in that email, ' +
        'or if it shows a <strong>6-digit code</strong>, type it below.</p>' +
        '<input name="token" inputmode="numeric" maxlength="6" placeholder="6-digit code (optional)" />' +
        '<button class="btn btn-primary full" type="submit">Verify code</button>' +
        '<p class="form-note" id="authNote"></p>' +
        '<p class="auth-switch"><a href="#" id="otpBack">← Different email</a> · <a href="#" id="otpResend">Resend email</a></p>' +
      '</form>';
    $('#otpBack').addEventListener('click', function (e) { e.preventDefault(); renderOtpEmail(email); });
    $('#otpResend').addEventListener('click', async function (e) {
      e.preventDefault(); var note = $('#authNote'); note.style.color = ''; note.textContent = 'Resending…';
      try { await Store.sendOtp(email); note.textContent = 'Code resent.'; } catch (err) { note.style.color = '#c0392b'; note.textContent = '⚠️ ' + friendlyAuthErr(err); }
    });
    $('#authForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var note = $('#authNote'); note.style.color = '';
      var token = (new FormData(e.target).get('token') || '').trim();
      if (!token) { note.style.color = '#c0392b'; note.textContent = 'No code? Just click the login link in your email instead.'; return; }
      note.textContent = 'Verifying…';
      try {
        await Store.verifyOtp(email, token);
        me = await Store.currentUser();
        if (me && !(me.user_metadata && me.user_metadata.name)) { renderCompleteProfile(); return; }
        afterAuthSuccess();
      } catch (err) { note.style.color = '#c0392b'; note.textContent = '⚠️ ' + friendlyAuthErr(err); }
    });
  }
  function renderCompleteProfile() {
    $$('.auth-tab').forEach(function (b) { b.classList.remove('on'); });
    authBody.innerHTML =
      '<form class="auth-form" id="authForm">' +
        '<p class="auth-sub">Welcome! Just complete your profile to finish.</p>' +
        '<input name="name" placeholder="Full name" required />' +
        '<input name="phone" type="tel" placeholder="Phone (10-digit)" required />' +
        '<button class="btn btn-primary full" type="submit">Save &amp; continue</button>' +
        '<p class="form-note" id="authNote"></p>' +
      '</form>';
    $('#authForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var note = $('#authNote'); note.style.color = ''; note.textContent = 'Saving…';
      var fd = new FormData(e.target);
      var phone = (fd.get('phone') || '').replace(/\D/g, '');
      if (phone.length < 10) { note.style.color = '#c0392b'; note.textContent = 'Enter a valid 10-digit phone.'; return; }
      try { await Store.updateProfile({ name: (fd.get('name') || '').trim(), phone: phone }); me = await Store.currentUser(); afterAuthSuccess(); }
      catch (err) { note.style.color = '#c0392b'; note.textContent = '⚠️ ' + (err.message || 'Could not save'); }
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    var note = $('#authNote'); note.style.color = ''; note.textContent = 'Logging in…';
    var fd = new FormData(e.target);
    try {
      await Store.signIn((fd.get('email') || '').trim(), fd.get('password') || '');
      me = await Store.currentUser();
      afterAuthSuccess();
    } catch (err) { note.style.color = '#c0392b'; note.textContent = '⚠️ ' + friendlyAuthErr(err); }
  }
  async function handleSignup(e) {
    e.preventDefault();
    var note = $('#authNote'); note.style.color = ''; note.textContent = 'Creating your account…';
    var fd = new FormData(e.target);
    var phone = (fd.get('phone') || '').replace(/\D/g, '');
    if (phone.length < 10) { note.style.color = '#c0392b'; note.textContent = 'Please enter a valid 10-digit phone.'; return; }
    try {
      await Store.signUp((fd.get('email') || '').trim(), fd.get('password') || '',
        { name: (fd.get('name') || '').trim(), phone: phone });
      me = await Store.currentUser();
      if (!me) {
        note.style.color = ''; note.textContent = '✅ Account created! Please check your email to confirm, then log in.';
        setTimeout(function () { renderAuth('login'); }, 2500);
        return;
      }
      afterAuthSuccess();
    } catch (err) { note.style.color = '#c0392b'; note.textContent = '⚠️ ' + friendlyAuthErr(err); }
  }
  function friendlyAuthErr(err) {
    var m = (err && err.message) || 'Something went wrong';
    if (/already registered|already exists/i.test(m)) return 'This email is already registered — try logging in.';
    if (/invalid login/i.test(m)) return 'Wrong email or password.';
    if (/email not confirmed/i.test(m)) return 'Please confirm your email first (check your inbox).';
    return m;
  }
  function afterAuthSuccess() {
    closeOverlay(authModal);
    updateAuthUI();
    if (pendingPost) { pendingPost = false; setMode('post', true); }
  }

  function openAccount() {
    var p = profileOf(me);
    var mine = listings.filter(function (l) { return l.ownerUid && l.ownerUid === me.id; });
    accountBody.innerHTML =
      '<div class="acc-profile">' +
        '<div class="acc-avatar">' + esc((p.name || me.email || 'U').charAt(0).toUpperCase()) + '</div>' +
        '<div><strong>' + esc(p.name || 'My profile') + '</strong>' +
          '<span>' + esc(me.email || '') + (p.phone ? ' · ' + esc(p.phone) : '') + '</span></div>' +
        '<button class="adm-logout" id="accLogout">Sign out</button>' +
      '</div>' +
      '<div class="acc-actions"><button class="btn btn-primary" id="accPost">＋ Post a property</button></div>' +
      '<h3 class="acc-h">My Listings (' + mine.length + ')</h3>' +
      (mine.length ? '<div class="adm-list">' + mine.map(function (l) {
        return '<div class="adm-row"><img src="' + esc(firstImg(l)) + '" onerror="this.src=\'' + placeholderImg(l) + '\'" />' +
          '<div class="adm-meta"><strong>' + esc(l.title) + '</strong><span>' + esc(l.locality) + ', ' + esc(l.city) + ' · ' + (l.listingType === 'rent' ? 'Rent' : 'Sale') + '</span></div>' +
          '<div class="row-acts"><button class="adm-edit" data-myedit="' + l.id + '">Edit</button>' +
          '<button class="adm-del" data-mydel="' + l.id + '">Delete</button></div></div>';
      }).join('') + '</div>' : '<p class="adm-empty">You haven\'t posted any property yet.</p>');
    $('#accLogout').addEventListener('click', async function () { await Store.signOut(); me = null; updateAuthUI(); closeOverlay(accountModal); renderResults(); });
    $('#accPost').addEventListener('click', function () { closeOverlay(accountModal); setMode('post', true); });
    $$('[data-myedit]', accountBody).forEach(function (b) {
      b.addEventListener('click', function () { closeOverlay(accountModal); startEdit(b.getAttribute('data-myedit')); });
    });
    $$('[data-mydel]', accountBody).forEach(function (b) {
      b.addEventListener('click', async function () {
        var id = b.getAttribute('data-mydel');
        if (!confirm('Delete this listing permanently?')) return;
        b.disabled = true; b.textContent = '…';
        try { await Store.remove(id); listings = listings.filter(function (x) { return x.id !== id; }); renderResults(); openAccount(); }
        catch (err) { alert('Delete failed: ' + (err.message || err)); b.disabled = false; b.textContent = 'Delete'; }
      });
    });
    openOverlay(accountModal);
  }

  /* ---------- Admin panel (secure login + leads) ---------- */
  var adminModal = $('#adminModal'), adminBody = $('#adminBody');
  var adminTab = 'listings';
  $$('[data-admin]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); openOverlay(adminModal); refreshAdminView(); });
  });
  $$('[data-close]', adminModal).forEach(function (el) { el.addEventListener('click', function () { closeOverlay(adminModal); }); });

  async function refreshAdminView() {
    adminBody.innerHTML = '<p class="adm-empty">Loading…</p>';
    var user = null;
    try { user = await Store.currentUser(); } catch (e) {}
    if (!user) { renderLogin(); return; }
    if (!Store.isAdmin(user)) { renderNotAdmin(user); return; }
    renderManage(user);
  }

  function renderNotAdmin(user) {
    adminBody.innerHTML =
      '<div class="adm-empty">' +
        '<p>Logged in as <strong>' + esc(user.email) + '</strong> — not an admin account.</p>' +
        '<p>Admin tools (all listings &amp; leads) are restricted to the business owner.</p>' +
        '<button class="adm-logout" id="naLogout">Sign out</button>' +
      '</div>';
    $('#naLogout').addEventListener('click', async function () { await Store.signOut(); me = null; updateAuthUI(); refreshAdminView(); });
  }

  function renderLogin() {
    var supa = Store.mode === 'supabase';
    adminBody.innerHTML =
      '<form class="adm-login" id="admLogin">' +
        '<p class="adm-sub">' + (supa ? 'Sign in with your admin email &amp; password to manage listings and view enquiries.' : 'Local demo — enter the admin passcode.') + '</p>' +
        (supa ? '<input type="email" name="email" placeholder="Admin email" autocomplete="username" required />' : '') +
        '<input type="password" name="password" placeholder="' + (supa ? 'Password' : 'Passcode') + '" autocomplete="current-password" required />' +
        '<button class="btn btn-primary full" type="submit">🔒 Sign in</button>' +
        '<p class="form-note" id="admNote"></p>' +
      '</form>';
    $('#admLogin').addEventListener('submit', async function (e) {
      e.preventDefault();
      var note = $('#admNote'); note.style.color = ''; note.textContent = 'Signing in…';
      var fd = new FormData(e.target);
      try { await Store.signIn((fd.get('email') || '').trim(), fd.get('password') || ''); me = await Store.currentUser(); updateAuthUI(); refreshAdminView(); }
      catch (err) { note.style.color = '#c0392b'; note.textContent = '⚠️ ' + (err.message || 'Sign in failed'); }
    });
  }

  async function renderManage(user) {
    var leads = [];
    try { leads = await Store.listLeads(); } catch (e) {}
    adminBody.innerHTML =
      '<div class="adm-top">' +
        '<span class="adm-user">👤 ' + esc(user.email || 'admin') + '</span>' +
        '<button class="adm-logout" id="admLogout">Sign out</button>' +
      '</div>' +
      '<div class="adm-tabs">' +
        '<button class="adm-tabbtn' + (adminTab === 'listings' ? ' on' : '') + '" data-atab="listings">🏠 Listings (' + listings.length + ')</button>' +
        '<button class="adm-tabbtn' + (adminTab === 'leads' ? ' on' : '') + '" data-atab="leads">📥 Leads (' + leads.length + ')</button>' +
      '</div>' +
      '<div id="admPane"></div>';
    $('#admLogout').addEventListener('click', async function () { await Store.signOut(); me = null; updateAuthUI(); adminTab = 'listings'; refreshAdminView(); });
    $$('[data-atab]').forEach(function (b) { b.addEventListener('click', function () { adminTab = b.getAttribute('data-atab'); renderManage(user); }); });
    if (adminTab === 'leads') renderLeadsPane(leads); else renderListingsPane();
  }

  function renderListingsPane() {
    var pane = $('#admPane');
    if (!listings.length) { pane.innerHTML = '<p class="adm-empty">No listings yet.</p>'; return; }
    pane.innerHTML = '<div class="adm-list">' + listings.map(function (l) {
      return '<div class="adm-row">' +
        '<img src="' + esc(firstImg(l)) + '" onerror="this.src=\'' + placeholderImg(l) + '\'" />' +
        '<div class="adm-meta"><strong>' + esc(l.title) + '</strong>' +
          '<span>' + esc(l.locality) + ', ' + esc(l.city) + ' · ' + (l.listingType === 'rent' ? 'Rent' : 'Sale') + ' · ' + esc(l.owner) + '</span></div>' +
        '<div class="row-acts"><button class="adm-edit" data-aedit="' + l.id + '">Edit</button>' +
        '<button class="adm-del" data-del="' + l.id + '">Delete</button></div></div>';
    }).join('') + '</div>';
    $$('[data-aedit]', pane).forEach(function (b) {
      b.addEventListener('click', function () { closeOverlay(adminModal); startEdit(b.getAttribute('data-aedit')); });
    });
    $$('[data-del]', pane).forEach(function (b) {
      b.addEventListener('click', async function () {
        var id = b.getAttribute('data-del');
        if (!confirm('Delete this listing permanently?')) return;
        b.disabled = true; b.textContent = '…';
        try { await Store.remove(id); listings = listings.filter(function (x) { return x.id !== id; }); renderResults(); refreshAdminView(); }
        catch (err) { alert('Delete failed: ' + (err.message || err)); b.disabled = false; b.textContent = 'Delete'; }
      });
    });
  }

  function renderLeadsPane(leads) {
    var pane = $('#admPane');
    if (!leads.length) { pane.innerHTML = '<p class="adm-empty">No enquiries yet. They will appear here when buyers submit the “Request a callback” form on a property.</p>'; return; }
    pane.innerHTML = '<div class="adm-list">' + leads.map(function (d) {
      var wa = String(d.phone || '').replace(/\D/g, '').slice(-10);
      var when = d.ts ? new Date(d.ts).toLocaleString() : '';
      return '<div class="adm-row lead"><div class="adm-meta">' +
        '<strong>' + esc(d.name) + ' · <a href="tel:' + esc(d.phone) + '">' + esc(d.phone) + '</a></strong>' +
        '<span>📌 ' + esc(d.propertyTitle || 'General enquiry') + (d.city ? ' — ' + esc(d.city) : '') + '</span>' +
        (d.message ? '<span class="lead-msg">“' + esc(d.message) + '”</span>' : '') +
        '<span class="lead-when">' + esc(when) + '</span></div>' +
        '<div class="lead-acts">' +
          '<a class="btn btn-ghost sm" href="https://wa.me/91' + wa + '" target="_blank" rel="noopener">💬</a>' +
          '<button class="adm-del" data-dlead="' + d.id + '">✕</button>' +
        '</div></div>';
    }).join('') + '</div>';
    $$('[data-dlead]', pane).forEach(function (b) {
      b.addEventListener('click', async function () {
        if (!confirm('Delete this enquiry?')) return;
        try { await Store.removeLead(b.getAttribute('data-dlead')); refreshAdminView(); }
        catch (err) { alert('Delete failed: ' + (err.message || err)); }
      });
    });
  }

  /* ---------- init ---------- */
  function showLoading() { $('#resultsMeta').textContent = 'Loading properties…'; }
  async function init() {
    updateFavCount();
    try { me = await Store.currentUser(); } catch (e) {}
    updateAuthUI();
    showLoading();
    var loadFailed = false;
    try {
      if (Store.seedIfEmpty) await Store.seedIfEmpty();
      listings = await Store.list();
    } catch (err) {
      console.warn('[portal] Supabase load failed, showing sample data:', err);
      loadFailed = true;
      listings = (Store.SEED || []).slice();   // keep the marketplace populated
    }
    var badge = $('#storeBadge');
    if (badge) {
      if (loadFailed) badge.innerHTML = '<span title="Run supabase.sql in your Supabase project to finish setup">⚠️ Sample data — finish DB setup</span>';
      else badge.textContent = Store.mode === 'supabase' ? '☁️ Live shared database' : '💾 Local demo mode';
    }
    renderResults();
  }
  init();
})();

/* ===== The Moon Estate — Property Marketplace UI =====
   Buy / Rent browse, Sell / Rent-out posting, favourites, admin, maps.
   Data goes through window.Store (Supabase or localStorage). */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var FAV_KEY = 'tme_favs_v1';

  var listings = [];          // in-memory cache
  var currentMode = 'buy';
  var showSavedOnly = false;

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
  function setMode(mode, scroll) {
    currentMode = mode;
    $$('#portalTabs .ptab').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-mode') === mode);
    });
    if (mode === 'post') { browsePane.classList.add('hidden'); postPane.classList.remove('hidden'); }
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
    var ptype = fd.get('ptype') || '', bhk = fd.get('bhk') || '', budget = Number(fd.get('budget')) || 0;
    var favs = getFavs();

    var pool = listings.filter(function (l) {
      if (l.listingType !== wantType) return false;
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
          '<p class="loc">📍 ' + esc(l.locality) + ', ' + esc(l.city) + '</p>' +
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

    var place = encodeURIComponent((l.address || (l.locality + ', ' + l.city)) + ', India');
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
        '<p class="m-loc">📍 ' + esc(l.locality) + ', ' + esc(l.city) + '</p>' +
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
      '</div>';

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
    var fd = new FormData(postForm);
    var phone = (fd.get('phone') || '').replace(/\D/g, '');
    if (phone.length < 10) { note.style.color = '#c0392b'; note.textContent = 'Please enter a valid 10-digit phone number.'; return; }

    var type = fd.get('listingType');
    var l = {
      id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      listingType: type, ptype: fd.get('ptype'), title: (fd.get('title') || '').trim(),
      bhk: fd.get('bhk') || '', bath: fd.get('bath') || '', furnish: fd.get('furnish') || '',
      area: Number(fd.get('area')) || '', areaUnit: fd.get('areaUnit'),
      city: (fd.get('city') || '').trim(), locality: (fd.get('locality') || '').trim(),
      address: (fd.get('address') || '').trim(), desc: (fd.get('desc') || '').trim(),
      owner: (fd.get('owner') || '').trim(), phone: phone, email: (fd.get('email') || '').trim(),
      postedBy: fd.get('postedBy') || 'Owner', images: pendingImages.slice(), ts: Date.now()
    };
    if (type === 'rent') { l.rent = Number(fd.get('rent')) || 0; l.deposit = Number(fd.get('deposit')) || 0; l.availFrom = fd.get('availFrom') || ''; l.tenants = fd.get('tenants') || 'Anyone'; }
    else { l.price = Number(fd.get('price')) || 0; }

    var btn = $('#postForm button[type="submit"]');
    btn.disabled = true; note.style.color = ''; note.textContent = 'Publishing…';
    try {
      await Store.add(l);
      listings.unshift(l);
      note.textContent = '✅ Your property is now live! Redirecting to your listing…';
      postForm.reset(); pendingImages = []; renderThumbs(); syncListingType();
      setTimeout(function () {
        setMode(type === 'rent' ? 'rent' : 'buy', true);
        $('#searchQ').value = l.city; renderResults();
        setTimeout(function () { openModal(l.id); }, 400);
        note.textContent = '';
      }, 900);
    } catch (err) {
      note.style.color = '#c0392b'; note.textContent = '⚠️ ' + (err.message || 'Could not publish. Please try again.');
    } finally { btn.disabled = false; }
  });

  /* ---------- Admin panel ---------- */
  var adminModal = $('#adminModal'), adminBody = $('#adminBody');
  $$('[data-admin]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var pass = prompt('Enter admin passcode:');
      if (pass == null) return;
      if (pass !== (window.TME_CONFIG && window.TME_CONFIG.ADMIN_PASSCODE)) { alert('Incorrect passcode.'); return; }
      renderAdmin(); openOverlay(adminModal);
    });
  });
  $$('[data-close]', adminModal).forEach(function (el) { el.addEventListener('click', function () { closeOverlay(adminModal); }); });

  function renderAdmin() {
    var sale = listings.filter(function (l) { return l.listingType === 'sale'; }).length;
    var rent = listings.length - sale;
    adminBody.innerHTML =
      '<div class="adm-stats">' +
        '<div><strong>' + listings.length + '</strong><span>Total</span></div>' +
        '<div><strong>' + sale + '</strong><span>For Sale</span></div>' +
        '<div><strong>' + rent + '</strong><span>For Rent</span></div>' +
        '<div><strong>' + (Store.mode === 'supabase' ? 'Cloud' : 'Local') + '</strong><span>Storage</span></div>' +
      '</div>' +
      '<div class="adm-list">' + listings.map(function (l) {
        return '<div class="adm-row" data-arow="' + l.id + '">' +
          '<img src="' + esc(firstImg(l)) + '" onerror="this.src=\'' + placeholderImg(l) + '\'" />' +
          '<div class="adm-meta"><strong>' + esc(l.title) + '</strong>' +
            '<span>' + esc(l.locality) + ', ' + esc(l.city) + ' · ' + (l.listingType === 'rent' ? 'Rent' : 'Sale') + ' · ' + esc(l.owner) + '</span></div>' +
          '<button class="adm-del" data-del="' + l.id + '">Delete</button>' +
        '</div>';
      }).join('') + '</div>';

    $$('[data-del]', adminBody).forEach(function (b) {
      b.addEventListener('click', async function () {
        var id = b.getAttribute('data-del');
        if (!confirm('Delete this listing permanently?')) return;
        b.disabled = true; b.textContent = '…';
        try {
          await Store.remove(id);
          listings = listings.filter(function (x) { return x.id !== id; });
          renderAdmin(); renderResults();
        } catch (err) { alert('Delete failed: ' + (err.message || err)); b.disabled = false; b.textContent = 'Delete'; }
      });
    });
  }

  /* ---------- init ---------- */
  function showLoading() { $('#resultsMeta').textContent = 'Loading properties…'; }
  async function init() {
    updateFavCount();
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

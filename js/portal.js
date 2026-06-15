/* ===== The Moon Estate — Property Marketplace engine =====
   Pure client-side (localStorage). Buy / Rent browse + Sell / Rent-out posting.
   No backend required — works on any static host. */
(function () {
  'use strict';

  var LS_KEY = 'tme_listings_v1';

  /* ---------- Imaginary seed listings ---------- */
  var SEED = [
    {
      id: 's1', listingType: 'sale', ptype: 'Residential Plot',
      title: '200 Sq.Yd Corner Plot on GT Road', bhk: '', bath: '', furnish: '',
      area: 200, areaUnit: 'Sq. Yd.', price: 2800000,
      city: 'Etah', locality: 'Vidya Vihar Colony, GT Road',
      address: 'Near Mandi Samiti, GT Road, Etah 207001',
      desc: 'Prime corner residential plot on the GT Road growth corridor. Clear title, 30ft road, ready for registry. Walking distance to market and school.',
      owner: 'The Moon Estate', phone: '9719910070', email: 'sales@themoonestate.in',
      postedBy: 'Builder',
      images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80'],
      ts: Date.now() - 864e5 * 2
    },
    {
      id: 's2', listingType: 'sale', ptype: 'Independent House / Villa',
      title: '3 BHK Independent Villa with Garden', bhk: '3', bath: '3', furnish: 'Semi-Furnished',
      area: 1800, areaUnit: 'Sq. Ft.', price: 6500000,
      city: 'Aligarh', locality: 'Ramghat Road',
      address: 'Sector 4, Ramghat Road, Aligarh 202001',
      desc: 'Spacious 3 BHK villa with private garden, modular kitchen, car parking and 24x7 water supply in a gated community.',
      owner: 'Rajeev Sharma', phone: '9876543210', email: 'rajeev@example.com',
      postedBy: 'Owner',
      images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80'],
      ts: Date.now() - 864e5 * 5
    },
    {
      id: 's3', listingType: 'sale', ptype: 'Apartment / Flat',
      title: '2 BHK Ready-to-Move Flat', bhk: '2', bath: '2', furnish: 'Unfurnished',
      area: 1050, areaUnit: 'Sq. Ft.', price: 3900000,
      city: 'Agra', locality: 'Kamla Nagar',
      address: 'Tower B, Kamla Nagar, Agra 282005',
      desc: 'Bright 2 BHK on the 4th floor with lift, covered parking and power backup. Close to schools and the bypass.',
      owner: 'Sunita Verma', phone: '9001122334', email: 'sunita@example.com',
      postedBy: 'Owner',
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80'],
      ts: Date.now() - 864e5 * 1
    },
    {
      id: 's4', listingType: 'sale', ptype: 'Agricultural Land',
      title: '1 Acre Agricultural Land near Highway', bhk: '', bath: '', furnish: '',
      area: 1, areaUnit: 'Acre', price: 4500000,
      city: 'Etah', locality: 'Shitalpur',
      address: 'Shitalpur, off GT Road, Etah 207001',
      desc: 'Fertile 1-acre farmland with tube-well and road access. Ideal for farmhouse or future investment.',
      owner: 'Mahesh Yadav', phone: '9123456780', email: 'mahesh@example.com',
      postedBy: 'Agent / Dealer',
      images: ['https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80'],
      ts: Date.now() - 864e5 * 8
    },
    {
      id: 'r1', listingType: 'rent', ptype: 'Apartment / Flat',
      title: '2 BHK Semi-Furnished Flat for Rent', bhk: '2', bath: '2', furnish: 'Semi-Furnished',
      area: 950, areaUnit: 'Sq. Ft.', rent: 12000, deposit: 50000,
      availFrom: '', tenants: 'Family',
      city: 'Etah', locality: 'Civil Lines',
      address: 'Civil Lines, Etah 207001',
      desc: 'Well-maintained 2 BHK with wardrobes, geyser and covered parking. Family preferred. Market and bus stand nearby.',
      owner: 'Anil Gupta', phone: '9988776655', email: 'anil@example.com',
      postedBy: 'Owner',
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'],
      ts: Date.now() - 864e5 * 3
    },
    {
      id: 'r2', listingType: 'rent', ptype: 'Independent House / Villa',
      title: '3 BHK House for Rent with Parking', bhk: '3', bath: '3', furnish: 'Fully Furnished',
      area: 1600, areaUnit: 'Sq. Ft.', rent: 22000, deposit: 100000,
      availFrom: '', tenants: 'Anyone',
      city: 'Aligarh', locality: 'Marris Road',
      address: 'Marris Road, Aligarh 202001',
      desc: 'Fully furnished independent house with 2 car parking, modular kitchen and inverter backup. Prime location.',
      owner: 'Pooja Singh', phone: '9090909090', email: 'pooja@example.com',
      postedBy: 'Owner',
      images: ['https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=900&q=80'],
      ts: Date.now() - 864e5 * 4
    },
    {
      id: 'r3', listingType: 'rent', ptype: 'Commercial / Shop',
      title: 'Shop / Showroom for Rent on Main Road', bhk: '', bath: '1', furnish: 'Unfurnished',
      area: 400, areaUnit: 'Sq. Ft.', rent: 18000, deposit: 90000,
      availFrom: '', tenants: 'Company / Lease',
      city: 'Agra', locality: 'Sanjay Place',
      address: 'Sanjay Place, Agra 282002',
      desc: 'Ground-floor commercial shop with glass front on a busy main road. High footfall, ideal for retail or office.',
      owner: 'Imran Khan', phone: '9811122233', email: 'imran@example.com',
      postedBy: 'Agent / Dealer',
      images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80'],
      ts: Date.now() - 864e5 * 6
    }
  ];

  /* ---------- Storage ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) { localStorage.setItem(LS_KEY, JSON.stringify(SEED)); return SEED.slice(); }
      return JSON.parse(raw);
    } catch (e) { return SEED.slice(); }
  }
  function save(list) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); }
    catch (e) { alert('Could not save listing — your browser storage may be full. Try fewer/smaller photos.'); }
  }
  var listings = load();

  /* ---------- Helpers ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function inr(n) {
    n = Number(n) || 0;
    if (n >= 1e7) return '₹ ' + (n / 1e7).toFixed(n % 1e7 ? 2 : 0) + ' Cr';
    if (n >= 1e5) return '₹ ' + (n / 1e5).toFixed(n % 1e5 ? 2 : 0) + ' Lakh';
    if (n >= 1e3) return '₹ ' + (n / 1e3).toFixed(0) + 'K';
    return '₹ ' + n;
  }
  function priceLabel(l) {
    if (l.listingType === 'rent') return inr(l.rent) + ' /mo';
    return inr(l.price);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function placeholderImg(l) {
    var em = l.listingType === 'rent' ? '🔑' : '🏠';
    return 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280"><rect width="100%" height="100%" fill="#eef3f7"/><text x="50%" y="52%" font-size="64" text-anchor="middle">' + em + '</text></svg>');
  }
  function firstImg(l) { return (l.images && l.images[0]) || placeholderImg(l); }

  /* ---------- Tabs / panes ---------- */
  var browsePane = $('#browsePane'), postPane = $('#postPane');
  var currentMode = 'buy';

  function setMode(mode, scroll) {
    currentMode = mode;
    $$('#portalTabs .ptab').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-mode') === mode || (mode === 'rent' && b.getAttribute('data-mode') === 'rent'));
    });
    if (mode === 'post') {
      browsePane.classList.add('hidden');
      postPane.classList.remove('hidden');
    } else {
      postPane.classList.add('hidden');
      browsePane.classList.remove('hidden');
      renderResults();
    }
    if (scroll) {
      var top = $('#portal').getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  $$('#portalTabs .ptab').forEach(function (b) {
    b.addEventListener('click', function () { setMode(b.getAttribute('data-mode'), false); });
  });

  // Any element with data-mode (nav, hero, empty-state) routes here
  $$('[data-mode]').forEach(function (el) {
    if (el.closest('#portalTabs')) return;
    el.addEventListener('click', function (e) {
      var m = el.getAttribute('data-mode');
      if (m) { setMode(m, true); }
    });
  });

  /* ---------- Budget options ---------- */
  (function fillBudget() {
    var sel = $('#budgetSelect');
    var opts = [['', 'Any budget'], [1000000, 'Up to ₹10 Lakh'], [2500000, 'Up to ₹25 Lakh'],
      [5000000, 'Up to ₹50 Lakh'], [10000000, 'Up to ₹1 Cr'], [30000000, 'Up to ₹3 Cr']];
    sel.innerHTML = opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('');
  })();

  /* ---------- Search + render ---------- */
  var searchForm = $('#searchForm');
  searchForm.addEventListener('submit', function (e) { e.preventDefault(); renderResults(); });
  $('#searchQ').addEventListener('input', debounce(renderResults, 250));
  searchForm.querySelector('[name="ptype"]').addEventListener('change', renderResults);
  searchForm.querySelector('[name="bhk"]').addEventListener('change', renderResults);
  $('#budgetSelect').addEventListener('change', renderResults);

  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  function renderResults() {
    var wantType = currentMode === 'rent' ? 'rent' : 'sale';
    var fd = new FormData(searchForm);
    var q = (fd.get('q') || '').trim().toLowerCase();
    var ptype = fd.get('ptype') || '';
    var bhk = fd.get('bhk') || '';
    var budget = Number(fd.get('budget')) || 0;

    var pool = listings.filter(function (l) {
      if (l.listingType !== wantType) return false;
      if (ptype && l.ptype !== ptype) return false;
      if (bhk) {
        var b = parseInt(l.bhk, 10) || 0;
        if (bhk === '4' ? b < 4 : b !== parseInt(bhk, 10)) return false;
      }
      if (budget) {
        var val = wantType === 'rent' ? l.rent : l.price;
        if (Number(val) > budget) return false;
      }
      return true;
    });

    var exact = pool, nearby = [];
    if (q) {
      var matchCities = {};
      exact = pool.filter(function (l) {
        var hit = (l.locality || '').toLowerCase().indexOf(q) > -1 ||
                  (l.city || '').toLowerCase().indexOf(q) > -1 ||
                  (l.title || '').toLowerCase().indexOf(q) > -1;
        if (hit) matchCities[(l.city || '').toLowerCase()] = true;
        return hit;
      });
      nearby = pool.filter(function (l) {
        if (exact.indexOf(l) > -1) return false;
        return matchCities[(l.city || '').toLowerCase()]; // same city, other locality
      });
    }

    // newest first
    var byNew = function (a, b) { return b.ts - a.ts; };
    exact.sort(byNew); nearby.sort(byNew);

    var meta = $('#resultsMeta');
    var label = wantType === 'rent' ? 'rentals' : 'properties for sale';
    if (q) meta.innerHTML = '<strong>' + exact.length + '</strong> ' + label + ' in “' + esc(q) + '”';
    else meta.innerHTML = '<strong>' + exact.length + '</strong> ' + label + ' available';

    $('#resultsExact').innerHTML = exact.map(cardHTML).join('');
    var nh = $('#nearbyHead');
    if (nearby.length) { nh.hidden = false; $('#resultsNearby').innerHTML = nearby.map(cardHTML).join(''); }
    else { nh.hidden = true; $('#resultsNearby').innerHTML = ''; }

    $('#emptyState').hidden = exact.length + nearby.length > 0;
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
        if (e.target.closest('a') && !e.target.closest('[data-view]')) return;
        openModal(c.getAttribute('data-id'));
      });
    });
    // re-apply tilt to new cards
    if (window.applyTilt) window.applyTilt('.listing.tilt');
  }

  /* ---------- Detail modal ---------- */
  var modal = $('#modal'), modalBody = $('#modalBody');
  function openModal(id) {
    var l = listings.filter(function (x) { return x.id === id; })[0];
    if (!l) return;
    var imgs = (l.images && l.images.length) ? l.images : [firstImg(l)];
    var rows = [];
    rows.push(['Type', l.ptype]);
    if (l.bhk) rows.push(['Configuration', l.bhk + ' BHK']);
    if (l.bath) rows.push(['Bathrooms', l.bath]);
    if (l.area) rows.push(['Area', l.area + ' ' + l.areaUnit]);
    if (l.furnish) rows.push(['Furnishing', l.furnish]);
    if (l.listingType === 'rent') {
      if (l.deposit) rows.push(['Security Deposit', inr(l.deposit)]);
      if (l.availFrom) rows.push(['Available From', l.availFrom]);
      if (l.tenants) rows.push(['Preferred Tenants', l.tenants]);
    }
    rows.push(['Posted By', (l.postedBy || 'Owner')]);
    if (l.address) rows.push(['Address', l.address]);

    var msg = encodeURIComponent('Hi, I am interested in your property "' + l.title + '" (' + l.locality + ', ' + l.city + ') listed on The Moon Estate. Is it available?');
    var phone = String(l.phone || '').replace(/\D/g, '');
    var wa = phone ? '91' + phone.slice(-10) : '919719910070';

    modalBody.innerHTML = '' +
      '<div class="m-gallery" id="mGallery">' +
        '<img id="mMain" src="' + esc(imgs[0]) + '" alt="' + esc(l.title) + '" onerror="this.src=\'' + placeholderImg(l) + '\'" />' +
        (imgs.length > 1 ? '<div class="m-thumbs">' + imgs.map(function (s, i) {
          return '<img src="' + esc(s) + '" data-i="' + i + '" class="' + (i === 0 ? 'on' : '') + '" />';
        }).join('') + '</div>' : '') +
      '</div>' +
      '<div class="m-info">' +
        '<span class="tag ' + (l.listingType === 'rent' ? 'rent' : '') + '">' + (l.listingType === 'rent' ? 'For Rent' : 'For Sale') + '</span>' +
        '<h2>' + esc(l.title) + '</h2>' +
        '<p class="m-loc">📍 ' + esc(l.locality) + ', ' + esc(l.city) + '</p>' +
        '<div class="m-price">' + priceLabel(l) + '</div>' +
        (l.desc ? '<p class="m-desc">' + esc(l.desc) + '</p>' : '') +
        '<div class="m-table">' + rows.map(function (r) {
          return '<div><span>' + esc(r[0]) + '</span><strong>' + esc(r[1]) + '</strong></div>';
        }).join('') + '</div>' +
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

    // gallery thumbs
    $$('#mGallery .m-thumbs img').forEach(function (t) {
      t.addEventListener('click', function () {
        $('#mMain').src = t.src;
        $$('#mGallery .m-thumbs img').forEach(function (x) { x.classList.remove('on'); });
        t.classList.add('on');
      });
    });

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeModal() { modal.hidden = true; document.body.style.overflow = ''; }
  $$('[data-close]', modal).forEach(function (el) { el.addEventListener('click', closeModal); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  /* ---------- Post form: listing type toggle ---------- */
  var postForm = $('#postForm');
  function syncListingType() {
    var t = postForm.querySelector('[name="listingType"]:checked').value;
    var rent = t === 'rent';
    $$('.rentOnly', postForm).forEach(function (el) { el.hidden = !rent; el.querySelectorAll('input,select').forEach(function (i){ i.disabled = !rent; }); });
    $$('.saleOnly', postForm).forEach(function (el) { el.hidden = rent; el.querySelectorAll('input,select').forEach(function (i){ i.disabled = rent; }); });
    // required flags
    var price = postForm.querySelector('[name="price"]'); if (price) price.required = !rent;
    var rentF = postForm.querySelector('[name="rent"]'); if (rentF) rentF.required = rent;
  }
  $$('[name="listingType"]', postForm).forEach(function (r) { r.addEventListener('change', syncListingType); });
  syncListingType();

  /* ---------- Image upload (compressed to base64) ---------- */
  var pendingImages = [];
  var thumbs = $('#thumbs');
  $('#photoInput').addEventListener('change', function (e) {
    var files = Array.prototype.slice.call(e.target.files);
    files.forEach(function (f) {
      if (pendingImages.length >= 6) return;
      if (!/^image\//.test(f.type)) return;
      compress(f, function (dataUrl) {
        pendingImages.push(dataUrl);
        renderThumbs();
      });
    });
    e.target.value = '';
  });
  function renderThumbs() {
    thumbs.innerHTML = pendingImages.map(function (src, i) {
      return '<div class="thumb"><img src="' + src + '" /><button type="button" data-rm="' + i + '">×</button></div>';
    }).join('');
    $$('[data-rm]', thumbs).forEach(function (b) {
      b.addEventListener('click', function () {
        pendingImages.splice(parseInt(b.getAttribute('data-rm'), 10), 1);
        renderThumbs();
      });
    });
  }
  function compress(file, cb) {
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var max = 1000, w = img.width, h = img.height;
        if (w > h && w > max) { h = h * max / w; w = max; }
        else if (h > max) { w = w * max / h; h = max; }
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(c.toDataURL('image/jpeg', 0.72));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- Post submit ---------- */
  postForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var note = $('#postNote');
    var fd = new FormData(postForm);
    var phone = (fd.get('phone') || '').replace(/\D/g, '');
    if (phone.length < 10) { note.style.color = '#c0392b'; note.textContent = 'Please enter a valid 10-digit phone number.'; return; }

    var type = fd.get('listingType');
    var l = {
      id: 'u' + Date.now().toString(36),
      listingType: type,
      ptype: fd.get('ptype'),
      title: (fd.get('title') || '').trim(),
      bhk: fd.get('bhk') || '', bath: fd.get('bath') || '', furnish: fd.get('furnish') || '',
      area: Number(fd.get('area')) || '', areaUnit: fd.get('areaUnit'),
      city: (fd.get('city') || '').trim(),
      locality: (fd.get('locality') || '').trim(),
      address: (fd.get('address') || '').trim(),
      desc: (fd.get('desc') || '').trim(),
      owner: (fd.get('owner') || '').trim(),
      phone: phone, email: (fd.get('email') || '').trim(),
      postedBy: fd.get('postedBy') || 'Owner',
      images: pendingImages.slice(),
      ts: Date.now()
    };
    if (type === 'rent') {
      l.rent = Number(fd.get('rent')) || 0;
      l.deposit = Number(fd.get('deposit')) || 0;
      l.availFrom = fd.get('availFrom') || '';
      l.tenants = fd.get('tenants') || 'Anyone';
    } else {
      l.price = Number(fd.get('price')) || 0;
    }

    listings.unshift(l);
    save(listings);

    note.style.color = '';
    note.textContent = '✅ Your property is now live! Redirecting to your listing…';
    postForm.reset();
    pendingImages = []; renderThumbs(); syncListingType();

    setTimeout(function () {
      setMode(type === 'rent' ? 'rent' : 'buy', true);
      $('#searchQ').value = l.city;
      renderResults();
      setTimeout(function () { openModal(l.id); }, 400);
      note.textContent = '';
    }, 900);
  });

  /* ---------- Init ---------- */
  renderResults();

  // honour hash like #portal already handled by data-mode anchors
})();

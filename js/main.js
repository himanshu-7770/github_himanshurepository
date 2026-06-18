/* ===== The Moon Estate — interactions & 3D floating scene ===== */
(function () {
  'use strict';

  /* ---------- Loader ---------- */
  window.addEventListener('load', function () {
    setTimeout(function () {
      var l = document.getElementById('loader');
      if (l) l.classList.add('hide');
    }, 500);
  });

  /* ---------- Year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled state + mobile toggle ---------- */
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');

  function onScroll() {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
      toggle.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.classList.remove('open');
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.14 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- Animated counters ---------- */
  var counted = false;
  var statsWrap = document.querySelector('.hero-stats');
  function runCounters() {
    if (counted || !statsWrap) return;
    counted = true;
    document.querySelectorAll('.num[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var start = 0, dur = 1400, t0 = performance.now();
      function step(now) {
        var p = Math.min((now - t0) / dur, 1);
        var val = (start + (target - start) * (1 - Math.pow(1 - p, 3)));
        var isDecimal = suffix.indexOf('.') === 0 || suffix.indexOf('★') === 0;
        el.textContent = (target % 1 === 0 && !isDecimal ? Math.round(val) : val.toFixed(0)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
  var cIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) runCounters(); });
  }, { threshold: 0.4 });
  if (statsWrap) cIO.observe(statsWrap);

  /* ---------- 3D tilt on cards (pointer parallax) ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canTilt = !reduce && window.matchMedia('(pointer:fine)').matches;
  window.applyTilt = function (selector) {
    if (!canTilt) return;
    document.querySelectorAll(selector || '.tilt').forEach(function (el) {
      if (el._tilt) return;            // avoid double-binding
      el._tilt = true;
      var queued = false, lx = 0, ly = 0;
      el.addEventListener('mousemove', function (ev) {
        var r = el.getBoundingClientRect();
        lx = (ev.clientX - r.left) / r.width - 0.5;
        ly = (ev.clientY - r.top) / r.height - 0.5;
        if (queued) return;            // throttle to one update per frame
        queued = true;
        requestAnimationFrame(function () {
          queued = false;
          el.style.transform = 'perspective(900px) rotateX(' + (-ly * 7).toFixed(2) +
            'deg) rotateY(' + (lx * 9).toFixed(2) + 'deg) translateY(-4px)';
        });
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  };
  window.applyTilt('.tilt');

  /* ---------- Contact form (front-end only demo) ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function () {
      var note = document.getElementById('formNote');
      var name = form.querySelector('[name="name"]').value.trim();
      var phone = form.querySelector('[name="phone"]').value.trim();
      if (!name || !phone) {
        note.textContent = 'Please add your name and phone number.';
        note.style.color = '#c0392b';
        return;
      }
      var interest = form.querySelector('[name="interest"]').value.trim();
      var msg = form.querySelector('[name="message"]').value.trim();
      var text = 'Hello, I am ' + name + ' (' + phone + ').' +
        (interest ? ' Interested in: ' + interest + '.' : '') +
        (msg ? ' ' + msg : '');
      note.textContent = 'Opening WhatsApp to send your enquiry…';
      note.style.color = '';
      // also save the enquiry as a lead (so it's captured in the dashboard)
      if (window.Store && window.Store.addLead) {
        var digits = phone.replace(/\D/g, '');
        window.Store.addLead({
          id: 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
          name: name, phone: digits, message: msg,
          propertyTitle: interest ? 'Website form: ' + interest : 'Website contact form',
          city: '', ts: Date.now()
        }).catch(function () {});
      }
      setTimeout(function () {
        window.open('https://wa.me/919719910070?text=' + encodeURIComponent(text), '_blank');
        form.reset();
      }, 600);
    });
  }

  /* ---------- 3D floating hero scene (Three.js) ---------- */
  var canvas = document.getElementById('scene3d');
  if (!canvas || typeof THREE === 'undefined' || reduce) return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 13);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  // Lower resolution on touch devices to keep things smooth
  var coarse = window.matchMedia('(pointer:coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1 : 1.5));

  // Lights — soft, warm, elegant
  scene.add(new THREE.AmbientLight(0xfff4e0, 0.9));
  var key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(5, 8, 8);
  scene.add(key);
  var gold = new THREE.PointLight(0xc9a24a, 1.6, 40);
  gold.position.set(-6, 3, 6);
  scene.add(gold);

  var group = new THREE.Group();
  scene.add(group);

  // Materials: light glass + gold accents
  var matLight = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.92 });
  var matGold = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.3, metalness: 0.85 });
  var matSoft = new THREE.MeshStandardMaterial({ color: 0xeef3f7, roughness: 0.4, metalness: 0.15, transparent: true, opacity: 0.9 });

  // A cluster of floating "buildings" — abstract skyline
  var heights = [3.4, 4.6, 2.6, 5.2, 3.0, 4.0];
  var towers = [];
  heights.forEach(function (h, i) {
    var w = 0.9 + (i % 3) * 0.18;
    var geo = new THREE.BoxGeometry(w, h, w);
    var mat = i % 3 === 0 ? matGold : (i % 2 === 0 ? matLight : matSoft);
    var m = new THREE.Mesh(geo, mat.clone());
    m.position.set((i - 2.5) * 1.35, h / 2 - 2.4, (i % 2 ? -1 : 1) * 0.6);
    group.add(m);
    towers.push(m);
  });

  // Floating accent spheres
  var spheres = [];
  for (var s = 0; s < 5; s++) {
    var sg = new THREE.SphereGeometry(0.22 + Math.random() * 0.2, 24, 24);
    var sm = new THREE.Mesh(sg, s % 2 ? matGold.clone() : matLight.clone());
    sm.position.set((Math.random() - 0.5) * 11, (Math.random() - 0.2) * 6, (Math.random() - 0.5) * 5);
    sm.userData.sp = 0.4 + Math.random() * 0.6;
    sm.userData.off = Math.random() * Math.PI * 2;
    group.add(sm);
    spheres.push(sm);
  }

  // Ground ring (subtle, elegant)
  var ring = new THREE.Mesh(
    new THREE.TorusGeometry(6.5, 0.04, 16, 120),
    new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.8, roughness: 0.3, transparent: true, opacity: 0.5 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -2.5;
  group.add(ring);

  group.rotation.x = 0.12;

  var mouseX = 0, mouseY = 0, tgX = 0, tgY = 0;
  window.addEventListener('mousemove', function (e) {
    tgX = (e.clientX / window.innerWidth - 0.5);
    tgY = (e.clientY / window.innerHeight - 0.5);
  });

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  var clock = new THREE.Clock();

  // Pause rendering when the hero is off-screen or the tab is hidden,
  // and cap the frame rate — prevents stutter/jank on low-end phones.
  var heroVisible = true, pageVisible = true;
  document.addEventListener('visibilitychange', function () { pageVisible = !document.hidden; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; }, { threshold: 0.01 }).observe(canvas);
  }
  var last = 0, frameMs = 1000 / 30;
  function animate(now) {
    requestAnimationFrame(animate);
    if (!heroVisible || !pageVisible) return;        // skip work when not visible
    if (now - last < frameMs) return;                // cap ~30fps
    last = now;
    resize();
    var t = clock.getElapsedTime();

    mouseX += (tgX - mouseX) * 0.05;
    mouseY += (tgY - mouseY) * 0.05;

    group.rotation.y = t * 0.12 + mouseX * 0.6;
    group.rotation.x = 0.12 + mouseY * 0.3;

    towers.forEach(function (m, i) {
      m.position.y += Math.sin(t * 0.8 + i) * 0.0016;
    });
    spheres.forEach(function (sm) {
      sm.position.y += Math.sin(t * sm.userData.sp + sm.userData.off) * 0.004;
    });
    ring.rotation.z = t * 0.2;

    renderer.render(scene, camera);
  }
  resize();
  requestAnimationFrame(animate);
})();

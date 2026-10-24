/* ملایر نامه | mn_app.js */
(function () {
  var base = document.documentElement.getAttribute('data-base') || '';

  /* mobile menu + dropdown */
  var hb = document.getElementById('mn-hb'), hd = document.getElementById('mn-header');
  if (hb && hd) hb.addEventListener('click', function () {
    var o = hd.classList.toggle('open'); hb.setAttribute('aria-expanded', o);
  });
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.mn-dd[open]').forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute('open'); });
  });

  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* hero slider */
  var sl = document.querySelector('[data-slider]');
  if (sl) {
    var slides = [].slice.call(sl.querySelectorAll('.mn-slide')), dots = [].slice.call(sl.querySelectorAll('.mn-sdot')), cur2 = 0, timer = null;
    var show = function (n) {
      cur2 = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('active', i === cur2); s.tabIndex = i === cur2 ? 0 : -1; });
      dots.forEach(function (d, i) { d.classList.toggle('active', i === cur2); });
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    var go = function () { stop(); if (!calm && slides.length > 1) timer = setInterval(function () { show(cur2 + 1); }, 5500); };
    dots.forEach(function (d, i) { d.addEventListener('click', function () { show(i); go(); }); });
    sl.addEventListener('mouseenter', stop); sl.addEventListener('mouseleave', go);
    sl.addEventListener('focusin', stop); sl.addEventListener('focusout', go);
    var x0 = null;
    sl.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    sl.addEventListener('touchend', function (e) {
      if (x0 !== null) { var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(cur2 + (dx < 0 ? 1 : -1)); }
      x0 = null; go();
    }, { passive: true });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else go(); });
    go();
  }

  /* scroll-in for cards */
  var rv = [].slice.call(document.querySelectorAll('.mn-card,.mn-cat,.mn-promo,.mn-poster'));
  if (rv.length) {
    if (!('IntersectionObserver' in window) || calm) { rv.forEach(function (n) { n.classList.add('in'); }); }
    else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
      rv.forEach(function (n) {
        var sib = [].indexOf.call(n.parentNode.children, n);
        n.style.setProperty('--i', sib % 5);
        io.observe(n);
      });
    }
  }

  /* search (home page) */
  var q = document.getElementById('mn-q'), res = document.getElementById('mn-res'), idx = null;
  function norm(s) { return (s || '').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[\u200c\u064B-\u0652]/g, '').toLowerCase(); }
  function load(cb) {
    if (idx) return cb();
    fetch(base + '/assets/mn_index.json').then(function (r) { return r.json(); })
      .then(function (d) { idx = d; cb(); }).catch(function () { idx = []; cb(); });
  }
  function show() {
    var terms = norm(q.value).split(/\s+/).filter(Boolean);
    res.replaceChildren();
    if (!terms.length) { res.hidden = true; return; }
    var hits = idx.filter(function (p) { var t = norm(p.t); return terms.every(function (w) { return t.indexOf(w) > -1; }); }).slice(0, 12);
    if (!hits.length) {
      var n = document.createElement('li'); n.className = 'mn-none'; n.textContent = 'موردی پیدا نشد.'; res.append(n);
    }
    hits.forEach(function (p) {
      var li = document.createElement('li'), a = document.createElement('a'), s = document.createElement('small');
      a.href = p.u; a.append(document.createTextNode(p.t)); s.textContent = p.c; a.append(s); li.append(a); res.append(li);
    });
    res.hidden = false;
  }
  if (q && res) {
    q.addEventListener('input', function () { load(show); });
    q.addEventListener('focus', function () { load(function () { if (q.value) show(); }); });
    document.addEventListener('click', function (e) { if (!q.parentNode.contains(e.target)) res.hidden = true; });
  }

  /* music player */
  var box = document.getElementById('mn-player');
  if (!box || !window.MN_SONGS) return;
  var songs = window.MN_SONGS, audio = new Audio(), cur = -1;
  audio.preload = 'none';
  var $ = function (id) { return document.getElementById(id); };
  var seek = $('mn-seek'), msg = $('mn-msg'), ico = $('mn-ico').querySelector('path');
  var PLAY = 'M8 5v14l11-7z', PAUSE = 'M6 5h4v14H6zM14 5h4v14h-4z';
  function fmt(t) { if (!isFinite(t)) return '0:00'; var m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + (s < 10 ? '0' : '') + s; }
  function pick(i, go) {
    if (!songs.length) return;
    cur = (i + songs.length) % songs.length;
    var s = songs[cur]; msg.textContent = ''; audio.src = s.src;
    $('mn-now').textContent = s.title; $('mn-now-s').textContent = s.style;
    seek.value = 0; $('mn-tc').textContent = '0:00'; $('mn-td').textContent = '0:00';
    document.querySelectorAll('.mn-track').forEach(function (t) { t.classList.toggle('active', +t.dataset.i === cur); });
    if (go) audio.play().catch(function () {});
  }
  document.querySelectorAll('.mn-track').forEach(function (t) { t.addEventListener('click', function () { pick(+t.dataset.i, true); }); });
  $('mn-play').addEventListener('click', function () { if (cur < 0) pick(0, true); else if (audio.paused) audio.play().catch(function () {}); else audio.pause(); });
  $('mn-prev').addEventListener('click', function () { pick(cur < 0 ? 0 : cur - 1, true); });
  $('mn-next').addEventListener('click', function () { pick(cur < 0 ? 0 : cur + 1, true); });
  audio.addEventListener('play', function () { box.classList.add('playing'); ico.setAttribute('d', PAUSE); $('mn-play').setAttribute('aria-label', 'توقف'); });
  audio.addEventListener('pause', function () { box.classList.remove('playing'); ico.setAttribute('d', PLAY); $('mn-play').setAttribute('aria-label', 'پخش'); });
  audio.addEventListener('loadedmetadata', function () { $('mn-td').textContent = fmt(audio.duration); });
  audio.addEventListener('timeupdate', function () { $('mn-tc').textContent = fmt(audio.currentTime); if (audio.duration) seek.value = audio.currentTime / audio.duration * 1000; });
  audio.addEventListener('ended', function () { pick(cur + 1, true); });
  audio.addEventListener('error', function () { box.classList.remove('playing'); msg.textContent = 'فایل صوتی پیدا نشد. نام فایل را در mn_music.txt بررسی کن.'; });
  seek.addEventListener('input', function () { if (audio.duration) audio.currentTime = seek.value / 1000 * audio.duration; });
  if (songs.length) pick(0, false);
})();

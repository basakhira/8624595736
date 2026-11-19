/* Public site: Supabase theke lekha ar chobi niye page-e boshay.
   script.js-er pore load hoy (index.html dekhun). */
(function () {
  'use strict';

  var cfg = window.SITE_CONFIG || {};
  function $(id) { return document.getElementById(id); }

  var yearEl = $('year');
  if (yearEl && !yearEl.textContent) yearEl.textContent = new Date().getFullYear();

  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || /^PASTE/.test(cfg.SUPABASE_URL)) return;

  var base = cfg.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/';
  var headers = { apikey: cfg.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + cfg.SUPABASE_ANON_KEY };

  function get(query) {
    return fetch(base + query, { headers: headers }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function setText(id, value) {
    var el = $(id);
    if (el && value) el.textContent = value;
  }

  function setLink(id, href) {
    var el = $(id);
    if (!el) return;
    if (href) { el.href = href; el.style.display = ''; }
    else { el.style.display = 'none'; }
  }

  function applySettings(s) {
    if (!s) return;
    setText('heroName', s.name);
    setText('wordmark', s.name);
    setText('footerName', s.name);
    setText('tagline', s.tagline);
    setText('bigPhone', s.phone);
    if (s.name) document.title = s.name + (s.tagline ? ' — ' + s.tagline : '');

    setLink('mainBookBtn', s.book_link);
    setLink('whatsappLink', s.whatsapp);
    setLink('instagramLink', s.instagram);
    setLink('emailLink', s.email ? 'mailto:' + s.email : '');

    if (s.hero_url) {
      var img = $('heroImg');
      if (img) {
        img.src = s.hero_url;
        img.alt = s.name || '';
        img.style.display = 'block';
      }
      var ph = document.querySelector('#heroPhoto .placeholder');
      if (ph) ph.style.display = 'none';
    }
  }

  /* ---- Lightbox (chobi boro kore dekha) ---- */
  var lb = $('lightbox');
  var lbImg = $('lightboxImg');
  var lbClose = $('lightboxClose');

  function openLightbox(src) {
    if (!lb || !lbImg) return;
    lbImg.src = src;
    lb.classList.add('open', 'active', 'show');
    lb.style.cssText = 'display:flex;position:fixed;top:0;left:0;right:0;bottom:0;' +
      'align-items:center;justify-content:center;background:rgba(58,18,32,.92);z-index:1000;';
    lbImg.style.maxWidth = '92vw';
    lbImg.style.maxHeight = '88vh';
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('open', 'active', 'show');
    lb.style.display = 'none';
    if (lbImg) lbImg.src = '';
  }

  if (lbClose) lbClose.addEventListener('click', function (e) { e.stopPropagation(); closeLightbox(); });
  if (lb) lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });

  function renderGallery(rows) {
    var grid = $('galleryGrid');
    if (!grid || !rows || !rows.length) return;
    grid.innerHTML = '';
    rows.forEach(function (row) {
      var fig = document.createElement('figure');
      fig.className = 'photo gallery-item';
      var img = document.createElement('img');
      img.src = row.url;
      img.alt = 'Gallery photo';
      img.loading = 'lazy';
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function () { openLightbox(row.url); });
      fig.appendChild(img);
      grid.appendChild(fig);
    });
  }

  get('site_settings?select=*&id=eq.1')
    .then(function (rows) { applySettings(rows[0]); })
    .catch(function (e) { console.warn('Settings load hoyni:', e); });

  get('gallery?select=url&order=created_at.desc')
    .then(renderGallery)
    .catch(function (e) { console.warn('Gallery load hoyni:', e); });
})();

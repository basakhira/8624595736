/* Admin panel — email + password diye login, tarpor site-er sob kichu change.
   Supabase (supabase-setup.sql) lagbe. */
(function () {
  'use strict';

  var cfg = window.SITE_CONFIG || {};
  function $(id) { return document.getElementById(id); }

  var logEl = $('log');
  function log(msg) {
    var t = new Date().toLocaleTimeString();
    var old = logEl.textContent === 'Ready.' ? '' : logEl.textContent;
    logEl.textContent = '[' + t + '] ' + msg + (old ? '\n' + old : '');
  }
  function fail(prefix, err) {
    var m = (err && err.message) ? err.message : String(err);
    if (/row-level security|policy|permission|not authorized|403/i.test(m)) {
      m += ' — এই ইমেইলটি supabase-setup.sql এ দেওয়া owner ইমেইলের সাথে মেলে না।';
    }
    log('❌ ' + prefix + ': ' + m);
  }

  if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || /^PASTE/.test(cfg.SUPABASE_URL)) {
    $('loginErr').textContent = 'config.js এ Supabase URL আর key এখনো বসানো হয়নি (README.txt দেখুন)।';
    $('loginBtn').disabled = true;
    return;
  }

  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  var BUCKET = 'photos';

  var TEXT_FIELDS = [
    ['name', 'fName'], ['tagline', 'fTagline'], ['phone', 'fPhone'],
    ['book_link', 'fBookLink'], ['whatsapp', 'fWhatsapp'],
    ['instagram', 'fInstagram'], ['email', 'fEmail']
  ];

  /* ---------- helpers ---------- */
  function withBusy(btn, label, fn) {
    var old = btn.textContent;
    btn.disabled = true;
    btn.textContent = label;
    return Promise.resolve().then(fn).catch(function (e) { fail('Error', e); }).then(function () {
      btn.disabled = false;
      btn.textContent = old;
    });
  }

  // Boro chobi choto kore (max 1600px, JPEG) — upload druto hoy, site-o druto khole
  function resizeImage(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var scale = Math.min(1, maxSide / Math.max(w, h));
        w = Math.round(w * scale); h = Math.round(h * scale);
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          if (b) resolve(b); else reject(new Error('ছবি কনভার্ট করা যায়নি'));
        }, 'image/jpeg', quality);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('"' + file.name + '" ছবিটা পড়া যায়নি (JPG বা PNG দিন)'));
      };
      img.src = url;
    });
  }

  function uploadImage(folder, file) {
    return resizeImage(file, 1600, 0.85).then(function (blob) {
      var path = folder + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
      return sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
        .then(function (res) {
          if (res.error) throw res.error;
          var pub = sb.storage.from(BUCKET).getPublicUrl(path);
          return { path: path, url: pub.data.publicUrl };
        });
    });
  }

  /* ---------- load data ---------- */
  function loadSettings() {
    return sb.from('site_settings').select('*').eq('id', 1).maybeSingle().then(function (res) {
      if (res.error) { fail('Settings load hoyni', res.error); return; }
      var s = res.data || {};
      TEXT_FIELDS.forEach(function (pair) { $(pair[1]).value = s[pair[0]] || ''; });
      var prev = $('heroPreview');
      if (s.hero_url) { prev.src = s.hero_url; prev.hidden = false; }
      else { prev.hidden = true; }
    });
  }

  function loadGallery() {
    return sb.from('gallery').select('*').order('created_at', { ascending: false }).then(function (res) {
      if (res.error) { fail('Gallery load hoyni', res.error); return; }
      var list = $('galleryList');
      list.innerHTML = '';
      (res.data || []).forEach(function (row) {
        var box = document.createElement('div');
        var img = document.createElement('img');
        img.src = row.url;
        img.alt = '';
        img.loading = 'lazy';
        var del = document.createElement('button');
        del.type = 'button';
        del.title = 'Delete';
        del.textContent = '×';
        del.addEventListener('click', function () { deletePhoto(row); });
        box.appendChild(img);
        box.appendChild(del);
        list.appendChild(box);
      });
    });
  }

  function deletePhoto(row) {
    if (!window.confirm('এই ছবিটা মুছে ফেলবেন?')) return;
    sb.storage.from(BUCKET).remove([row.path]).then(function (r1) {
      if (r1.error) throw r1.error;
      return sb.from('gallery').delete().eq('id', row.id);
    }).then(function (r2) {
      if (r2.error) throw r2.error;
      log('✅ ছবি মুছে ফেলা হয়েছে।');
      return loadGallery();
    }).catch(function (e) { fail('Delete hoyni', e); });
  }

  /* ---------- actions ---------- */
  $('saveText').addEventListener('click', function () {
    withBusy($('saveText'), 'Saving...', function () {
      var row = { id: 1, updated_at: new Date().toISOString() };
      TEXT_FIELDS.forEach(function (pair) { row[pair[0]] = $(pair[1]).value.trim(); });
      return sb.from('site_settings').upsert(row).then(function (res) {
        if (res.error) throw res.error;
        log('✅ লেখা সেভ হয়েছে। সাইটে নতুন তথ্য দেখতে পেজ রিফ্রেশ করুন।');
      });
    });
  });

  $('uploadHero').addEventListener('click', function () {
    var file = $('heroFile').files[0];
    if (!file) { log('আগে একটা ছবি সিলেক্ট করুন।'); return; }
    withBusy($('uploadHero'), 'Uploading...', function () {
      var oldPath = null;
      return sb.from('site_settings').select('hero_path').eq('id', 1).maybeSingle().then(function (r) {
        oldPath = r.data && r.data.hero_path;
        return uploadImage('hero', file);
      }).then(function (up) {
        return sb.from('site_settings')
          .upsert({ id: 1, hero_url: up.url, hero_path: up.path, updated_at: new Date().toISOString() })
          .then(function (res) {
            if (res.error) throw res.error;
            if (oldPath) sb.storage.from(BUCKET).remove([oldPath]);
            $('heroFile').value = '';
            $('heroPreview').src = up.url;
            $('heroPreview').hidden = false;
            log('✅ মেইন ছবি আপলোড হয়েছে।');
          });
      });
    });
  });

  $('uploadGallery').addEventListener('click', function () {
    var files = Array.prototype.slice.call($('galleryFiles').files);
    if (!files.length) { log('আগে এক বা একাধিক ছবি সিলেক্ট করুন।'); return; }
    withBusy($('uploadGallery'), 'Uploading...', function () {
      var done = 0;
      return files.reduce(function (chain, file, i) {
        return chain.then(function () {
          log('(' + (i + 1) + '/' + files.length + ') আপলোড হচ্ছে: ' + file.name);
          return uploadImage('gallery', file).then(function (up) {
            return sb.from('gallery').insert({ url: up.url, path: up.path }).then(function (res) {
              if (res.error) throw res.error;
              done++;
            });
          }).catch(function (e) { fail(file.name + ' upload hoyni', e); });
        });
      }, Promise.resolve()).then(function () {
        $('galleryFiles').value = '';
        log('✅ ' + done + 'টি ছবি গ্যালারিতে যোগ হয়েছে।');
        return loadGallery();
      });
    });
  });

  /* ---------- login / logout ---------- */
  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    $('loginErr').textContent = '';
    var btn = $('loginBtn');
    btn.disabled = true;
    sb.auth.signInWithPassword({
      email: $('loginEmail').value.trim(),
      password: $('loginPassword').value
    }).then(function (res) {
      if (res.error) {
        $('loginErr').textContent = /invalid/i.test(res.error.message)
          ? 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।' : res.error.message;
      } else {
        $('loginPassword').value = '';
      }
    }).catch(function (err) {
      $('loginErr').textContent = err.message || String(err);
    }).then(function () { btn.disabled = false; });
  });

  $('logoutBtn').addEventListener('click', function () { sb.auth.signOut(); });

  var shownFor = null;
  function showState(session) {
    var user = session && session.user;
    var id = user ? user.id : null;
    if (id === shownFor) return;
    shownFor = id;

    $('loginCard').hidden = !!user;
    $('panel').hidden = !user;
    $('logoutBtn').hidden = !user;
    $('whoAmI').hidden = !user;
    $('whoAmI').textContent = user ? user.email : '';

    if (user) {
      log('✅ Login hoyeche: ' + user.email);
      loadSettings();
      loadGallery();
    }
  }

  sb.auth.onAuthStateChange(function (_event, session) { showState(session); });
  sb.auth.getSession().then(function (res) { showState(res.data && res.data.session); });
})();

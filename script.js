// ---------- mobile nav ----------
const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');
navToggle.addEventListener('click', () => {
  const open = siteNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});
siteNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => siteNav.classList.remove('open')));

document.getElementById('year').textContent = new Date().getFullYear();

// ---------- falling hearts ----------
const heartsLayer = document.getElementById('hearts');
const HEART_COUNT = 22;
for (let i = 0; i < HEART_COUNT; i++) {
  const span = document.createElement('span');
  span.textContent = '♥';
  span.style.left = Math.random() * 100 + 'vw';
  span.style.fontSize = (14 + Math.random() * 18) + 'px';
  span.style.animationDuration = (7 + Math.random() * 8) + 's';
  span.style.animationDelay = (Math.random() * 10) + 's';
  span.style.opacity = (0.4 + Math.random() * 0.5).toFixed(2);
  heartsLayer.appendChild(span);
}

// ---------- lightbox ----------
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
function closeLightbox(){ lightbox.classList.remove('open'); lightboxImg.src=''; }
function openLightbox(src, alt){
  lightboxImg.src = src; lightboxImg.alt = alt || '';
  lightbox.classList.add('open');
}

// ---------- load content.json and render ----------
fetch('content.json?t=' + Date.now())
  .then(r => r.json())
  .then(renderContent)
  .catch(() => { /* keep the defaults already in the HTML */ });

function renderContent(data){
  if (data.name){
    document.title = data.name + ' — ' + (data.tagline || 'Portfolio');
    document.getElementById('heroName').textContent = data.name;
    document.getElementById('wordmark').textContent = data.name;
    document.getElementById('footerName').textContent = data.name;
  }
  if (data.tagline) document.getElementById('tagline').textContent = data.tagline;

  if (data.hero){
    const img = document.getElementById('heroImg');
    img.src = data.hero + '?t=' + Date.now();
    img.alt = data.name || '';
    img.style.display = 'block';
    document.getElementById('heroPhoto').querySelector('.placeholder').style.display = 'none';
  }

  if (data.phone) document.getElementById('bigPhone').textContent = data.phone;

  // Book Now buttons (nav, hero, contact) all point to the custom link once set.
  // Until it's set, they just scroll down to the contact section.
  if (data.bookLink){
    ['navBookBtn','heroBookBtn','mainBookBtn'].forEach(id => {
      const el = document.getElementById(id);
      el.href = data.bookLink;
      el.target = '_blank';
      el.rel = 'noopener';
    });
  } else {
    const mainBtn = document.getElementById('mainBookBtn');
    mainBtn.href = data.whatsapp || '#';
    if (data.whatsapp){ mainBtn.target = '_blank'; mainBtn.rel = 'noopener'; }
  }

  const waLink = document.getElementById('whatsappLink');
  const igLink = document.getElementById('instagramLink');
  const emailLink = document.getElementById('emailLink');
  if (data.whatsapp) waLink.href = data.whatsapp; else waLink.style.display = 'none';
  if (data.instagram) igLink.href = data.instagram; else igLink.style.display = 'none';
  if (data.email){ emailLink.href = 'mailto:' + data.email; } else { emailLink.style.display = 'none'; }

  const grid = document.getElementById('galleryGrid');
  const emptyMsg = document.getElementById('galleryEmpty');
  if (Array.isArray(data.gallery) && data.gallery.length){
    emptyMsg.remove();
    data.gallery.forEach(src => {
      const fig = document.createElement('figure');
      const img = document.createElement('img');
      img.src = src + '?t=' + Date.now();
      img.alt = '';
      img.loading = 'lazy';
      fig.appendChild(img);
      fig.addEventListener('click', () => openLightbox(img.src, ''));
      grid.appendChild(fig);
    });
  }
}

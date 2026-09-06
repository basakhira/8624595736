// ============================================================
// SETTINGS (saved in this browser only)
// ============================================================
const settingsFields = ['ghOwner','ghRepo','ghBranch','ghToken'];
settingsFields.forEach(id => {
  const saved = localStorage.getItem('site_' + id);
  if (saved) document.getElementById(id).value = saved;
});

document.getElementById('saveSettings').addEventListener('click', () => {
  settingsFields.forEach(id => {
    localStorage.setItem('site_' + id, document.getElementById(id).value.trim());
  });
  log('Setup saved in this browser.');
  loadContent();
});

function getSettings(){
  return {
    owner: localStorage.getItem('site_ghOwner') || '',
    repo: localStorage.getItem('site_ghRepo') || '',
    branch: localStorage.getItem('site_ghBranch') || 'main',
    token: localStorage.getItem('site_ghToken') || ''
  };
}

function settingsReady(){
  const s = getSettings();
  if (!s.owner || !s.repo || !s.token){
    log('Uporer "One-time setup" ta pura kore Save korun (username, repo, token).');
    return false;
  }
  return true;
}

// ============================================================
// LOG
// ============================================================
const logEl = document.getElementById('log');
function log(msg){
  const time = new Date().toLocaleTimeString();
  logEl.textContent += `\n[${time}] ${msg}`;
  logEl.scrollTop = logEl.scrollHeight;
}

// ============================================================
// GITHUB CONTENTS API HELPERS
// ============================================================
function apiUrl(path){
  const s = getSettings();
  return `https://api.github.com/repos/${s.owner}/${s.repo}/contents/${path}`;
}

async function ghGetFile(path){
  const s = getSettings();
  const res = await fetch(apiUrl(path) + `?ref=${s.branch}`, {
    headers: {
      'Authorization': 'token ' + s.token,
      'Accept': 'application/vnd.github+json'
    }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json(); // { sha, content (base64), ... }
}

async function ghPutFile(path, base64Content, message, sha){
  const s = getSettings();
  const body = { message, content: base64Content, branch: s.branch };
  if (sha) body.sha = sha;
  const res = await fetch(apiUrl(path), {
    method: 'PUT',
    headers: {
      'Authorization': 'token ' + s.token,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok){
    const errText = await res.text();
    throw new Error(`Save failed for ${path}: ${res.status} ${errText}`);
  }
  return res.json();
}

async function readContentJson(){
  const file = await ghGetFile('content.json');
  if (!file) return { name:'', tagline:'', phone:'', whatsapp:'', instagram:'', email:'', hero:'', gallery:[] };
  const json = decodeURIComponent(escape(atob(file.content.replace(/\n/g,''))));
  return JSON.parse(json);
}

async function writeContentJson(data){
  const existing = await ghGetFile('content.json');
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
  await ghPutFile('content.json', encoded, 'Update site content', existing ? existing.sha : undefined);
}

// ============================================================
// IMAGE RESIZE (keeps uploads under the API's 1MB limit)
// ============================================================
function resizeImage(file, maxWidth = 1600, quality = 0.82){
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = e => { img.src = e.target.result; };
    reader.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl.split(',')[1]); // base64 only
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================
// LOAD CURRENT CONTENT INTO THE FORM
// ============================================================
let currentData = null;

async function loadContent(){
  if (!settingsReady()) return;
  try{
    log('Loading current content...');
    currentData = await readContentJson();
    document.getElementById('fName').value = currentData.name || '';
    document.getElementById('fTagline').value = currentData.tagline || '';
    document.getElementById('fPhone').value = currentData.phone || '';
    document.getElementById('fWhatsapp').value = currentData.whatsapp || '';
    document.getElementById('fInstagram').value = currentData.instagram || '';
    document.getElementById('fEmail').value = currentData.email || '';
    renderGalleryList();
    log('Loaded.');
  } catch(err){
    log('Error: ' + err.message);
  }
}

function renderGalleryList(){
  const wrap = document.getElementById('galleryList');
  wrap.innerHTML = '';
  (currentData.gallery || []).forEach((path, idx) => {
    const div = document.createElement('div');
    const img = document.createElement('img');
    img.src = 'https://raw.githubusercontent.com/' + getSettings().owner + '/' + getSettings().repo + '/' + getSettings().branch + '/' + path;
    const btn = document.createElement('button');
    btn.textContent = '×';
    btn.title = 'Remove from gallery';
    btn.addEventListener('click', () => removeGalleryImage(idx));
    div.appendChild(img);
    div.appendChild(btn);
    wrap.appendChild(div);
  });
}

async function removeGalleryImage(idx){
  currentData.gallery.splice(idx, 1);
  try{
    await writeContentJson(currentData);
    log('Photo removed from gallery. Site will update in ~30-60 sec.');
    renderGalleryList();
  } catch(err){ log('Error: ' + err.message); }
}

// ============================================================
// ACTIONS
// ============================================================
document.getElementById('saveText').addEventListener('click', async () => {
  if (!settingsReady()) return;
  try{
    if (!currentData) currentData = await readContentJson();
    currentData.name = document.getElementById('fName').value.trim();
    currentData.tagline = document.getElementById('fTagline').value.trim();
    currentData.phone = document.getElementById('fPhone').value.trim();
    currentData.whatsapp = document.getElementById('fWhatsapp').value.trim();
    currentData.instagram = document.getElementById('fInstagram').value.trim();
    currentData.email = document.getElementById('fEmail').value.trim();
    log('Saving text...');
    await writeContentJson(currentData);
    log('Saved! Wait about 30-60 seconds, then refresh your live site.');
  } catch(err){ log('Error: ' + err.message); }
});

document.getElementById('uploadHero').addEventListener('click', async () => {
  if (!settingsReady()) return;
  const fileInput = document.getElementById('heroFile');
  const file = fileInput.files[0];
  if (!file){ log('Please choose a photo first.'); return; }
  try{
    log('Uploading main photo...');
    const base64 = await resizeImage(file, 1600, 0.82);
    const path = 'images/hero.jpg';
    const existing = await ghGetFile(path);
    await ghPutFile(path, base64, 'Update main photo', existing ? existing.sha : undefined);
    if (!currentData) currentData = await readContentJson();
    currentData.hero = path;
    await writeContentJson(currentData);
    log('Main photo uploaded! Wait about 30-60 seconds, then refresh your live site.');
    fileInput.value = '';
  } catch(err){ log('Error: ' + err.message); }
});

document.getElementById('uploadGallery').addEventListener('click', async () => {
  if (!settingsReady()) return;
  const fileInput = document.getElementById('galleryFiles');
  const files = Array.from(fileInput.files || []);
  if (!files.length){ log('Please choose at least one photo.'); return; }
  try{
    if (!currentData) currentData = await readContentJson();
    if (!Array.isArray(currentData.gallery)) currentData.gallery = [];
    for (let i = 0; i < files.length; i++){
      log(`Uploading photo ${i + 1} of ${files.length}...`);
      const base64 = await resizeImage(files[i], 1600, 0.82);
      const path = `images/gallery-${Date.now()}-${i}.jpg`;
      await ghPutFile(path, base64, 'Add gallery photo', undefined);
      currentData.gallery.push(path);
    }
    await writeContentJson(currentData);
    log('Gallery updated! Wait about 30-60 seconds, then refresh your live site.');
    fileInput.value = '';
    renderGalleryList();
  } catch(err){ log('Error: ' + err.message); }
});

// Try loading on page open if setup already saved
loadContent();

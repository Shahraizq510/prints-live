// 1) Set this to your coffee link
const COFFEE_URL = "https://ko-fi.com/interestingsoup?ref=prints";

// 2) Repo URL shown in footer
const REPO_URL = "https://github.com/shahraizq510/prints-live";

// 3) Stream URL (MJPEG)
const STREAM_URL = 'https://prints.qureshi.io';

// 4) Status endpoint (JSON)
const STATUS_URL = 'https://printstatus.qureshi.io/status';

// Default value shown for everyone (owner updates this by telling me: "printing ...")
const CURRENTLY_PRINTING_DEFAULT = 'Leaper - Arc Raiders';

const els = {
  year: document.getElementById('year'),
  status: document.getElementById('status'),
  reload: document.getElementById('reload'),
  coffeeBtn: document.getElementById('coffeeBtn'),
  coffeeNote: document.getElementById('coffeeNote'),
  ghLink: document.getElementById('ghLink'),

  currentlyPrinting: document.getElementById('currentlyPrinting'),
  progressPct: document.getElementById('progressPct'),
  progressBar: document.getElementById('progressBar'),
  etaText: document.getElementById('etaText'),
};

els.year.textContent = new Date().getFullYear();

function setStatus(state, text){
  els.status.classList.remove('good','bad');
  if(state) els.status.classList.add(state);
  els.status.querySelector('span:last-child').textContent = text;
}

// Coffee button wiring
if (COFFEE_URL && /^https?:\/\//i.test(COFFEE_URL)) {
  els.coffeeBtn.href = COFFEE_URL;
  els.coffeeNote.style.display = 'none';
} else {
  els.coffeeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Set your coffee link in script.js (COFFEE_URL).');
  });
}

// Footer repo link wiring
if (REPO_URL && /^https?:\/\//i.test(REPO_URL)) {
  els.ghLink.href = REPO_URL;
  els.ghLink.textContent = 'View source on GitHub';
}

// --- Stream reconnect logic ---
let loadedOnce = false;
let currentImg = document.getElementById('mjpeg');

function wireImg(img){
  img.addEventListener('load', () => {
    loadedOnce = true;
    setStatus('good', 'Live');
  });
  img.addEventListener('error', () => {
    setStatus('bad', 'Stream error');
  });
}

wireImg(currentImg);

function reconnectStream(){
  setStatus(null, 'Reconnecting…');

  const next = currentImg.cloneNode(false);
  next.src = STREAM_URL; // no query params

  currentImg.replaceWith(next);
  currentImg = next;
  wireImg(currentImg);

  setTimeout(() => {
    if (!loadedOnce) setStatus('bad', 'Not loading (tap Reload)');
  }, 6000);
}

els.reload.addEventListener('click', reconnectStream);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') reconnectStream();
});

window.addEventListener('pageshow', (e) => {
  if (e.persisted) reconnectStream();
});

// --- Currently Printing (owner-controlled) ---
function readPrinting(){
  const hash = (location.hash || '').slice(1);
  const params = new URLSearchParams(hash);
  const v = params.get('printing');

  if (v && v.trim()) {
    const text = decodeURIComponent(v).trim();
    els.currentlyPrinting.textContent = text;
    try { localStorage.setItem('currentlyPrinting', text); } catch {}
    return;
  }

  try {
    const saved = localStorage.getItem('currentlyPrinting');
    if (saved) {
      els.currentlyPrinting.textContent = saved;
      return;
    }
  } catch {}

  els.currentlyPrinting.textContent = CURRENTLY_PRINTING_DEFAULT || '—';
}

window.addEventListener('hashchange', readPrinting);
readPrinting();

// --- Status (progress + ETA) ---
function formatEtaSeconds(totalSeconds){
  if (typeof totalSeconds !== 'number' || !isFinite(totalSeconds) || totalSeconds < 0) return '—';
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function renderStatus(data){
  const progress = Math.max(0, Math.min(100, Number(data?.progress)));
  const eta = Number(data?.eta);

  if (Number.isFinite(progress)) {
    els.progressPct.textContent = String(Math.round(progress));
    els.progressBar.style.width = `${progress}%`;
  } else {
    els.progressPct.textContent = '—';
    els.progressBar.style.width = '0%';
  }

  els.etaText.textContent = formatEtaSeconds(eta);
}

async function fetchStatus(){
  try {
    const res = await fetch(STATUS_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    renderStatus(json);
  } catch {
    // Leave previous values; don't spam errors
  }
}

fetchStatus();
setInterval(fetchStatus, 15000);

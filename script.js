// 1) Set this to your coffee link (BuyMeACoffee / Ko-fi / Stripe link)
const COFFEE_URL = "https://ko-fi.com/YOUR_HANDLE";

// 2) Repo URL shown in footer
const REPO_URL = "https://github.com/shahraizq510/prints-live";

// 3) Stream URL (MJPEG)
const STREAM_URL = 'https://prints.qureshi.io';

const els = {
  year: document.getElementById('year'),
  status: document.getElementById('status'),
  reload: document.getElementById('reload'),
  coffeeBtn: document.getElementById('coffeeBtn'),
  coffeeNote: document.getElementById('coffeeNote'),
  ghLink: document.getElementById('ghLink'),
  currentlyPrinting: document.getElementById('currentlyPrinting'),
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
// Key point: your MJPEG endpoint returns 400 when query params are present.
// So we reconnect WITHOUT adding ?t=... .
// On mobile browsers, the reliable way is to replace the <img> node entirely.

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
// Set it by updating the site (tell me: "Printing X"), OR by visiting:
// https://.../#printing=Leaper%20-%20Arc%20Raiders
function readPrintingFromHash(){
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
    if (saved) els.currentlyPrinting.textContent = saved;
  } catch {}
}

window.addEventListener('hashchange', readPrintingFromHash);
readPrintingFromHash();

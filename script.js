// 1) Set this to your coffee link (BuyMeACoffee / Ko-fi / Stripe link)
const COFFEE_URL = "https://ko-fi.com/YOUR_HANDLE";

// 2) Optional: repo URL shown in footer
const REPO_URL = "https://github.com/shahraizq510/prints-live";

const STREAM_URL = 'https://prints.qureshi.io';

const els = {
  year: document.getElementById('year'),
  status: document.getElementById('status'),
  reload: document.getElementById('reload'),
  copyLink: document.getElementById('copyLink'),
  coffeeBtn: document.getElementById('coffeeBtn'),
  coffeeNote: document.getElementById('coffeeNote'),
  ghLink: document.getElementById('ghLink'),
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
// So we must reconnect WITHOUT adding ?t=... .
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

  // If we still haven't loaded after a bit, show a clearer status.
  setTimeout(() => {
    if (!loadedOnce) setStatus('bad', 'Not loading (tap Reload)');
  }, 6000);
}

els.reload.addEventListener('click', reconnectStream);

els.copyLink.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(STREAM_URL);
    els.copyLink.textContent = 'Copied!';
    setTimeout(() => els.copyLink.textContent = 'Copy stream link', 1200);
  } catch {
    prompt('Copy stream link:', STREAM_URL);
  }
});

// When returning to the tab/app, try reconnecting (Android usually needs this; iOS often doesn’t).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') reconnectStream();
});

// When restored from back-forward cache
window.addEventListener('pageshow', (e) => {
  if (e.persisted) reconnectStream();
});

// 1) Set this to your coffee link (BuyMeACoffee / Ko-fi / Stripe link)
const COFFEE_URL = "https://ko-fi.com/YOUR_HANDLE";

// 2) Optional: set your repo URL later (shows in footer)
const REPO_URL = "https://github.com/shahraizq510/prints-live";

const els = {
  year: document.getElementById('year'),
  mjpeg: document.getElementById('mjpeg'),
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
} else {
  els.ghLink.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Optional: set REPO_URL in script.js after you create the repo.');
  });
}

// Stream handling
// Mobile browsers (esp. iOS Safari) often kill MJPEG <img> connections when backgrounded.
// We auto-reload on resume, and we retry after errors.
const STREAM_BASE_URL = 'https://prints.qureshi.io';

let loadedOnce = false;
let retryTimer = null;

function scheduleRetry(ms = 1500) {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    // Avoid hammering the stream while backgrounded
    if (document.visibilityState === 'visible') reloadStream();
  }, ms);
}

els.mjpeg.addEventListener('load', () => {
  loadedOnce = true;
  setStatus('good', 'Live');
});

els.mjpeg.addEventListener('error', () => {
  setStatus('bad', 'Stream error');
  scheduleRetry();
});

// Best-effort: after a few seconds, if we haven't loaded, mark as maybe-blocked.
setTimeout(() => {
  if (!loadedOnce) setStatus('bad', 'Not loading (blocked?)');
}, 6000);

function reloadStream(){
  setStatus(null, 'Reloading…');

  // Bust cache by appending a timestamp query param.
  // Also hard-reset src first to force a new connection.
  const url = STREAM_BASE_URL + '?t=' + Date.now();
  els.mjpeg.src = '';
  requestAnimationFrame(() => {
    els.mjpeg.src = url + bust;
  });
}

els.reload.addEventListener('click', reloadStream);

els.copyLink.addEventListener('click', async () => {
  const url = STREAM_BASE_URL;
  try {
    await navigator.clipboard.writeText(url);
    els.copyLink.textContent = 'Copied!';
    setTimeout(() => els.copyLink.textContent = 'Copy stream link', 1200);
  } catch {
    prompt('Copy stream link:', url);
  }
});

// Auto-recover when returning to the tab/app
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') reloadStream();
});

// When restored from back-forward cache
window.addEventListener('pageshow', (e) => {
  if (e.persisted) reloadStream();
});

// Kick the stream once on initial load with a cache-busted URL
reloadStream();

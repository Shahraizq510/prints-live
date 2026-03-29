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

// Stream status
let loadedOnce = false;
els.mjpeg.addEventListener('load', () => {
  loadedOnce = true;
  setStatus('good', 'Live');
});
els.mjpeg.addEventListener('error', () => {
  setStatus('bad', 'Stream error');
});

// Best-effort: after a few seconds, if we haven't loaded, mark as maybe-blocked.
setTimeout(() => {
  if (!loadedOnce) setStatus('bad', 'Not loading (blocked?)');
}, 6000);

function reloadStream(){
  setStatus(null, 'Reloading…');
  // Bust cache by appending a timestamp query param
  const base = 'https://prints.qureshi.io';
  els.mjpeg.src = base + (base.includes('?') ? '&' : '?') + 't=' + Date.now();
}

els.reload.addEventListener('click', reloadStream);

els.copyLink.addEventListener('click', async () => {
  const url = 'https://prints.qureshi.io';
  try {
    await navigator.clipboard.writeText(url);
    els.copyLink.textContent = 'Copied!';
    setTimeout(() => els.copyLink.textContent = 'Copy stream link', 1200);
  } catch {
    prompt('Copy stream link:', url);
  }
});

// 1) Set this to your coffee link
const COFFEE_URL = "https://ko-fi.com/interestingsoup?ref=prints";

// 2) Repo URL shown in footer
const REPO_URL = "https://github.com/shahraizq510/prints-live";

// 3) Stream URL (MJPEG)
const STREAM_URL = 'https://prints.qureshi.io';

// 4) Status endpoint (JSON)
const STATUS_URL = 'https://printstatus.interestingsoup.com/status';

// 5) Past prints endpoint
const PAST_PRINTS_URL = 'https://printstatus.interestingsoup.com/past-prints';

// Default value shown when API has no print name
const CURRENTLY_PRINTING_DEFAULT = 'Idle';

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

  pastGrid: document.getElementById('pastGrid'),
  pastEmpty: document.getElementById('pastEmpty'),
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
  next.src = STREAM_URL;

  currentImg.replaceWith(next);
  currentImg = next;
  wireImg(currentImg);

  setTimeout(() => {
    if (!loadedOnce) setStatus('bad', 'Not loading (tap Reload)');
  }, 6000);
}

els.reload.addEventListener('click', reconnectStream);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    reconnectStream();
    fetchStatus();          // re-fetch print status immediately
    restartStatusInterval(); // ensure the 15s poll is alive
  }
});

window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    reconnectStream();
    fetchStatus();
    restartStatusInterval();
  }
});

// --- Status (progress + ETA + print name) ---
function formatEtaSeconds(totalSeconds){
  if (typeof totalSeconds !== 'number' || !isFinite(totalSeconds) || totalSeconds < 0) return '—';
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function renderStatus(data){
  const progressRaw = Number(data?.progress);
  const etaRaw = Number(data?.eta);

  if (Number.isFinite(progressRaw)) {
    const progress = Math.max(0, Math.min(100, progressRaw));
    els.progressPct.textContent = String(Math.round(progress));
    els.progressBar.style.width = `${progress}%`;
  } else {
    els.progressPct.textContent = '—';
    els.progressBar.style.width = '0%';
  }

  els.etaText.textContent = formatEtaSeconds(etaRaw);

  // Auto-update "Currently Printing" from printer data
  if (data?.printName) {
    els.currentlyPrinting.textContent = data.printName;
  } else {
    els.currentlyPrinting.textContent = CURRENTLY_PRINTING_DEFAULT;
  }
}

function renderStatusUnavailable(){
  els.progressPct.textContent = '—';
  els.progressBar.style.width = '0%';
  els.etaText.textContent = '—';
  els.currentlyPrinting.textContent = '—';
}

async function fetchStatus(){
  try {
    const res = await fetch(STATUS_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    renderStatus(json);
  } catch {
    renderStatusUnavailable();
  }
}

let statusInterval = null;
function restartStatusInterval(){
  if (statusInterval) clearInterval(statusInterval);
  statusInterval = setInterval(fetchStatus, 15000);
}

fetchStatus();
restartStatusInterval();

// --- Past Prints (Timelapses) ---
async function fetchPastPrints(){
  try {
    const res = await fetch(PAST_PRINTS_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const prints = await res.json();

    if (!prints.length) {
      els.pastEmpty.textContent = 'No timelapses yet — they\'ll appear here after your next print!';
      els.pastEmpty.style.display = '';
      els.pastGrid.innerHTML = '';
      return;
    }

    els.pastEmpty.style.display = 'none';
    els.pastGrid.innerHTML = prints.map(p => `
      <div class="pastCard">
        <img class="pastGif" src="${escapeHtml(p.gifUrl)}" alt="${escapeHtml(p.name)}" loading="lazy" />
        <div class="pastInfo">
          <div class="pastName">${escapeHtml(p.name)}</div>
          <div class="pastMeta">${escapeHtml(p.date)} · ${p.frames} frames</div>
        </div>
      </div>
    `).join('');
  } catch {
    els.pastEmpty.textContent = 'Couldn\'t load past prints.';
    els.pastEmpty.style.display = '';
  }
}

function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

fetchPastPrints();

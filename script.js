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

// SVG icons for action buttons
const ICONS = {
  shop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
  stl: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  desc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
};

function buildActionBtn(icon, label, url) {
  if (!url) return '';
  return `<a class="pastAction" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(label)}">${icon}<span>${escapeHtml(label)}</span></a>`;
}

function handleCardClick(card) {
  const isExpanded = card.classList.contains('expanded');

  // Collapse any other expanded card
  document.querySelectorAll('.pastCard.expanded').forEach(c => {
    if (c !== card) {
      c.classList.remove('expanded');
      const img = c.querySelector('.pastGif');
      if (img && img.dataset.src) { img.src = img.dataset.src; }
    }
  });

  if (isExpanded) {
    // Collapse: swap back to GIF
    card.classList.remove('expanded');
    const img = card.querySelector('.pastGif');
    if (img && img.dataset.src) { img.src = img.dataset.src; }
  } else {
    // Expand: swap to final photo if available
    card.classList.add('expanded');
    const img = card.querySelector('.pastGif');
    const photoUrl = card.dataset.photoUrl;
    if (img && photoUrl) {
      img.src = photoUrl;
    }
  }
}

// Description modal
function showDescription(name, description) {
  // Remove existing modal if any
  document.querySelector('.descModal')?.remove();

  const modal = document.createElement('div');
  modal.className = 'descModal';
  modal.innerHTML = `
    <div class="descBackdrop"></div>
    <div class="descContent">
      <div class="descTitle">${escapeHtml(name)}</div>
      <div class="descText">${escapeHtml(description)}</div>
      <button class="ghost descClose" type="button">Close</button>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('open'));

  const close = () => {
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 200);
  };
  modal.querySelector('.descBackdrop').addEventListener('click', close);
  modal.querySelector('.descClose').addEventListener('click', close);
}

async function fetchPastPrints(){
  try {
    const res = await fetch(PAST_PRINTS_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const prints = await res.json();

    // Newest first by completedAt timestamp
    prints.sort((a, b) => new Date(b.completedAt || b.date) - new Date(a.completedAt || a.date));

    if (!prints.length) {
      els.pastEmpty.textContent = 'No timelapses yet — they\'ll appear here after your next print!';
      els.pastEmpty.style.display = '';
      els.pastGrid.innerHTML = '';
      return;
    }

    els.pastEmpty.style.display = 'none';

    const hasAnyActions = prints.some(p => p.shopUrl || p.stlUrl || p.printDetails);

    els.pastGrid.innerHTML = prints.map((p, i) => {
      const actions = [];
      if (p.shopUrl) actions.push(buildActionBtn(ICONS.shop, 'Shop', p.shopUrl));
      if (p.stlUrl) actions.push(buildActionBtn(ICONS.stl, 'STL', p.stlUrl));
      if (p.printDetails) actions.push(
        `<button class="pastAction pastDescBtn" data-idx="${i}" title="Details">${ICONS.desc}<span>Info</span></button>`
      );

      const isInteractive = actions.length > 0 || p.productPhotoUrl;

      return `
      <div class="pastCard${p.productPhotoUrl ? ' hasPhoto' : ''}${isInteractive ? ' interactive' : ''}"
           data-photo-url="${escapeHtml(p.productPhotoUrl || '')}"
           data-idx="${i}">
        <div class="pastImgWrap">
          <img class="pastGif" data-src="${escapeHtml(p.gifUrl)}" alt="${escapeHtml(p.name)}" />
          ${isInteractive ? '<div class="pastTapHint">Tap to expand</div>' : ''}
        </div>
        ${actions.length ? `<div class="pastActions">${actions.join('')}</div>` : ''}
        <div class="pastInfo">
          <div class="pastName">${escapeHtml(p.name)}</div>
          <div class="pastMeta">${escapeHtml(p.date)} · ${p.frames} frames</div>
        </div>
      </div>`;
    }).join('');

    // Store prints data for description lookups
    els.pastGrid._printsData = prints;

    // Wire up card clicks (expand/collapse)
    els.pastGrid.querySelectorAll('.pastCard.interactive').forEach(card => {
      card.querySelector('.pastImgWrap')?.addEventListener('click', (e) => {
        handleCardClick(card);
      });
    });

    // Wire up description buttons (stop propagation so card doesn't toggle)
    els.pastGrid.querySelectorAll('.pastDescBtn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.idx);
        const p = els.pastGrid._printsData[idx];
        if (p?.printDetails) showDescription(p.name, p.printDetails);
      });
    });

    // Lazy-load GIFs as they scroll into view
    const lazyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          lazyObserver.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    els.pastGrid.querySelectorAll('img[data-src]').forEach(img => lazyObserver.observe(img));
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

function qs(name, defaultValue = null) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || defaultValue;
}

function safe(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function renderDifficultyButtons(current) {
  const diffs = { normal: 'Normal', heroic: 'Heroic', mythic: 'Mythic' };
  const container = document.getElementById('difficulty-buttons');
  container.innerHTML = '';
  const group = document.createElement('div');
  group.className = 'btn-group';
  Object.entries(diffs).forEach(([key, label]) => {
    const btn = document.createElement('a');
    btn.className = 'btn btn-outline-secondary' + (current === key ? ' active' : '');
    btn.href = `?boss=${encodeURIComponent(bossSlug)}&diff=${key}`;
    btn.textContent = label;
    group.appendChild(btn);
  });
  container.appendChild(group);
}

function createMechanicCard(mech) {
  const card = document.createElement('div');
  card.className = 'col-12 col-md-6';
  card.innerHTML = `
        <div class="mechanic-card p-4">
          <div class="d-flex align-items-start mb-3">
            ${mech.icon ? `<img src="${safe(mech.icon)}" alt="${safe(mech.title)}" class="ability-icon me-3" />` : ''}
            <div>
              <h3 class="mb-1"><a href="${safe(mech.wowhead || '#')}" target="_blank" rel="noopener">${safe(mech.title)}</a>${mech.subtitle ? ' – ' + safe(mech.subtitle) : ''}</h3>
              ${mech.description ? `<p class="mechanic-text mb-0 mt-2">${safe(mech.description)}</p>` : ''}
            </div>
          </div>
          ${mech.note ? `<p class="text-muted small">${safe(mech.note)}</p>` : ''}
          <p>${safe(mech.details || '')}</p>
          <div class="mechanic-action">
            <div class="mechanic-action-actor">${safe(mech.who || 'Všichni')}</div>
            <div class="mechanic-action-do">${safe(mech.what || '')}</div>
          </div>
        </div>
      `;
  return card;
}

function renderMechanicWithVideo(mech, diff, index) {
  const diffs = mech.difficulties || ['normal', 'heroic', 'mythic'];
  if (!diffs.includes(diff)) return null; // skip non-applicable

  const cardOnLeft = index % 2 === 0;
  const wrapper = document.createElement('div');
  wrapper.className = 'mechanic-row row align-items-center mb-5';
  wrapper.dataset.diff = diffs.join(' ');

  const cardCell = createMechanicCard(mech);
  const videoCell = document.createElement('div');
  videoCell.className = 'col-12 col-md-6 mb-3 mb-md-0';
  videoCell.innerHTML = `
        <div class="video-wrapper">
          <video controls muted loop preload="metadata" style="width: 100%; height: auto">
            <source src="${safe(mech.video)}" type="video/mp4" />
            Váš prohlížeč nepodporuje video.
          </video>
        </div>
      `;

  if (cardOnLeft) {
    wrapper.appendChild(cardCell);
    wrapper.appendChild(videoCell);
  } else {
    wrapper.appendChild(videoCell);
    wrapper.appendChild(cardCell);
  }

  return wrapper;
}

function renderPhase(phase, diff) {
  const section = document.createElement('div');
  section.className = 'section-card';

  const title = document.createElement('h2');
  title.className = 'section-title';
  title.textContent = phase.title;
  section.appendChild(title);

  if (phase.notes && phase.notes.length) {
    const ul = document.createElement('ul');
    for (const note of phase.notes) {
      const li = document.createElement('li');
      li.textContent = note;
      ul.appendChild(li);
    }
    section.appendChild(ul);
  }

  if (phase.mechanics && phase.mechanics.length) {
    const pendingNoVideo = [];
    let noVideoIndex = 0;

    const flushNoVideo = () => {
      while (pendingNoVideo.length >= 2) {
        const row = document.createElement('div');
        row.className = 'row g-4';

        const first = pendingNoVideo.shift();
        const second = pendingNoVideo.shift();

        first.card.classList.add('no-video-card');
        second.card.classList.add('no-video-card', 'no-video-offset');

        row.appendChild(first.card);
        row.appendChild(second.card);
        section.appendChild(row);
      }

      if (pendingNoVideo.length === 1) {
        const { card, pos } = pendingNoVideo.shift();
        card.classList.add('no-video-card');
        if (pos % 2 === 1) {
          card.classList.add('no-video-right');
        }
        const row = document.createElement('div');
        row.className = 'row g-4';
        row.appendChild(card);
        section.appendChild(row);
      }
    };

    phase.mechanics.forEach((mech, idx) => {
      const diffs = mech.difficulties || ['normal', 'heroic', 'mythic'];
      if (!diffs.includes(diff)) return;

      const hasVideo = mech.video && mech.video.trim().length;
      if (hasVideo) {
        flushNoVideo();
        const node = renderMechanicWithVideo(mech, diff, idx);
        if (node) section.appendChild(node);
      } else {
        pendingNoVideo.push({ card: createMechanicCard(mech), pos: noVideoIndex });
        noVideoIndex += 1;
      }
    });

    flushNoVideo();
  }

  return section;
}

const bossSlug = qs('boss');
const diff = qs('diff', 'normal');

import { renderNav } from './nav.js';

async function loadBoss() {
  if (!bossSlug) {
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').textContent = 'Chybí parametr boss (např. ?boss=vaelgor-and-ezzorak).';
    return;
  }

  await renderNav(bossSlug);

  try {
    const res = await fetch(`data/bosses/${encodeURIComponent(bossSlug)}.json`);
    if (!res.ok) throw new Error('Boss neexistuje');
    const boss = await res.json();

    document.title = boss.title + ' | Midnight Raid Taktiky CZ';
    document.getElementById('boss-title').textContent = boss.title;

    const wowheadEl = document.getElementById('boss-wowhead');
    wowheadEl.innerHTML = '';
    if (boss.wowhead) {
      const a = document.createElement('a');
      a.href = boss.wowhead;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'text-info small';
      a.textContent = `Wowhead: ${boss.title}`;
      wowheadEl.appendChild(a);
      wowheadEl.style.display = '';
    } else {
      wowheadEl.style.display = 'none';
    }

    if (boss.setup) {
      document.getElementById('boss-setup').innerHTML = `<strong>Setup:</strong> ${safe(boss.setup)}`;
    } else {
      document.getElementById('boss-setup').innerHTML = '';
    }

    const noteEl = document.getElementById('boss-note');
    if (boss.note) {
      noteEl.innerHTML = safe(boss.note);
      noteEl.style.display = '';
    } else {
      noteEl.style.display = 'none';
    }

    if (boss.overview && boss.overview.length) {
      const ov = document.getElementById('boss-overview');
      const ul = document.getElementById('boss-overview-list');
      boss.overview.forEach(line => {
        const li = document.createElement('li');
        li.textContent = line;
        ul.appendChild(li);
      });
      ov.style.display = 'block';
    }

    renderDifficultyButtons(diff);

    const container = document.getElementById('phases-container');
    if (boss.phases && boss.phases.length) {
      boss.phases.forEach(phase => {
        container.appendChild(renderPhase(phase, diff));
      });
    }

    const source = document.getElementById('source-link');
    source.innerHTML = `<strong>Zdroj:</strong> <a href="https://www.mythictrap.com/en/vs-dr-mqd/${encodeURIComponent(bossSlug)}" target="_blank" rel="noopener">MythicTrap – ${safe(boss.title)}</a>`;
  } catch (err) {
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').textContent = 'Nepodařilo se načíst data pro boss: ' + bossSlug;
  }
}

loadBoss();

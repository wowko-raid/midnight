import { renderNav } from './nav.js';

async function loadBossCards() {
  try {
    const resp = await fetch('data/bosses/list.json');
    const bosses = await resp.json();

    const raidInfo = {
      voidspire: {
        title: 'The Voidspire',
        description: '5 bossů: Imperator, Vorasius, Fallen King, Vaelgor & Ezzorak, Lightblinded Vanguard'
      },
      dreamrift: {
        title: 'The Dreamrift',
        description: '1 boss: Chimaerus, the Undreamt God'
      },
      'march-on-quel-danas': {
        title: "March on Quel'Danas",
        description: '2 bossové: Beloren & L\'ura'
      },
      other: {
        title: 'Ostatní bossové',
        description: 'Bossové, kteří ještě nemají přiřazený raid (aktualizuj data/bosses/list.json).'
      }
    };

    const normalizeRaid = raw =>
      (raw || 'other')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '');

    const bossesByRaid = bosses.reduce((acc, boss) => {
      const raid = normalizeRaid(boss.raid);
      if (!acc[raid]) acc[raid] = [];
      acc[raid].push(boss);
      return acc;
    }, {});

    const raidOrder = ['voidspire', 'dreamrift', 'march-on-quel-danas', 'other'];

    const container = document.getElementById('raid-list');

    function makeCard(boss) {
      const col = document.createElement('div');
      col.className = 'col-12 col-lg-6';
      const card = document.createElement('article');
      card.className = 'boss-card h-100';

      const title = document.createElement('h3');
      const link = document.createElement('a');
      link.href = `boss.html?boss=${encodeURIComponent(boss.slug)}`;
      link.className = 'text-white text-decoration-none';
      link.textContent = boss.title;
      title.appendChild(link);
      card.appendChild(title);

      if (boss.setup) {
        const setup = document.createElement('p');
        setup.className = 'role-plan';
        setup.innerHTML = `<strong>Setup:</strong> ${boss.setup}`;
        card.appendChild(setup);
      }

      if (boss.overview && boss.overview.length) {
        const ul = document.createElement('ul');
        for (const line of boss.overview) {
          const li = document.createElement('li');
          li.textContent = line;
          ul.appendChild(li);
        }
        card.appendChild(ul);
      }

      const footer = document.createElement('div');
      footer.className = 'card-footer';
      const button = document.createElement('a');
      button.className = 'btn btn-sm btn-primary w-100';
      button.href = `boss.html?boss=${encodeURIComponent(boss.slug)}`;
      button.textContent = 'Otevřít taktiku';
      footer.appendChild(button);
      card.appendChild(footer);

      col.appendChild(card);
      return col;
    }

    function makeRaidSection(raidKey, bosses) {
      const raid = raidInfo[raidKey] || { title: raidKey, description: '' };

      const section = document.createElement('section');
      section.id = raidKey;
      section.className = 'section-card mb-5';

      const title = document.createElement('h2');
      title.className = 'section-title';
      title.textContent = raid.title;
      section.appendChild(title);

      if (raid.description) {
        const desc = document.createElement('p');
        desc.className = 'raid-description mb-4';
        desc.textContent = raid.description;
        section.appendChild(desc);
      }

      const row = document.createElement('div');
      row.className = 'row g-4';
      bosses.forEach(boss => row.appendChild(makeCard(boss)));
      section.appendChild(row);

      return section;
    }

    raidOrder.forEach(raidKey => {
      const bossesForRaid = bossesByRaid[raidKey] || [];
      if (bossesForRaid.length) {
        container.appendChild(makeRaidSection(raidKey, bossesForRaid));
      }
    });
  } catch (err) {
    console.error(err);
    const container = document.getElementById('raid-list');
    container.innerHTML = `<div class="col-12"><div class="alert alert-danger">Nepodařilo se načíst seznam bossů.</div></div>`;
  }
}

(async () => {
  await renderNav();
  loadBossCards();
})();

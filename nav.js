function normalizeRaidKey(raw) {
  if (!raw) return 'other';
  return raw
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}

async function buildNavItems(bosses, activeBossSlug) {
  const raidOrder = [
    { key: 'voidspire', title: 'The Voidspire' },
    { key: 'dreamrift', title: 'The Dreamrift' },
    { key: 'march-on-quel-danas', title: "March on Quel'Danas" }
  ];

  const bossesByRaid = bosses.reduce((acc, boss) => {
    const raid = normalizeRaidKey(boss.raid);
    if (!acc[raid]) acc[raid] = [];
    acc[raid].push(boss);
    return acc;
  }, {});

  const navList = document.createElement('ul');
  navList.className = 'navbar-nav ms-auto mb-2 mb-lg-0';

  const makeBossLink = boss => {
    const a = document.createElement('a');
    a.className = 'dropdown-item' + (boss.slug === activeBossSlug ? ' active' : '');
    a.href = `boss.html?boss=${encodeURIComponent(boss.slug)}`;
    a.textContent = boss.title;
    if (boss.slug === activeBossSlug) a.setAttribute('aria-current', 'page');
    return a;
  };

  const makeRaidDropdown = (raidTitle, bosses) => {
    const li = document.createElement('li');
    li.className = 'nav-item dropdown';

    const a = document.createElement('a');
    a.className = 'nav-link dropdown-toggle';
    a.href = `#${raidTitle.toLowerCase().replace(/\s+/g, '-')}`;
    a.setAttribute('role', 'button');
    a.setAttribute('data-bs-toggle', 'dropdown');
    a.setAttribute('aria-expanded', 'false');
    a.textContent = raidTitle;
    li.appendChild(a);

    const menu = document.createElement('ul');
    menu.className = 'dropdown-menu dropdown-menu-dark';
    bosses.forEach(boss => {
      const item = document.createElement('li');
      item.appendChild(makeBossLink(boss));
      menu.appendChild(item);
    });

    li.appendChild(menu);
    return li;
  };

  raidOrder.forEach(raid => {
    const list = bossesByRaid[raid.key] || [];
    if (list.length) {
      navList.appendChild(makeRaidDropdown(raid.title, list));
    }
  });

  const githubLi = document.createElement('li');
  githubLi.className = 'nav-item';
  const ghLink = document.createElement('a');
  ghLink.className = 'nav-link';
  ghLink.href = 'https://github.com/wowko-raid/midnight';
  ghLink.target = '_blank';
  ghLink.rel = 'noopener';
  ghLink.textContent = 'GitHub';
  githubLi.appendChild(ghLink);
  navList.appendChild(githubLi);

  return navList;
}

export async function renderNav(activeBossSlug = null) {
  const container = document.getElementById('main-nav-placeholder');
  if (!container) return;

  const nav = document.createElement('nav');
  nav.className = 'navbar navbar-expand-lg navbar-dark nav-glass sticky-top';

  const inner = document.createElement('div');
  inner.className = 'container';

  const brand = document.createElement('a');
  brand.className = 'navbar-brand fw-semibold';
  brand.href = 'index.html';
  brand.textContent = 'WoW: Midnight raid taktiky';

  const toggle = document.createElement('button');
  toggle.className = 'navbar-toggler';
  toggle.type = 'button';
  toggle.setAttribute('data-bs-toggle', 'collapse');
  toggle.setAttribute('data-bs-target', '#mainNav');
  toggle.setAttribute('aria-controls', 'mainNav');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Přepnout navigaci');
  toggle.innerHTML = '<span class="navbar-toggler-icon"></span>';

  const collapse = document.createElement('div');
  collapse.className = 'collapse navbar-collapse';
  collapse.id = 'mainNav';

  const bosses = await fetch('data/bosses/list.json').then(r => r.json());
  const navList = await buildNavItems(bosses, activeBossSlug);
  collapse.appendChild(navList);

  inner.appendChild(brand);
  inner.appendChild(toggle);
  inner.appendChild(collapse);
  nav.appendChild(inner);

  container.replaceWith(nav);
}

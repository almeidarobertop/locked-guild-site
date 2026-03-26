let membersData = [],
  showAll = false,
  hasRendered = false;

const MAX_VISIBLE = 50,
  tableWrapper = document.getElementById('tableWrapper'),
  searchInput = document.getElementById('searchInput'),
  autocompleteList = document.getElementById('autocompleteList'),
  tableSection = document.getElementById('members'),
  tableObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasRendered) {
        hasRendered = true;
        applyFilters();
      }
    });
  }, {
    threshold: 0.2
  }),
  vocationMap = {
    knight: "🛡️",
    paladin: "🏹",
    sorcerer: "🔥",
    druid: "🌿",
    monk: "🥋"
  };

tableObserver.observe(tableSection);

function getRankDisplay(index) {
  if (index === 0) return '<span class="medal gold">🥇</span>';
  if (index === 1) return '<span class="medal silver">🥈</span>';
  if (index === 2) return '<span class="medal bronze">🥉</span>';
  return index + 1;
}

function getVocationIcon(vocation) {
  const v = vocation.toLowerCase();
  for (const key in vocationMap) {
    if (v.includes(key)) return vocationMap[key];
  }
  return "⚔️";
}

function renderTable(data) {
  const tbody = document.querySelector('#membersTable tbody');
  const counter = document.getElementById('memberCount');

  tbody.innerHTML = '';

  counter.innerText = `Total: ${data.length} membros`;

  const visibleData = showAll ? data : data.slice(0, MAX_VISIBLE);

  visibleData.forEach((m, index) => {
    const row = document.createElement('tr');

    if (index < 5) {
      row.classList.add(`top-${index + 1}`);
    }

    row.innerHTML = `
      <td>${getRankDisplay(index)}</td>
      <td>
        <a href="https://www.tibia.com/community/?subtopic=characters&name=${m.name}" target="_blank">
          ${m.name}
        </a>
      </td>
      <td>${m.level}</td>
      <td>${getVocationIcon(m.vocation)} ${m.vocation}</td>
    `;

    tbody.appendChild(row);

    row.classList.add('animating');
    row.style.transitionDelay = `${index * 30}ms`;

    requestAnimationFrame(() => {
      row.classList.add('show');
      row.classList.remove('animating');
    });
  });

  renderToggleButton(data.length);
}

function renderToggleButton(total) {
  let btn = document.getElementById('toggleMembers');

  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'toggleMembers';
    btn.className = 'btn';
    btn.style.marginTop = '20px';
    document.getElementById('members').appendChild(btn);
  }

  if (total <= MAX_VISIBLE) {
    btn.style.display = 'none';
    return;
  }

  btn.style.display = 'inline-flex';

  btn.classList.toggle('active', showAll);

  btn.innerText = showAll
    ? 'Mostrar menos'
    : `Mostrar todos (${total})`;

  btn.onclick = () => {
    showAll = !showAll;
    tableWrapper.classList.toggle('collapsed', !showAll);
    applyFilters();
  };
}

function applyFilters() {
  let filtered = [...membersData];

  const sort = document.getElementById('sortLevel').value;
  const voc = document.getElementById('filterVoc').value;
  const search = searchInput.value.toLowerCase();

  if (voc) {
    filtered = filtered.filter(m => m.vocation.includes(voc));
  }

  if (search) {
    filtered = filtered.filter(m =>
      m.name.toLowerCase().includes(search)
    );
  }

  if (sort === 'asc') {
    filtered.sort((a, b) => a.level - b.level);
  } else if (sort === 'desc') {
    filtered.sort((a, b) => b.level - a.level);
  }

  renderTable(filtered);

  saveState();
}

function saveState() {
  localStorage.setItem('guildFilters', JSON.stringify({
    sort: document.getElementById('sortLevel').value,
    voc: document.getElementById('filterVoc').value,
    search: searchInput.value,
    showAll
  }));
}

function loadState() {
  const saved = localStorage.getItem('guildFilters');
  if (!saved) return;

  const state = JSON.parse(saved);

  document.getElementById('sortLevel').value = state.sort || '';
  document.getElementById('filterVoc').value = state.voc || '';
  searchInput.value = state.search || '';
  showAll = state.showAll || false;
}

fetch('src/data/members.json')
  .then(res => res.json())
  .then(data => {
    membersData = data.map(m => ({
      ...m,
      level: parseInt(m.level)
    }));

    membersData.sort((a, b) => b.level - a.level);

    loadState();
    tableWrapper.classList.toggle('collapsed', !showAll);
  });

document.getElementById('sortLevel').addEventListener('change', applyFilters);
document.getElementById('filterVoc').addEventListener('change', applyFilters);

searchInput.addEventListener('input', () => {
  if (!hasRendered) {
    hasRendered = true;
  }
  applyFilters();
});
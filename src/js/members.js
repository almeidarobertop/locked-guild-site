let membersData = [],
  showAll = false;
const MAX_VISIBLE = 50,
  tableWrapper = document.getElementById('tableWrapper');

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

  btn.innerText = showAll
    ? 'Mostrar menos'
    : `Mostrar todos (${total})`;

  btn.onclick = () => {
    showAll = !showAll;

    btn.classList.toggle('active', showAll);
    tableWrapper.classList.toggle('collapsed', !showAll);

    applyFilters();
  };
}

function renderTable(data) {
  const tbody = document.querySelector('#membersTable tbody');
  const counter = document.getElementById('memberCount');

  tbody.innerHTML = '';

  counter.innerText = `Total: ${data.length} membros`;

  const visibleData = showAll ? data : data.slice(0, MAX_VISIBLE);

  visibleData.forEach((m, index) => {
    const row = document.createElement('tr');

    if (index < 5) row.classList.add('top5');

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <a href="https://www.tibia.com/community/?subtopic=characters&name=${m.name}" target="_blank">
          ${m.name}
        </a>
      </td>
      <td>${m.level}</td>
      <td>${m.vocation}</td>
    `;

    tbody.appendChild(row);

    setTimeout(() => {
      row.classList.add('show');
    }, index * 20);
  });

  renderToggleButton(data.length);
}

fetch('src/data/members.json')
  .then(res => res.json())
  .then(data => {
    membersData = data.map(m => ({
      ...m,
      level: parseInt(m.level)
    }));

    membersData.sort((a, b) => b.level - a.level);
    renderTable(membersData);
    tableWrapper.classList.add('collapsed');
  });

document.getElementById('sortLevel').addEventListener('change', applyFilters);
document.getElementById('filterVoc').addEventListener('change', applyFilters);

function applyFilters() {
  const table = document.getElementById('membersTable');

  table.classList.add('fade-out');

  setTimeout(() => {
    let filtered = [...membersData];

    const sort = document.getElementById('sortLevel').value;
    const voc = document.getElementById('filterVoc').value;

    if (voc) {
      filtered = filtered.filter(m => m.vocation.includes(voc));
    }

    if (sort === 'asc') {
      filtered.sort((a, b) => a.level - b.level);
    } else if (sort === 'desc') {
      filtered.sort((a, b) => b.level - a.level);
    }

    renderTable(filtered);

    table.classList.remove('fade-out');
    table.classList.add('fade-in');

    setTimeout(() => {
      table.classList.remove('fade-in');
    }, 300);

  }, 200);
}
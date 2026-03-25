let membersData = [];

function renderTable(data) {
  const tbody = document.querySelector('#membersTable tbody');
  const counter = document.getElementById('memberCount');

  tbody.innerHTML = '';
  counter.innerText = `Total: ${data.length} membros`;

  data.forEach((m, index) => {
    const row = `
      <tr class="${index < 5 ? 'top5' : ''}">
        <td>
          <a href="https://www.tibia.com/community/?subtopic=characters&name=${m.name}" target="_blank">
            ${m.name}
          </a>
        </td>
        <td>${m.level}</td>
        <td>${m.vocation}</td>
      </tr>
    `;

    tbody.innerHTML += row;
  });
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
  });

document.getElementById('sortLevel').addEventListener('change', applyFilters);
document.getElementById('filterVoc').addEventListener('change', applyFilters);

function applyFilters() {
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
}
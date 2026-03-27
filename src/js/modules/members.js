export function initMembers() {
    const dom = {
        tableWrapper: document.getElementById('tableWrapper'),
        searchInput: document.getElementById('searchInput'),
        tableSection: document.getElementById('members'),
        tbody: document.getElementById('membersTbody'),
        counter: document.getElementById('memberCount'),
        sortSelect: document.getElementById('sortLevel'),
        filterSelect: document.getElementById('filterVoc'),
    };

    if (
        !dom.tableWrapper ||
        !dom.searchInput ||
        !dom.tableSection ||
        !dom.tbody ||
        !dom.counter ||
        !dom.sortSelect ||
        !dom.filterSelect
    ) return;

    let membersData = [];
    let showAll = false;
    let hasRendered = false;

    const MAX_VISIBLE = 50;

    const vocationMap = {
        knight: '🛡️',
        paladin: '🏹',
        sorcerer: '🔥',
        druid: '🌿',
        monk: '🥋',
    };

    const getVocationIcon = (vocation) => {
        const v = vocation.toLowerCase();

        for (const key in vocationMap) {
            if (v.includes(key)) return vocationMap[key];
        }

        return '⚔️';
    };

    const getRank = (index) => {
        if (index === 0) return '<span class="medal gold">🥇</span>';
        if (index === 1) return '<span class="medal silver">🥈</span>';
        if (index === 2) return '<span class="medal bronze">🥉</span>';
        return index + 1;
    };

    const renderChunked = (data) => {
        dom.tbody.innerHTML = '';
        dom.counter.textContent = `Total: ${data.length} membros`;

        const visible = showAll ? data : data.slice(0, MAX_VISIBLE);

        let index = 0;
        const chunkSize = 20;

        const renderChunk = () => {
            const fragment = document.createDocumentFragment();

            for (let i = 0; i < chunkSize && index < visible.length; i += 1, index += 1) {
                const m = visible[index];
                const row = document.createElement('tr');

                if (index < 5) row.classList.add(`top-${index + 1}`);

                row.innerHTML = `
          <td>${getRank(index)}</td>
          <td>
            <a href="https://www.tibia.com/community/?subtopic=characters&name=${m.name}" target="_blank">
              ${m.name}
            </a>
          </td>
          <td>${m.level}</td>
          <td>${getVocationIcon(m.vocation)} ${m.vocation}</td>
        `;

                row.style.transitionDelay = `${index * 15}ms`;

                fragment.appendChild(row);

                requestAnimationFrame(() => {
                    row.classList.add('show');
                });
            }

            dom.tbody.appendChild(fragment);

            if (index < visible.length) {
                requestAnimationFrame(renderChunk);
            }
        };

        renderChunk();
        renderToggleButton(data.length);
    };

    const renderToggleButton = (total) => {
        let btn = document.getElementById('toggleMembers');

        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'toggleMembers';
            btn.className = 'btn';
            btn.style.marginTop = '20px';
            dom.tableSection.appendChild(btn);
        }

        if (total <= MAX_VISIBLE) {
            btn.style.display = 'none';
            return;
        }

        btn.style.display = 'inline-flex';
        btn.textContent = showAll
            ? 'Mostrar menos'
            : `Mostrar todos (${total})`;

        btn.onclick = () => {
            showAll = !showAll;
            dom.tableWrapper.classList.toggle('collapsed', !showAll);
            applyFilters();
        };
    };

    const applyFilters = () => {
        let filtered = [...membersData];

        const sort = dom.sortSelect.value;
        const voc = dom.filterSelect.value;
        const search = dom.searchInput.value.toLowerCase();

        if (voc) {
            filtered = filtered.filter((m) => m.vocation.includes(voc));
        }

        if (search) {
            filtered = filtered.filter((m) =>
                m.name.toLowerCase().includes(search)
            );
        }

        if (sort === 'asc') {
            filtered.sort((a, b) => a.level - b.level);
        } else if (sort === 'desc') {
            filtered.sort((a, b) => b.level - a.level);
        }

        renderChunked(filtered);
        saveState();
    };

    const saveState = () => {
        localStorage.setItem(
            'guildFilters',
            JSON.stringify({
                sort: dom.sortSelect.value,
                voc: dom.filterSelect.value,
                search: dom.searchInput.value,
                showAll,
            })
        );
    };

    const loadState = () => {
        const saved = localStorage.getItem('guildFilters');
        if (!saved) return;

        const state = JSON.parse(saved);

        dom.sortSelect.value = state.sort || '';
        dom.filterSelect.value = state.voc || '';
        dom.searchInput.value = state.search || '';
        showAll = state.showAll || false;
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting || hasRendered) return;

            hasRendered = true;
            applyFilters();
        });
    }, {
        rootMargin: '200px',
    });

    observer.observe(dom.tableSection);

    fetch('src/data/members.json')
        .then((res) => res.json())
        .then((data) => {
            membersData = data.map((m) => ({
                ...m,
                level: parseInt(m.level, 10),
            }));

            membersData.sort((a, b) => b.level - a.level);

            loadState();
            dom.tableWrapper.classList.toggle('collapsed', !showAll);

            setTimeout(() => {
                if (!hasRendered) {
                    hasRendered = true;
                    applyFilters();
                }
            }, 300);
        });

    dom.sortSelect.addEventListener('change', applyFilters);
    dom.filterSelect.addEventListener('change', applyFilters);

    dom.searchInput.addEventListener('input', () => {
        if (!hasRendered) hasRendered = true;
        applyFilters();
    });
}

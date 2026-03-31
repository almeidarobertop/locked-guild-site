export function initMembers() {
    const dom = {
        tableWrapper: document.getElementById('tableWrapper'),
        searchInput: document.getElementById('searchInput'),
        tableSection: document.getElementById('members'),
        tbody: document.getElementById('membersTbody'),
        counter: document.getElementById('memberCount'),
        sortSelect: document.getElementById('sortLevel'),
        filterSelect: document.getElementById('filterVoc'),
        viewModeSelect: document.getElementById('viewMode'),
        detailHeader: document.getElementById('memberDetailHeader'),
    };

    if (
        !dom.tableWrapper ||
        !dom.searchInput ||
        !dom.tableSection ||
        !dom.tbody ||
        !dom.counter ||
        !dom.sortSelect ||
        !dom.filterSelect ||
        !dom.viewModeSelect ||
        !dom.detailHeader
    ) return;

    let membersData = [];
    let showAll = false;

    const MAX_VISIBLE = 50;
    const MEDALS = {
        gold: '\u{1F947}',
        silver: '\u{1F948}',
        bronze: '\u{1F949}',
    };
    const VOCATION_ICONS = {
        knight: '\u{1F6E1}\uFE0F',
        paladin: '\u{1F3F9}',
        sorcerer: '\u{1F525}',
        druid: '\u{1F33F}',
        monk: '\u{1F94B}',
        'sem vocacao': '\u2694\uFE0F',
    };
    const SKILL_ICONS = {
        magic: '\u2728',
        distance: '\u{1F3F9}',
        fist: '\u{1F94A}',
        axe: '\u{1FA93}',
        sword: '\u2694\uFE0F',
        club: '\u{1F528}',
    };
    const DETAIL_HEADERS = {
        vocation: 'Vocação',
        skill: 'Skill',
    };

    const rowObserver = 'IntersectionObserver' in window
        ? new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                const row = entry.target;

                row.classList.remove('animating');
                row.classList.add('show');

                observer.unobserve(row);
            });
        }, {
            rootMargin: '50px',
        })
        : null;

    const capitalize = (str) =>
        str.charAt(0).toUpperCase() + str.slice(1);

    const escapeHtml = (value = '') =>
        String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;');

    const escapeHtmlAttr = (value = '') =>
        escapeHtml(value).replaceAll('"', '&quot;');

    const getNormalizedVocation = (vocation) => {
        if (!vocation) return 'sem vocacao';

        const normalizedVocation = vocation.toLowerCase();

        return normalizedVocation === 'none'
            ? 'sem vocacao'
            : normalizedVocation;
    };

    const getVocationIcon = (vocation) => {
        const normalizedVocation = getNormalizedVocation(vocation);

        for (const key in VOCATION_ICONS) {
            if (normalizedVocation.includes(key)) return VOCATION_ICONS[key];
        }

        return VOCATION_ICONS['sem vocacao'];
    };

    const getRank = (index) => {
        if (index === 0) return `<span class="medal gold">${MEDALS.gold}</span>`;
        if (index === 1) return `<span class="medal silver">${MEDALS.silver}</span>`;
        if (index === 2) return `<span class="medal bronze">${MEDALS.bronze}</span>`;
        return index + 1;
    };

    const getTopLevelBadge = (index) =>
        index === 0 ? '<span class="member-top-badge" aria-hidden="true">\u{1F451}</span>' : '';

    const getLevelGainBadge = (levelGain) => {
        if (!Number.isFinite(levelGain) || levelGain <= 0) return '';

        const description = levelGain === 1
            ? 'Ganhou 1 level desde a ultima atualizacao'
            : `Ganhou ${levelGain} levels desde a ultima atualizacao`;

        return `<span class="member-level-gain" title="${escapeHtmlAttr(description)}" aria-label="${escapeHtmlAttr(description)}">+${levelGain}</span>`;
    };

    const getSkillIcon = (category) => SKILL_ICONS[category] || '\u2605';

    const getPrimaryHighscore = (member) => {
        const highscore = member.primaryHighscore;

        if (!highscore || !Number.isFinite(highscore.rank) || !Number.isFinite(highscore.value)) {
            return null;
        }

        return highscore;
    };

    const getSkillMarkup = (member) => {
        const primaryHighscore = getPrimaryHighscore(member);

        if (!primaryHighscore) {
            return '<span class="member-skill member-skill-empty">Nao ranqueado</span>';
        }

        const description = `${primaryHighscore.label}: rank ${primaryHighscore.rank}, valor ${primaryHighscore.value}`;

        return `
            <span class="member-skill" title="${escapeHtmlAttr(description)}" aria-label="${escapeHtmlAttr(description)}">
                <span class="member-skill-label">${getSkillIcon(primaryHighscore.category)} ${escapeHtml(primaryHighscore.label)}</span>
                <span class="member-skill-value">${primaryHighscore.value}</span>
                <span class="member-skill-rank">#${primaryHighscore.rank}</span>
            </span>
        `;
    };

    const getDetailCellMarkup = (member) => {
        if (dom.viewModeSelect.value === 'skill') {
            return getSkillMarkup(member);
        }

        return `${getVocationIcon(member.vocation)} ${escapeHtml(capitalize(member.vocation))}`;
    };

    const updateDetailHeader = () => {
        dom.detailHeader.textContent = DETAIL_HEADERS[dom.viewModeSelect.value] || DETAIL_HEADERS.vocation;
    };

    const renderChunked = (data) => {
        dom.tbody.innerHTML = '';
        dom.counter.textContent = `Total: ${data.length} membros`;
        updateDetailHeader();

        const visible = showAll ? data : data.slice(0, MAX_VISIBLE);

        let index = 0;
        const chunkSize = 20;

        const renderChunk = () => {
            const fragment = document.createDocumentFragment();

            for (let i = 0; i < chunkSize && index < visible.length; i += 1, index += 1) {
                const member = visible[index];
                const row = document.createElement('tr');

                if (index < 5) row.classList.add(`top-${index + 1}`);

                row.innerHTML = `
                <td>${getRank(index)}</td>
                <td>
                    <span class="member-name">
                        <a href="https://www.tibia.com/community/?subtopic=characters&name=${encodeURIComponent(member.name)}" target="_blank" title="${escapeHtmlAttr(member.rank || 'Sem rank')}">
                            ${escapeHtml(member.name)}
                        </a>
                        ${getTopLevelBadge(index)}
                    </span>
                </td>
                <td>
                    <span class="member-level">
                        <span class="member-level-value">${member.level}</span>
                        ${getLevelGainBadge(member.levelGain)}
                    </span>
                </td>
                <td>${getDetailCellMarkup(member)}</td>
            `;

                row.classList.add('animating');
                row.style.transitionDelay = `${Math.min(index * 10, 300)}ms`;

                if (rowObserver) {
                    rowObserver.observe(row);
                } else {
                    row.classList.remove('animating');
                    row.classList.add('show');
                }

                fragment.appendChild(row);
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

        btn.classList.toggle('active', showAll);

        btn.onclick = () => {
            showAll = !showAll;
            dom.tableWrapper.classList.toggle('collapsed', !showAll);
            btn.classList.toggle('active', showAll);
            applyFilters();
        };
    };

    const compareBySkillRank = (a, b) => {
        const skillA = getPrimaryHighscore(a);
        const skillB = getPrimaryHighscore(b);

        if (!skillA && !skillB) return b.level - a.level;
        if (!skillA) return 1;
        if (!skillB) return -1;
        if (skillA.rank !== skillB.rank) return skillA.rank - skillB.rank;
        if (skillA.value !== skillB.value) return skillB.value - skillA.value;
        return a.name.localeCompare(b.name);
    };

    const compareBySkillValue = (a, b) => {
        const skillA = getPrimaryHighscore(a);
        const skillB = getPrimaryHighscore(b);

        if (!skillA && !skillB) return b.level - a.level;
        if (!skillA) return 1;
        if (!skillB) return -1;
        if (skillA.value !== skillB.value) return skillB.value - skillA.value;
        if (skillA.rank !== skillB.rank) return skillA.rank - skillB.rank;
        return a.name.localeCompare(b.name);
    };

    const applyFilters = () => {
        let filtered = [...membersData];

        const sort = dom.sortSelect.value;
        const vocationFilter = dom.filterSelect.value;
        const search = dom.searchInput.value.toLowerCase();

        if (vocationFilter) {
            filtered = filtered.filter((member) =>
                member.vocation.toLowerCase().includes(vocationFilter)
            );
        }

        if (search) {
            filtered = filtered.filter((member) =>
                member.name.toLowerCase().includes(search)
            );
        }

        if (sort === 'asc') {
            filtered.sort((a, b) => a.level - b.level);
        } else if (sort === 'desc') {
            filtered.sort((a, b) => b.level - a.level);
        } else if (sort === 'skill-rank-asc') {
            filtered.sort(compareBySkillRank);
        } else if (sort === 'skill-value-desc') {
            filtered.sort(compareBySkillValue);
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
                viewMode: dom.viewModeSelect.value,
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
        dom.viewModeSelect.value = state.viewMode || 'vocation';
        showAll = state.showAll || false;
    };

    const populateVocationFilter = () => {
        const select = dom.filterSelect;

        select.innerHTML = '<option value="">Filtrar por Vocação</option>';

        const added = new Set();

        membersData.forEach((member) => {
            const vocation = member.vocation.toLowerCase();

            for (const key in VOCATION_ICONS) {
                if (key === 'sem vocacao') continue;

                if (vocation.includes(key) && !added.has(key)) {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = `${VOCATION_ICONS[key]} ${capitalize(key)}`;
                    select.appendChild(option);
                    added.add(key);
                }
            }
        });
    };

    fetch('src/data/members.json')
        .then((res) => res.json())
        .then((data) => {
            const DEFAULT_VOCATION = 'Sem vocacao';

            membersData = data.map((member) => {
                const normalizedVocation = getNormalizedVocation(member.vocation || DEFAULT_VOCATION);
                const primaryHighscore = member.primaryHighscore && typeof member.primaryHighscore === 'object'
                    ? {
                        category: member.primaryHighscore.category || '',
                        label: member.primaryHighscore.label || 'Skill',
                        rank: parseInt(member.primaryHighscore.rank, 10),
                        value: parseInt(member.primaryHighscore.value, 10),
                    }
                    : null;

                return {
                    ...member,
                    level: parseInt(member.level, 10),
                    levelGain: parseInt(member.levelGain, 10) || 0,
                    previousLevel: parseInt(member.previousLevel, 10) || parseInt(member.level, 10),
                    vocation: normalizedVocation,
                    primaryHighscore: primaryHighscore && Number.isFinite(primaryHighscore.rank) && Number.isFinite(primaryHighscore.value)
                        ? primaryHighscore
                        : null,
                };
            });

            populateVocationFilter();

            membersData.sort((a, b) => b.level - a.level);

            loadState();
            dom.tableWrapper.classList.toggle('collapsed', !showAll);
            applyFilters();
        });

    dom.sortSelect.addEventListener('change', applyFilters);
    dom.filterSelect.addEventListener('change', applyFilters);
    dom.viewModeSelect.addEventListener('change', applyFilters);
    dom.searchInput.addEventListener('input', applyFilters);
}

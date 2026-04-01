export function initMembers() {
    const dom = {
        tableWrapper: document.getElementById('tableWrapper'),
        searchInput: document.getElementById('searchInput'),
        tableSection: document.getElementById('members'),
        tbody: document.getElementById('membersTbody'),
        counter: document.getElementById('memberCount'),
        sortToggle: document.getElementById('sortToggle'),
        filterSelect: document.getElementById('filterVoc'),
        viewMode: document.getElementById('viewMode'),
        viewModeButtons: Array.from(document.querySelectorAll('#viewMode [data-view-mode]')),
        detailHeader: document.getElementById('memberDetailHeader'),
        sharePanel: document.getElementById('sharePanel'),
        shareSummary: document.getElementById('shareSummary'),
        shareRange: document.getElementById('shareRange'),
        shareMatches: document.getElementById('shareMatches'),
        shareToggle: document.getElementById('shareToggle'),
        shareClear: document.getElementById('shareClear'),
    };

    if (
        !dom.tableWrapper ||
        !dom.searchInput ||
        !dom.tableSection ||
        !dom.tbody ||
        !dom.counter ||
        !dom.sortToggle ||
        !dom.filterSelect ||
        !dom.viewMode ||
        dom.viewModeButtons.length === 0 ||
        !dom.detailHeader ||
        !dom.sharePanel ||
        !dom.shareSummary ||
        !dom.shareRange ||
        !dom.shareMatches ||
        !dom.shareToggle ||
        !dom.shareClear
    ) return;

    let membersData = [];
    let showAll = false;
    let sortDirection = 'desc';
    let shareOnly = false;
    let autocompleteItems = [];
    let activeAutocompleteIndex = -1;

    const MAX_VISIBLE = 50;
    const MAX_AUTOCOMPLETE_RESULTS = 8;
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

    const normalizeText = (value = '') =>
        String(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();

    const autocompleteList = document.createElement('div');
    autocompleteList.className = 'autocomplete-list';
    autocompleteList.id = 'membersAutocomplete';
    autocompleteList.hidden = true;
    autocompleteList.setAttribute('role', 'listbox');
    dom.searchInput.setAttribute('autocomplete', 'off');
    dom.searchInput.setAttribute('aria-autocomplete', 'list');
    dom.searchInput.setAttribute('aria-controls', autocompleteList.id);
    dom.searchInput.setAttribute('aria-expanded', 'false');
    dom.searchInput.parentElement?.appendChild(autocompleteList);

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

    const getSkillTrendBadge = (member) => {
        const direction = member.primarySkillTrend;

        if (direction !== 'up' && direction !== 'down') return '';

        const isUp = direction === 'up';
        const description = isUp
            ? 'Skill aumentou desde a ultima atualizacao'
            : 'Skill diminuiu desde a ultima atualizacao';

        return `
            <span class="member-skill-trend member-skill-trend-${direction}" title="${escapeHtmlAttr(description)}" aria-label="${escapeHtmlAttr(description)}">
                ${isUp ? '\u2191' : '\u2193'}
            </span>
        `;
    };

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
                <span class="member-skill-main">
                    <span class="member-skill-label">${getSkillIcon(primaryHighscore.category)} ${escapeHtml(primaryHighscore.label)}</span>
                    <span class="member-skill-value">
                        <span class="member-skill-value-number">${primaryHighscore.value}</span>
                        ${getSkillTrendBadge(member)}
                    </span>
                </span>
                <span class="member-skill-context">#${primaryHighscore.rank} em Ourobra</span>
            </span>
        `;
    };

    const getCurrentViewMode = () =>
        dom.viewModeButtons.find((button) => button.classList.contains('active'))?.dataset.viewMode || 'vocation';

    const updateSortToggle = () => {
        const label = sortDirection === 'asc'
            ? 'Menor primeiro'
            : 'Maior primeiro';

        dom.sortToggle.dataset.sortDirection = sortDirection;
        dom.sortToggle.setAttribute('aria-pressed', String(sortDirection === 'desc'));

        const labelNode = dom.sortToggle.querySelector('.sort-toggle-label');
        if (labelNode) {
            labelNode.textContent = label;
        }
    };

    const updateShareToggle = () => {
        dom.shareToggle.setAttribute('aria-pressed', String(shareOnly));
        dom.shareToggle.textContent = shareOnly
            ? 'Ocultar da Tabela'
            : 'Mostrar na Tabela';
    };

    const setCurrentViewMode = (mode) => {
        dom.viewModeButtons.forEach((button) => {
            const isActive = button.dataset.viewMode === mode;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });
    };

    const getDetailCellMarkup = (member) => {
        if (getCurrentViewMode() === 'skill') {
            return getSkillMarkup(member);
        }

        return `${getVocationIcon(member.vocation)} ${escapeHtml(capitalize(member.vocation))}`;
    };

    const updateDetailHeader = () => {
        dom.detailHeader.textContent = DETAIL_HEADERS[getCurrentViewMode()] || DETAIL_HEADERS.vocation;
    };

    const syncTableWrapperState = (total) => {
        const shouldCollapse = !showAll && total > MAX_VISIBLE;
        dom.tableWrapper.classList.toggle('collapsed', shouldCollapse);
    };

    const getShareRange = (level) => ({
        min: Math.floor(level * (2 / 3)),
        max: Math.ceil(level * 1.5),
    });

    const canShareExperience = (anchor, member) => {
        if (!anchor || !member || !Number.isFinite(anchor.level) || !Number.isFinite(member.level)) {
            return false;
        }

        const range = getShareRange(anchor.level);
        return member.level >= range.min && member.level <= range.max;
    };

    const getShareAnchor = (searchValue, filteredMembers) => {
        const normalizedSearch = normalizeText(searchValue);
        if (!normalizedSearch) return null;

        const exactMatch = membersData.find((member) => member.searchName === normalizedSearch);
        if (exactMatch) return exactMatch;

        if (filteredMembers.length === 1) {
            return filteredMembers[0];
        }

        return null;
    };

    const getShareBadgeMarkup = (type) => {
        if (type === 'anchor') {
            return '<span class="member-share-badge">Referência</span>';
        }

        if (type === 'match') {
            return '<span class="member-share-badge">Share</span>';
        }

        return '';
    };

    const closeAutocomplete = () => {
        autocompleteItems = [];
        activeAutocompleteIndex = -1;
        autocompleteList.hidden = true;
        autocompleteList.innerHTML = '';
        dom.searchInput.setAttribute('aria-expanded', 'false');
        dom.searchInput.removeAttribute('aria-activedescendant');
    };

    const selectAutocompleteItem = (member) => {
        dom.searchInput.value = member.name;
        closeAutocomplete();
        applyFilters();
    };

    const updateAutocompleteActiveItem = () => {
        const buttons = autocompleteList.querySelectorAll('.autocomplete-item');

        buttons.forEach((button, index) => {
            const isActive = index === activeAutocompleteIndex;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-selected', String(isActive));

            if (isActive) {
                dom.searchInput.setAttribute('aria-activedescendant', button.id);
                button.scrollIntoView({ block: 'nearest' });
            }
        });

        if (activeAutocompleteIndex < 0) {
            dom.searchInput.removeAttribute('aria-activedescendant');
        }
    };

    const renderAutocomplete = () => {
        const search = normalizeText(dom.searchInput.value);

        if (!search) {
            closeAutocomplete();
            return;
        }

        autocompleteItems = membersData
            .filter((member) => member.searchName.includes(search) && member.searchName !== search)
            .sort((a, b) => {
                const startsA = Number(!a.searchName.startsWith(search));
                const startsB = Number(!b.searchName.startsWith(search));

                if (startsA !== startsB) return startsA - startsB;
                return a.name.localeCompare(b.name);
            })
            .slice(0, MAX_AUTOCOMPLETE_RESULTS);

        if (autocompleteItems.length === 0) {
            closeAutocomplete();
            return;
        }

        activeAutocompleteIndex = -1;
        autocompleteList.innerHTML = autocompleteItems.map((member, index) => `
            <button
                type="button"
                class="autocomplete-item"
                id="autocomplete-item-${index}"
                role="option"
                aria-selected="false"
                data-name="${escapeHtmlAttr(member.name)}"
            >
                <span class="autocomplete-item-name">${escapeHtml(member.name)}</span>
                <span class="autocomplete-item-meta">Lvl ${member.level}</span>
            </button>
        `).join('');
        autocompleteList.hidden = false;
        dom.searchInput.setAttribute('aria-expanded', 'true');
    };

    const renderSharePanel = (shareContext) => {
        if (!shareContext) {
            dom.sharePanel.hidden = true;
            dom.shareMatches.innerHTML = '';
            updateShareToggle();
            return;
        }

        const { anchor, range, compatibleMembers } = shareContext;
        const memberLabel = compatibleMembers.length === 1 ? 'membro compatível' : 'membros compatíveis';

        dom.shareSummary.innerHTML = `
            <strong>${escapeHtml(anchor.name)}</strong> level ${anchor.level}
            pode dividir experiência com ${compatibleMembers.length} ${memberLabel} na guild.
        `;
        dom.shareRange.textContent = `Níveis: ${range.min} a ${range.max}.`;
        dom.shareMatches.innerHTML = compatibleMembers.length > 0
            ? compatibleMembers.map((member) => `
                <span class="share-chip">
                    ${escapeHtml(member.name)}
                    <strong>${member.level}</strong>
                </span>
            `).join('')
            : '<span class="share-chip">Nenhum membro da guild está nesse intervalo de level agora.</span>';

        dom.sharePanel.hidden = false;
        updateShareToggle();
    };

    const renderChunked = (data, shareContext) => {
        dom.tbody.innerHTML = '';
        dom.counter.textContent = `Total: ${data.length} membros`;
        updateDetailHeader();
        syncTableWrapperState(data.length);

        const visible = showAll ? data : data.slice(0, MAX_VISIBLE);

        let index = 0;
        const chunkSize = 20;

        const renderChunk = () => {
            const fragment = document.createDocumentFragment();

            for (let i = 0; i < chunkSize && index < visible.length; i += 1, index += 1) {
                const member = visible[index];
                const row = document.createElement('tr');
                const isShareAnchor = shareContext?.anchor.name === member.name;
                const isShareMatch = !isShareAnchor && canShareExperience(shareContext?.anchor, member);

                if (index < 5) row.classList.add(`top-${index + 1}`);
                if (isShareAnchor) row.classList.add('is-share-anchor');
                if (isShareMatch) row.classList.add('is-share-match');

                row.innerHTML = `
                <td>${getRank(index)}</td>
                <td>
                    <span class="member-name">
                        <a href="https://www.tibia.com/community/?subtopic=characters&name=${encodeURIComponent(member.name)}" target="_blank" title="${escapeHtmlAttr(member.rank || 'Sem rank')}">
                            ${escapeHtml(member.name)}
                        </a>
                        ${getTopLevelBadge(index)}
                        ${getShareBadgeMarkup(isShareAnchor ? 'anchor' : isShareMatch ? 'match' : '')}
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
            btn.classList.remove('active');
            return;
        }

        btn.style.display = 'inline-flex';
        btn.textContent = showAll
            ? 'Mostrar menos'
            : `Mostrar todos (${total})`;

        btn.classList.toggle('active', showAll);

        btn.onclick = () => {
            showAll = !showAll;
            btn.classList.toggle('active', showAll);
            applyFilters();
        };
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

    const compareBySkillValueAsc = (a, b) => {
        const skillA = getPrimaryHighscore(a);
        const skillB = getPrimaryHighscore(b);

        if (!skillA && !skillB) return a.level - b.level;
        if (!skillA) return 1;
        if (!skillB) return -1;
        if (skillA.value !== skillB.value) return skillA.value - skillB.value;
        if (skillA.rank !== skillB.rank) return skillA.rank - skillB.rank;
        return a.name.localeCompare(b.name);
    };

    const sortMembers = (members) => {
        if (sortDirection === 'asc') {
            if (getCurrentViewMode() === 'skill') {
                members.sort(compareBySkillValueAsc);
            } else {
                members.sort((a, b) => a.level - b.level);
            }

            return;
        }

        if (getCurrentViewMode() === 'skill') {
            members.sort(compareBySkillValue);
        } else {
            members.sort((a, b) => b.level - a.level);
        }
    };

    const applyFilters = () => {
        const vocationFilter = dom.filterSelect.value;
        const search = dom.searchInput.value;
        const normalizedSearch = normalizeText(search);

        let filteredByVocation = [...membersData];

        if (vocationFilter) {
            filteredByVocation = filteredByVocation.filter((member) =>
                member.vocation.toLowerCase().includes(vocationFilter)
            );
        }

        let filtered = [...filteredByVocation];

        if (normalizedSearch) {
            filtered = filtered.filter((member) =>
                member.searchName.includes(normalizedSearch)
            );
        }

        const shareAnchor = getShareAnchor(search, filtered);
        const shareContext = shareAnchor
            ? {
                anchor: shareAnchor,
                range: getShareRange(shareAnchor.level),
                compatibleMembers: membersData
                    .filter((member) => member.name !== shareAnchor.name && canShareExperience(shareAnchor, member))
                    .sort((a, b) => b.level - a.level),
            }
            : null;

        if (shareOnly && !shareContext) {
            shareOnly = false;
        }

        if (shareOnly && shareContext) {
            filtered = filteredByVocation.filter((member) =>
                member.name === shareContext.anchor.name || canShareExperience(shareContext.anchor, member)
            );
        }

        sortMembers(filtered);
        renderSharePanel(shareContext);
        renderChunked(filtered, shareContext);
        saveState();
    };

    const handleViewModeChange = () => {
        applyFilters();
    };

    const saveState = () => {
        localStorage.setItem(
            'guildFilters',
            JSON.stringify({
                sortDirection,
                voc: dom.filterSelect.value,
                search: dom.searchInput.value,
                shareOnly,
                showAll,
                viewMode: getCurrentViewMode(),
            })
        );
    };

    const loadState = () => {
        const saved = localStorage.getItem('guildFilters');
        if (!saved) {
            updateShareToggle();
            return;
        }

        const state = JSON.parse(saved);

        sortDirection = state.sortDirection === 'asc' ? 'asc' : 'desc';
        dom.filterSelect.value = state.voc || '';
        dom.searchInput.value = state.search || '';
        setCurrentViewMode(state.viewMode || 'vocation');
        showAll = Boolean(state.showAll);
        shareOnly = Boolean(state.shareOnly);
        updateSortToggle();
        updateShareToggle();
    };

    const populateVocationFilter = () => {
        const select = dom.filterSelect;

        select.innerHTML = '<option value="">Todas Vocações</option>';

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

                const parsedLevel = parseInt(member.level, 10);

                return {
                    ...member,
                    level: parsedLevel,
                    levelGain: parseInt(member.levelGain, 10) || 0,
                    previousLevel: parseInt(member.previousLevel, 10) || parsedLevel,
                    primarySkillTrend: member.primarySkillTrend === 'up' || member.primarySkillTrend === 'down'
                        ? member.primarySkillTrend
                        : 'none',
                    vocation: normalizedVocation,
                    primaryHighscore: primaryHighscore && Number.isFinite(primaryHighscore.rank) && Number.isFinite(primaryHighscore.value)
                        ? primaryHighscore
                        : null,
                    searchName: normalizeText(member.name),
                };
            });

            populateVocationFilter();
            membersData.sort((a, b) => b.level - a.level);

            loadState();
            updateSortToggle();
            applyFilters();
            renderAutocomplete();
        });

    dom.sortToggle.addEventListener('click', () => {
        sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
        updateSortToggle();
        applyFilters();
    });
    dom.filterSelect.addEventListener('change', applyFilters);
    dom.viewModeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (button.classList.contains('active')) return;
            setCurrentViewMode(button.dataset.viewMode || 'vocation');
            handleViewModeChange();
        });
    });
    dom.searchInput.addEventListener('input', () => {
        applyFilters();
        renderAutocomplete();
    });
    dom.searchInput.addEventListener('keydown', (event) => {
        if (autocompleteItems.length === 0 || autocompleteList.hidden) {
            if (event.key === 'Escape') {
                closeAutocomplete();
            }
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            activeAutocompleteIndex = (activeAutocompleteIndex + 1) % autocompleteItems.length;
            updateAutocompleteActiveItem();
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            activeAutocompleteIndex = activeAutocompleteIndex <= 0
                ? autocompleteItems.length - 1
                : activeAutocompleteIndex - 1;
            updateAutocompleteActiveItem();
            return;
        }

        if (event.key === 'Enter' && activeAutocompleteIndex >= 0) {
            event.preventDefault();
            selectAutocompleteItem(autocompleteItems[activeAutocompleteIndex]);
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            closeAutocomplete();
        }
    });
    dom.searchInput.addEventListener('blur', () => {
        window.setTimeout(closeAutocomplete, 120);
    });
    dom.searchInput.addEventListener('focus', () => {
        renderAutocomplete();
    });
    autocompleteList.addEventListener('mousedown', (event) => {
        event.preventDefault();
        const item = event.target instanceof Element
            ? event.target.closest('.autocomplete-item')
            : null;

        if (!item) return;

        const member = autocompleteItems.find((entry) => entry.name === item.getAttribute('data-name'));
        if (member) {
            selectAutocompleteItem(member);
        }
    });
    dom.shareToggle.addEventListener('click', () => {
        shareOnly = !shareOnly;
        updateShareToggle();
        applyFilters();
    });
    dom.shareClear.addEventListener('click', () => {
        dom.searchInput.value = '';
        shareOnly = false;
        updateShareToggle();
        applyFilters();
        closeAutocomplete();
    });
}

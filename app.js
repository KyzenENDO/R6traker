/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   R6 TRACKER â€” Application Logic (Electron)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

(function () {
    'use strict';

    // â”€â”€â”€ Data Store Keys â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const STORAGE_KEYS = {
        mainPlayerId: 'r6_main_player_id',
        matches: 'r6tracker_matches',
        players: 'r6tracker_players',
        streak: 'r6tracker_streak',
        wins: 'r6tracker_wins',
        losses: 'r6tracker_losses',
        rowSpacing: 'r6tracker_row_spacing',
        activeTeammates: 'r6tracker_active_teammates',
        activeOpponents: 'r6tracker_active_opponents',
    };

    function loadData(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch {
            return [];
        }
    }

    function saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    let matches = loadData(STORAGE_KEYS.matches);
    let players = loadData(STORAGE_KEYS.players);
    let sessionStreak = parseInt(localStorage.getItem(STORAGE_KEYS.streak)) || 0;
    let sessionWins = parseInt(localStorage.getItem(STORAGE_KEYS.wins)) || 0;
    let sessionLosses = parseInt(localStorage.getItem(STORAGE_KEYS.losses)) || 0;
    let rowSpacing = parseInt(localStorage.getItem(STORAGE_KEYS.rowSpacing)) || 38;
    
    let activeTeammateIds = loadData(STORAGE_KEYS.activeTeammates);
    let activeOpponentIds = loadData(STORAGE_KEYS.activeOpponents);

    // â”€â”€â”€ Rank Metadata â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const RANK_DATA = {
        'Copper V': { tier: 'Copper', color: '#b87333', emoji: '🟤', order: 1 },
        'Copper IV': { tier: 'Copper', color: '#b87333', emoji: '🟤', order: 2 },
        'Copper III': { tier: 'Copper', color: '#b87333', emoji: '🟤', order: 3 },
        'Copper II': { tier: 'Copper', color: '#b87333', emoji: '🟤', order: 4 },
        'Copper I': { tier: 'Copper', color: '#b87333', emoji: '🟤', order: 5 },
        'Bronze V': { tier: 'Bronze', color: '#cd7f32', emoji: '🥉', order: 6 },
        'Bronze IV': { tier: 'Bronze', color: '#cd7f32', emoji: '🥉', order: 7 },
        'Bronze III': { tier: 'Bronze', color: '#cd7f32', emoji: '🥉', order: 8 },
        'Bronze II': { tier: 'Bronze', color: '#cd7f32', emoji: '🥉', order: 9 },
        'Bronze I': { tier: 'Bronze', color: '#cd7f32', emoji: '🥉', order: 10 },
        'Silver V': { tier: 'Silver', color: '#c0c0c0', emoji: 'âšª', order: 11 },
        'Silver IV': { tier: 'Silver', color: '#c0c0c0', emoji: 'âšª', order: 12 },
        'Silver III': { tier: 'Silver', color: '#c0c0c0', emoji: 'âšª', order: 13 },
        'Silver II': { tier: 'Silver', color: '#c0c0c0', emoji: 'âšª', order: 14 },
        'Silver I': { tier: 'Silver', color: '#c0c0c0', emoji: 'âšª', order: 15 },
        'Gold V': { tier: 'Gold', color: '#ffd700', emoji: '🥇', order: 16 },
        'Gold IV': { tier: 'Gold', color: '#ffd700', emoji: '🥇', order: 17 },
        'Gold III': { tier: 'Gold', color: '#ffd700', emoji: '🥇', order: 18 },
        'Gold II': { tier: 'Gold', color: '#ffd700', emoji: '🥇', order: 19 },
        'Gold I': { tier: 'Gold', color: '#ffd700', emoji: '🥇', order: 20 },
        'Platinum V': { tier: 'Platinum', color: '#4fc3f7', emoji: '💎', order: 21 },
        'Platinum IV': { tier: 'Platinum', color: '#4fc3f7', emoji: '💎', order: 22 },
        'Platinum III': { tier: 'Platinum', color: '#4fc3f7', emoji: '💎', order: 23 },
        'Platinum II': { tier: 'Platinum', color: '#4fc3f7', emoji: '💎', order: 24 },
        'Platinum I': { tier: 'Platinum', color: '#4fc3f7', emoji: '💎', order: 25 },
        'Emerald V': { tier: 'Emerald', color: '#50c878', emoji: '💚', order: 26 },
        'Emerald IV': { tier: 'Emerald', color: '#50c878', emoji: '💚', order: 27 },
        'Emerald III': { tier: 'Emerald', color: '#50c878', emoji: '💚', order: 28 },
        'Emerald II': { tier: 'Emerald', color: '#50c878', emoji: '💚', order: 29 },
        'Emerald I': { tier: 'Emerald', color: '#50c878', emoji: '💚', order: 30 },
        'Diamond V': { tier: 'Diamond', color: '#b9f2ff', emoji: 'âœ¨', order: 31 },
        'Diamond IV': { tier: 'Diamond', color: '#b9f2ff', emoji: 'âœ¨', order: 32 },
        'Diamond III': { tier: 'Diamond', color: '#b9f2ff', emoji: 'âœ¨', order: 33 },
        'Diamond II': { tier: 'Diamond', color: '#b9f2ff', emoji: 'âœ¨', order: 34 },
        'Diamond I': { tier: 'Diamond', color: '#b9f2ff', emoji: 'âœ¨', order: 35 },
        'Champion': { tier: 'Champion', color: '#e040fb', emoji: '👑', order: 36 },
    };

    function getRankColor(rank) {
        return RANK_DATA[rank]?.color || '#8b8fa3';
    }

    function getRankEmoji(rank) {
        return RANK_DATA[rank]?.emoji || '🎮';
    }

    // â”€â”€â”€ Utility Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function formatDate(timestamp) {
        const d = new Date(timestamp);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;

        return d.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    }

    // â”€â”€â”€ Toast System â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'âœ“',
            error: 'âœ•',
            info: 'â„¹',
        };

        toast.innerHTML = `<span style="font-weight:700;">${icons[type] || 'â„¹'}</span> ${message}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // â”€â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(tabName) {
        navBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
        tabContents.forEach(tab => tab.classList.toggle('active', tab.id === `tab-${tabName}`));
    }

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('btn-goto-matches')?.addEventListener('click', () => switchTab('matches'));
    document.getElementById('btn-add-first-match')?.addEventListener('click', () => {
        switchTab('matches');
        openMatchModal();
    });

    // â”€â”€â”€ Modal Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    function openModal(modalId) {
        const overlay = document.getElementById(modalId);
        overlay.style.display = 'flex';
        requestAnimationFrame(() => overlay.classList.add('visible'));
    }

    // Close modals
    function closeModal(modalId) {
        const overlay = document.getElementById(modalId);
        overlay.classList.remove('visible');
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
    }

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(overlay.id);
        });
    });

    document.getElementById('close-match-modal')?.addEventListener('click', () => closeModal('modal-match'));
    document.getElementById('cancel-match')?.addEventListener('click', () => closeModal('modal-match'));
    document.getElementById('close-player-modal')?.addEventListener('click', () => closeModal('modal-player'));
    document.getElementById('cancel-player')?.addEventListener('click', () => closeModal('modal-player'));
    document.getElementById('close-edit-player-modal')?.addEventListener('click', () => closeModal('modal-edit-player'));
    document.getElementById('cancel-edit-player')?.addEventListener('click', () => closeModal('modal-edit-player'));
    document.getElementById('close-confirm-modal')?.addEventListener('click', () => closeModal('modal-confirm'));
    document.getElementById('cancel-confirm')?.addEventListener('click', () => closeModal('modal-confirm'));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.visible').forEach(m => closeModal(m.id));
        }
    });

    // â”€â”€â”€ Match Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    function openMatchModal() {
        document.getElementById('match-form').reset();
        selectedTeammates = [];
        selectedOpponents = [];
        populateMultiSelects();
        openModal('modal-match');
    }

    document.getElementById('btn-add-match')?.addEventListener('click', openMatchModal);

    let selectedTeammates = [];
    let selectedOpponents = [];

    function populateMultiSelects() {
        const teammatesDropdown = document.getElementById('teammates-dropdown');
        const opponentsDropdown = document.getElementById('opponents-dropdown');

        const teammates = players.filter(p => p.type === 'teammate');
        const opponents = players.filter(p => p.type === 'opponent');

        teammatesDropdown.innerHTML = teammates.length === 0
            ? '<div class="multi-select-option" style="color:var(--text-muted);cursor:default;">Aucun coéquipier ajouté</div>'
            : teammates.map(p => `
                <div class="multi-select-option ${selectedTeammates.includes(p.id) ? 'selected' : ''}" data-id="${p.id}">
                    ${p.name}
                </div>
            `).join('');

        opponentsDropdown.innerHTML = opponents.length === 0
            ? '<div class="multi-select-option" style="color:var(--text-muted);cursor:default;">Aucun adversaire ajouté</div>'
            : opponents.map(p => `
                <div class="multi-select-option ${selectedOpponents.includes(p.id) ? 'selected' : ''}" data-id="${p.id}">
                    ${p.name}
                </div>
            `).join('');

        updateMultiSelectDisplay('teammates');
        updateMultiSelectDisplay('opponents');

        teammatesDropdown.querySelectorAll('.multi-select-option[data-id]').forEach(opt => {
            opt.addEventListener('click', () => {
                const id = opt.dataset.id;
                if (selectedTeammates.includes(id)) {
                    selectedTeammates = selectedTeammates.filter(x => x !== id);
                    opt.classList.remove('selected');
                } else {
                    selectedTeammates.push(id);
                    opt.classList.add('selected');
                }
                updateMultiSelectDisplay('teammates');
            });
        });

        opponentsDropdown.querySelectorAll('.multi-select-option[data-id]').forEach(opt => {
            opt.addEventListener('click', () => {
                const id = opt.dataset.id;
                if (selectedOpponents.includes(id)) {
                    selectedOpponents = selectedOpponents.filter(x => x !== id);
                    opt.classList.remove('selected');
                } else {
                    selectedOpponents.push(id);
                    opt.classList.add('selected');
                }
                updateMultiSelectDisplay('opponents');
            });
        });
    }

    function updateMultiSelectDisplay(type) {
        const list = type === 'teammates' ? selectedTeammates : selectedOpponents;
        const display = document.getElementById(`${type}-display`);

        if (list.length === 0) {
            display.innerHTML = type === 'teammates' ? 'Aucun coéquipier sélectionné' : 'Aucun adversaire sélectionné';
            display.style.color = 'var(--text-muted)';
        } else {
            display.style.color = '';
            display.innerHTML = list.map(id => {
                const player = players.find(p => p.id === id);
                return player ? `<span class="selected-tag">${player.name}</span>` : '';
            }).join('');
        }
    }

    ['teammates', 'opponents'].forEach(type => {
        const select = document.getElementById(`${type}-select`);
        const display = document.getElementById(`${type}-display`);

        display.addEventListener('click', (e) => {
            e.stopPropagation();
            select.classList.toggle('open');
            const other = type === 'teammates' ? 'opponents' : 'teammates';
            document.getElementById(`${other}-select`).classList.remove('open');
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.multi-select').forEach(s => s.classList.remove('open'));
    });

    // Submit match
    document.getElementById('match-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const map = document.getElementById('match-map').value;
        const result = document.querySelector('input[name="result"]:checked')?.value;
        const scoreUs = parseInt(document.getElementById('match-score-us').value);
        const scoreThem = parseInt(document.getElementById('match-score-them').value);
        const notes = document.getElementById('match-notes').value.trim();

        if (!map || !result || isNaN(scoreUs) || isNaN(scoreThem)) {
            showToast('Veuillez remplir tous les champs requis', 'error');
            return;
        }

        const match = {
            id: generateId(),
            map,
            result,
            scoreUs,
            scoreThem,
            teammates: [...selectedTeammates],
            opponents: [...selectedOpponents],
            notes,
            timestamp: Date.now(),
        };

        matches.unshift(match);
        saveData(STORAGE_KEYS.matches, matches);
        closeModal('modal-match');
        
        // Auto Update Streak & Session Counters
        if (result === 'win') {
            adjustStreak(1);
            adjustWins(1);
            showToast('🏆 Victoire enregistrée ! Streak +1', 'success');
        } else {
            adjustStreak(-1);
            adjustLosses(1);
            showToast('💀 Défaite enregistrée. Streak -1', 'success');
        }
        
        renderAll();
    });

    // â”€â”€â”€ Player Add / Edit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    document.getElementById('btn-add-player')?.addEventListener('click', () => {
        document.getElementById('player-form').reset();
        document.getElementById('type-teammate').checked = true;
        openModal('modal-player');
    });


    document.getElementById('player-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('player-name').value.trim();
        const type = document.querySelector('input[name="player-type"]:checked')?.value;
        const rank = document.getElementById('player-rank').value;
        const platform = document.getElementById('player-platform').value;

        if (!name || !type || !rank) {
            showToast('Veuillez remplir tous les champs requis', 'error');
            return;
        }

        if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            showToast('Un joueur avec ce nom existe déjà', 'error');
            return;
        }

        const player = {
            id: generateId(),
            name,
            type,
            rank,
            platform,
            createdAt: Date.now(),
            externalStats: null, // sera rempli par l'API Tabstats
        };

        players.push(player);
        saveData(STORAGE_KEYS.players, players);
        closeModal('modal-player');
        showToast(`${name} ajouté ! Cliquez 🔍 pour récupérer ses stats automatiquement.`, 'success');
        renderAll();

        // Auto-fetch stats after adding
        const newPlayer = players.find(p => p.name === name);
        if (newPlayer) {
            setTimeout(() => searchAndUpdatePlayerStats(newPlayer.id), 500);
        }
    });


    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  R6 TRACKER HEADLESS INTEGRATION
    //  Récupère les vraies stats R6 Siege depuis r6.tracker.network
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    const PLATFORM_MAP = {
        'PC': 'pc',
        'PlayStation': 'psn',
        'Xbox': 'xbox',
    };

    // Cache des stats pour éviter trop de requêtes (1 heure de cache)
    const statsCache = {};
    const CACHE_DURATION = 60 * 60 * 1000; // 1 heure

    /**
     * Cherche les stats d'un joueur via scraper headless BrowserWindow
     */
    async function fetchPlayerStats(playerName, platform) {
        const platformKey = PLATFORM_MAP[platform] || 'pc';
        const cacheKey = `${playerName}_${platformKey}`;
        const now = Date.now();

        // Retourne le cache si récent
        if (statsCache[cacheKey] && (now - statsCache[cacheKey].timestamp) < CACHE_DURATION) {
            return statsCache[cacheKey].data;
        }

        try {
            const result = await window.r6api.fetchPlayerStatsHeadless(playerName, platformKey);
            if (!result || result.error) throw new Error(result?.error || 'Erreur réseau headless');
            
            const stats = parseR6TrackerData(result.html, playerName);
            if (!stats.found) throw new Error("Stats introuvables (profil privé ou inexistant ?)");
            
            statsCache[cacheKey] = { data: stats, timestamp: now };
            return stats;
        } catch (err) {
            throw new Error(err.message || `Joueur introuvable sur ${platform}.`);
        }
    }

    function parseR6TrackerData(html, playerName) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Suppression des scripts et styles pour un textContent propre
            doc.querySelectorAll('script, style').forEach(el => el.remove());
            
            // textContent unifié
            const cleanText = (doc.body.textContent || '').replace(/\s+/g, ' ');

            let rank = null, kd = null, winrate = null, hours = null, level = null, kills = null, totalWins = null, totalLosses = null;

            // Rank (on teste du plus long au plus court pour match "Copper III" avant "Copper I")
            const rankNames = Object.keys(RANK_DATA).sort((a, b) => b.length - a.length);
            for (let r of rankNames) {
                if (cleanText.includes(r)) {
                    rank = r;
                    break;
                }
            }

            // K/D Ratio
            const kdMatch = cleanText.match(/K\/D(?:\sRatio)?\s*([0-9]+[.,][0-9]+)/i);
            if (kdMatch) kd = parseFloat(kdMatch[1].replace(',', '.'));

            // Win %
            const wrMatch = cleanText.match(/Win\s*%\s*([0-9.]+)%/i);
            if (wrMatch) winrate = parseFloat(wrMatch[1]);
            else {
                const wrMatch2 = cleanText.match(/Win\s*Rate\s*([0-9.]+)%/i);
                if (wrMatch2) winrate = parseFloat(wrMatch2[1]);
            }

            // Level
            const levelMatch = cleanText.match(/Level\s*([0-9]+)/i);
            if (levelMatch) level = parseInt(levelMatch[1], 10);

            // Kills
            const killsMatch = cleanText.match(/Kills\s*([0-9,]+)/i);
            if (killsMatch) kills = parseInt(killsMatch[1].replace(/,/g, ''), 10);

            // Play Time
            const playtimeMatch = cleanText.match(/Play\s*Time\s*([0-9,]+)/i);
            if (playtimeMatch) hours = parseInt(playtimeMatch[1].replace(/,/g, ''), 10);

            const winsMatch = cleanText.match(/Wins?\s*([0-9,]+)/i);
            if (winsMatch) totalWins = parseInt(winsMatch[1].replace(/,/g, ''), 10);

            const lossesMatch = cleanText.match(/Losses?\s*([0-9,]+)/i);
            if (lossesMatch) totalLosses = parseInt(lossesMatch[1].replace(/,/g, ''), 10);

            const found = !!(rank || kd || winrate || kills);

            return {
                found,
                rank: normalizeRankName(rank),
                kd,
                winrate,
                hours,
                level,
                kills,
                totalWins,
                totalLosses,
                source: 'r6tracker',
                lastUpdated: Date.now(),
            };
        } catch (err) {
            console.error('Erreur parsing R6Tracker:', err);
            return { found: false };
        }
    }

    function normalizeRankName(raw) {
        if (!raw) return null;
        const cleaned = raw.trim();
        if (RANK_DATA[cleaned]) return cleaned;
        
        const rankMap = {
            'copper': 'Copper', 'bronze': 'Bronze', 'silver': 'Silver',
            'gold': 'Gold', 'platinum': 'Platinum', 'emerald': 'Emerald',
            'diamond': 'Diamond', 'champion': 'Champion',
        };
        const lower = cleaned.toLowerCase();
        for (const [key, val] of Object.entries(rankMap)) {
            if (lower.startsWith(key)) {
                const roman = lower.replace(key, '').trim();
                const candidate = `${val} ${roman.toUpperCase()}`;
                if (RANK_DATA[candidate]) return candidate;
            }
        }
        return cleaned;
    }

    async function searchAndUpdatePlayerStats(playerId) {
        const player = players.find(p => p.id === playerId);
        if (!player) return;

        const card = document.querySelector(`[data-player-id="${playerId}"]`)?.closest('.player-card');
        const btn = card?.querySelector('.fetch-stats-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner">â³</span> Recherche...`;
        }

        try {
            showToast(`Recherche sur R6 Tracker... (Patientez ~5s)`, 'info');
            const stats = await fetchPlayerStats(player.name, player.platform);

            if (!stats.found) {
                showToast(`Aucune stat trouvée pour ${player.name}`, 'error');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `🔍 Réessayer`;
                }
                return;
            }

            if (stats.rank && RANK_DATA[stats.rank]) {
                player.rank = stats.rank;
            }

            player.externalStats = {
                kd: stats.kd,
                winrate: stats.winrate,
                hours: stats.hours,
                level: stats.level,
                kills: stats.kills,
                totalWins: stats.totalWins,
                totalLosses: stats.totalLosses,
                source: stats.source,
                lastUpdated: stats.lastUpdated,
            };

            saveData(STORAGE_KEYS.players, players);
            renderAll();

            const updated = [];
            if (stats.rank) updated.push(`Rang: ${stats.rank}`);
            if (stats.kd) updated.push(`K/D: ${stats.kd}`);
            if (stats.winrate) updated.push(`Win Rate: ${stats.winrate}%`);

            showToast(`${player.name} mis à jour ! ${updated.slice(0, 3).join(' • ')}`, 'success');

        } catch (err) {
            showToast(err.message || 'Erreur lors de la recherche', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `🔍 Réessayer`;
            }
        }
    }

    async function searchPlayerMultiPlatform(name) {
        const platforms = ['pc', 'psn', 'xbox'];
        const results = [];
        for (const platform of platforms) {
            try {
                const result = await window.r6api.fetchPlayerStatsHeadless(name, platform);
                if (result && !result.error) {
                    const stats = parseR6TrackerData(result.html, name);
                    if (stats.found) {
                        results.push({ platform, stats });
                    }
                }
            } catch {}
        }
        return results;
    }

    // â”€â”€â”€ Modale de recherche de joueur â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    function openSearchModal(playerId) {
        const player = players.find(p => p.id === playerId);
        if (!player) return;

        // Crée la modale de recherche si elle n'existe pas
        let modal = document.getElementById('modal-search-stats');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-search-stats';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-box" style="max-width:500px;">
                    <h3 class="modal-title">🔍 Stats Tabstats</h3>
                    <div id="search-stats-content" style="padding:16px 0;"></div>
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="document.getElementById('modal-search-stats').classList.remove('open')">Fermer</button>
                        <button class="btn-primary" id="apply-stats-btn" style="display:none;">âœ… Appliquer ces stats</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const content = document.getElementById('search-stats-content');
        const applyBtn = document.getElementById('apply-stats-btn');
        
        content.innerHTML = `
            <div style="text-align:center; padding:24px;">
                <div style="font-size:32px; margin-bottom:12px;">â³</div>
                <div style="color:var(--text-muted);">Recherche de <strong style="color:var(--text-primary);">${player.name}</strong> sur Tabstats...</div>
                <div style="color:var(--text-muted); font-size:12px; margin-top:8px;">Plateforme : ${player.platform}</div>
            </div>
        `;
        applyBtn.style.display = 'none';
        modal.classList.add('open');

        searchAndUpdatePlayerStats(playerId);
    }

    // END TABSTATS INTEGRATION
    let pendingDeleteAction = null;

    function confirmDelete(message, action) {
        document.getElementById('confirm-message').textContent = message;
        pendingDeleteAction = action;
        openModal('modal-confirm');
    }

    document.getElementById('confirm-action')?.addEventListener('click', () => {
        if (pendingDeleteAction) {
                pendingDeleteAction();
            pendingDeleteAction = null;
        }
        closeModal('modal-confirm');
    });

    // --- QUICK WIN/LOSS/DRAW VIA F7/F8/OVERLAY BUTTONS ---
    if (window.r6api && window.r6api.onQuickResult) {
        window.r6api.onQuickResult((result) => {
            if (result === 'win') {
                adjustStreak(1); adjustWins(1);
                const qm = { id: generateId(), map: 'Rapide', result: 'win', scoreUs: 0, scoreThem: 0, teammates: [], opponents: [], notes: 'Victoire rapide', timestamp: Date.now() };
                matches.unshift(qm); saveData(STORAGE_KEYS.matches, matches); renderAll();
                showToast('Victoire enregistree !', 'success');
            } else if (result === 'loss') {
                adjustStreak(-1); adjustLosses(1);
                const qm = { id: generateId(), map: 'Rapide', result: 'loss', scoreUs: 0, scoreThem: 0, teammates: [], opponents: [], notes: 'Defaite rapide', timestamp: Date.now() };
                matches.unshift(qm); saveData(STORAGE_KEYS.matches, matches); renderAll();
                showToast('Defaite enregistree.', 'success');
            } else if (result === 'draw') {
                adjustLosses(1);
                const qm = { id: generateId(), map: 'Rapide', result: 'loss', scoreUs: 0, scoreThem: 0, teammates: [], opponents: [], notes: 'Match nul', timestamp: Date.now() };
                matches.unshift(qm); saveData(STORAGE_KEYS.matches, matches); renderAll();
                showToast('Match nul enregistre.', 'info');
            }
        });
    }

    // --- AUTO-TRACKER (BACKGROUND PROFILE POLLING) ---
    let autoTrackerInterval = null;
    let autoTrackerLastStats = null;
    
    async function pollMainPlayerStats() {
        const mainId = localStorage.getItem(STORAGE_KEYS.mainPlayerId);
        if (!mainId) return;
        const mainPlayer = players.find(p => p.id === mainId);
        if (!mainPlayer) return;
        
        try {
            // Fetch without cache
            const platformKey = PLATFORM_MAP[mainPlayer.platform] || 'pc';
            const result = await window.r6api.fetchPlayerStatsHeadless(mainPlayer.name, platformKey);
            if (!result || result.error) return;
            
            const stats = parseR6TrackerData(result.html, mainPlayer.name);
            if (!stats.found || stats.totalWins === null || stats.totalLosses === null) return;
            
            if (autoTrackerLastStats) {
                const winsDiff = stats.totalWins - autoTrackerLastStats.totalWins;
                const lossesDiff = stats.totalLosses - autoTrackerLastStats.totalLosses;
                
                if (winsDiff > 0) {
                    // Win detected!
                    adjustStreak(1); adjustWins(1);
                    const qm = { id: generateId(), map: 'Auto', result: 'win', scoreUs: 0, scoreThem: 0, teammates: [], opponents: [], notes: 'Victoire Auto-Detectée', timestamp: Date.now() };
                    matches.unshift(qm); saveData(STORAGE_KEYS.matches, matches); renderAll();
                    showToast('Victoire Auto-Detectée pour ' + mainPlayer.name + ' !', 'success');
                } else if (lossesDiff > 0) {
                    // Loss detected!
                    adjustStreak(-1); adjustLosses(1);
                    const qm = { id: generateId(), map: 'Auto', result: 'loss', scoreUs: 0, scoreThem: 0, teammates: [], opponents: [], notes: 'Défaite Auto-Detectée', timestamp: Date.now() };
                    matches.unshift(qm); saveData(STORAGE_KEYS.matches, matches); renderAll();
                    showToast('Défaite Auto-Detectée pour ' + mainPlayer.name + '.', 'success');
                }
            }
            
            // Update baseline
            autoTrackerLastStats = { totalWins: stats.totalWins, totalLosses: stats.totalLosses };
        } catch (err) {
            // Silent fail
        }
    }

    function startAutoTracker() {
        const mainId = localStorage.getItem(STORAGE_KEYS.mainPlayerId);
        if (mainId && players.some(p => p.id === mainId)) {
            showToast('🔄 Auto-Tracker activé (Vérification toutes les 1 min)', 'info');
            // Reset baseline on start
            autoTrackerLastStats = null;
            // Check immediately, then every 1 minute (60000 ms)
            pollMainPlayerStats();
            autoTrackerInterval = setInterval(pollMainPlayerStats, 60000);
        } else {
            showToast('⚠️ R6 Siege détecté, mais aucun Joueur Principal (⭐) n est défini. L auto-tracking est désactivé.', 'error');
        }
    }

    function stopAutoTracker() {
        if (autoTrackerInterval) clearInterval(autoTrackerInterval);
        autoTrackerInterval = null;
    }

    // --- HYBRID SCREEN RECORDING FOR OCR (PC Fixe + PC Portable) ---
    let backgroundOcrInterval = null;
    let ocrCooldown = false;
    let localStream = null;
    let ocrStreamInterval = null;
    let useNativeCapturer = false; // false = getUserMedia (PC fixe), true = desktopCapturer (PC portable)

    // Méthode 1 : getUserMedia (PC fixe, 1 GPU)
    async function startStreamCapture() {
        try {
            const sourceId = await window.r6api.getScreenSourceId();
            if (!sourceId) throw new Error('No source ID');

            localStream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId,
                        minWidth: 1280, maxWidth: 1920,
                        minHeight: 720, maxHeight: 1080
                    }
                }
            });

            const video = document.getElementById('ocr-video-stream') || (() => {
                const v = document.createElement('video');
                v.id = 'ocr-video-stream';
                v.style.display = 'none';
                v.autoplay = true;
                v.muted = true;
                document.body.appendChild(v);
                return v;
            })();
            video.srcObject = localStream;
            video.play();

            ocrStreamInterval = setInterval(() => {
                if (ocrCooldown) return;
                if (!video || video.videoWidth === 0) return;
                const canvas = document.createElement('canvas');
                canvas.width = 1280; canvas.height = 720;
                canvas.getContext('2d').drawImage(video, 0, 0, 1280, 720);
                window.r6api.analyzeMatchFrame(canvas.toDataURL('image/jpeg', 0.7));
            }, 5000);

            useNativeCapturer = false;
            console.log('[Background OCR] Mode PC Fixe (getUserMedia) ✅');
            showToast('🎥 Enregistrement fantôme activé', 'info');
            return true;
        } catch (e) {
            console.warn('[Background OCR] getUserMedia échoué, passage en mode PC Portable...', e);
            stopStreamCapture();
            return false;
        }
    }

    function stopStreamCapture() {
        if (ocrStreamInterval) clearInterval(ocrStreamInterval);
        ocrStreamInterval = null;
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            localStream = null;
        }
        const video = document.getElementById('ocr-video-stream');
        if (video) video.srcObject = null;
    }

    // Méthode 2 : desktopCapturer thumbnails (PC Portable, dual GPU)
    function startNativeCapture() {
        const captureAndProcess = async () => {
            if (ocrCooldown) return;
            if (!window.r6api || !window.r6api.captureScreenFrame) return;
            try {
                const frameData = await window.r6api.captureScreenFrame();
                if (frameData) window.r6api.analyzeMatchFrame(frameData);
            } catch (err) {
                console.error('[Background OCR] Erreur native capture:', err);
            }
        };
        captureAndProcess();
        backgroundOcrInterval = setInterval(captureAndProcess, 5000);
        useNativeCapturer = true;
        console.log('[Background OCR] Mode PC Portable (desktopCapturer) ✅');
        showToast('🎥 Enregistrement fantôme activé', 'info');
    }

    // Point d'entrée : essaie getUserMedia, sinon desktopCapturer
    async function startScreenRecording() {
        if (localStream || backgroundOcrInterval) return;
        const streamOk = await startStreamCapture();
        if (!streamOk) {
            startNativeCapture();
        }
    }

    function stopScreenRecording() {
        stopStreamCapture();
        if (backgroundOcrInterval) clearInterval(backgroundOcrInterval);
        backgroundOcrInterval = null;
        useNativeCapturer = false;
    }


    function showCoachModal(result) {
        let modal = document.getElementById('modal-ai-coach');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-ai-coach';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal" style="max-width: 450px; text-align: center; background: linear-gradient(145deg, #1f2335 0%, #16192b 100%); border: 1px solid var(--accent-primary);">
                    <div style="font-size: 3.5rem; margin-bottom: 12px; text-shadow: 0 0 15px var(--accent-primary);">🤖</div>
                    <h2 style="margin-bottom: 16px; color: var(--text-light);"><span style="color:var(--accent-primary);">Coach IA</span> - Fin de Match</h2>
                    <div id="ai-coach-message" style="font-size: 1.05rem; line-height: 1.6; margin-bottom: 24px; padding: 16px; background: rgba(0,0,0,0.2); border-radius: 8px;"></div>
                    <button class="btn-primary" onclick="document.getElementById('modal-ai-coach').classList.remove('visible'); setTimeout(() => document.getElementById('modal-ai-coach').style.display='none', 300)">Compris, Coach !</button>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Allow clicking outside to close
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('visible');
                    setTimeout(() => { modal.style.display = 'none'; }, 300);
                }
            });
        }
        
        const msgContainer = document.getElementById('ai-coach-message');
        const tips = result === 'win' ? [
            "L'IA a analysé ta victoire : Excellente lecture du jeu ! Continue sur cette lancée. Ton agressivité contrôlée a fait la différence.",
            "L'IA a analysé ta victoire : Belle synergie d'équipe. La victoire s'est jouée sur le contrôle de la carte. Garde ce rythme au prochain match !",
            "L'IA a analysé ta victoire : GG ! Tu as bien sécurisé tes lignes de tir. L'adversaire n'a pas su s'adapter à ton positionnement."
        ] : [
            "L'IA a analysé ta défaite : Ne te décourage pas. Prends un instant pour réfléchir : as-tu assez utilisé tes drones avant de prendre tes duels ?",
            "L'IA a analysé ta défaite : Il y a des matchs comme ça... Fais attention à ne pas trop être agressif quand tu as l'avantage numérique.",
            "L'IA a analysé ta défaite : L'adversaire a su trouver une faille. La prochaine fois, essaie d'être plus flexible sur ton choix d'opérateur en défense."
        ];
        
        msgContainer.innerHTML = tips[Math.floor(Math.random() * tips.length)];
        msgContainer.style.borderLeft = result === 'win' ? '4px solid var(--win-color)' : '4px solid var(--loss-color)';
        
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('visible'));
    }

    if (window.r6api && window.r6api.onAutoMatchResult) {
        window.r6api.onAutoMatchResult((result) => {
            if (ocrCooldown) return; // Prevent multiple triggers
            
            ocrCooldown = true;
            // Cooldown of 5 minutes before accepting another match end
            setTimeout(() => { ocrCooldown = false; }, 300000);

            if (result === 'win') {
                adjustStreak(1); adjustWins(1);
                const qm = { id: generateId(), map: 'Auto-OCR', result: 'win', scoreUs: 0, scoreThem: 0, teammates: [], opponents: [], notes: 'Victoire par Analyse Vidéo', timestamp: Date.now() };
                matches.unshift(qm); saveData(STORAGE_KEYS.matches, matches); renderAll();
                showToast('🏆 Victoire détectée automatiquement par OCR ! Overlay mis à jour.', 'success');
                setTimeout(() => showCoachModal('win'), 1500);
            } else if (result === 'loss') {
                adjustStreak(-1); adjustLosses(1);
                const qm = { id: generateId(), map: 'Auto-OCR', result: 'loss', scoreUs: 0, scoreThem: 0, teammates: [], opponents: [], notes: 'Défaite par Analyse Vidéo', timestamp: Date.now() };
                matches.unshift(qm); saveData(STORAGE_KEYS.matches, matches); renderAll();
                showToast('💀 Défaite détectée automatiquement par OCR. Overlay mis à jour.', 'success');
                setTimeout(() => showCoachModal('loss'), 1500);
            }
        });
    }

    // --- R6 SIEGE GAME STATUS LISTENER ---
    if (window.r6api && window.r6api.onR6GameStatus) {
        window.r6api.onR6GameStatus((status) => {
            if (status.running) {
                showToast('🎮 R6 Siege detecté !', 'info'); 
                startAutoTracker();
                startScreenRecording();
            } else {
                showToast('🔴 R6 Siege fermé.', 'info'); 
                stopAutoTracker();
                stopScreenRecording();
            }
        });
    }

    // ─── IN-GAME OVERLAY CONTROLS ─────────────────────────
    function adjustStreak(amount) {
        sessionStreak += amount;
        localStorage.setItem(STORAGE_KEYS.streak, sessionStreak);
        updateStreakUI();
        syncOverlayData();
    }

    function adjustWins(amount) {
        sessionWins = Math.max(0, sessionWins + amount);
        localStorage.setItem(STORAGE_KEYS.wins, sessionWins);
        updateSessionStatsUI();
        syncOverlayData();
    }

    function adjustLosses(amount) {
        sessionLosses = Math.max(0, sessionLosses + amount);
        localStorage.setItem(STORAGE_KEYS.losses, sessionLosses);
        updateSessionStatsUI();
        syncOverlayData();
    }

    function resetSession() {
        sessionStreak = 0;
        sessionWins = 0;
        sessionLosses = 0;
        localStorage.setItem(STORAGE_KEYS.streak, sessionStreak);
        localStorage.setItem(STORAGE_KEYS.wins, sessionWins);
        localStorage.setItem(STORAGE_KEYS.losses, sessionLosses);
        updateStreakUI();
        updateSessionStatsUI();
        syncOverlayData();
        showToast('Session réinitialisée !', 'info');
    }

    function updateStreakUI() {
        const valEl = document.getElementById('control-streak-value');
        if (valEl) {
            valEl.textContent = (sessionStreak > 0 ? '+' : '') + sessionStreak;
            valEl.className = 'streak-number';
            if (sessionStreak > 0) valEl.classList.add('win');
            else if (sessionStreak < 0) valEl.classList.add('loss');
        }
    }

    function updateSessionStatsUI() {
        const winsEl = document.getElementById('control-wins-value');
        const lossesEl = document.getElementById('control-losses-value');
        if (winsEl) winsEl.textContent = sessionWins;
        if (lossesEl) lossesEl.textContent = sessionLosses;
    }

    function syncOverlayData() {
        if (!window.r6api) return;
        
        const teammates = activeTeammateIds
            .map(id => players.find(p => p.id === id))
            .filter(Boolean);

        const opponents = activeOpponentIds
            .map(id => players.find(p => p.id === id))
            .filter(Boolean);

        window.r6api.updateOverlay({
            streak: sessionStreak,
            wins: sessionWins,
            losses: sessionLosses,
            rowSpacing: rowSpacing,
            teammates,
            opponents
        });
    }

    function toggleActivePlayer(id, type) {
        if (type === 'teammate') {
            if (activeTeammateIds.includes(id)) {
                activeTeammateIds = activeTeammateIds.filter(x => x !== id);
            } else {
                activeTeammateIds.push(id);
            }
            saveData(STORAGE_KEYS.activeTeammates, activeTeammateIds);
        } else {
            if (activeOpponentIds.includes(id)) {
                activeOpponentIds = activeOpponentIds.filter(x => x !== id);
            } else {
                activeOpponentIds.push(id);
            }
            saveData(STORAGE_KEYS.activeOpponents, activeOpponentIds);
        }
        renderOverlayTabSelectors();
        syncOverlayData();
    }

    function renderOverlayTabSelectors() {
        const teammatesList = document.getElementById('active-teammates-selectors');
        const opponentsList = document.getElementById('active-opponents-selectors');

        if (!teammatesList || !opponentsList) return;

        const allTeammates = players.filter(p => p.type === 'teammate');
        const allOpponents = players.filter(p => p.type === 'opponent');

        teammatesList.innerHTML = allTeammates.length === 0
            ? '<div class="no-players">Aucun coéquipier ajouté. Allez dans "Joueurs" pour en ajouter.</div>'
            : allTeammates.map(p => {
                const isSelected = activeTeammateIds.includes(p.id);
                const rankColor = getRankColor(p.rank);
                const stats = getPlayerStats(p.id);
                const winrateColor = stats.winrate >= 50 ? 'var(--win-color)' : 'var(--loss-color)';
                return `
                    <div class="active-selector-item ${isSelected ? 'selected' : ''}" data-player-id="${p.id}" data-player-type="teammate">
                        <div class="active-selector-left">
                            <span class="active-checkbox"></span>
                            <span class="active-selector-name">${p.name}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="active-selector-winrate" style="color: ${winrateColor}; font-size: 0.8rem; font-weight: 600; font-family: 'Rajdhani', sans-serif;">
                                ${stats.winrate}% WR
                            </span>
                            <span class="active-selector-rank" style="background: ${rankColor}15; color: ${rankColor}; border: 1px solid ${rankColor}30;">
                                ${p.rank}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');

        opponentsList.innerHTML = allOpponents.length === 0
            ? '<div class="no-players">Aucun adversaire ajouté. Allez dans "Joueurs" pour en ajouter.</div>'
            : allOpponents.map(p => {
                const isSelected = activeOpponentIds.includes(p.id);
                const rankColor = getRankColor(p.rank);
                const stats = getPlayerStats(p.id);
                const winrateColor = stats.winrate >= 50 ? 'var(--win-color)' : 'var(--loss-color)';
                return `
                    <div class="active-selector-item ${isSelected ? 'selected' : ''}" data-player-id="${p.id}" data-player-type="opponent">
                        <div class="active-selector-left">
                            <span class="active-checkbox"></span>
                            <span class="active-selector-name">${p.name}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="active-selector-winrate" style="color: ${winrateColor}; font-size: 0.8rem; font-weight: 600; font-family: 'Rajdhani', sans-serif;">
                                ${stats.winrate}% WR
                            </span>
                            <span class="active-selector-rank" style="background: ${rankColor}15; color: ${rankColor}; border: 1px solid ${rankColor}30;">
                                ${p.rank}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');

        document.querySelectorAll('.active-selector-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.playerId;
                const type = item.dataset.playerType;
                toggleActivePlayer(id, type);
            });
        });
    }

    function initOverlayTabEvents() {
        // Streak events
        document.getElementById('btn-streak-minus')?.addEventListener('click', () => adjustStreak(-1));
        document.getElementById('btn-streak-plus')?.addEventListener('click', () => adjustStreak(1));
        document.getElementById('btn-streak-reset')?.addEventListener('click', resetSession);

        // Manual Wins/Losses adjustment events
        document.getElementById('btn-wins-minus')?.addEventListener('click', () => adjustWins(-1));
        document.getElementById('btn-wins-plus')?.addEventListener('click', () => adjustWins(1));
        document.getElementById('btn-losses-minus')?.addEventListener('click', () => adjustLosses(-1));
        document.getElementById('btn-losses-plus')?.addEventListener('click', () => adjustLosses(1));

        // Slider spacing events
        const spacingSlider = document.getElementById('input-row-spacing');
        const spacingLabel = document.getElementById('label-row-spacing');
        
        if (spacingSlider && spacingLabel) {
            spacingSlider.value = rowSpacing;
            spacingLabel.textContent = rowSpacing + 'px';

            spacingSlider.addEventListener('input', (e) => {
                rowSpacing = parseInt(e.target.value);
                spacingLabel.textContent = rowSpacing + 'px';
                localStorage.setItem(STORAGE_KEYS.rowSpacing, rowSpacing);
                syncOverlayData();
            });
        }

        // ── Display/Screen selector for multi-monitor ──
        const displaySelect = document.getElementById('input-display-select');
        if (displaySelect && window.r6api && window.r6api.listDisplays) {
            window.r6api.listDisplays().then(({ displays, selectedIndex }) => {
                displaySelect.innerHTML = '';
                displays.forEach((d, i) => {
                    const opt = document.createElement('option');
                    opt.value = i;
                    const w = d.width || '?';
                    const h = d.height || '?';
                    opt.textContent = `Écran ${i + 1}` + (w !== '?' ? ` — ${w}×${h}` : '') + (d.primary ? ' (Principal)' : '');
                    if (i === selectedIndex) opt.selected = true;
                    displaySelect.appendChild(opt);
                });
            }).catch(() => {
                displaySelect.innerHTML = '<option value="0">Écran par défaut</option>';
            });

            displaySelect.addEventListener('change', async (e) => {
                const idx = parseInt(e.target.value);
                
                // ⚡ Attendre que l'index soit bien sauvegardé AVANT de redémarrer la capture
                await window.r6api.setDisplayIndex(idx);
                
                // Redémarrer la capture sur le nouvel écran
                stopScreenRecording();
                await startScreenRecording();
                
                showToast(`Écran de capture mis à jour : Écran ${idx + 1}`, 'success');
            });
        }

        // Sim alerts
        document.getElementById('btn-toggle-overlay-visible')?.addEventListener('click', () => {
            showToast('Astuce: Appuyez sur N à tout moment en jeu pour scanner le tableau de score !', 'info');
        });
        document.getElementById('btn-toggle-overlay-locked')?.addEventListener('click', () => {
            showToast('Astuce: Utilisez la touche F10 à tout moment en jeu !', 'info');
        });

        // Initialize IPC listeners for Electron shortcuts status sync
        if (window.r6api) {
            window.r6api.onOverlayVisibility((visible) => {
                const badge = document.getElementById('control-overlay-visible-badge');
                if (badge) {
                    badge.textContent = visible ? 'Visible (Molette)' : 'Masqué (Molette)';
                    badge.className = `overlay-badge ${visible ? 'badge-active' : 'badge-inactive'}`;
                }
            });

            window.r6api.onOverlayLocked((locked) => {
                const badge = document.getElementById('control-overlay-locked-badge');
                if (badge) {
                    badge.textContent = locked ? 'Verrouillé (F10)' : 'Ajustable (F10)';
                    badge.className = `overlay-badge ${locked ? 'badge-locked' : 'badge-unlocked'}`;
                }
            });
        }
    }

    // â”€â”€â”€ Rendering Dashboard, Match History, etc. â”€â”€â”€â”€â”€â”€â”€â”€
    function renderDashboard() {
        const wins = matches.filter(m => m.result === 'win').length;
        const losses = matches.filter(m => m.result === 'loss').length;
        const total = matches.length;
        const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;

        document.getElementById('total-wins').textContent = wins;
        document.getElementById('total-losses').textContent = losses;
        document.getElementById('total-winrate').textContent = winrate + '%';
        document.getElementById('total-matches').textContent = total;
        document.getElementById('winrate-bar').style.width = winrate + '%';

        renderTrend('win-trend', matches, 'win');
        renderTrend('loss-trend', matches, 'loss');

        renderMatchesList(
            document.getElementById('recent-matches-list'),
            matches.slice(0, 5),
            document.getElementById('recent-empty')
        );

        renderChart();
    }

    function renderTrend(elementId, data, type) {
        const el = document.getElementById(elementId);
        if (data.length < 6) {
            el.textContent = '';
            return;
        }
        const recent = data.slice(0, 5).filter(m => m.result === type).length;
        const previous = data.slice(5, 10).filter(m => m.result === type).length;
        const diff = recent - previous;

        if (diff > 0) {
            el.textContent = `â†‘ +${diff} vs précédent`;
            el.style.color = type === 'win' ? 'var(--win-color)' : 'var(--loss-color)';
        } else if (diff < 0) {
            el.textContent = `â†“ ${diff} vs précédent`;
            el.style.color = 'var(--text-muted)';
        } else {
            el.textContent = 'â†’ Stable';
            el.style.color = 'var(--text-muted)';
        }
    }

    function renderMatchesList(container, matchList, emptyEl) {
        container.querySelectorAll('.match-card').forEach(c => c.remove());

        if (matchList.length === 0) {
            if (emptyEl) emptyEl.classList.remove('hidden');
            return;
        }

        if (emptyEl) emptyEl.classList.add('hidden');

        matchList.forEach(match => {
            const card = document.createElement('div');
            card.className = `match-card ${match.result}`;

            const formatPlayerTag = (p, type) => {
                const ext = p.externalStats;
                const kdInfo = ext && ext.kd !== null ? ` <span style="opacity:0.7; font-size:0.85em; margin-left:4px;">[${ext.kd} KD]</span>` : '';
                const rankEmoji = getRankEmoji(p.rank) || '';
                return `<span class="match-player-tag ${type}" title="${p.rank}">${rankEmoji} ${p.name}${kdInfo}</span>`;
            };

            const teammateNames = match.teammates
                .map(id => players.find(p => p.id === id))
                .filter(Boolean)
                .map(p => formatPlayerTag(p, 'teammate'))
                .join('');

            const opponentNames = match.opponents
                .map(id => players.find(p => p.id === id))
                .filter(Boolean)
                .map(p => formatPlayerTag(p, 'opponent'))
                .join('');

            card.innerHTML = `
                <div class="match-result-badge">${match.result === 'win' ? 'W' : 'L'}</div>
                <div class="match-info">
                    <span class="match-map">${match.map}</span>
                    <span class="match-date">${formatDate(match.timestamp)}${match.notes ? ' • ' + match.notes : ''}</span>
                </div>
                <div class="match-score">${match.scoreUs} - ${match.scoreThem}</div>
                <div class="match-players">${teammateNames}${opponentNames}</div>
                <div class="match-actions">
                    <button class="match-delete-btn" data-match-id="${match.id}" title="Supprimer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            `;

            card.querySelector('.match-delete-btn').addEventListener('click', () => {
                confirmDelete(`Supprimer le match sur ${match.map} ?`, () => {
                    matches = matches.filter(m => m.id !== match.id);
                    saveData(STORAGE_KEYS.matches, matches);
                    showToast('Match supprimé', 'info');
                    renderAll();
                });
            });

            container.appendChild(card);
        });
    }

    let currentFilter = 'all';
    document.querySelectorAll('#match-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            document.querySelectorAll('#match-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderMatchesTab();
        });
    });

    function renderMatchesTab() {
        let filtered = matches;
        if (currentFilter === 'win') filtered = matches.filter(m => m.result === 'win');
        if (currentFilter === 'loss') filtered = matches.filter(m => m.result === 'loss');

        renderMatchesList(
            document.getElementById('matches-list'),
            filtered,
            document.getElementById('matches-empty')
        );
    }

    let currentPlayerTab = 'teammates';
    document.querySelectorAll('.player-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPlayerTab = btn.dataset.ptab;
            document.querySelectorAll('.player-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderPlayersTab();
        });
    });

    function getPlayerStats(playerId) {
        const player = players.find(p => p.id === playerId);
        if (!player) return { wins: 0, losses: 0, total: 0, winrate: 0 };

        const field = player.type === 'teammate' ? 'teammates' : 'opponents';
        const playerMatches = matches.filter(m => m[field]?.includes(playerId));

        const wins = playerMatches.filter(m => m.result === 'win').length;
        const losses = playerMatches.filter(m => m.result === 'loss').length;
        const total = playerMatches.length;
        const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;

        return { wins, losses, total, winrate };
    }


    function renderPlayersTab() {
        const container = document.getElementById('players-list');
        const emptyEl = document.getElementById('players-empty');
        container.querySelectorAll('.player-card').forEach(c => c.remove());

        const type = currentPlayerTab === 'teammates' ? 'teammate' : 'opponent';
        const filtered = players.filter(p => p.type === type);

        if (filtered.length === 0) {
            emptyEl.classList.remove('hidden');
            return;
        }

        emptyEl.classList.add('hidden');

        filtered.sort((a, b) => {
            const orderA = RANK_DATA[a.rank]?.order || 0;
            const orderB = RANK_DATA[b.rank]?.order || 0;
            return orderB - orderA;
        });

        filtered.forEach(player => {
            const stats = getPlayerStats(player.id);
            const ext = player.externalStats;
            const rankColor = getRankColor(player.rank);
            const rankEmoji = getRankEmoji(player.rank);
            const initials = player.name.substring(0, 2).toUpperCase();

            // Format last updated time
            const lastUpdated = ext?.lastUpdated
                ? `Mis à jour ${formatDate(ext.lastUpdated)}`
                : 'Jamais synchronisé';

            // External stats section
            const extStatsHtml = ext ? `
                <div class="player-external-stats">
                    ${ext.kd !== null && ext.kd !== undefined ? `
                        <div class="ext-stat">
                            <div class="ext-stat-value">${ext.kd?.toFixed(2) || '—'}</div>
                            <div class="ext-stat-label">K/D</div>
                        </div>` : ''}

                    ${ext.hours !== null && ext.hours !== undefined ? `
                        <div class="ext-stat">
                            <div class="ext-stat-value">${ext.hours !== null ? ext.hours + 'h' : '—'}</div>
                            <div class="ext-stat-label">Jeu</div>
                        </div>` : ''}
                    ${ext.level !== null && ext.level !== undefined ? `
                        <div class="ext-stat">
                            <div class="ext-stat-value">${ext.level !== null ? 'Niv. ' + ext.level : '—'}</div>
                            <div class="ext-stat-label">Niveau</div>
                        </div>` : ''}
                    ${ext.kills !== null && ext.kills !== undefined ? `
                        <div class="ext-stat">
                            <div class="ext-stat-value">${ext.kills !== null ? (ext.kills >= 1000 ? (ext.kills/1000).toFixed(1) + 'k' : ext.kills) : '—'}</div>
                            <div class="ext-stat-label">Kills</div>
                        </div>` : ''}
                </div>
                <div class="ext-stats-footer">
                    <span class="ext-source-badge">📊 Tabstats</span>
                    <span class="ext-last-updated">${lastUpdated}</span>
                </div>
            ` : `
                <div class="player-no-stats">
                    <span>Aucune stat en ligne. Cliquez 🔄 pour synchroniser.</span>
                </div>
            `;

            const card = document.createElement('div');
            card.className = `player-card ${player.type}`;

            card.innerHTML = `
                <div class="player-card-header">
                    <div class="player-avatar">${initials}</div>
                    <div>
                        <div class="player-name">${player.name}</div>
                        <div class="player-platform">${player.platform}</div>
                    </div>
                </div>
                <div class="player-rank-section">
                    <div class="rank-icon" style="background: ${rankColor}20; color: ${rankColor}; border: 1px solid ${rankColor}40;">${rankEmoji}</div>
                    <span class="rank-name" style="color: ${rankColor};">${player.rank}</span>
                </div>
                <div class="player-stats" title="Statistiques Globales (ou Session si non synchronisé)">
                    <div class="player-stat">
                        <div class="player-stat-value" style="color: var(--win-color);">${ext?.totalWins ?? stats.wins}</div>
                        <div class="player-stat-label">Wins</div>
                    </div>
                    <div class="player-stat">
                        <div class="player-stat-value" style="color: var(--loss-color);">${ext?.totalLosses ?? stats.losses}</div>
                        <div class="player-stat-label">Losses</div>
                    </div>
                    <div class="player-stat">
                        <div class="player-stat-value">${ext?.winrate ?? stats.winrate}%</div>
                        <div class="player-stat-label">Win Rate</div>
                    </div>
                </div>
                ${extStatsHtml}
                <div class="player-card-actions">
                    <button class="player-action-btn main-player-btn" data-player-id="${player.id}" title="Définir comme joueur principal pour l'Auto-Tracker">
                        ${localStorage.getItem(STORAGE_KEYS.mainPlayerId) === player.id ? '⭐ Principal' : '☆ Définir Principal'}
                    </button>
                    <button class="player-action-btn fetch-stats-btn" data-player-id="${player.id}" title="Actualiser les stats depuis R6 Tracker">
                        🔍 Actualiser
                    </button>
                    <button class="player-action-btn view-tracker-btn" data-player-id="${player.id}" title="Ouvrir R6 Tracker dans le navigateur">
                        🌍 Voir Tracker
                    </button>
                    <button class="player-action-btn edit-player-btn" data-player-id="${player.id}" title="Modifier" style="padding: 0 12px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2-2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button class="player-action-btn delete delete-player-btn" data-player-id="${player.id}" title="Supprimer" style="padding: 0 12px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"/></svg></button>
                </div>
            `;

            // Events
            card.querySelector('.main-player-btn')?.addEventListener('click', () => {
                if (localStorage.getItem(STORAGE_KEYS.mainPlayerId) === player.id) {
                    localStorage.removeItem(STORAGE_KEYS.mainPlayerId);
                    showToast('Joueur principal retiré', 'info');
                } else {
                    localStorage.setItem(STORAGE_KEYS.mainPlayerId, player.id);
                    showToast(player.name + ' défini comme joueur principal pour l Auto-Tracker', 'success');
                }
                renderPlayersTab();
            });

            card.querySelector('.fetch-stats-btn').addEventListener('click', (e) => {
                const btn = e.currentTarget;
                btn.disabled = true;
                btn.textContent = 'â³ Recherche...';
                searchAndUpdatePlayerStats(player.id).finally(() => {
                    btn.disabled = false;
                    btn.textContent = '🔍 Actualiser';
                });
            });

            card.querySelector('.view-tracker-btn').addEventListener('click', () => {
                const platformMap = { 'Xbox': 'xbl', 'PlayStation': 'psn', 'PC': 'ubi' };
                const p = platformMap[player.platform] || 'ubi';
                const url = `https://r6.tracker.network/r6siege/profile/${p}/${encodeURIComponent(player.name)}/overview`;
                window.r6api.openExternalUrl(url);
            });

            card.querySelector('.edit-player-btn').addEventListener('click', () => {
                document.getElementById('edit-player-id').value = player.id;
                document.getElementById('edit-player-name').value = player.name;
                document.getElementById('edit-player-rank').value = player.rank;
                document.getElementById('edit-player-platform').value = player.platform;
                openModal('modal-edit-player');
            });

            card.querySelector('.delete-player-btn').addEventListener('click', () => {
                confirmDelete(`Supprimer le joueur "${player.name}" ?`, () => {
                    players = players.filter(p => p.id !== player.id);
                    saveData(STORAGE_KEYS.players, players);
                    
                    if (Array.isArray(activeTeammateIds)) {
                        activeTeammateIds = activeTeammateIds.filter(x => x !== player.id);
                        saveData(STORAGE_KEYS.activeTeammates, activeTeammateIds);
                    } else {
                        activeTeammateIds = [];
                    }
                    
                    if (Array.isArray(activeOpponentIds)) {
                        activeOpponentIds = activeOpponentIds.filter(x => x !== player.id);
                        saveData(STORAGE_KEYS.activeOpponents, activeOpponentIds);
                    } else {
                        activeOpponentIds = [];
                    }
                    
                    showToast(`${player.name} supprimé`, 'info');
                    renderAll();
                });
            });

            container.appendChild(card);
        });
    }


    function renderChart() {
        const canvas = document.getElementById('performance-chart');
        const ctx = canvas.getContext('2d');
        const emptyEl = document.getElementById('chart-empty');

        if (matches.length === 0) {
            emptyEl.classList.remove('hidden');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        emptyEl.classList.add('hidden');

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = { top: 20, right: 20, bottom: 40, left: 50 };

        ctx.clearRect(0, 0, width, height);

        const sortedMatches = [...matches].sort((a, b) => a.timestamp - b.timestamp);
        const grouped = {};
        sortedMatches.forEach(m => {
            const key = new Date(m.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            if (!grouped[key]) grouped[key] = { wins: 0, losses: 0 };
            if (m.result === 'win') grouped[key].wins++;
            else grouped[key].losses++;
        });

        const labels = Object.keys(grouped);
        const winsData = labels.map(l => grouped[l].wins);
        const lossesData = labels.map(l => grouped[l].losses);

        if (labels.length === 0) return;

        const maxVal = Math.max(...winsData, ...lossesData, 1);
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        const gridSteps = 5;
        for (let i = 0; i <= gridSteps; i++) {
            const y = padding.top + (chartH / gridSteps) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            const val = Math.round(maxVal - (maxVal / gridSteps) * i);
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = '11px Inter';
            ctx.textAlign = 'right';
            ctx.fillText(val.toString(), padding.left - 10, y + 4);
        }

        const maxLabels = Math.min(labels.length, 12);
        const step = Math.max(1, Math.floor(labels.length / maxLabels));

        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';

        for (let i = 0; i < labels.length; i += step) {
            const x = padding.left + (chartW / (labels.length - 1 || 1)) * i;
            ctx.fillText(labels[i], x, height - 10);
        }

        drawLine(ctx, winsData, labels.length, maxVal, chartW, chartH, padding, '#22c55e', 'rgba(34, 197, 94, 0.08)');
        drawLine(ctx, lossesData, labels.length, maxVal, chartW, chartH, padding, '#ef4444', 'rgba(239, 68, 68, 0.08)');

        drawDots(ctx, winsData, labels.length, maxVal, chartW, chartH, padding, '#22c55e');
        drawDots(ctx, lossesData, labels.length, maxVal, chartW, chartH, padding, '#ef4444');
    }

    function drawLine(ctx, data, count, max, chartW, chartH, padding, color, fillColor) {
        if (data.length === 0) return;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const getX = (i) => padding.left + (chartW / (count - 1 || 1)) * i;
        const getY = (v) => padding.top + chartH - (v / max) * chartH;

        ctx.moveTo(getX(0), getY(data[0]));
        for (let i = 1; i < data.length; i++) {
            const cpX = (getX(i - 1) + getX(i)) / 2;
            ctx.bezierCurveTo(cpX, getY(data[i - 1]), cpX, getY(data[i]), getX(i), getY(data[i]));
        }
        ctx.stroke();

        ctx.lineTo(getX(data.length - 1), padding.top + chartH);
        ctx.lineTo(getX(0), padding.top + chartH);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
    }

    function drawDots(ctx, data, count, max, chartW, chartH, padding, color) {
        const getX = (i) => padding.left + (chartW / (count - 1 || 1)) * i;
        const getY = (v) => padding.top + chartH - (v / max) * chartH;

        data.forEach((v, i) => {
            ctx.beginPath();
            ctx.arc(getX(i), getY(v), 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#161822';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(renderChart, 200);
    });

    // â”€â”€â”€ RANKING TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let currentRankingFilter = 'all';
    let currentRankingScope = 'local';
    let globalLeaderboardCache = null;

    document.querySelectorAll('[data-rfilter]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentRankingFilter = btn.dataset.rfilter;
            document.querySelectorAll('[data-rfilter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderRankingTab();
        });
    });

    document.querySelectorAll('[data-scope]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentRankingScope = btn.dataset.scope;
            document.querySelectorAll('[data-scope]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterGroup = document.getElementById('ranking-filter-group');
            if (filterGroup) {
                filterGroup.style.display = currentRankingScope === 'global' ? 'none' : 'flex';
            }
            renderRankingTab();
        });
    });

    async function renderRankingTab() {
        const podiumContainer = document.getElementById('ranking-podium');
        const listContainer = document.getElementById('ranking-list');
        const emptyEl = document.getElementById('ranking-empty');

        if (currentRankingScope === 'global') {
            podiumContainer.innerHTML = '';
            listContainer.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);"><div class="spinner" style="font-size:2rem; margin-bottom:16px;">â³</div><div>Récupération du Top 100 mondial...<br>(Le scraper headless prend environ 5 à 10 secondes)</div></div>';
            if (emptyEl) emptyEl.classList.add('hidden');

            try {
                if (!globalLeaderboardCache || (Date.now() - globalLeaderboardCache.timestamp) > 10 * 60 * 1000) {
                    const result = await window.r6api.fetchLeaderboardHeadless();
                    if (!result || result.error) throw new Error(result?.error || 'Erreur réseau');
                    
                    const topPlayers = parseGlobalLeaderboard(result.html);
                    if (!topPlayers.length) throw new Error("Impossible de parser le leaderboard (Structure HTML inconnue ou Cloudflare bloquant)");
                    
                    globalLeaderboardCache = { data: topPlayers, timestamp: Date.now() };
                }
                renderGlobalLeaderboard(globalLeaderboardCache.data);
            } catch (err) {
                listContainer.innerHTML = `<div style="text-align:center; padding:40px; color:var(--loss-color);">âŒ ${err.message}</div>`;
            }
            return;
        }

        // --- LOCAL RANKING ---
        let filtered = [...players];
        if (currentRankingFilter === 'teammates') {
            filtered = filtered.filter(p => p.type === 'teammate');
        } else if (currentRankingFilter === 'opponents') {
            filtered = filtered.filter(p => p.type === 'opponent');
        }

        const getTrueStats = (player) => {
            const ext = player.externalStats;
            if (ext) {
                return {
                    wins: (ext.totalWins !== undefined && ext.totalWins !== null) ? ext.totalWins : 0,
                    losses: (ext.totalLosses !== undefined && ext.totalLosses !== null) ? ext.totalLosses : 0,
                    winrate: ext.winrate || 0,
                    kd: ext.kd || 0
                };
            }
            // Fallback to local
            const local = getPlayerStats(player.id);
            return {
                wins: local.wins,
                losses: local.losses,
                winrate: local.winrate,
                kd: 0
            };
        };

        filtered.sort((a, b) => {
            const statsA = getTrueStats(a);
            const statsB = getTrueStats(b);
            
            if (statsB.wins !== statsA.wins) return statsB.wins - statsA.wins; // Max Wins first
            if (statsB.kd !== statsA.kd) return statsB.kd - statsA.kd; // Then best KD
            // Then rank order as fallback
            const orderA = RANK_DATA[a.rank]?.order || 0;
            const orderB = RANK_DATA[b.rank]?.order || 0;
            return orderB - orderA;
        });

        podiumContainer.innerHTML = '';
        listContainer.querySelectorAll('.ranking-row').forEach(r => r.remove());

        if (filtered.length === 0) {
            if (emptyEl) emptyEl.classList.remove('hidden');
            return;
        }
        if (emptyEl) emptyEl.classList.add('hidden');

        // Podium (Top 3)
        const top3 = filtered.slice(0, Math.min(3, filtered.length));
        const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : [top3[0]];
        const podiumPositions = top3.length >= 3 ? [2, 1, 3] : top3.length === 2 ? [2, 1] : [1];

        podiumOrder.forEach((player, idx) => {
            const pos = podiumPositions[idx];
            const stats = getTrueStats(player);
            const rankColor = getRankColor(player.rank);
            const rankEmoji = getRankEmoji(player.rank);
            const initials = player.name.substring(0, 2).toUpperCase();

            const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉';
            const podiumClass = pos === 1 ? 'podium-first' : pos === 2 ? 'podium-second' : 'podium-third';

            const card = document.createElement('div');
            card.className = `podium-card ${podiumClass}`;
            card.innerHTML = `
                <div class="podium-medal">${medal}</div>
                <div class="podium-avatar" style="border-color: ${rankColor}; box-shadow: 0 0 15px ${rankColor}40;">${initials}</div>
                <div class="podium-name">${player.name}</div>
                <div class="podium-rank-badge" style="background: ${rankColor}18; color: ${rankColor}; border: 1px solid ${rankColor}35;">
                    <span class="podium-rank-emoji">${rankEmoji}</span>
                    <span>${player.rank}</span>
                </div>
                <div class="podium-stats">
                    <span class="podium-winrate">${stats.winrate}% <span style="font-size:0.7em; color:var(--accent-primary); margin-left:4px;">KD: ${stats.kd > 0 ? stats.kd.toFixed(2) : '-'}</span></span>
                    <span class="podium-wl">${stats.wins}W - ${stats.losses}L</span>
                </div>
                <div class="podium-bar" style="height: ${pos === 1 ? '100px' : pos === 2 ? '72px' : '52px'}; background: linear-gradient(to top, ${rankColor}25, transparent);"></div>
            `;
            podiumContainer.appendChild(card);
        });

        // Full Ranking List
        filtered.forEach((player, idx) => {
            const stats = getTrueStats(player);
            const rankColor = getRankColor(player.rank);
            const rankEmoji = getRankEmoji(player.rank);
            const typeLabel = player.type === 'teammate' ? 'Coéquipier' : 'Adversaire';
            const typeClass = player.type === 'teammate' ? 'type-teammate' : 'type-opponent';

            const row = document.createElement('div');
            row.className = 'ranking-row';
            if (idx < 3) row.classList.add('ranking-top3');

            row.innerHTML = `
                <span class="rank-col-pos">
                    <span class="ranking-position ${idx < 3 ? 'pos-top' : ''}" style="${idx < 3 ? 'background:' + rankColor + '20; color:' + rankColor + '; border: 1px solid ' + rankColor + '40;' : ''}">${idx + 1}</span>
                </span>
                <span class="rank-col-name">
                    <span class="ranking-player-avatar" style="background: ${rankColor}20; color: ${rankColor}; border: 1px solid ${rankColor}30;">${player.name.substring(0, 2).toUpperCase()}</span>
                    <span class="ranking-player-name">${player.name}</span>
                </span>
                <span class="rank-col-type">
                    <span class="ranking-type-badge ${typeClass}">${typeLabel}</span>
                </span>
                <span class="rank-col-rank">
                    <span class="ranking-rank-badge" style="background: ${rankColor}15; color: ${rankColor}; border: 1px solid ${rankColor}30;">
                        ${rankEmoji} ${player.rank}
                    </span>
                </span>
                <span class="rank-col-stats">
                    <span style="color: var(--win-color);">${stats.wins}</span>
                    <span style="color: var(--text-muted); opacity: 0.4;">/</span>
                    <span style="color: var(--loss-color);">${stats.losses}</span>
                    <span style="margin-left: 12px; color: var(--accent-primary); font-size: 0.85em; background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px;">K/D: ${stats.kd > 0 ? stats.kd.toFixed(2) : '-'}</span>
                </span>
                <span class="rank-col-winrate">
                    <div class="ranking-winrate-bar-bg">
                        <div class="ranking-winrate-bar-fill" style="width: ${stats.winrate}%; background: ${rankColor};"></div>
                    </div>
                    <span class="ranking-winrate-text">${stats.winrate}%</span>
                </span>
            `;
            listContainer.appendChild(row);
        });
    }

    function parseGlobalLeaderboard(html) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            // Remove junk
            doc.querySelectorAll('script, style, svg, img, iframe, nav, header, footer').forEach(e => e.remove());
            
            // Try to find table rows
            let rows = Array.from(doc.querySelectorAll('table tbody tr'));
            if (rows.length === 0) rows = Array.from(doc.querySelectorAll('[role="row"]')).slice(1);
            if (rows.length === 0) rows = Array.from(doc.querySelectorAll('.trn-leaderboard-row, .leaderboard-row'));

            const players = [];
            rows.forEach((row, idx) => {
                const textTokens = (row.textContent || '').replace(/\s+/g, ' ').trim().split(' ').filter(x => x);
                if (textTokens.length < 2) return;
                
                // Le premier élément est souvent le rank (#1)
                let pos = parseInt(textTokens[0].replace(/[^0-9]/g, ''));
                if (isNaN(pos)) pos = idx + 1;
                
                let name = textTokens.find(t => t.length > 2 && !t.match(/^[0-9,.]+$/)) || textTokens[1];
                let rating = textTokens.slice(2).join(' ').substring(0, 30); // Info additionnelle (MMR, Winrate)

                players.push({ pos, name, rating });
            });

            return players.slice(0, 100);
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    function renderGlobalLeaderboard(players) {
        const listContainer = document.getElementById('ranking-list');
        listContainer.innerHTML = '';
        
        players.forEach((p, idx) => {
            const row = document.createElement('div');
            row.className = 'ranking-row';
            if (idx < 3) row.classList.add('ranking-top3');

            // Force rank colors for top 1 (Champion style)
            const rankColor = idx === 0 ? '#e040fb' : idx < 3 ? '#b9f2ff' : '#8b8fa3';
            const initials = p.name ? p.name.substring(0, 2).toUpperCase() : '??';

            row.innerHTML = `
                <span class="rank-col-pos" style="flex: 0.5;">
                    <span class="ranking-position ${idx < 3 ? 'pos-top' : ''}" style="${idx < 3 ? 'background:' + rankColor + '20; color:' + rankColor + '; border: 1px solid ' + rankColor + '40;' : ''}">${p.pos}</span>
                </span>
                <span class="rank-col-name" style="flex: 2;">
                    <span class="ranking-player-avatar" style="background: ${rankColor}20; color: ${rankColor}; border: 1px solid ${rankColor}30;">${initials}</span>
                    <span class="ranking-player-name" style="font-weight: 700; font-size: 1.1rem;">${p.name}</span>
                </span>
                <span class="rank-col-stats" style="flex: 3; color: var(--text-muted); font-size: 0.9rem; justify-content: flex-start;">
                    ${p.rating}
                </span>
                <span class="rank-col-rank" style="flex: 1;">
                    <a href="https://r6.tracker.network/r6siege/profile/ubi/${encodeURIComponent(p.name)}/overview" target="_blank" class="btn-secondary" style="padding: 4px 8px; font-size: 0.8rem; text-decoration: none;">Voir Profil</a>
                </span>
            `;
            listContainer.appendChild(row);
        });
    }

    // â”€â”€â”€ Render All â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    function renderAll() {
        renderDashboard();
        renderMatchesTab();
        renderPlayersTab();
        renderRankingTab();
        renderOverlayTabSelectors();
        updateStreakUI();
        updateSessionStatsUI();
        syncOverlayData();
    }

    // â”€â”€â”€ Initialize â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    initOverlayTabEvents();
    renderAll();

    // Entrance animation
    document.querySelectorAll('.stat-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + i * 80);
    });

    // ─── GLOBAL SEARCH BAR ───
    function initGlobalSearch() {
        const form = document.getElementById('global-search-form');
        const input = document.getElementById('global-search-input');
        const submitBtn = document.getElementById('global-search-btn');
        const closeBtn = document.getElementById('close-tracker-modal');
        const content = document.getElementById('tracker-profile-content');
        
        let lastSearchedPlayer = null;

        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = input.value.trim();
            const platformInput = document.querySelector('input[name="global-platform"]:checked');
            const platform = platformInput ? platformInput.value : 'pc';

            if (!username) return;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;"></div>';
            showToast('Recherche de ' + username + ' sur R6 Tracker...', 'info');

            try {
                const result = await window.r6api.fetchPlayerStatsHeadless(username, platform);
                
                if (!result || result.error) {
                    throw new Error(result?.error || 'Erreur lors de la récupération');
                }

                const data = parseR6TrackerData(result.html, username);
                
                if (!data.found) {
                    throw new Error('Joueur introuvable ou aucune donnée R6 Tracker.');
                }

                lastSearchedPlayer = { name: username, platform: platform, data: data };

                const rankColor = getRankColor(data.rank);
                const rankEmoji = getRankEmoji(data.rank);
                const initials = username.substring(0, 2).toUpperCase();

                content.innerHTML = `
                    <div class="tracker-profile-header">
                        <div class="tracker-profile-avatar" style="border: 2px solid ${rankColor}; box-shadow: 0 0 15px ${rankColor}40;">
                            ${initials}
                        </div>
                        <div>
                            <div class="tracker-profile-name">${username}</div>
                            <div class="tracker-profile-platform">${platform === 'pc' ? 'PC (Ubisoft)' : platform === 'xbox' ? 'Xbox Live' : 'PlayStation Network'}</div>
                        </div>
                    </div>
                    <div style="background: ${rankColor}15; border: 1px solid ${rankColor}30; border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <span style="font-size: 2rem;">${rankEmoji}</span>
                        <div>
                            <div style="font-weight: 700; color: ${rankColor}; font-size: 1.2rem;">${data.rank || 'Unranked'}</div>
                            <div style="color: var(--text-muted); font-size: 0.85rem;">Classement Actuel</div>
                        </div>
                    </div>
                    <div class="tracker-profile-stats-grid">
                        <div class="ext-stat" style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px;">
                            <div class="ext-stat-value" style="font-size: 1.5rem; font-weight: bold;">${data.kd !== null ? data.kd.toFixed(2) : 'N/A'}</div>
                            <div class="ext-stat-label" style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Ratio K/D</div>
                        </div>
                        <div class="ext-stat" style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px;">
                            <div class="ext-stat-value" style="font-size: 1.5rem; font-weight: bold;">${data.winrate !== null ? data.winrate + '%' : 'N/A'}</div>
                            <div class="ext-stat-label" style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Win Rate</div>
                        </div>
                        <div class="ext-stat" style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px;">
                            <div class="ext-stat-value" style="font-size: 1.5rem; font-weight: bold;">${data.level !== null ? data.level : 'N/A'}</div>
                            <div class="ext-stat-label" style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Niveau</div>
                        </div>
                        <div class="ext-stat" style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px;">
                            <div class="ext-stat-value" style="font-size: 1.5rem; font-weight: bold;">${data.kills !== null ? data.kills.toLocaleString() : 'N/A'}</div>
                            <div class="ext-stat-label" style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Kills Totaux</div>
                        </div>
                        <div class="ext-stat" style="background: rgba(255,255,255,0.05); padding: 16px; grid-column: span 2; border-radius: 8px;">
                            <div class="ext-stat-value" style="font-size: 1.5rem; font-weight: bold;">${data.hours !== null ? data.hours + 'h' : 'N/A'}</div>
                            <div class="ext-stat-label" style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Temps de Jeu</div>
                        </div>
                    </div>
                `;

                openModal('modal-tracker-profile');

            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
            }
        });

        document.getElementById('tracker-modal-add-teammate')?.addEventListener('click', () => {
            if (lastSearchedPlayer) {
                document.getElementById('player-name').value = lastSearchedPlayer.name;
                document.getElementById('type-teammate').checked = true;
                const platformMap = { 'pc': 'PC', 'xbox': 'Xbox', 'psn': 'PlayStation' };
                document.getElementById('player-platform').value = platformMap[lastSearchedPlayer.platform];
                document.getElementById('player-rank').value = lastSearchedPlayer.data.rank || '';
                closeModal('modal-tracker-profile');
                openModal('modal-player');
                showToast("Complétez l'ajout du joueur", 'info');
            }
        });

        document.getElementById('tracker-modal-add-opponent')?.addEventListener('click', () => {
            if (lastSearchedPlayer) {
                document.getElementById('player-name').value = lastSearchedPlayer.name;
                document.getElementById('type-opponent').checked = true;
                const platformMap = { 'pc': 'PC', 'xbox': 'Xbox', 'psn': 'PlayStation' };
                document.getElementById('player-platform').value = platformMap[lastSearchedPlayer.platform];
                document.getElementById('player-rank').value = lastSearchedPlayer.data.rank || '';
                closeModal('modal-tracker-profile');
                openModal('modal-player');
                showToast("Complétez l'ajout de l'adversaire", 'info');
            }
        });
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closeModal('modal-tracker-profile');
            });
        }
    }
    
    initGlobalSearch();

    // --- OCR SCOREBOARD INTEGRATION ---
    let scoreboardSessionPlayers = [];

    function getOcrNameCandidates(originalName) {
        const candidates = new Set();
        const clean = originalName.trim();
        if (clean.length < 3) return [];

        // 1. Remplacer les virgules par des points (erreur d'OCR fréquente)
        if (clean.includes(',')) {
            candidates.add(clean.replace(/,/g, '.'));
        }

        // 2. Gestion des points manquants ou en trop
        if (clean.includes('.')) {
            candidates.add(clean.replace(/\./g, ''));
        }
        
        const dotsCount = (clean.match(/\./g) || []).length;
        if (dotsCount >= 2 && clean.length <= 10) {
            const lettersOnly = clean.replace(/\./g, '');
            const withAllDots = lettersOnly.split('').join('.');
            candidates.add(withAllDots);
        }

        // 3. Substitutions de caractères fréquemment confondus par Tesseract OCR
        if (clean.includes('0')) candidates.add(clean.replace(/0/g, 'O'));
        if (clean.includes('O')) candidates.add(clean.replace(/O/g, '0'));
        if (clean.includes('o')) candidates.add(clean.replace(/o/g, '0'));

        if (clean.includes('1')) {
            candidates.add(clean.replace(/1/g, 'I'));
            candidates.add(clean.replace(/1/g, 'l'));
        }
        if (clean.includes('I')) {
            candidates.add(clean.replace(/I/g, '1'));
            candidates.add(clean.replace(/I/g, 'l'));
        }
        if (clean.includes('l')) {
            candidates.add(clean.replace(/l/g, '1'));
            candidates.add(clean.replace(/l/g, 'I'));
        }

        if (clean.includes('S')) candidates.add(clean.replace(/S/g, '5'));
        if (clean.includes('5')) candidates.add(clean.replace(/5/g, 'S'));
        if (clean.includes('s')) candidates.add(clean.replace(/s/g, '5'));

        if (clean.includes('B')) candidates.add(clean.replace(/B/g, '8'));
        if (clean.includes('8')) candidates.add(clean.replace(/8/g, 'B'));

        if (clean.includes('Z')) candidates.add(clean.replace(/Z/g, '2'));
        if (clean.includes('2')) candidates.add(clean.replace(/2/g, 'Z'));
        if (clean.includes('z')) candidates.add(clean.replace(/z/g, '2'));

        if (clean.includes('G')) candidates.add(clean.replace(/G/g, '6'));
        if (clean.includes('6')) candidates.add(clean.replace(/6/g, 'G'));
        if (clean.includes('g')) candidates.add(clean.replace(/g/g, '6'));

        if (clean.includes('_')) candidates.add(clean.replace(/_/g, '-'));
        if (clean.includes('-')) candidates.add(clean.replace(/-/g, '_'));

        candidates.delete(originalName);
        return Array.from(candidates).slice(0, 4);
    }

    async function fetchSinglePlayerStats(sp) {
        const platformsToTry = ['pc', 'psn', 'xbl'];
        let foundData = null;
        let finalPlatform = 'pc';
        let lastError = null;

        // Étape 1 : Essayer le nom original sur les 3 plateformes
        for (let plat of platformsToTry) {
            try {
                const result = await window.r6api.fetchPlayerStatsHeadless(sp.name, plat);
                if (!result || result.error) throw new Error(result?.error || 'Erreur réseau');
                const data = parseR6TrackerData(result.html, sp.name);
                if (!data.found) throw new Error('Introuvable sur ' + plat.toUpperCase());
                
                foundData = data;
                finalPlatform = plat;
                break;
            } catch (err) {
                lastError = err.message;
            }
        }

        // Étape 2 : Si pas trouvé, essayer avec des variations OCR courantes (en priorité sur PC pour aller vite)
        if (!foundData) {
            const candidates = getOcrNameCandidates(sp.name);
            if (candidates.length > 0) {
                console.log(`[OCR-Search] ${sp.name} introuvable. Essai des variantes OCR sur PC:`, candidates);
                for (let candidate of candidates) {
                    try {
                        const result = await window.r6api.fetchPlayerStatsHeadless(candidate, 'pc');
                        if (result && !result.error) {
                            const data = parseR6TrackerData(result.html, candidate);
                            if (data.found) {
                                foundData = data;
                                finalPlatform = 'pc';
                                console.log(`[OCR-Search] Joueur trouvé avec la variante: ${candidate} (au lieu de ${sp.name})`);
                                sp.name = candidate; // Met à jour le nom dans l'UI
                                break;
                            }
                        }
                    } catch (e) {
                        // Ignorer les erreurs de variantes individuelles
                    }
                }
            }
        }

        if (foundData) {
            sp.data = foundData;
            sp.platform = finalPlatform;
            sp.error = null;
        } else {
            sp.error = 'Introuvable sur PC, PSN et XBOX';
        }
        sp.loading = false;
        renderScoreboardTab();
    }

    async function fetchScoreboardStatsSequentially() {
        for (let sp of scoreboardSessionPlayers) {
            if (sp.loading) {
                await fetchSinglePlayerStats(sp);
            }
        }
    }

    if (window.r6api && window.r6api.onOcrStatus) {
        window.r6api.onOcrStatus((statusMsg) => {
            if (statusMsg.status === 'scanning') {
                showToast('📸 Capture d\'écran en cours...', 'info');
            } else if (statusMsg.status === 'processing') {
                showToast('🧠 Analyse de l\'image par l\'IA OCR...', 'info');
            } else if (statusMsg.status === 'error') {
                showToast('❌ Erreur OCR: ' + statusMsg.error, 'error');
            }
        });
    }

    if (window.r6api && window.r6api.onOcrResults) {
        window.r6api.onOcrResults((names) => {
            if (!names || names.length === 0) {
                showToast('⚠️ Aucun pseudo R6 détecté sur l\'écran.', 'info');
                return;
            }
            showToast(`✅ ${names.length} pseudos trouvés ! Recherche en cours (1 par 1)...`, 'success');
            
            // Overwrite scoreboard session players
            scoreboardSessionPlayers = names.map(name => ({
                id: generateId(),
                name: name,
                platform: 'pc',
                data: null,
                loading: true,
                error: null
            }));

            // Switch to scoreboard tab
            switchTab('scoreboard');
            renderScoreboardTab();

            // Fetch stats sequentially
            fetchScoreboardStatsSequentially();
        });
    }

    function renderScoreboardTab() {
        const list = document.getElementById('scoreboard-list');
        const emptyState = document.getElementById('scoreboard-empty');
        if (!list) return;

        if (scoreboardSessionPlayers.length === 0) {
            emptyState.style.display = 'flex';
            // Remove existing cards
            Array.from(list.children).forEach(c => {
                if (c !== emptyState) c.remove();
            });
            return;
        }

        emptyState.style.display = 'none';
        
        // Clear list except empty state
        Array.from(list.children).forEach(c => {
            if (c !== emptyState) c.remove();
        });

        scoreboardSessionPlayers.forEach(sp => {
            const card = document.createElement('div');
            card.className = 'player-card';

            const initials = sp.name.substring(0, 2).toUpperCase();
            
            if (sp.loading) {
                card.innerHTML = `
                    <div class="player-card-header">
                        <div class="player-avatar" style="border-color: #8b8fa3;">${initials}</div>
                        <div>
                            <div class="player-name">${sp.name}</div>
                            <div class="player-platform">${sp.platform.toUpperCase()}</div>
                        </div>
                    </div>
                    <div style="padding: 24px; text-align: center; color: var(--text-muted);">
                        <div class="spinner" style="margin: 0 auto 12px auto; width: 24px; height: 24px; border-width: 3px;"></div>
                        <div style="margin-top: 8px;">Recherche en cours...</div>
                    </div>
                `;
            } else if (sp.error) {
                card.innerHTML = `
                    <div class="player-card-header">
                        <div class="player-avatar" style="border-color: #8b8fa3;">${initials}</div>
                        <div>
                            <div class="player-name">${sp.name}</div>
                            <div class="player-platform">${sp.platform.toUpperCase()}</div>
                        </div>
                    </div>
                    <div style="padding: 24px; text-align: center; color: var(--loss-color);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24" style="margin-bottom:8px;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        <div>${sp.error}</div>
                    </div>
                    <div class="player-card-actions" style="margin-top: 16px;">
                        <button class="player-action-btn add-sb-btn" data-type="teammate" data-id="${sp.id}" title="Ajouter comme Allié">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="margin-right:4px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            Allié
                        </button>
                        <button class="player-action-btn add-sb-btn" data-type="opponent" data-id="${sp.id}" title="Ajouter comme Ennemi" style="color:var(--loss-color);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="margin-right:4px;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            Ennemi
                        </button>
                        <button class="player-action-btn retry-sb-btn" data-id="${sp.id}" title="Réessayer" style="color:var(--accent-primary);">
                            🔍 Réessayer
                        </button>
                    </div>
                `;
            } else {
                const rankColor = getRankColor(sp.data.rank);
                const rankEmoji = getRankEmoji(sp.data.rank);
                
                card.innerHTML = `
                    <div class="player-card-header">
                        <div class="player-avatar" style="border-color: ${rankColor}; box-shadow: 0 0 10px ${rankColor}30;">${initials}</div>
                        <div>
                            <div class="player-name">${sp.name}</div>
                            <div class="player-platform">${sp.platform.toUpperCase()}</div>
                        </div>
                    </div>
                    <div class="player-rank-section">
                        <div class="rank-icon" style="background: ${rankColor}20; color: ${rankColor}; border: 1px solid ${rankColor}40;">${rankEmoji}</div>
                        <span class="rank-name" style="color: ${rankColor};">${sp.data.rank || 'Unranked'}</span>
                    </div>
                    <div class="player-stats" title="Statistiques Globales">
                        <div class="player-stat">
                            <div class="player-stat-value" style="color: var(--win-color);">${sp.data.totalWins ?? '—'}</div>
                            <div class="player-stat-label">Wins</div>
                        </div>
                        <div class="player-stat">
                            <div class="player-stat-value" style="color: var(--loss-color);">${sp.data.totalLosses ?? '—'}</div>
                            <div class="player-stat-label">Losses</div>
                        </div>
                        <div class="player-stat">
                            <div class="player-stat-value">${sp.data.winrate ? sp.data.winrate + '%' : '—'}</div>
                            <div class="player-stat-label">Win Rate</div>
                        </div>
                    </div>
                    <div class="player-external-stats" style="margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
                        ${sp.data.kd !== null ? `
                            <div class="ext-stat" style="min-width: 30%;">
                                <div class="ext-stat-value">${sp.data.kd?.toFixed(2)}</div>
                                <div class="ext-stat-label">K/D</div>
                            </div>` : ''}
                        ${sp.data.level !== null ? `
                            <div class="ext-stat" style="min-width: 30%;">
                                <div class="ext-stat-value">Niv. ${sp.data.level}</div>
                                <div class="ext-stat-label">Niveau</div>
                            </div>` : ''}
                        ${sp.data.kills !== null ? `
                            <div class="ext-stat" style="min-width: 30%;">
                                <div class="ext-stat-value">${sp.data.kills >= 1000 ? (sp.data.kills/1000).toFixed(1) + 'k' : sp.data.kills}</div>
                                <div class="ext-stat-label">Kills</div>
                            </div>` : ''}
                    </div>
                    <div class="player-card-actions" style="margin-top: 16px;">
                        <button class="player-action-btn add-sb-btn" data-type="teammate" data-id="${sp.id}" title="Ajouter comme Allié">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="margin-right:4px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            Allié
                        </button>
                        <button class="player-action-btn add-sb-btn" data-type="opponent" data-id="${sp.id}" title="Ajouter comme Ennemi" style="color:var(--loss-color);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="margin-right:4px;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            Ennemi
                        </button>
                    </div>
                `;
            }

            list.appendChild(card);
        });

        // Add event listeners to buttons
        list.querySelectorAll('.add-sb-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const spId = e.currentTarget.dataset.id;
                const type = e.currentTarget.dataset.type;
                const sp = scoreboardSessionPlayers.find(p => p.id === spId);
                
                if (sp) {
                    // Check if player exists
                    let player = players.find(p => p.name.toLowerCase() === sp.name.toLowerCase());
                    if (!player) {
                        player = {
                            id: generateId(),
                            name: sp.name,
                            type: type,
                            rank: sp.data ? (sp.data.rank || 'Non Classé') : 'Non Classé',
                            platform: sp.platform,
                            externalStats: sp.data ? {
                                kd: sp.data.kd,
                                winrate: sp.data.winrate,
                                hours: sp.data.hours,
                                level: sp.data.level,
                                kills: sp.data.kills,
                                totalWins: sp.data.totalWins,
                                totalLosses: sp.data.totalLosses,
                                source: sp.data.source,
                                lastUpdated: sp.data.lastUpdated
                            } : null,
                            createdAt: Date.now()
                        };
                        players.push(player);
                    } else {
                        // Just update their type if they already exist
                        player.type = type;
                    }
                    
                    saveData(STORAGE_KEYS.players, players);
                    showToast(`${sp.name} ajouté aux ${type === 'teammate' ? 'Alliés' : 'Ennemis'} !`, 'success');
                    renderAll();
                    
                    // Visual feedback
                    const parentCard = e.currentTarget.closest('.player-card');
                    if (parentCard) {
                        parentCard.style.opacity = '0.5';
                        parentCard.style.pointerEvents = 'none';
                    }
                }
            });
        });

        // Bind retry buttons
        list.querySelectorAll('.retry-sb-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const spId = e.currentTarget.dataset.id;
                const sp = scoreboardSessionPlayers.find(p => p.id === spId);
                if (sp) {
                    sp.loading = true;
                    sp.error = null;
                    renderScoreboardTab();
                    fetchSinglePlayerStats(sp);
                }
            });
        });
    }

    // Bind navigation to ensure scoreboard renders if switched manually
    document.getElementById('nav-scoreboard')?.addEventListener('click', () => {
        renderScoreboardTab();
    });

})();

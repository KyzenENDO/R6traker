(function () {
    'use strict';

    // ─── DOM Elements ────────────────────────────────────
    const body = document.body;
    const sessionStreakEl = document.getElementById('session-streak');
    const sessionWinsEl = document.getElementById('session-wins');
    const sessionLossesEl = document.getElementById('session-losses');
    const streakSection = document.querySelector('.hud-streak');
    
    const teammatesList = document.getElementById('teammates-list');
    const opponentsList = document.getElementById('opponents-list');
    const teamsContainer = document.getElementById('teams-container');

    const RANK_COLORS = {
        'Copper': '#b87333',
        'Bronze': '#cd7f32',
        'Silver': '#c0c0c0',
        'Gold': '#ffd700',
        'Platinum': '#4fc3f7',
        'Emerald': '#50c878',
        'Diamond': '#b9f2ff',
        'Champion': '#e040fb',
    };

    function getRankTier(rankName) {
        if (!rankName) return 'Copper';
        return rankName.split(' ')[0];
    }

    function getRankColor(rankName) {
        const tier = getRankTier(rankName);
        return RANK_COLORS[tier] || '#8b8fa3';
    }

    // ─── Listen for Main Process (IPC) ───────────────────
    if (window.r6api) {
        // Toggle Lock State (Draggable or Click-through)
        window.r6api.onOverlayLocked((locked) => {
            if (locked) {
                body.classList.add('locked');
                body.classList.remove('unlocked');
            } else {
                body.classList.remove('locked');
                body.classList.add('unlocked');
            }
        });

        // Overlay status initialization
        window.r6api.getOverlayStatus();
        window.r6api.onOverlayStatusReply((status) => {
            if (status.locked) {
                body.classList.add('locked');
                body.classList.remove('unlocked');
            } else {
                body.classList.remove('locked');
                body.classList.add('unlocked');
            }
        });

        // Receive Data Update (Wins, Losses, Streak, and Players)
        window.r6api.onOverlayData((data) => {
            updateWins(data.wins || 0);
            updateLosses(data.losses || 0);
            updateStreak(data.streak || 0);

            const spacingVal = parseInt(data.rowSpacing) || 38;
            const teammates = data.teammates || [];
            const opponents = data.opponents || [];

            renderPlayers('teammate', teammates, teammatesList, spacingVal);
            renderPlayers('opponent', opponents, opponentsList, spacingVal);

            // Hide the container if no players are active so it doesn't take space
            if (teammates.length === 0 && opponents.length === 0) {
                teamsContainer.style.display = 'none';
            } else {
                teamsContainer.style.display = 'grid';
            }
        });
    }

    // ─── UI Update Helpers ───────────────────────────────
    function updateWins(wins) {
        if (sessionWinsEl) sessionWinsEl.textContent = wins;
    }

    function updateLosses(losses) {
        if (sessionLossesEl) sessionLossesEl.textContent = losses;
    }

    function updateStreak(streak) {
        if (!sessionStreakEl) return;

        sessionStreakEl.textContent = (streak > 0 ? '+' : '') + streak;
        sessionStreakEl.className = 'hud-stat-value';
        
        // Update streak section icon color
        if (streakSection) {
            streakSection.classList.remove('streak-positive', 'streak-negative');
        }
        
        if (streak > 0) {
            sessionStreakEl.classList.add('win');
            if (streakSection) streakSection.classList.add('streak-positive');
        } else if (streak < 0) {
            sessionStreakEl.classList.add('loss');
            if (streakSection) streakSection.classList.add('streak-negative');
        } else {
            sessionStreakEl.classList.add('neutral');
        }
    }

    function renderPlayers(type, players, container, rowSpacing) {
        container.innerHTML = '';

        if (players.length === 0) {
            container.innerHTML = `<div class="no-players">Aucun ${type === 'teammate' ? 'coéquipier' : 'adversaire'}</div>`;
            return;
        }

        players.forEach((p, idx) => {
            const color = getRankColor(p.rank);
            const rankLabel = p.rank || 'Unranked';
            
            const row = document.createElement('div');
            row.className = 'player-row';
            
            // Calculate dynamic spacing margin. 
            // The row height is 38px. If user wants a spacing of 42px center-to-center, 
            // we apply a margin-bottom of (42 - 38) = 4px.
            if (idx < players.length - 1) {
                const margin = Math.max(0, rowSpacing - 38);
                row.style.marginBottom = margin + 'px';
            }

            row.innerHTML = `
                <div class="player-left">
                    <span class="player-platform-icon">${p.platform || 'PC'}</span>
                    <span class="player-name-text" title="${p.name}">${p.name}</span>
                </div>
                <div class="player-right">
                    <div class="player-rank-badge" style="background: ${color}20; color: ${color}; border: 1px solid ${color}40;">
                        <span>${rankLabel}</span>
                    </div>
                </div>
            `;
            container.appendChild(row);
        });
    }

    // ─── Game Status Listener (Reset stats on close) ─────
    if (window.r6api && window.r6api.onR6GameStatus) {
        window.r6api.onR6GameStatus((status) => {
            if (!status.running) {
                // Reset overlay UI: clear player lists and stats when game closes
                renderPlayers('teammate', [], teammatesList, 38);
                renderPlayers('opponent', [], opponentsList, 38);
                updateWins(0);
                updateLosses(0);
                updateStreak(0);
            }
        });
    }

})();

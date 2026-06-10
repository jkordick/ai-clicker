// UI rendering and DOM manipulation
const UI = {
    elements: {},

    init() {
        this.elements = {
            tokenCount: document.getElementById('token-count'),
            tps: document.getElementById('tps'),
            iqCount: document.getElementById('iq-count'),
            iqPerSec: document.getElementById('iq-per-sec'),
            drainPerSec: document.getElementById('drain-per-sec'),
            clickButton: document.getElementById('click-button'),
            clickParticles: document.getElementById('click-particles'),
            buildingsList: document.getElementById('buildings-list'),
            upgradesList: document.getElementById('upgrades-list'),
            modelsList: document.getElementById('models-list'),
            modelShopInfo: document.getElementById('model-shop-info'),
            eventLog: document.getElementById('event-log'),
            saveBtn: document.getElementById('save-btn'),
            resetBtn: document.getElementById('reset-btn'),
            lastSave: document.getElementById('last-save'),
            clickPowerDisplay: document.getElementById('click-power-display'),
            autoTpsDisplay: document.getElementById('auto-tps-display'),
            clickChipAuto: document.getElementById('click-chip-auto'),
        };

        this.setupTabs();
        this.setupShiftTracker();
        this.setupTipsRotation();
    },

    TIPS: [
        '⚡ Hold SHIFT and click a Tech Stack item to buy 10x at once.',
        '💥 5% of your clicks crit for 3x tokens! Boost it with Beam Search and Strawberry.',
        '🤖 Hover over an active model in the top bar to see its specialty perk.',
        '🔄 Slots full? Deactivate a current model to free a slot — no more silent swaps.',
        '💧 If drain exceeds earnings, your tokens deplete and IQ production slows to a crawl.',
        '🧠 Spend Intelligence on better models — each tier multiplies your IQ generation.',
        '📦 Two upgrades unlock extra model slots: Parallel Inference and Model Orchestration.',
        '🎯 Different models specialize: some boost TPS, click power, or reduce drain.',
        '💾 Your progress auto-saves every 30 seconds and when you close the tab.',
        '🌳 Chain-of-Thought, Knowledge Distillation, and Recursive Self-Improvement multiply IQ gain.',
        '📦 INT8 Quantization and Speculative Decoding reduce all model drain.',
        '🪙 Click the brain to manually generate tokens — useful in the early game.',
        '🏗️ Buildings stack: each unit adds to your tokens-per-second.',
        '🔒 Locked upgrades show their requirements — keep building to unlock them.',
        '🎲 Gronk models are chaotic: random IQ bursts make output unpredictable.',
        '💡 The Tech Stack tab is where you grow your passive token income.',
        '⬆️ Higher-tier models cost more IQ but produce vastly more — invest in upgrades.',
        '🎼 Run multiple models with different specialties to stack their bonuses.',
        '👁️ Hover any stat in the top bar for an explanation of what it does.',
        '🌌 Reach the ASI threshold (starts at 1M, x5 per prestige) to earn Research Points.',
        '🌌 Each prestige raises the bar x5: 1M → 5M → 25M → 125M... compound your RP wisely.',
        '🔬 Research Points spent in the Research Lab unlock permanent perks that survive prestige.',
        '🧠 Cognitive Bandwidth is the bread and butter — buy 10 ranks for a 250% TPS & IQ boost.',
        '🌊 New: Vibe Coding adds % of TPS to every click — keeps clicks relevant in late game.',
        '🏆 Achievements stack a permanent +1% global multiplier each. Free progress!',
        '🍓 Strawberry Memory permanently adds +10% crit chance for just 1 RP.',
        '💾 Persistent Knowledge keeps your highest-tier model across prestige.',
        '⚛️ Quantum Cluster is the top tech-stack tier; ASI sits beyond it as the prestige goal.',
        '🪞 AGI is the wildest building — human-level general intelligence. The last step before ASI.',
    ],

    setupTipsRotation() {
        const tipText = document.getElementById('tip-text');
        if (!tipText) return;

        let lastIdx = -1;
        const showRandomTip = () => {
            let idx;
            do { idx = Math.floor(Math.random() * this.TIPS.length); }
            while (idx === lastIdx && this.TIPS.length > 1);
            lastIdx = idx;

            tipText.classList.add('fading');
            setTimeout(() => {
                tipText.textContent = this.TIPS[idx];
                tipText.classList.remove('fading');
            }, 400);
        };

        // Show first tip immediately (no fade)
        tipText.textContent = this.TIPS[Math.floor(Math.random() * this.TIPS.length)];
        setInterval(showRandomTip, 60_000);
    },

    setupShiftTracker() {
        const setShift = (on) => document.body.classList.toggle('shift-held', on);
        window.addEventListener('keydown', (e) => { if (e.key === 'Shift') setShift(true); });
        window.addEventListener('keyup', (e) => { if (e.key === 'Shift') setShift(false); });
        window.addEventListener('blur', () => setShift(false));
    },

    setupTabs() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
                // Stats tab is read-only and only updates on tick; render immediately on open
                if (tab.dataset.tab === 'stats' && typeof Game !== 'undefined') {
                    Game.renderStats();
                }
            });
        });

        // Buy-mode buttons
        const group = document.getElementById('buy-mode-group');
        if (group) {
            group.querySelectorAll('.buy-mode-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const mode = btn.dataset.mode === 'max' ? 'max' : parseInt(btn.dataset.mode, 10);
                    Game.setBuyMode(mode);
                    this.updateBuyModeButtons();
                });
            });
            this.updateBuyModeButtons();
        }
    },

    updateBuyModeButtons() {
        const group = document.getElementById('buy-mode-group');
        if (!group) return;
        const mode = (Game.state && Game.state.buyMode) || 1;
        group.querySelectorAll('.buy-mode-btn').forEach(btn => {
            const m = btn.dataset.mode === 'max' ? 'max' : parseInt(btn.dataset.mode, 10);
            btn.classList.toggle('active', m === mode);
        });
    },

    // Briefly flash an active model chip (chaos burst feedback)
    flashModelChip(modelId) {
        const bar = document.getElementById('active-models-bar');
        if (!bar) return;
        const chips = bar.querySelectorAll('.active-model-chip');
        chips.forEach(chip => {
            if (chip.dataset.modelId === modelId || chip.querySelector('.chip-name')?.textContent === (Game.findModel(modelId) || {}).name) {
                chip.classList.remove('burst');
                void chip.offsetWidth;
                chip.classList.add('burst');
                setTimeout(() => chip.classList.remove('burst'), 1100);
            }
        });
    },

    // Format numbers nicely
    formatNumber(num) {
        if (num < 1000) return Math.floor(num).toLocaleString();
        if (num < 1_000_000) return (num / 1_000).toFixed(1) + 'K';
        if (num < 1_000_000_000) return (num / 1_000_000).toFixed(2) + 'M';
        if (num < 1_000_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
        if (num < 1e15) return (num / 1_000_000_000_000).toFixed(2) + 'T';
        return num.toExponential(2);
    },

    formatTps(num) {
        if (num < 10) return num.toFixed(1);
        if (num < 1000) return Math.floor(num).toLocaleString();
        return this.formatNumber(num);
    },

    // Update stats bar
    updateStats(tokens, tps, intelligence, iqps, drain) {
        this.elements.tokenCount.textContent = this.formatNumber(tokens);
        this.elements.iqCount.textContent = this.formatNumber(intelligence);

        // Token detail: +earn / -drain
        this.elements.tps.textContent = `+${this.formatTps(tps)}`;
        this.elements.drainPerSec.textContent = `-${this.formatTps(drain)}`;

        // Click zone chips: per-click power + auto TPS (pulse when producing)
        if (this.elements.clickPowerDisplay) {
            this.elements.clickPowerDisplay.textContent = `+${this.formatNumber(Game.getClickPower())}`;
        }
        if (this.elements.autoTpsDisplay) {
            this.elements.autoTpsDisplay.textContent = `+${this.formatTps(tps)}/s`;
        }
        if (this.elements.clickChipAuto) {
            this.elements.clickChipAuto.classList.toggle('active', tps > 0);
        }

        // IQ rate
        this.elements.iqPerSec.textContent = `+${this.formatTps(iqps)}/s`;

        // Warning: bank can't cover one tick of drain → models will skip ticks (real starvation)
        const iqWarn = document.getElementById('iq-warning');
        if (iqWarn) {
            const tickDrain = drain / 10; // drain per tick (100ms)
            const starving = drain > 0 && tokens < tickDrain && Game.state.activeModels.length > 0;
            iqWarn.style.display = starving ? '' : 'none';
        }

        // Net token flow indicator
        const net = tps - drain;
        const netEl = document.getElementById('token-net');
        if (netEl) {
            if (net > 0) {
                netEl.textContent = `net +${this.formatTps(net)}/s`;
                netEl.className = 'stat-net positive';
            } else if (net < 0) {
                netEl.textContent = `net ${this.formatTps(net)}/s`;
                netEl.className = 'stat-net negative';
            } else {
                netEl.textContent = 'net ±0/s';
                netEl.className = 'stat-net zero';
            }
        }

        // Active models bar
        this.updateActiveModelsBar();

        // ASI progress + prestige availability
        this.updateAsiProgress();

        // Stats panel — only update when its tab is visible
        const statsTab = document.getElementById('tab-stats');
        if (statsTab && statsTab.classList.contains('active')) {
            this.renderStatsPanel(tps, iqps, drain);
        }
    },

    renderStatsPanel(tps, iqps, drain) {
        const panel = document.getElementById('stats-panel');
        if (!panel) return;
        const s = Game.state;
        const st = s.stats;
        const fmt = (n) => this.formatNumber(n);
        const fmtRate = (n) => this.formatTps(n);
        const pct = (n) => (n * 100).toFixed(1) + '%';
        const x = (n) => n.toFixed(2) + '×';

        // Derived numbers
        const clickPower = Game.getClickPower();
        const critChance = Game.getCritChance();
        const critMult = Game.getCritMultiplier();
        const observedCritRate = st.lifetimeClicks > 0
            ? (st.totalCrits / st.lifetimeClicks) : 0;
        const modelDrain = Game.calculateModelDrain();
        const computeCost = Game.calculateComputeCost();
        const drainMult = s.drainMultiplier || 1;
        const researchMult = Game.getResearchMultiplier();
        const slots = Game.getModelSlots();
        const playtime = Game.formatDuration(st.totalTimePlayed || 0);
        const session = Game.formatDuration((Date.now() - st.sessionStart) / 1000);
        const nextRPThreshold = (() => {
            // Inverse of floor((iq/threshold)^0.6 * 3): solve for IQ needed for (current RP + 1)
            const cur = Game.calculatePrestigeGain();
            const next = cur + 1;
            const ratio = Math.pow(next / 3, 1 / 0.6);
            return ratio * Game.ASI_THRESHOLD;
        })();

        // Achievements
        const achList = (typeof ACHIEVEMENTS !== 'undefined') ? ACHIEVEMENTS : [];
        const achUnlocked = (s.achievements || []).length;
        const achTotal = achList.length;
        const achBonus = s.achievementBonus || 0;

        // Building count
        let totalBuildings = 0;
        for (const k in s.buildings) totalBuildings += s.buildings[k];

        const row = (label, value, cls = '') =>
            `<div class="stats-row"><span class="stats-label">${label}</span><span class="stats-value ${cls}">${value}</span></div>`;
        const formula = (text) => `<div class="stats-formula">${text}</div>`;

        panel.innerHTML = `
            <div class="stats-section click-power">
                <h3 class="stats-section-title">⚡ Click Power</h3>
                ${row('Click power', fmt(clickPower), 'gold')}
                ${row('Click multiplier', x(s.clickMultiplier), 'accent')}
                ${row('Crit chance', pct(critChance), 'accent')}
                ${row('Crit multiplier', x(critMult), 'accent')}
                ${row('Total clicks', fmt(st.lifetimeClicks))}
                ${row('Total crits', fmt(st.totalCrits))}
                ${row('Observed crit rate', pct(observedCritRate))}
                ${row('Tokens from crits', fmt(st.critTokensGained), 'positive')}
            </div>

            <div class="stats-section income">
                <h3 class="stats-section-title">🪙 Income</h3>
                ${row('Tokens / sec', '+' + fmtRate(tps), 'positive')}
                ${row('Global multiplier', x(s.globalMultiplier), 'accent')}
                ${row('Cost multiplier', x(s.costMultiplier), s.costMultiplier < 1 ? 'positive' : '')}
                ${row('Current tokens', fmt(s.tokens), 'gold')}
                ${row('Peak tokens', fmt(st.highestTokens))}
                ${row('Peak TPS', '+' + fmt(st.highestTps) + '/s')}
                ${row('Tokens earned (run)', fmt(s.totalTokens))}
                ${row('Tokens earned (lifetime)', fmt(st.lifetimeTokens))}
                ${row('Spent on buildings', fmt(st.tokensSpentBuildings), 'negative')}
                ${row('Spent on upgrades', fmt(st.tokensSpentUpgrades), 'negative')}
            </div>

            <div class="stats-section intelligence">
                <h3 class="stats-section-title">🧠 Intelligence</h3>
                ${row('IQ / sec', '+' + fmtRate(iqps), 'accent')}
                ${row('IQ multiplier', x(s.iqMultiplier), 'accent')}
                ${row('Research multiplier', x(researchMult), researchMult > 1 ? 'positive' : '')}
                ${formula(`+${(researchMult - 1) * 100 | 0}% from Cognitive Bandwidth research`)}
                ${row('Current IQ', fmt(s.intelligence), 'accent')}
                ${row('Peak IQ', fmt(st.highestIntelligence))}
                ${row('Peak IQ/s', '+' + fmt(st.highestIqps) + '/s')}
                ${row('IQ earned (run)', fmt(s.totalIntelligence))}
                ${row('IQ earned (lifetime)', fmt(st.lifetimeIntelligence))}
                ${row('IQ spent on models', fmt(st.iqSpentModels), 'negative')}
            </div>

            <div class="stats-section drain">
                <h3 class="stats-section-title">🔥 Drain Breakdown</h3>
                ${row('Model drain', '-' + fmtRate(modelDrain), 'negative')}
                ${row('Compute cost (5% TPS)', '-' + fmtRate(computeCost), 'negative')}
                ${row('Total drain', '-' + fmtRate(drain), 'negative')}
                ${row('Drain multiplier', x(drainMult), drainMult < 1 ? 'positive' : '')}
                ${row('Net token flow', (tps - drain >= 0 ? '+' : '') + fmtRate(tps - drain),
                    tps - drain >= 0 ? 'positive' : 'negative')}
                ${row('Active models', `${s.activeModels.length} / ${slots}`)}
            </div>

            <div class="stats-section prestige">
                <h3 class="stats-section-title">🌌 Prestige</h3>
                ${row('Research Points (available)', fmt(s.researchPoints || 0), 'accent')}
                ${row('Research Points (earned)', fmt(s.researchPointsTotal || 0))}
                ${row('Times prestiged (ASI)', fmt(s.asiAchieved || 0))}
                ${row('Current ASI threshold', fmt(Game.ASI_THRESHOLD) + ' IQ', 'gold')}
                ${row('Available RP now', fmt(Game.calculatePrestigeGain()), 'gold')}
                ${row('IQ for next RP', fmt(nextRPThreshold))}
                ${row('Next prestige threshold', fmt(Game.ASI_THRESHOLD * 5) + ' IQ')}
                ${formula('Threshold x5 per prestige; RP = floor((IQ / threshold)^0.6 × 3)')}
            </div>

            <div class="stats-section achievements">
                <h3 class="stats-section-title">🏆 Achievements (${achUnlocked} / ${achTotal})</h3>
                ${row('Achievement bonus', '+' + (achBonus * 100).toFixed(0) + '% global', achBonus > 0 ? 'positive' : '')}
                <div class="achievements-grid">
                    ${achList.map(a => {
                        const got = (s.achievements || []).includes(a.id);
                        return `<div class="achievement-row ${got ? 'unlocked' : 'locked'}" title="${a.desc}">
                            <span class="achievement-icon">${got ? '🏆' : '🔒'}</span>
                            <span class="achievement-name">${got ? a.name : '???'}</span>
                            <span class="achievement-desc">${got ? a.desc : '???'}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <div class="stats-section session">
                <h3 class="stats-section-title">📊 Session</h3>
                ${row('Session time', session)}
                ${row('Total playtime', playtime)}
                ${row('Buildings owned', fmt(totalBuildings))}
                ${row('Upgrades purchased', fmt(st.upgradesPurchased))}
                ${row('Models acquired', fmt(st.modelsAcquired))}
                ${row('Model swaps', fmt(st.modelsActivated))}
                ${row('Model slots', `${s.activeModels.length} / ${slots}`)}
            </div>
        `;
    },

    updateAsiProgress() {
        const fillEl = document.getElementById('asi-bar-fill');
        const textEl = document.getElementById('asi-bar-text');
        const btnEl = document.getElementById('prestige-btn');
        const rpDisp = document.getElementById('asi-rp-display');
        const rpCount = document.getElementById('rp-count');
        if (!fillEl) return;

        const intel = Game.state.intelligence;
        const threshold = Game.ASI_THRESHOLD;
        const pct = Math.min(intel / threshold, 1) * 100;

        fillEl.style.width = `${pct}%`;
        textEl.textContent = `${this.formatNumber(intel)} / ${this.formatNumber(threshold)} IQ`;

        const canPrestige = intel >= threshold;
        btnEl.style.display = canPrestige ? 'block' : 'none';
        if (canPrestige) {
            const gain = Game.calculatePrestigeGain();
            btnEl.textContent = `⚡ ACHIEVE ASI & PRESTIGE (+${gain} RP)`;
        }

        // Show RP badge if any
        const rp = Game.state.researchPoints || 0;
        if (rp > 0) {
            rpDisp.style.display = '';
            rpCount.textContent = rp;
        } else {
            rpDisp.style.display = 'none';
        }
    },

    updateActiveModelsBar() {
        const bar = document.getElementById('active-models-bar');
        if (!bar) return;

        const activeModels = Game.state.activeModels || [];
        const slots = Game.getModelSlots();
        const iqMult = Game.state.iqMultiplier || 1;
        const drainMult = Game.state.drainMultiplier || 1;

        // Update slots badge
        const slotsEl = document.getElementById('model-slots-display');
        if (slotsEl) slotsEl.textContent = `${activeModels.length}/${slots}`;

        const key = `${activeModels.join(',')}|${iqMult}|${drainMult}`;
        if (bar.dataset.lastKey === key) return;
        bar.dataset.lastKey = key;

        if (activeModels.length === 0) {
            bar.innerHTML = '<span class="no-models">None</span>';
            return;
        }

        const chips = activeModels.map(modelId => {
            const model = Game.findModel(modelId);
            if (!model) return '';
            let drainVal = model.specialty.drainMult ? model.drain * model.specialty.drainMult : model.drain;
            drainVal *= drainMult;
            let iqVal = model.iqOutput;
            if (model.specialty.iqMult) iqVal *= model.specialty.iqMult;
            iqVal *= iqMult;
            return `<div class="active-model-chip" data-model-id="${modelId}" data-chip-tooltip="${model.specialty.desc}">
                <span class="chip-name">${model.name}</span>
                <span class="chip-stats"><span class="chip-drain">-${this.formatTps(drainVal)}</span> · <span class="chip-iq">+${this.formatTps(iqVal)}</span></span>
            </div>`;
        }).join('');

        bar.innerHTML = chips;
    },

    // Render buildings list
    renderBuildings(buildings, state, onBuy) {
        const html = buildings.map(building => {
            const owned = state.buildings[building.id] || 0;
            const cost = Math.floor(getBuildingCost(building, owned) * state.costMultiplier);
            const canAfford = state.tokens >= cost;
            const multiplier = state.buildingMultipliers[building.id] || 1;

            let statsText;
            if (building.isClickUpgrade) {
                const totalBonus = owned * building.clickBonus * multiplier;
                statsText = `+${building.clickBonus * multiplier} per click each | Total: +${totalBonus} click power`;
            } else {
                const tps = getBuildingTps(building, owned, multiplier * state.globalMultiplier);
                statsText = `+${this.formatTps(building.baseTps * multiplier * state.globalMultiplier)} TPS each | Total: ${this.formatTps(tps)} TPS`;
            }

            // Compute bulk x10 cost (best-effort: assume current state)
            let bulkCost = 0;
            let simOwned = owned;
            for (let i = 0; i < 10; i++) {
                bulkCost += Math.floor(getBuildingCost(building, simOwned) * state.costMultiplier);
                simOwned++;
            }
            const canAffordBulk = state.tokens >= bulkCost;

            return `
                <div class="building-card ${canAfford ? '' : 'cant-afford'}"
                     data-building-id="${building.id}"
                     data-cost-bulk="${canAffordBulk ? '1' : '0'}">
                    <div class="building-icon">${building.icon}</div>
                    <div class="building-info">
                        <div class="building-name">${building.name}</div>
                        <div class="building-desc">${building.description}</div>
                        <div class="building-stats">${statsText}</div>
                    </div>
                    <div class="building-right">
                        <div class="building-cost">
                            <span class="cost-single">🪙 ${this.formatNumber(cost)}</span>
                            <span class="cost-bulk">x10: 🪙 ${this.formatNumber(bulkCost)}</span>
                        </div>
                        <div class="building-owned">Owned: ${owned}</div>
                    </div>
                </div>
            `;
        }).join('');

        this.elements.buildingsList.innerHTML = html;

        // Attach click handlers
        this.elements.buildingsList.querySelectorAll('.building-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const id = card.dataset.buildingId;
                const mode = (Game.state && Game.state.buyMode) || 1;
                // Shift still does 10x (legacy). Otherwise use buyMode.
                const qty = e.shiftKey ? 10 : mode;
                onBuy(id, qty);
            });
        });
    },

    // Render upgrades list
    renderUpgrades(upgrades, state, onBuy) {
        const available = upgrades.filter(u => {
            if (state.upgrades.includes(u.id)) return true;
            if (!u.requires) return true;
            const owned = state.buildings[u.requires.building] || 0;
            return owned >= u.requires.count;
        });

        const locked = upgrades.filter(u => {
            if (state.upgrades.includes(u.id)) return false;
            if (!u.requires) return false;
            const owned = state.buildings[u.requires.building] || 0;
            return owned < u.requires.count;
        });

        const html = available.map(upgrade => {
            const purchased = state.upgrades.includes(upgrade.id);
            const canAfford = state.tokens >= upgrade.cost;
            const cssClass = purchased ? 'purchased' : (!canAfford ? 'cant-afford' : '');

            return `
                <div class="upgrade-card ${cssClass}"
                     data-upgrade-id="${upgrade.id}">
                    <div class="upgrade-icon">${upgrade.icon}</div>
                    <div class="upgrade-info">
                        <div class="upgrade-name">${upgrade.name}${purchased ? ' ✓' : ''}</div>
                        <div class="upgrade-desc">${upgrade.description}</div>
                    </div>
                    <div class="upgrade-cost">${purchased ? 'OWNED' : '🪙 ' + this.formatNumber(upgrade.cost)}</div>
                </div>
            `;
        }).join('');

        // Show preview of locked upgrades
        const lockedHtml = locked.length > 0 ? `
            <div class="upgrades-locked-header">🔒 ${locked.length} more upgrade${locked.length > 1 ? 's' : ''} to discover...</div>
            ${locked.slice(0, 3).map(u => `
                <div class="upgrade-card locked">
                    <div class="upgrade-icon">❓</div>
                    <div class="upgrade-info">
                        <div class="upgrade-name">???</div>
                        <div class="upgrade-desc">Requires: ${u.requires.count}x ${this.getBuildingName(u.requires.building)}</div>
                    </div>
                    <div class="upgrade-cost">🔒</div>
                </div>
            `).join('')}
        ` : '';

        this.elements.upgradesList.innerHTML = (html + lockedHtml) || '<div class="upgrade-card"><div class="upgrade-info"><div class="upgrade-desc">Keep building to unlock upgrades...</div></div></div>';

        // Attach click handlers
        this.elements.upgradesList.querySelectorAll('.upgrade-card:not(.purchased):not(.locked)').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.upgradeId;
                onBuy(id);
            });
        });
    },

    renderResearch(researchUpgrades, state, onBuy) {
        const tabBtn = document.getElementById('research-tab-btn');
        const list = document.getElementById('research-list');
        const header = document.getElementById('research-header');
        if (!list || !header || !tabBtn) return;

        // Tab is hidden until the player has earned at least 1 RP (lifetime)
        const totalRP = state.researchPointsTotal || 0;
        const unlocked = totalRP > 0 || (state.asiAchieved || 0) > 0;
        tabBtn.classList.toggle('hidden', !unlocked);

        const availableRP = state.researchPoints || 0;
        const spentRP = totalRP - availableRP;
        header.innerHTML = `
            <div class="research-summary">
                <div class="research-rp">
                    <span class="rp-label">Research Points</span>
                    <span class="rp-value">🔬 ${this.formatNumber(availableRP)}</span>
                </div>
                <div class="research-meta">
                    <span>Spent: ${this.formatNumber(spentRP)}</span>
                    <span>Earned (lifetime): ${this.formatNumber(totalRP)}</span>
                </div>
            </div>
            <div class="shop-hint">🔬 Permanent perks. Survive prestige. Spend wisely.</div>
        `;

        // Group by tier
        const tiers = { 1: [], 2: [], 3: [] };
        for (const u of researchUpgrades) tiers[u.tier].push(u);

        const tierLabels = { 1: 'Foundational', 2: 'Advanced', 3: 'Endgame' };

        const renderCard = (upgrade) => {
            const rank = getResearchRank(state, upgrade.id);
            const maxed = rank >= upgrade.maxRank;
            const cost = maxed ? 0 : getResearchCost(upgrade, rank);
            const affordable = !maxed && availableRP >= cost;
            const cssClass = maxed ? 'maxed' : (affordable ? 'affordable' : 'cant-afford');
            const rankLabel = upgrade.maxRank > 1
                ? `<span class="research-rank">[${rank}/${upgrade.maxRank}]</span>`
                : '';
            const costLabel = maxed
                ? 'MAXED'
                : `🔬 ${cost} RP`;
            return `
                <div class="upgrade-card research-card ${cssClass}" data-research-id="${upgrade.id}">
                    <div class="upgrade-icon">${upgrade.icon}</div>
                    <div class="upgrade-info">
                        <div class="upgrade-name">${upgrade.name} ${rankLabel}${maxed ? ' ✓' : ''}</div>
                        <div class="upgrade-desc">${upgrade.description}</div>
                    </div>
                    <div class="upgrade-cost">${costLabel}</div>
                </div>
            `;
        };

        let html = '';
        for (const tier of [1, 2, 3]) {
            if (tiers[tier].length === 0) continue;
            html += `<div class="research-tier-header">⟨ ${tierLabels[tier]} ⟩</div>`;
            html += tiers[tier].map(renderCard).join('');
        }
        list.innerHTML = html;

        list.querySelectorAll('.research-card:not(.maxed)').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.researchId;
                onBuy(id);
            });
        });
    },

    getBuildingName(buildingId) {
        const b = BUILDINGS.find(b => b.id === buildingId);
        return b ? b.name : buildingId;
    },

    // Render models shop (buy with IQ, activate/deactivate)
    renderModels(companies, state, onBuy, onActivate) {
        const slots = Game.getModelSlots();
        const activeCount = state.activeModels.length;

        // Info bar
        this.elements.modelShopInfo.innerHTML = '';

        const html = companies.map(company => {
            const companyModels = company.models.map(model => {
                const owned = state.ownedModels.includes(model.id);
                const active = state.activeModels.includes(model.id);
                const tierLocked = model.tier >= 6 && (state.asiAchieved || 0) < 1;
                let cost = MODEL_TIER_COSTS[model.tier] || 0;

                // Apply IQ cost reductions
                for (const ownedId of state.activeModels) {
                    const m = Game.findModel(ownedId);
                    if (m && m.specialty.iqCostMult) {
                        cost *= m.specialty.iqCostMult;
                    }
                }
                cost = Math.floor(cost * (state.iqCostMultiplier || 1));

                const canAfford = state.intelligence >= cost;
                const slotsFull = state.activeModels.length >= Game.getModelSlots();
                let cssClass = owned ? (active ? 'model-active' : 'model-owned') : (tierLocked ? 'cant-afford' : (!canAfford ? 'cant-afford' : ''));
                if (owned && !active && slotsFull) cssClass += ' slots-full';
                let actionText, actionClass;
                if (active) {
                    actionText = '⏹ DEACTIVATE';
                    actionClass = 'active';
                } else if (owned) {
                    actionText = slotsFull ? '🔒 SLOTS FULL' : '▶ ACTIVATE';
                    actionClass = slotsFull ? 'disabled' : 'owned';
                } else if (tierLocked) {
                    actionText = '🔒 REQUIRES ASI PRESTIGE';
                    actionClass = '';
                } else {
                    actionText = `🧠 ${this.formatNumber(cost)}`;
                    actionClass = '';
                }

                return `
                    <div class="model-card ${cssClass}" data-model-id="${model.id}" style="border-left: 3px solid ${company.color}">
                        <div class="model-tier-badge">T${model.tier}</div>
                        <div class="model-main">
                            <div class="model-title-row">
                                <span class="model-name">${model.name}</span>
                                <span class="model-company" style="color: ${company.color}">${company.name}</span>
                            </div>
                            <div class="model-meta-row">
                                <span class="model-stat" title="Token drain per second">▼ ${model.drain}</span>
                                <span class="model-stat" title="Intelligence per second">▲ ${model.iqOutput}</span>
                                <span class="model-specialty">${model.specialty.desc}</span>
                            </div>
                            <div class="model-flavor">${model.flavor}</div>
                        </div>
                        <div class="model-action ${actionClass}">${actionText}</div>
                    </div>
                `;
            }).join('');
            return companyModels;
        }).join('');

        this.elements.modelsList.innerHTML = html;

        // Attach handlers
        this.elements.modelsList.querySelectorAll('.model-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.modelId;
                if (state.ownedModels.includes(id)) {
                    // If slots full and not currently active, refuse (clear messaging)
                    if (!state.activeModels.includes(id) && state.activeModels.length >= Game.getModelSlots()) {
                        UI.log('Slots full — deactivate a model first.', 'warning');
                        return;
                    }
                    onActivate(id);
                } else {
                    onBuy(id);
                }
            });
        });
    },

    // Pop a "+N" randomly around the click button
    spawnFlyingToken(amount, clientX, clientY, isCrit = false) {
        const counterEl = this.elements.tokenCount;
        const btnWrapper = document.getElementById('click-button-wrapper');

        const pop = document.createElement('div');
        pop.className = 'counter-pop';
        if (isCrit) pop.classList.add('crit');
        pop.textContent = isCrit ? `CRIT! +${this.formatNumber(amount)}` : `+${this.formatNumber(amount)}`;

        // Random offset around center of the button
        const offsetX = (Math.random() - 0.5) * 80;
        const offsetY = (Math.random() - 0.5) * 60;
        pop.style.left = `calc(50% + ${offsetX}px)`;
        pop.style.top = `calc(50% + ${offsetY}px)`;

        btnWrapper.appendChild(pop);

        // Bump the counter
        counterEl.classList.remove('bump');
        void counterEl.offsetWidth;
        counterEl.classList.add('bump');

        setTimeout(() => pop.remove(), 850);
    },

    // Spawn click particle + sparks
    spawnParticle(amount, x, y, isCrit = false) {
        // Main number particle
        const particle = document.createElement('div');
        particle.className = 'particle';
        if (isCrit) particle.classList.add('crit');
        particle.textContent = `+${this.formatNumber(amount)}`;
        particle.style.left = `${x + (Math.random() - 0.5) * 40}px`;
        particle.style.top = `${y - 20}px`;
        this.elements.clickParticles.appendChild(particle);
        setTimeout(() => particle.remove(), 1200);

        // Spawn sparks
        const sparkCount = Math.min(8, 3 + Math.floor(amount / 50));
        for (let i = 0; i < sparkCount; i++) {
            const spark = document.createElement('div');
            spark.className = 'spark';
            const angle = (Math.PI * 2 / sparkCount) * i + (Math.random() - 0.5) * 0.5;
            const distance = 40 + Math.random() * 60;
            spark.style.left = `${x}px`;
            spark.style.top = `${y}px`;
            spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
            spark.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
            spark.style.background = ['#fbbf24', '#fb923c', '#22d3ee', '#4ade80'][Math.floor(Math.random() * 4)];
            this.elements.clickParticles.appendChild(spark);
            setTimeout(() => spark.remove(), 600);
        }

        // Pulse animation on button
        const btn = this.elements.clickButton;
        btn.classList.remove('pulse');
        void btn.offsetWidth; // Force reflow
        btn.classList.add('pulse');

        // Screen shake (subtle)
        const zone = document.getElementById('click-zone');
        zone.classList.remove('shake');
        void zone.offsetWidth;
        zone.classList.add('shake');
    },

    // Add log entry
    log(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `> ${message}`;
        this.elements.eventLog.appendChild(entry);
        this.elements.eventLog.scrollTop = this.elements.eventLog.scrollHeight;

        // Keep only last 20 entries
        while (this.elements.eventLog.children.length > 20) {
            this.elements.eventLog.firstChild.remove();
        }
    },

    // Update save indicator
    updateSaveIndicator(text) {
        this.elements.lastSave.textContent = text;
    },

    // Update affordability classes without full re-render
    updateAffordability(state) {
        this.elements.buildingsList.querySelectorAll('.building-card').forEach(card => {
            const id = card.dataset.buildingId;
            const building = BUILDINGS.find(b => b.id === id);
            if (!building) return;
            const owned = state.buildings[id] || 0;
            const cost = Math.floor(getBuildingCost(building, owned) * (state.costMultiplier || 1));
            card.classList.toggle('cant-afford', state.tokens < cost);

            // Update bulk affordability
            let bulkCost = 0;
            let simOwned = owned;
            for (let i = 0; i < 10; i++) {
                bulkCost += Math.floor(getBuildingCost(building, simOwned) * (state.costMultiplier || 1));
                simOwned++;
            }
            card.dataset.costBulk = state.tokens >= bulkCost ? '1' : '0';
        });

        this.elements.upgradesList.querySelectorAll('.upgrade-card:not(.purchased)').forEach(card => {
            const id = card.dataset.upgradeId;
            const upgrade = UPGRADES.find(u => u.id === id);
            if (!upgrade) return;
            card.classList.toggle('cant-afford', state.tokens < upgrade.cost);
        });
    },
};

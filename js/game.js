// Main game loop and logic
const Game = {
    state: null,
    tickInterval: null,
    saveInterval: null,
    renderInterval: null,

    init() {
        // Load or create state
        const saved = loadGame();
        if (saved) {
            this.state = { ...getDefaultState(), ...saved };
            // Handle offline progress
            if (saved._offlineSeconds && saved._offlineSeconds > 5) {
                const offlineTps = this.calculateTps();
                const offlineEarnings = offlineTps * Math.min(saved._offlineSeconds, 8 * 3600); // Max 8h offline
                if (offlineEarnings > 0) {
                    this.state.tokens += offlineEarnings;
                    this.state.totalTokens += offlineEarnings;
                    setTimeout(() => {
                        const timeStr = this.formatDuration(saved._offlineSeconds);
                        UI.log(`Welcome back! Earned ${UI.formatNumber(offlineEarnings)} tokens while away (${timeStr})`, 'event');
                    }, 500);
                }
            }
            delete this.state._offlineSeconds;
        } else {
            this.state = getDefaultState();
        }

        // Init UI
        UI.init();
        this.bindEvents();
        this.renderShop();
        this.renderStats();

        // Start loops
        this.tickInterval = setInterval(() => this.tick(), 100); // 10 ticks/sec
        this.saveInterval = setInterval(() => this.autoSave(), 30000); // Save every 30s
        this.renderInterval = setInterval(() => this.renderStats(), 250); // Stats only 4x/sec
    },

    bindEvents() {
        // Click button
        UI.elements.clickButton.addEventListener('click', (e) => this.handleClick(e));

        // Clicking anywhere in the click zone also generates tokens
        const clickZone = document.getElementById('click-zone');
        clickZone.addEventListener('click', (e) => {
            if (e.target === UI.elements.clickButton || UI.elements.clickButton.contains(e.target)) return;
            this.handleClick(e);
        });

        // Save/Reset
        UI.elements.saveBtn.addEventListener('click', () => {
            this.save();
            UI.log('Game saved!', 'purchase');
        });

        UI.elements.resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure? This will delete ALL progress!')) {
                if (confirm('Really really sure? There\'s no undo!')) {
                    deleteSave();
                    this.state = getDefaultState();
                    UI.log('Game reset. Starting fresh!', 'event');
                    this.render();
                }
            }
        });
    },

    handleClick(e) {
        const power = this.getClickPower();
        this.state.tokens += power;
        this.state.totalTokens += power;
        this.state.totalClicks++;

        // Particle effect at cursor position within click zone
        const containerRect = UI.elements.clickParticles.getBoundingClientRect();
        const x = e.clientX - containerRect.left;
        const y = e.clientY - containerRect.top;
        UI.spawnParticle(power, x, y);
    },

    getClickPower() {
        const promptingOwned = this.state.buildings['prompting'] || 0;
        const promptingMultiplier = this.state.buildingMultipliers['prompting'] || 1;
        const baseClick = this.state.clickPower + (promptingOwned * 1 * promptingMultiplier);
        return Math.floor(baseClick * this.state.clickMultiplier);
    },

    calculateTps() {
        let totalTps = 0;
        for (const building of BUILDINGS) {
            const owned = this.state.buildings[building.id] || 0;
            const multiplier = this.state.buildingMultipliers[building.id] || 1;
            totalTps += getBuildingTps(building, owned, multiplier);
        }
        return totalTps * this.state.globalMultiplier;
    },

    tick() {
        // Generate tokens from buildings (10 ticks/sec, so divide by 10)
        const tps = this.calculateTps();
        const earned = tps / 10;
        if (earned > 0) {
            this.state.tokens += earned;
            this.state.totalTokens += earned;
        }
        this.state.lastTick = Date.now();

        // Track highest TPS
        if (tps > this.state.stats.highestTps) {
            this.state.stats.highestTps = tps;
        }
    },

    render() {
        this.renderStats();
        this.renderShop();
    },

    renderStats() {
        const tps = this.calculateTps();
        UI.updateStats(this.state.tokens, tps, this.getClickPower());
        // Update affordability classes without full re-render
        UI.updateAffordability(this.state);
    },

    renderShop() {
        UI.renderBuildings(BUILDINGS, this.state, (id) => this.buyBuilding(id));
        UI.renderUpgrades(UPGRADES, this.state, (id) => this.buyUpgrade(id));
        UI.renderModels(COMPANIES, this.state);
    },

    buyBuilding(id) {
        const building = BUILDINGS.find(b => b.id === id);
        if (!building) return;

        const owned = this.state.buildings[id] || 0;
        let cost = getBuildingCost(building, owned);
        cost = Math.floor(cost * this.state.costMultiplier);

        if (this.state.tokens >= cost) {
            this.state.tokens -= cost;
            this.state.buildings[id] = owned + 1;
            UI.log(`Built ${building.name} (#${owned + 1})`, 'purchase');
            this.renderShop();
        }
    },

    buyUpgrade(id) {
        const upgrade = UPGRADES.find(u => u.id === id);
        if (!upgrade) return;
        if (this.state.upgrades.includes(id)) return;

        if (this.state.tokens >= upgrade.cost) {
            this.state.tokens -= upgrade.cost;
            this.state.upgrades.push(id);
            this.applyUpgrade(upgrade);
            UI.log(`Unlocked: ${upgrade.name}!`, 'achievement');
            this.renderShop();
        }
    },

    applyUpgrade(upgrade) {
        const effect = upgrade.effect;
        switch (effect.type) {
            case 'click_multiply':
                this.state.clickMultiplier *= effect.value;
                break;
            case 'building_multiply':
                this.state.buildingMultipliers[effect.target] =
                    (this.state.buildingMultipliers[effect.target] || 1) * effect.value;
                break;
            case 'global_multiply':
                this.state.globalMultiplier *= effect.value;
                break;
            case 'cost_reduce':
                this.state.costMultiplier *= effect.value;
                break;
        }
    },

    // Re-apply all purchased upgrades (after load)
    reapplyUpgrades() {
        // Reset multipliers
        this.state.clickMultiplier = 1;
        this.state.globalMultiplier = 1;
        this.state.costMultiplier = 1;
        this.state.buildingMultipliers = {};

        for (const upgradeId of this.state.upgrades) {
            const upgrade = UPGRADES.find(u => u.id === upgradeId);
            if (upgrade) this.applyUpgrade(upgrade);
        }
    },

    save() {
        saveGame(this.state);
        UI.updateSaveIndicator(`Last saved: ${new Date().toLocaleTimeString()}`);
    },

    autoSave() {
        this.save();
    },

    formatDuration(seconds) {
        if (seconds < 60) return `${Math.floor(seconds)}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
        return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
    },
};

// Boot!
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
    // Reapply upgrades on load to recalculate multipliers
    if (Game.state.upgrades.length > 0) {
        Game.reapplyUpgrades();
    }
});

// Save before closing
window.addEventListener('beforeunload', () => {
    Game.save();
});

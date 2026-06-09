// UI rendering and DOM manipulation
const UI = {
    elements: {},

    init() {
        this.elements = {
            tokenCount: document.getElementById('token-count'),
            tps: document.getElementById('tps'),
            clickPower: document.getElementById('click-power'),
            clickButton: document.getElementById('click-button'),
            clickParticles: document.getElementById('click-particles'),
            buildingsList: document.getElementById('buildings-list'),
            upgradesList: document.getElementById('upgrades-list'),
            modelsList: document.getElementById('models-list'),
            eventLog: document.getElementById('event-log'),
            saveBtn: document.getElementById('save-btn'),
            resetBtn: document.getElementById('reset-btn'),
            lastSave: document.getElementById('last-save'),
        };

        this.setupTabs();
    },

    setupTabs() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
            });
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
    updateStats(tokens, tps, clickPower) {
        this.elements.tokenCount.textContent = this.formatNumber(tokens);
        this.elements.tps.textContent = this.formatTps(tps);
        this.elements.clickPower.textContent = this.formatNumber(clickPower);
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

            return `
                <div class="building-card ${canAfford ? '' : 'cant-afford'}"
                     data-building-id="${building.id}">
                    <div class="building-icon">${building.icon}</div>
                    <div class="building-info">
                        <div class="building-name">${building.name}</div>
                        <div class="building-desc">${building.description}</div>
                        <div class="building-stats">${statsText}</div>
                    </div>
                    <div class="building-right">
                        <div class="building-cost">🪙 ${this.formatNumber(cost)}</div>
                        <div class="building-owned">Owned: ${owned}</div>
                    </div>
                </div>
            `;
        }).join('');

        this.elements.buildingsList.innerHTML = html;

        // Attach click handlers
        this.elements.buildingsList.querySelectorAll('.building-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.buildingId;
                onBuy(id);
            });
        });
    },

    // Render upgrades list
    renderUpgrades(upgrades, state, onBuy) {
        const available = upgrades.filter(u => {
            if (state.upgrades.includes(u.id)) return true; // Show purchased
            if (!u.requires) return true;
            const owned = state.buildings[u.requires.building] || 0;
            return owned >= u.requires.count;
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

        this.elements.upgradesList.innerHTML = html || '<div class="upgrade-card"><div class="upgrade-info"><div class="upgrade-desc">Keep building to unlock upgrades...</div></div></div>';

        // Attach click handlers
        this.elements.upgradesList.querySelectorAll('.upgrade-card:not(.purchased)').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.upgradeId;
                onBuy(id);
            });
        });
    },

    // Render models/companies list
    renderModels(companies, state) {
        const html = companies.map(company => {
            const companyModels = company.models.map(model => {
                const owned = state.activeModels.includes(model.id);
                return `
                    <div class="model-card" style="border-left: 3px solid ${company.color}">
                        <div class="model-company">${company.name}</div>
                        <div class="model-name">${model.name} ${owned ? '✓' : ''}</div>
                        <div class="building-desc">${model.flavor}</div>
                        <div class="model-stats">
                            <span>Tier ${model.tier}</span>
                            <span>${model.bonus.type}: x${model.bonus.value}</span>
                        </div>
                    </div>
                `;
            }).join('');
            return companyModels;
        }).join('');

        this.elements.modelsList.innerHTML = html || '<div class="model-card">Coming soon...</div>';
    },

    // Spawn click particle + sparks
    spawnParticle(amount, x, y) {
        // Main number particle
        const particle = document.createElement('div');
        particle.className = 'particle';
        if (amount > 100) particle.classList.add('crit');
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
        });

        this.elements.upgradesList.querySelectorAll('.upgrade-card:not(.purchased)').forEach(card => {
            const id = card.dataset.upgradeId;
            const upgrade = UPGRADES.find(u => u.id === id);
            if (!upgrade) return;
            card.classList.toggle('cant-afford', state.tokens < upgrade.cost);
        });
    },
};

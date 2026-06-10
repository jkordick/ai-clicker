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
            // Migrate: ensure ownedModels exists and includes active models
            if (!this.state.ownedModels) this.state.ownedModels = [];
            for (const id of this.state.activeModels) {
                if (!this.state.ownedModels.includes(id)) this.state.ownedModels.push(id);
            }
            if (!this.state.intelligence) this.state.intelligence = 0;
            if (!this.state.totalIntelligence) this.state.totalIntelligence = 0;
            if (!this.state.modelSlots) this.state.modelSlots = 1;
            if (!this.state.iqCostMultiplier) this.state.iqCostMultiplier = 1;
            if (!this.state.iqMultiplier) this.state.iqMultiplier = 1;
            if (!this.state.drainMultiplier) this.state.drainMultiplier = 1;
            if (this.state.critChanceBonus == null) this.state.critChanceBonus = 0;
            if (this.state.critMultBonus == null) this.state.critMultBonus = 0;
            if (this.state.computeCostRate == null) this.state.computeCostRate = 0.05;
            if (this.state.researchPoints == null) this.state.researchPoints = 0;
            // Migration: prior players had RP that auto-granted +25% passive.
            // Backfill researchPointsTotal so they show a sensible lifetime total
            // and so the Research tab unlocks.
            if (this.state.researchPointsTotal == null
                || this.state.researchPointsTotal < this.state.researchPoints) {
                this.state.researchPointsTotal = this.state.researchPoints || 0;
            }
            if (!this.state.researchUpgrades) this.state.researchUpgrades = {};
            if (this.state.asiAchieved == null) this.state.asiAchieved = 0;

            // Stats migration: ensure all stat fields exist
            const defaultStats = getDefaultState().stats;
            this.state.stats = { ...defaultStats, ...(this.state.stats || {}) };
            // Backfill lifetime totals from existing run totals (old saves)
            if (this.state.stats.lifetimeTokens < (this.state.totalTokens || 0)) {
                this.state.stats.lifetimeTokens = this.state.totalTokens || 0;
            }
            if (this.state.stats.lifetimeIntelligence < (this.state.totalIntelligence || 0)) {
                this.state.stats.lifetimeIntelligence = this.state.totalIntelligence || 0;
            }
            if (this.state.stats.lifetimeClicks < (this.state.totalClicks || 0)) {
                this.state.stats.lifetimeClicks = this.state.totalClicks || 0;
            }
            // sessionStart always refreshes on load (resume = new session)
            this.state.stats.sessionStart = Date.now();

            // Reapply upgrades to rebuild computed multipliers (including modelSlots)
            this.reapplyUpgrades();

            // Iteratively trim active models if save exceeds available slots
            this.normalizeActiveModels(null);

            // Handle offline progress
            if (saved._offlineSeconds && saved._offlineSeconds > 5) {
                const offlineTps = this.calculateTps();
                const offlineEarnings = offlineTps * Math.min(saved._offlineSeconds, 8 * 3600);
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

        // Show model selection for new games
        if (!this.state.startingModel) {
            this.showModelSelect();
        } else {
            this.startGame();
        }
    },

    showModelSelect() {
        const overlay = document.getElementById('model-select-overlay');
        const grid = document.getElementById('model-select-grid');
        overlay.classList.remove('hidden');

        // One starter model per company (tier 1)
        const starters = COMPANIES.map(company => {
            const model = company.models.find(m => m.tier === 1);
            return { company, model };
        }).filter(s => s.model);

        grid.innerHTML = starters.map(({ company, model }) => `
            <div class="model-option" data-model-id="${model.id}" style="border-left: 4px solid ${company.color}">
                <div class="model-opt-company" style="color: ${company.color}">${company.name}</div>
                <div class="model-opt-name">${model.name}</div>
                <div class="model-opt-flavor">${model.flavor}</div>
                <div class="model-opt-bonus">
                    Drain: ${model.drain}/s → IQ: ${model.iqOutput}/s
                    <br>${model.specialty.desc}
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.model-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const modelId = opt.dataset.modelId;
                this.selectStartingModel(modelId);
            });
        });
    },

    selectStartingModel(modelId) {
        this.state.startingModel = modelId;
        this.state.ownedModels.push(modelId);
        this.state.activeModels.push(modelId);

        // Hide modal and start
        document.getElementById('model-select-overlay').classList.add('hidden');
        const model = this.findModel(modelId);
        UI.log(`Model activated: ${model.name}! Let's build.`, 'achievement');
        this.startGame();
    },

    startGame() {
        this.renderShop();
        this.renderStats();

        // Start loops
        this.tickInterval = setInterval(() => this.tick(), 100);
        this.saveInterval = setInterval(() => this.autoSave(), 30000);
        this.renderInterval = setInterval(() => this.renderStats(), 250);
    },

    bindEvents() {
        UI.elements.clickButton.addEventListener('click', (e) => this.handleClick(e));

        const clickZone = document.getElementById('click-zone');
        clickZone.addEventListener('click', (e) => {
            if (e.target === UI.elements.clickButton || UI.elements.clickButton.contains(e.target)) return;
            this.handleClick(e);
        });

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
                    this.showModelSelect();
                }
            }
        });

        // Prestige
        const prestigeBtn = document.getElementById('prestige-btn');
        if (prestigeBtn) prestigeBtn.addEventListener('click', () => this.openPrestigeModal());

        const prestigeCancel = document.getElementById('prestige-cancel');
        if (prestigeCancel) prestigeCancel.addEventListener('click', () => {
            document.getElementById('prestige-overlay').classList.add('hidden');
        });

        const prestigeConfirm = document.getElementById('prestige-confirm');
        if (prestigeConfirm) prestigeConfirm.addEventListener('click', () => this.doPrestige());
    },

    // ASI threshold = 1 million intelligence (halved by 'singularity-approach' research)
    ASI_THRESHOLD_BASE: 1_000_000,
    get ASI_THRESHOLD() {
        return hasResearch(this.state, 'singularity-approach')
            ? this.ASI_THRESHOLD_BASE / 2
            : this.ASI_THRESHOLD_BASE;
    },

    // Research Points gained = floor(sqrt(intelligence / threshold))
    calculatePrestigeGain() {
        const ratio = this.state.intelligence / this.ASI_THRESHOLD;
        if (ratio < 1) return 0;
        return Math.floor(Math.sqrt(ratio));
    },

    openPrestigeModal() {
        const gain = this.calculatePrestigeGain();
        if (gain < 1) return;
        const newTotal = (this.state.researchPoints || 0) + gain;
        document.getElementById('prestige-iq-display').textContent = UI.formatNumber(this.state.intelligence);
        document.getElementById('prestige-rp-gain').textContent = gain;
        document.getElementById('prestige-rp-total').textContent = newTotal;
        document.getElementById('prestige-bonus-display').textContent = (newTotal * 25).toFixed(0);
        document.getElementById('prestige-overlay').classList.remove('hidden');
    },

    doPrestige() {
        const gain = this.calculatePrestigeGain();
        if (gain < 1) return;
        const newRP = (this.state.researchPoints || 0) + gain;
        const newRPTotal = (this.state.researchPointsTotal || 0) + gain;
        const newASICount = (this.state.asiAchieved || 0) + 1;

        // Preserve lifetime stats across prestige
        const preservedStats = { ...this.state.stats };
        preservedStats.prestigeCount = (preservedStats.prestigeCount || 0) + 1;
        preservedStats.sessionStart = Date.now();

        // Preserve research upgrades (the whole point of RP)
        const preservedResearch = { ...(this.state.researchUpgrades || {}) };

        // Persistent Knowledge research: keep highest-tier owned model
        let keptModelId = null;
        if (preservedResearch['persistent-knowledge'] && this.state.ownedModels.length > 0) {
            let bestTier = -1;
            for (const id of this.state.ownedModels) {
                const m = this.findModel(id);
                if (m && m.tier > bestTier) { bestTier = m.tier; keptModelId = id; }
            }
        }

        // Reset state but keep RP, ASI count, lifetime stats, research
        const fresh = getDefaultState();
        fresh.researchPoints = newRP;
        fresh.researchPointsTotal = newRPTotal;
        fresh.researchUpgrades = preservedResearch;
        fresh.asiAchieved = newASICount;
        fresh.stats = preservedStats;

        // Head Start research: 10K tokens to start
        if (preservedResearch['head-start']) {
            fresh.tokens = 10000;
        }

        // Re-grant kept model so the user can re-pick or auto-activates
        if (keptModelId) {
            fresh.ownedModels = [keptModelId];
            fresh.activeModels = [keptModelId];
            fresh.startingModel = keptModelId;
        }

        this.state = fresh;
        this.save();

        document.getElementById('prestige-overlay').classList.add('hidden');
        UI.log(`🌌 ASI achieved! Gained ${gain} RP (total earned: ${newRPTotal})`, 'achievement');
        this.render();

        // Only show model select if we don't already have one (Persistent Knowledge case)
        if (!keptModelId) {
            this.showModelSelect();
        } else {
            this.startGame();
        }
    },

    handleClick(e) {
        let power = this.getClickPower();

        // Crit roll
        const critChance = this.getCritChance();
        const isCrit = Math.random() < critChance;
        if (isCrit) {
            power = Math.floor(power * this.getCritMultiplier());
        }

        this.state.tokens += power;
        this.state.totalTokens += power;
        this.state.stats.lifetimeTokens += power;
        this.state.totalClicks++;
        this.state.stats.lifetimeClicks++;
        if (isCrit) {
            this.state.stats.totalCrits++;
            this.state.stats.critTokensGained += power;
        }

        const containerRect = UI.elements.clickParticles.getBoundingClientRect();
        const x = e.clientX - containerRect.left;
        const y = e.clientY - containerRect.top;
        UI.spawnParticle(power, x, y, isCrit);
        UI.spawnFlyingToken(power, e.clientX, e.clientY, isCrit);
    },

    // Base 5% crit chance, additive from upgrades + active model specialties + research
    getCritChance() {
        let chance = 0.05 + (this.state.critChanceBonus || 0);
        if (hasResearch(this.state, 'strawberry-memory')) chance += 0.10;
        for (const modelId of this.state.activeModels) {
            const model = this.findModel(modelId);
            if (model && model.specialty.critChance) {
                chance += model.specialty.critChance;
            }
        }
        return Math.min(chance, 1);
    },

    // Base 3x crit multiplier, additive from upgrades + model specialties
    getCritMultiplier() {
        let mult = 3 + (this.state.critMultBonus || 0);
        for (const modelId of this.state.activeModels) {
            const model = this.findModel(modelId);
            if (model && model.specialty.critMult) {
                mult += model.specialty.critMult;
            }
        }
        return mult;
    },

    getClickPower() {
        const promptingOwned = this.state.buildings['prompting'] || 0;
        const promptingMultiplier = this.state.buildingMultipliers['prompting'] || 1;
        const baseClick = this.state.clickPower + (promptingOwned * 1 * promptingMultiplier);
        let clickMult = this.state.clickMultiplier;

        // Apply active model click bonuses
        for (const modelId of this.state.activeModels) {
            const model = this.findModel(modelId);
            if (model && model.specialty.clickMult) {
                clickMult *= model.specialty.clickMult;
            }
        }

        // Echo Chamber research: ×2 click power
        if (hasResearch(this.state, 'echo-chamber')) clickMult *= 2;

        return Math.floor(baseClick * clickMult);
    },

    calculateTps() {
        let totalTps = 0;
        for (const building of BUILDINGS) {
            const owned = this.state.buildings[building.id] || 0;
            const multiplier = this.state.buildingMultipliers[building.id] || 1;
            totalTps += getBuildingTps(building, owned, multiplier);
        }

        let tpsMult = this.state.globalMultiplier;

        // Apply active model TPS bonuses
        for (const modelId of this.state.activeModels) {
            const model = this.findModel(modelId);
            if (model && model.specialty.tpsMult) {
                tpsMult *= model.specialty.tpsMult;
            }
            if (model && model.specialty.globalMult) {
                tpsMult *= model.specialty.globalMult;
            }
        }

        // Chained Reasoning research: +1% global TPS per owned model
        if (hasResearch(this.state, 'chained-reasoning')) {
            tpsMult *= 1 + (this.state.ownedModels.length * 0.01);
        }

        return totalTps * tpsMult * this.getResearchMultiplier();
    },

    // Each Research Point... no longer auto-grants. See Cognitive Bandwidth instead.
    getResearchMultiplier() {
        const rank = getResearchRank(this.state, 'cognitive-bandwidth');
        return 1 + rank * 0.25;
    },

    // Calculate total token drain from all active models
    calculateDrain() {
        return this.calculateModelDrain() + this.calculateComputeCost();
    },

    calculateModelDrain() {
        let totalDrain = 0;
        for (const modelId of this.state.activeModels) {
            const model = this.findModel(modelId);
            if (!model) continue;
            let drain = model.drain;
            if (model.specialty.drainMult) {
                drain *= model.specialty.drainMult;
            }
            totalDrain += drain;
        }
        return totalDrain * (this.state.drainMultiplier || 1);
    },

    // Compute cost: a % of current TPS goes to compute/electricity.
    // Default 5%. Reduced by drainMultiplier (same drain-reduction upgrades).
    calculateComputeCost() {
        if (this.state.activeModels.length === 0) return 0; // no models = no compute
        const tps = this.calculateTps();
        let baseRate = this.state.computeCostRate || 0.05;
        if (hasResearch(this.state, 'compute-optimization')) baseRate *= 0.5;
        const rate = baseRate * (this.state.drainMultiplier || 1);
        return tps * rate;
    },

    // Calculate total IQ output from all active models
    calculateIqPerSec() {
        let totalIq = 0;
        for (const modelId of this.state.activeModels) {
            const model = this.findModel(modelId);
            if (!model) continue;
            let iq = model.iqOutput;
            if (model.specialty.iqMult) {
                iq *= model.specialty.iqMult;
            }
            if (model.specialty.chaosMult && Math.random() < 0.02) {
                iq *= model.specialty.chaosMult;
            }
            totalIq += iq;
        }
        return totalIq * (this.state.iqMultiplier || 1) * this.getResearchMultiplier();
    },

    getModelSlots() {
        let slots = this.state.modelSlots;
        // Cognitive Surplus research: +1 per rank
        slots += getResearchRank(this.state, 'cognitive-surplus');
        for (const modelId of this.state.activeModels) {
            const model = this.findModel(modelId);
            if (model && model.specialty.slotBonus) {
                slots += model.specialty.slotBonus;
            }
        }
        return slots;
    },

    tick() {
        // Generate tokens from tech stack (10 ticks/sec)
        const tps = this.calculateTps();
        const earned = tps / 10;
        if (earned > 0) {
            this.state.tokens += earned;
            this.state.totalTokens += earned;
            this.state.stats.lifetimeTokens += earned;
        }

        // Models consume tokens and produce intelligence
        const drain = this.calculateDrain() / 10;
        const iqRate = this.calculateIqPerSec() / 10;

        if (drain > 0 && this.state.tokens >= drain) {
            this.state.tokens -= drain;
            this.state.intelligence += iqRate;
            this.state.totalIntelligence += iqRate;
            this.state.stats.lifetimeIntelligence += iqRate;
        } else if (drain > 0 && this.state.tokens > 0) {
            const ratio = this.state.tokens / drain;
            const partialIq = iqRate * ratio;
            this.state.intelligence += partialIq;
            this.state.totalIntelligence += partialIq;
            this.state.stats.lifetimeIntelligence += partialIq;
            this.state.tokens = 0;
        }

        this.state.lastTick = Date.now();
        this.state.stats.totalTimePlayed += 0.1;

        const iqps = this.calculateIqPerSec();
        if (tps > this.state.stats.highestTps) this.state.stats.highestTps = tps;
        if (iqps > this.state.stats.highestIqps) this.state.stats.highestIqps = iqps;
        if (this.state.intelligence > this.state.stats.highestIntelligence) {
            this.state.stats.highestIntelligence = this.state.intelligence;
        }
        if (this.state.tokens > this.state.stats.highestTokens) {
            this.state.stats.highestTokens = this.state.tokens;
        }
    },

    render() {
        this.renderStats();
        this.renderShop();
    },

    renderStats() {
        const tps = this.calculateTps();
        const drain = this.calculateDrain();
        const iqps = this.calculateIqPerSec();
        UI.updateStats(this.state.tokens, tps, this.state.intelligence, iqps, drain);
        UI.updateAffordability(this.state);
    },

    renderShop() {
        UI.renderBuildings(BUILDINGS, this.state, (id, qty) => this.buyBuilding(id, qty));
        UI.renderUpgrades(UPGRADES, this.state, (id) => this.buyUpgrade(id));
        UI.renderModels(COMPANIES, this.state, (id) => this.buyModel(id), (id) => this.activateModel(id));
        UI.renderResearch(RESEARCH_UPGRADES, this.state, (id) => this.buyResearch(id));
    },

    buyResearch(id) {
        const upgrade = RESEARCH_UPGRADES.find(u => u.id === id);
        if (!upgrade) return;
        const currentRank = getResearchRank(this.state, id);
        if (currentRank >= upgrade.maxRank) return;
        const cost = getResearchCost(upgrade, currentRank);
        if ((this.state.researchPoints || 0) < cost) return;

        this.state.researchPoints -= cost;
        this.state.researchUpgrades[id] = currentRank + 1;
        const newRank = currentRank + 1;
        UI.log(
            upgrade.maxRank > 1
                ? `🔬 Researched: ${upgrade.name} (rank ${newRank}/${upgrade.maxRank})`
                : `🔬 Researched: ${upgrade.name}`,
            'achievement'
        );
        // Re-render in case slot count, multipliers, etc. changed
        this.render();
    },

    buyBuilding(id, quantity = 1) {
        const building = BUILDINGS.find(b => b.id === id);
        if (!building) return;

        let bought = 0;
        let totalSpent = 0;
        for (let i = 0; i < quantity; i++) {
            const owned = this.state.buildings[id] || 0;
            let cost = getBuildingCost(building, owned);
            cost = Math.floor(cost * this.state.costMultiplier);

            if (this.state.tokens < cost) break;
            this.state.tokens -= cost;
            this.state.buildings[id] = owned + 1;
            totalSpent += cost;
            bought++;
        }

        if (bought > 0) {
            const owned = this.state.buildings[id];
            this.state.stats.tokensSpentBuildings += totalSpent;
            this.state.stats.buildingsPurchased += bought;
            if (bought === 1) {
                UI.log(`Built ${building.name} (#${owned})`, 'purchase');
            } else {
                UI.log(`Built ${bought}x ${building.name} for 🪙${UI.formatNumber(totalSpent)}`, 'purchase');
            }
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
            this.state.stats.tokensSpentUpgrades += upgrade.cost;
            this.state.stats.upgradesPurchased++;
            this.applyUpgrade(upgrade);
            UI.log(`Unlocked: ${upgrade.name}!`, 'achievement');
            this.renderShop();
        }
    },

    buyModel(modelId) {
        const model = this.findModel(modelId);
        if (!model) return;
        if (this.state.ownedModels.includes(modelId)) return;

        let cost = MODEL_TIER_COSTS[model.tier] || 0;

        // Recursive Insight research: Tier 5+ models cost 50% less IQ
        if (model.tier >= 5 && hasResearch(this.state, 'recursive-insight')) {
            cost *= 0.5;
        }

        // Apply IQ cost reduction from Zeta models
        for (const ownedId of this.state.activeModels) {
            const m = this.findModel(ownedId);
            if (m && m.specialty.iqCostMult) {
                cost *= m.specialty.iqCostMult;
            }
        }
        cost = Math.floor(cost * this.state.iqCostMultiplier);

        if (this.state.intelligence >= cost) {
            this.state.intelligence -= cost;
            this.state.ownedModels.push(modelId);
            this.state.stats.iqSpentModels += cost;
            this.state.stats.modelsAcquired++;
            UI.log(`Acquired: ${model.name}! Activate it from the Models tab.`, 'purchase');
            this.renderShop();
        }
    },

    activateModel(modelId) {
        const model = this.findModel(modelId);
        if (!model) return;
        if (!this.state.ownedModels.includes(modelId)) return;

        if (this.state.activeModels.includes(modelId)) {
            // Deactivate — only if more than 1 active
            if (this.state.activeModels.length > 1) {
                this.state.activeModels = this.state.activeModels.filter(id => id !== modelId);
                UI.log(`Deactivated: ${model.name}`, 'info');
                this.normalizeActiveModels(modelId);
            } else {
                UI.log(`Can't deactivate your only model! Activate another to swap.`, 'info');
            }
        } else {
            // Activate — if slot available, just add. If full, swap out the oldest active.
            if (this.state.activeModels.length < this.getModelSlots()) {
                this.state.activeModels.push(modelId);
                this.state.stats.modelsActivated++;
                UI.log(`Activated: ${model.name}!`, 'purchase');
            } else {
                // Prefer swapping out a non-slot-provider to preserve capacity
                const swapIdx = this.state.activeModels.findIndex(id => {
                    const m = this.findModel(id);
                    return !m || !m.specialty.slotBonus;
                });
                const idx = swapIdx >= 0 ? swapIdx : 0;
                const removed = this.state.activeModels.splice(idx, 1)[0];
                const removedModel = this.findModel(removed);
                this.state.activeModels.push(modelId);
                this.state.stats.modelsActivated++;
                UI.log(`Swapped ${removedModel ? removedModel.name : 'model'} → ${model.name}`, 'purchase');
                this.normalizeActiveModels(modelId);
            }
        }
        this.renderShop();
    },

    // Iteratively trim activeModels until length <= getModelSlots().
    // Removes from the end, but never removes the protected (just-activated) model.
    normalizeActiveModels(protectId) {
        let safety = 16;
        while (this.state.activeModels.length > this.getModelSlots() && safety-- > 0) {
            // Drop the last non-protected model
            const removeIdx = (() => {
                for (let i = this.state.activeModels.length - 1; i >= 0; i--) {
                    if (this.state.activeModels[i] !== protectId) return i;
                }
                return -1;
            })();
            if (removeIdx < 0) break;
            const removed = this.state.activeModels.splice(removeIdx, 1)[0];
            const removedModel = this.findModel(removed);
            UI.log(`Auto-deactivated ${removedModel ? removedModel.name : 'a model'} (no slot)`, 'info');
        }
    },

    findModel(modelId) {
        for (const company of COMPANIES) {
            const model = company.models.find(m => m.id === modelId);
            if (model) return model;
        }
        return null;
    },

    findCompanyForModel(modelId) {
        for (const company of COMPANIES) {
            if (company.models.find(m => m.id === modelId)) return company;
        }
        return null;
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
            case 'model_slot':
                this.state.modelSlots += effect.value;
                break;
            case 'iq_multiply':
                this.state.iqMultiplier *= effect.value;
                break;
            case 'drain_reduce':
                this.state.drainMultiplier *= effect.value;
                break;
            case 'crit_chance':
                this.state.critChanceBonus += effect.value;
                break;
            case 'crit_mult':
                this.state.critMultBonus += effect.value;
                break;
        }
    },

    reapplyUpgrades() {
        this.state.clickMultiplier = 1;
        this.state.globalMultiplier = 1;
        this.state.costMultiplier = 1;
        this.state.iqMultiplier = 1;
        this.state.drainMultiplier = 1;
        this.state.modelSlots = 1;
        this.state.critChanceBonus = 0;
        this.state.critMultBonus = 0;
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
    if (Game.state && Game.state.upgrades && Game.state.upgrades.length > 0) {
        Game.reapplyUpgrades();
    }
});

window.addEventListener('beforeunload', () => {
    Game.save();
});

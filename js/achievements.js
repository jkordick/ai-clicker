// Achievements — small permanent rewards for hitting milestones.
// Each unlocked achievement grants +1% global multiplier (stacked in Game.achievementBonus).
// Checked once per second in Game.tick().

const ACHIEVEMENTS = [
    // Click milestones
    { id: 'click-100',      name: 'Warming Up',         desc: '100 lifetime clicks',           check: (s) => s.stats.lifetimeClicks >= 100 },
    { id: 'click-1k',       name: 'Repetitive Strain',  desc: '1,000 lifetime clicks',         check: (s) => s.stats.lifetimeClicks >= 1_000 },
    { id: 'click-10k',      name: 'Carpal Tunnel',      desc: '10,000 lifetime clicks',        check: (s) => s.stats.lifetimeClicks >= 10_000 },

    // Crit milestones
    { id: 'crit-first',     name: 'First Blood',        desc: 'Score your first crit',         check: (s) => s.stats.totalCrits >= 1 },
    { id: 'crit-100',       name: 'Lucky Streak',       desc: '100 lifetime crits',            check: (s) => s.stats.totalCrits >= 100 },
    { id: 'crit-tokens-1m', name: 'Crit Magnate',       desc: '1M tokens from crits',          check: (s) => s.stats.critTokensGained >= 1_000_000 },

    // Token milestones
    { id: 'tokens-1k',      name: 'Pocket Change',      desc: '1,000 lifetime tokens',         check: (s) => s.stats.lifetimeTokens >= 1_000 },
    { id: 'tokens-1m',      name: 'Token Tycoon',       desc: '1M lifetime tokens',            check: (s) => s.stats.lifetimeTokens >= 1_000_000 },
    { id: 'tokens-1b',      name: 'Token Mogul',        desc: '1B lifetime tokens',            check: (s) => s.stats.lifetimeTokens >= 1_000_000_000 },
    { id: 'tokens-1t',      name: 'Trillion Club',      desc: '1T lifetime tokens',            check: (s) => s.stats.lifetimeTokens >= 1_000_000_000_000 },

    // TPS milestones
    { id: 'tps-100',        name: 'Steady Drip',        desc: 'Hit 100 TPS',                   check: (s) => s.stats.highestTps >= 100 },
    { id: 'tps-10k',        name: 'Industrial Output',  desc: 'Hit 10K TPS',                   check: (s) => s.stats.highestTps >= 10_000 },
    { id: 'tps-1m',         name: 'Token Geyser',       desc: 'Hit 1M TPS',                    check: (s) => s.stats.highestTps >= 1_000_000 },

    // IQ milestones
    { id: 'iq-100',         name: 'Sentient-ish',       desc: 'Reach 100 IQ',                  check: (s) => s.stats.highestIntelligence >= 100 },
    { id: 'iq-10k',         name: 'Galaxy Brain',       desc: 'Reach 10K IQ',                  check: (s) => s.stats.highestIntelligence >= 10_000 },
    { id: 'iq-1m',          name: 'Megamind',           desc: 'Reach 1M IQ',                   check: (s) => s.stats.highestIntelligence >= 1_000_000 },

    // Buildings
    { id: 'build-10',       name: 'Tech Stack',         desc: 'Own 10 buildings total',        check: (s) => sumBuildings(s) >= 10 },
    { id: 'build-100',      name: 'Full Stack',         desc: 'Own 100 buildings total',       check: (s) => sumBuildings(s) >= 100 },
    { id: 'build-500',      name: 'Empire',             desc: 'Own 500 buildings total',       check: (s) => sumBuildings(s) >= 500 },
    { id: 'build-prompting-25', name: 'Prompt Whisperer', desc: '25 Prompting buildings',      check: (s) => (s.buildings['prompting']||0) >= 25 },
    { id: 'build-agi-1',    name: 'It\'s Alive',        desc: 'Build your first AGI',          check: (s) => (s.buildings['agi-system']||0) >= 1 },

    // Models
    { id: 'model-2',        name: 'Multi-Model',        desc: 'Own 2 different models',        check: (s) => s.ownedModels.length >= 2 },
    { id: 'model-10',       name: 'Model Collector',    desc: 'Own 10 different models',       check: (s) => s.ownedModels.length >= 10 },
    { id: 'model-tier6',    name: 'Frontier',           desc: 'Own a Tier 6 model',            check: (s, g) => s.ownedModels.some(id => { const m = g.findModel(id); return m && m.tier >= 6; }) },

    // Prestige
    { id: 'prestige-1',     name: 'Ascend',             desc: 'Prestige once',                 check: (s) => (s.asiAchieved||0) >= 1 },
    { id: 'prestige-5',     name: 'Cycle of Rebirth',   desc: 'Prestige 5 times',              check: (s) => (s.asiAchieved||0) >= 5 },
    { id: 'rp-10',          name: 'Researcher',         desc: 'Earn 10 RP lifetime',           check: (s) => (s.researchPointsTotal||0) >= 10 },
    { id: 'rp-100',         name: 'Tenured Professor',  desc: 'Earn 100 RP lifetime',          check: (s) => (s.researchPointsTotal||0) >= 100 },

    // Upgrades / research
    { id: 'upgrade-5',      name: 'Optimizer',          desc: 'Buy 5 upgrades',                check: (s) => s.stats.upgradesPurchased >= 5 },
    { id: 'upgrade-all',    name: 'Min-Maxer',          desc: 'Buy every standard upgrade',    check: (s) => s.upgrades.length >= (typeof UPGRADES !== 'undefined' ? UPGRADES.length : 999) },
];

function sumBuildings(state) {
    let total = 0;
    for (const k in (state.buildings || {})) total += state.buildings[k];
    return total;
}

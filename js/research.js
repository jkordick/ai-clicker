// Research upgrades — permanent perks purchased with Research Points (RP).
// RP is earned at prestige (ASI). Unlike regular upgrades, these survive prestige.
//
// Each entry:
//   id, name, icon, description
//   cost(rank)        -> RP cost to buy the *next* rank (rank starts at 0)
//   maxRank           -> max purchasable ranks (1 = single-buy)
//   tier              -> visual grouping (1=common, 2=advanced, 3=endgame)

const RESEARCH_UPGRADES = [
    {
        id: 'cognitive-bandwidth',
        name: 'Cognitive Bandwidth',
        icon: '🧠',
        description: '+25% Tokens/sec & IQ/sec per rank. The bread and butter of recursive self-improvement.',
        cost: (rank) => rank + 1, // 1, 2, 3, 4, ...
        maxRank: 10,
        tier: 1,
    },
    {
        id: 'head-start',
        name: 'Head Start',
        icon: '🚀',
        description: 'Start every prestige with 10,000 tokens already in the bank.',
        cost: () => 1,
        maxRank: 1,
        tier: 1,
    },
    {
        id: 'strawberry-memory',
        name: 'Strawberry Memory',
        icon: '🍓',
        description: '+10% crit chance permanently. The model remembers there are 2 r\'s. Probably.',
        cost: () => 1,
        maxRank: 1,
        tier: 1,
    },
    {
        id: 'compute-optimization',
        name: 'Compute Optimization',
        icon: '⚙️',
        description: 'Compute cost rate halved: 5% of TPS → 2.5%.',
        cost: () => 2,
        maxRank: 1,
        tier: 1,
    },
    {
        id: 'persistent-knowledge',
        name: 'Persistent Knowledge',
        icon: '💾',
        description: 'Keep your highest-tier owned model across prestige (you still start the run with it active).',
        cost: () => 2,
        maxRank: 1,
        tier: 2,
    },
    {
        id: 'echo-chamber',
        name: 'Echo Chamber',
        icon: '🔊',
        description: 'Click power ×2 permanently. Confirmation bias is a hell of a drug.',
        cost: () => 3,
        maxRank: 1,
        tier: 2,
    },
    {
        id: 'cognitive-surplus',
        name: 'Cognitive Surplus',
        icon: '🎰',
        description: '+1 base model slot per rank (permanent, applies before any other slot bonus).',
        cost: (rank) => 3 + rank * 2, // 3, 5, 7
        maxRank: 3,
        tier: 2,
    },
    {
        id: 'chained-reasoning',
        name: 'Chained Reasoning',
        icon: '⛓️',
        description: 'Each *owned* model (active or benched) grants +1% global TPS multiplier.',
        cost: () => 4,
        maxRank: 1,
        tier: 2,
    },
    {
        id: 'recursive-insight',
        name: 'Recursive Insight',
        icon: '🔁',
        description: 'Tier 5 & Tier 6 models cost 50% less IQ to acquire.',
        cost: () => 5,
        maxRank: 1,
        tier: 3,
    },
    {
        id: 'singularity-approach',
        name: 'Singularity Approach',
        icon: '🌀',
        description: 'ASI threshold halved (1B → 500M IQ). Prestige twice as fast forever.',
        cost: () => 10,
        maxRank: 1,
        tier: 3,
    },
];

function getResearchRank(state, id) {
    return (state.researchUpgrades && state.researchUpgrades[id]) || 0;
}

function hasResearch(state, id) {
    return getResearchRank(state, id) > 0;
}

function getResearchCost(upgrade, currentRank) {
    return upgrade.cost(currentRank);
}

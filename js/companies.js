// Parody AI Companies & their model families
const COMPANIES = [
    {
        id: 'philanthropic',
        name: 'Philanthropic',
        tagline: 'Building AI that cares... eventually',
        color: '#d4a574',
        models: [
            { id: 'clyde-haiku', name: 'Clyde 3 Haiku', tier: 1, drain: 1, iqOutput: 0.15, specialty: { type: 'safe', desc: '-20% token drain', drainMult: 0.8 }, flavor: 'Small, fast, writes poetry about safety' },
            { id: 'clyde-sonnet', name: 'Clyde 3.5 Sonnet', tier: 2, drain: 5, iqOutput: 1.8, specialty: { type: 'quality', desc: '+30% IQ output', iqMult: 1.3 }, flavor: 'The workhorse. Refuses politely.' },
            { id: 'clyde-opus', name: 'Clyde 3.5 Opus', tier: 3, drain: 25, iqOutput: 18, specialty: { type: 'deep', desc: '+50% IQ output', iqMult: 1.5 }, flavor: 'Expensive but writes dissertations on ethics' },
            { id: 'clyde-4-sonnet', name: 'Clyde 4 Sonnet', tier: 4, drain: 100, iqOutput: 80, specialty: { type: 'code', desc: '+80% click power', clickMult: 1.8 }, flavor: '"The one that codes" — and philosophizes about it' },
            { id: 'clyde-4-opus', name: 'Clyde 4 Opus', tier: 5, drain: 500, iqOutput: 450, specialty: { type: 'all', desc: '+40% everything', globalMult: 1.4 }, flavor: 'Extended Pondering™ enabled. May take a while.' },
        ],
    },
    {
        id: 'openbrain',
        name: 'OpenBrain',
        tagline: 'Open in name only™',
        color: '#74d4a5',
        models: [
            { id: 'bpt-35-turbo', name: 'BPT-3.5 Turbo', tier: 1, drain: 2, iqOutput: 0.3, specialty: { type: 'speed', desc: '+20% TPS', tpsMult: 1.2 }, flavor: 'Everyone\'s first model. Still works!' },
            { id: 'bpt-4', name: 'BPT-4', tier: 2, drain: 8, iqOutput: 2.5, specialty: { type: 'quality', desc: '+40% IQ output', iqMult: 1.4 }, flavor: 'The one that started it all (again)' },
            { id: 'bpt-4o', name: 'BPT-4o', tier: 3, drain: 30, iqOutput: 20, specialty: { type: 'multi', desc: '+25% TPS, +25% click', tpsMult: 1.25, clickMult: 1.25 }, flavor: 'Can see! Can hear! Can... charge more!' },
            { id: 'bpt-o1', name: 'BPT-o1 "Strawberry"', tier: 4, drain: 150, iqOutput: 100, specialty: { type: 'reasoning', desc: '+100% IQ, +5x crit damage', iqMult: 2.0, critMult: 5 }, flavor: 'Thinks for 3 minutes. Bills you for 30.' },
            { id: 'bpt-5', name: 'BPT-5', tier: 5, drain: 600, iqOutput: 500, specialty: { type: 'all', desc: '+50% everything', globalMult: 1.5 }, flavor: 'The board fired everyone to make this' },
        ],
    },
    {
        id: 'noodle',
        name: 'Noodle',
        tagline: 'We have infinite compute and we\'re not afraid to use it',
        color: '#74a5d4',
        models: [
            { id: 'gemstone-flash', name: 'Gemstone 1.5 Flash', tier: 1, drain: 3, iqOutput: 0.25, specialty: { type: 'speed', desc: '+40% TPS', tpsMult: 1.4 }, flavor: 'Fast as lightning, depth of a puddle' },
            { id: 'gemstone-pro', name: 'Gemstone 1.5 Pro', tier: 2, drain: 6, iqOutput: 2.0, specialty: { type: 'context', desc: '+1 model slot', slotBonus: 1 }, flavor: 'Actually works now (third time\'s the charm)' },
            { id: 'gemstone-2-flash', name: 'Gemstone 2.0 Flash', tier: 3, drain: 20, iqOutput: 15, specialty: { type: 'speed', desc: '+60% TPS', tpsMult: 1.6 }, flavor: 'So fast it answers before you ask' },
            { id: 'gemstone-25-pro', name: 'Gemstone 2.5 Pro', tier: 4, drain: 120, iqOutput: 85, specialty: { type: 'reasoning', desc: '+70% IQ, +1 slot', iqMult: 1.7, slotBonus: 1 }, flavor: 'Deep Think mode: "Hold my TPU"' },
            { id: 'gemstone-ultra', name: 'Gemstone Ultra', tier: 5, drain: 700, iqOutput: 550, specialty: { type: 'context', desc: '+2 slots, +30% all', slotBonus: 2, globalMult: 1.3 }, flavor: '2 million tokens of context. Remembers everything. Judges you.' },
        ],
    },
    {
        id: 'macrohard',
        name: 'Macrohard',
        tagline: 'Enterprise-grade AI with enterprise-grade pricing',
        color: '#a574d4',
        models: [
            { id: 'co-parrot-1', name: 'Co-Parrot 1.0', tier: 1, drain: 2, iqOutput: 0.2, specialty: { type: 'code', desc: '+50% click power', clickMult: 1.5 }, flavor: 'Autocomplete became sentient' },
            { id: 'co-parrot-workspace', name: 'Co-Parrot Workspace', tier: 2, drain: 7, iqOutput: 2.2, specialty: { type: 'code', desc: '+80% click power', clickMult: 1.8 }, flavor: 'Lives in your IDE. Knows your secrets.' },
            { id: 'co-parrot-agent', name: 'Co-Parrot Agent', tier: 3, drain: 35, iqOutput: 22, specialty: { type: 'auto', desc: '+50% TPS, +50% click, +20% crit', tpsMult: 1.5, clickMult: 1.5, critChance: 0.20 }, flavor: 'Does your PRs while you sleep' },
            { id: 'phi-4-mini', name: 'Phi-4 Mini', tier: 2, drain: 3, iqOutput: 1.2, specialty: { type: 'efficient', desc: '-40% drain', drainMult: 0.6 }, flavor: 'Tiny but mighty. Runs on a potato.' },
            { id: 'co-parrot-ultra', name: 'Co-Parrot Ultra', tier: 5, drain: 550, iqOutput: 480, specialty: { type: 'code', desc: '+150% click, +50% TPS', clickMult: 2.5, tpsMult: 1.5 }, flavor: 'Includes Clippy 2.0 as a free bonus' },
        ],
    },
    {
        id: 'zeta',
        name: 'Zeta',
        tagline: 'Open source go brrrr',
        color: '#d47474',
        models: [
            { id: 'llamba-2-7b', name: 'Llamba 2 7B', tier: 1, drain: 1, iqOutput: 0.12, specialty: { type: 'efficient', desc: '-30% drain, free', drainMult: 0.7 }, flavor: 'Small, free, community-loved' },
            { id: 'llamba-3-70b', name: 'Llamba 3 70B', tier: 2, drain: 5, iqOutput: 1.9, specialty: { type: 'open', desc: '-25% model IQ costs', iqCostMult: 0.75 }, flavor: 'Community fine-tunes go crazy' },
            { id: 'llamba-31-405b', name: 'Llamba 3.1 405B', tier: 3, drain: 28, iqOutput: 19, specialty: { type: 'open', desc: '-30% model IQ costs', iqCostMult: 0.7 }, flavor: '"Open source GPT-4" — their words, not ours' },
            { id: 'llamba-4-scout', name: 'Llamba 4 Scout', tier: 4, drain: 80, iqOutput: 70, specialty: { type: 'speed', desc: '+80% TPS, -20% drain', tpsMult: 1.8, drainMult: 0.8 }, flavor: 'Lightweight agent, finds what you need' },
            { id: 'llamba-4-maverick', name: 'Llamba 4 Maverick', tier: 5, drain: 400, iqOutput: 400, specialty: { type: 'open', desc: '-40% costs, +30% all', iqCostMult: 0.6, globalMult: 1.3 }, flavor: 'Mixture of Experts: 8 llambas in a trenchcoat' },
        ],
    },
    {
        id: 'yai',
        name: 'yAI',
        tagline: 'Move fast and break benchmarks',
        color: '#d4d474',
        models: [
            { id: 'gronk-1', name: 'Gronk 1', tier: 1, drain: 4, iqOutput: 0.5, specialty: { type: 'chaos', desc: 'Random 2× IQ bursts', chaosMult: 2.0 }, flavor: 'Unfiltered. Unhinged. Unpredictable.' },
            { id: 'gronk-2', name: 'Gronk 2', tier: 2, drain: 10, iqOutput: 3.0, specialty: { type: 'chaos', desc: 'Random 3× IQ bursts, +15% crit', chaosMult: 3.0, critChance: 0.15 }, flavor: 'Now with 50% less accidental manifestos' },
            { id: 'gronk-3', name: 'Gronk 3', tier: 4, drain: 130, iqOutput: 90, specialty: { type: 'chaos', desc: 'Random 4× bursts, +30% all', chaosMult: 4.0, globalMult: 1.3 }, flavor: '"Fun mode" is not optional. It\'s the only mode.' },
        ],
    },
    {
        id: 'sirocco',
        name: 'Sirocco',
        tagline: 'Oui oui, efficient AI',
        color: '#74d4d4',
        models: [
            { id: 'croissant-7b', name: 'Croissant 7B', tier: 1, drain: 1.5, iqOutput: 0.22, specialty: { type: 'efficient', desc: 'Best tier-1 efficiency', drainMult: 0.85 }, flavor: 'Tiny, European, punches above its weight' },
            { id: 'croissant-nemo', name: 'Croissant Nemo', tier: 2, drain: 4, iqOutput: 1.6, specialty: { type: 'efficient', desc: '-35% drain', drainMult: 0.65 }, flavor: 'A collab. Finding itself.' },
            { id: 'croissant-large', name: 'Croissant Large', tier: 3, drain: 18, iqOutput: 16, specialty: { type: 'efficient', desc: '-40% drain, +20% IQ', drainMult: 0.6, iqMult: 1.2 }, flavor: 'Sacré bleu, it\'s actually good' },
            { id: 'codestral', name: 'Codestral', tier: 3, drain: 22, iqOutput: 14, specialty: { type: 'code', desc: '+100% click power', clickMult: 2.0 }, flavor: 'Le code. C\'est magnifique.' },
            { id: 'croissant-moe', name: 'Croissant MoE', tier: 5, drain: 350, iqOutput: 380, specialty: { type: 'efficient', desc: '-50% drain, +40% IQ', drainMult: 0.5, iqMult: 1.4 }, flavor: 'Mixture of Croissants™' },
        ],
    },
    {
        id: 'deepdive',
        name: 'DeepDive',
        tagline: 'Why pay more when you can pay less?',
        color: '#74d4a0',
        models: [
            { id: 'abyssal-v2', name: 'Abyssal V2', tier: 1, drain: 1, iqOutput: 0.18, specialty: { type: 'efficient', desc: '-25% all costs', drainMult: 0.75 }, flavor: 'Costs nothing. Surprisingly decent.' },
            { id: 'abyssal-coder', name: 'Abyssal Coder', tier: 2, drain: 4, iqOutput: 1.5, specialty: { type: 'code', desc: '+70% click, -20% drain', clickMult: 1.7, drainMult: 0.8 }, flavor: 'Your 10x engineer for 0.1x the price' },
            { id: 'abyssal-r1', name: 'Abyssal R1', tier: 4, drain: 60, iqOutput: 75, specialty: { type: 'reasoning', desc: '+120% IQ output', iqMult: 2.2 }, flavor: 'Reasoning at 1/10th the cost. How? Don\'t ask.' },
        ],
    },
];

// IQ cost to unlock models by tier
const MODEL_TIER_COSTS = {
    1: 0,
    2: 100,
    3: 1_000,
    4: 10_000,
    5: 100_000,
};

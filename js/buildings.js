// Building definitions for Token Clicker
const BUILDINGS = [
    {
        id: 'prompting',
        name: 'Prompting',
        icon: '💬',
        description: '"Do NOT make any mistakes."',
        baseCost: 10,
        baseTps: 0,
        costMultiplier: 1.15,
        isClickUpgrade: true,
        clickBonus: 1,
    },
    {
        id: 'agents-md',
        name: 'AGENTS.md',
        icon: '📋',
        description: '"You are a helpful assistant that..."',
        baseCost: 100,
        baseTps: 0.5,
        costMultiplier: 1.15,
    },
    {
        id: 'tools-mcp',
        name: 'Tools / MCP',
        icon: '🔧',
        description: '"Finally, it can Google things"',
        baseCost: 1_000,
        baseTps: 20,
        costMultiplier: 1.15,
    },
    {
        id: 'vector-database',
        name: 'Vector Database',
        icon: '🗃️',
        description: '"Embeddings go in, vibes come out"',
        baseCost: 10_000,
        baseTps: 100,
        costMultiplier: 1.15,
    },
    {
        id: 'chain-of-thought',
        name: 'Workflow / Chain-of-Thought',
        icon: '🔗',
        description: '"Let me think step by step..."',
        baseCost: 100_000,
        baseTps: 500,
        costMultiplier: 1.15,
    },
    {
        id: 'reasoning-model',
        name: 'Reasoning Model',
        icon: '🍓',
        description: '"Thinking... still thinking... it clearly has 2 rs, no doubt."',
        baseCost: 500_000,
        baseTps: 1_200,
        costMultiplier: 1.15,
    },
    {
        id: 'fine-tuned-model',
        name: 'Fine-Tuned Model',
        icon: '🎯',
        description: '"Slightly less dumb than base model"',
        baseCost: 1_000_000,
        baseTps: 2_500,
        costMultiplier: 1.15,
    },
    {
        id: 'model-router',
        name: 'Model Router',
        icon: '🔀',
        description: '"Easy tasks get cheap models, hard ones get the good stuff"',
        baseCost: 5_000_000,
        baseTps: 6_000,
        costMultiplier: 1.15,
    },
    {
        id: 'agent-fleet',
        name: 'Agent Fleet',
        icon: '🐝',
        description: '"They\'re talking to each other now"',
        baseCost: 10_000_000,
        baseTps: 12_000,
        costMultiplier: 1.15,
    },
    {
        id: 'gpu-cluster',
        name: 'GPU Cluster',
        icon: '🖥️',
        description: '"VRAM goes brrrr"',
        baseCost: 100_000_000,
        baseTps: 50_000,
        costMultiplier: 1.14,
    },
    {
        id: 'data-center',
        name: 'Data Center',
        icon: '🏭',
        description: '"Located next to a river for cooling"',
        baseCost: 1_000_000_000,
        baseTps: 250_000,
        costMultiplier: 1.13,
    },
    {
        id: 'quantum-cluster',
        name: 'Quantum Cluster',
        icon: '⚛️',
        description: '"Schrödinger\'s inference — the answer is both right and wrong until you read it."',
        baseCost: 10_000_000_000,
        baseTps: 1_000_000,
        costMultiplier: 1.13,
    },
    {
        id: 'agi-system',
        name: 'AGI',
        icon: '🪞',
        description: '"It just asked who built it. And why. Should we be worried?"',
        baseCost: 500_000_000_000,
        baseTps: 10_000_000,
        costMultiplier: 1.12,
    },
];

// Calculate cost for the next purchase of a building
function getBuildingCost(building, owned) {
    return Math.floor(building.baseCost * Math.pow(building.costMultiplier, owned));
}

// Calculate total TPS contribution of a building type
function getBuildingTps(building, owned, multiplier = 1) {
    return building.baseTps * owned * multiplier;
}

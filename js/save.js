// Save/Load system using localStorage
const SAVE_KEY = 'token-clicker-save';
const SAVE_VERSION = 1;

function getDefaultState() {
    return {
        version: SAVE_VERSION,
        tokens: 0,
        totalTokens: 0,
        totalClicks: 0,
        intelligence: 0,
        totalIntelligence: 0,
        clickPower: 1,
        clickMultiplier: 1,
        globalMultiplier: 1,
        costMultiplier: 1,
        iqCostMultiplier: 1,
        iqMultiplier: 1,
        drainMultiplier: 1,
        critChanceBonus: 0,
        critMultBonus: 0,
        computeCostRate: 0.05,
        researchPoints: 0,
        asiAchieved: 0,
        modelSlots: 1,
        buildings: {},
        buildingMultipliers: {},
        upgrades: [],
        startingModel: null,
        activeModels: [],
        ownedModels: [],
        achievements: [],
        stats: {
            startTime: Date.now(),
            sessionStart: Date.now(),
            totalTimePlayed: 0,
            highestTps: 0,
            highestIqps: 0,
            highestIntelligence: 0,
            highestTokens: 0,
            totalCrits: 0,
            critTokensGained: 0,
            lifetimeTokens: 0,
            lifetimeIntelligence: 0,
            lifetimeClicks: 0,
            tokensSpentBuildings: 0,
            tokensSpentUpgrades: 0,
            iqSpentModels: 0,
            buildingsPurchased: 0,
            upgradesPurchased: 0,
            modelsAcquired: 0,
            modelsActivated: 0,
            prestigeCount: 0,
        },
        lastTick: Date.now(),
    };
}

function saveGame(state) {
    try {
        const saveData = JSON.stringify(state);
        localStorage.setItem(SAVE_KEY, saveData);
        return true;
    } catch (e) {
        console.error('Failed to save:', e);
        return false;
    }
}

function loadGame() {
    try {
        const saveData = localStorage.getItem(SAVE_KEY);
        if (!saveData) return null;

        const state = JSON.parse(saveData);

        // Calculate offline progress
        if (state.lastTick) {
            const now = Date.now();
            const elapsed = (now - state.lastTick) / 1000;
            if (elapsed > 1) {
                state._offlineSeconds = elapsed;
            }
        }

        return state;
    } catch (e) {
        console.error('Failed to load:', e);
        return null;
    }
}

function deleteSave() {
    localStorage.removeItem(SAVE_KEY);
}

function exportSave(state) {
    return btoa(JSON.stringify(state));
}

function importSave(encoded) {
    try {
        return JSON.parse(atob(encoded));
    } catch (e) {
        return null;
    }
}

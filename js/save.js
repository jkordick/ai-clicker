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
            totalTimePlayed: 0,
            highestTps: 0,
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

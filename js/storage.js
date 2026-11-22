// =========================================================
// js/storage.js — Profile, Warrior Spirit, Upgrades & 3 Save Slots
// =========================================================
window.MG = window.MG || {};

MG.Storage = (function () {
  const PROFILE_KEY = "mg_arena_profile_v1";
  const SLOT_PREFIX = "mg_arena_save_slot_";

  const DEFAULT_PROFILE = {
    warriorSpirit: 0,
    totalDeaths: 0,
    totalWins: 0,
    upgrades: {
      upg_hp: 0,
      upg_mp: 0,
      upg_stats: 0,
      upg_gold: 0,
      upg_xp: 0
    },
    options: {
      masterVol: 0.7,
      sfxVol: 0.85,
      musicVol: 0.35,
      muted: false,
      animatedBg: true,
      keybindings: {
        attack: "1",
        skills: "2",
        items: "3",
        surrender: "4",
        confirm: "Enter",
        menu: "Escape"
      }
    }
  };

  function getProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        upgrades: { ...DEFAULT_PROFILE.upgrades, ...(parsed.upgrades || {}) },
        options: {
          ...DEFAULT_PROFILE.options,
          ...(parsed.options || {}),
          keybindings: {
            ...DEFAULT_PROFILE.options.keybindings,
            ...((parsed.options && parsed.options.keybindings) || {})
          }
        }
      };
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
    }
  }

  function saveProfile(profile) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn("Could not save profile:", e);
    }
  }

  function getOptions() {
    return getProfile().options;
  }

  function saveOptions(opts) {
    const p = getProfile();
    p.options = { ...p.options, ...opts };
    saveProfile(p);
  }

  function addWarriorSpirit(amount, isDeath = false) {
    const p = getProfile();
    p.warriorSpirit = (p.warriorSpirit || 0) + amount;
    if (isDeath) p.totalDeaths = (p.totalDeaths || 0) + 1;
    saveProfile(p);
    return p.warriorSpirit;
  }

  function buyUpgrade(upgradeId) {
    const def = MG.Data.UPGRADES.find((u) => u.id === upgradeId);
    if (!def) return { ok: false, msg: "Unknown upgrade" };
    const p = getProfile();
    const curRank = p.upgrades[upgradeId] || 0;
    if (curRank >= def.maxLevel) return { ok: false, msg: "Max rank reached!" };
    const cost = def.baseCost + curRank * def.stepCost;
    if (p.warriorSpirit < cost) return { ok: false, msg: "Not enough Warrior Spirit!" };

    p.warriorSpirit -= cost;
    p.upgrades[upgradeId] = curRank + 1;
    saveProfile(p);
    return { ok: true, rank: curRank + 1, spirit: p.warriorSpirit };
  }

  function saveGame(slotIndex, gameState) {
    if (slotIndex < 0 || slotIndex > 2) return false;
    try {
      const payload = {
        slotIndex,
        savedAt: new Date().toISOString(),
        state: gameState
      };
      localStorage.setItem(SLOT_PREFIX + slotIndex, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.warn("Save failed:", e);
      return false;
    }
  }

  function loadGame(slotIndex) {
    if (slotIndex < 0 || slotIndex > 2) return null;
    try {
      const raw = localStorage.getItem(SLOT_PREFIX + slotIndex);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function deleteGame(slotIndex) {
    localStorage.removeItem(SLOT_PREFIX + slotIndex);
  }

  function listSlots() {
    return [0, 1, 2].map((idx) => loadGame(idx));
  }

  return {
    getProfile,
    saveProfile,
    getOptions,
    saveOptions,
    addWarriorSpirit,
    buyUpgrade,
    saveGame,
    loadGame,
    deleteGame,
    listSlots
  };
})();

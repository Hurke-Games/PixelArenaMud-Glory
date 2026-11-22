// =========================================================
// js/character.js — Stats, Layered Front-Facing Renderer, Enemies
// =========================================================
window.MG = window.MG || {};

MG.Character = (function () {
  function rollRandomBaseStats() {
    // Assign 60 points across 6 stats around average 10 (each starts at 6, +24 distributed)
    const keys = ["str", "dex", "int", "tou", "man", "luk"];
    const stats = { str: 6, dex: 6, int: 6, tou: 6, man: 6, luk: 6 };
    for (let i = 0; i < 24; i++) {
      const k = keys[Math.floor(Math.random() * keys.length)];
      if (stats[k] < 16) stats[k]++;
      else i--;
    }
    return stats;
  }

  function createNewPlayer(config) {
    const profile = MG.Storage.getProfile();
    const upg = profile.upgrades || {};
    const race = MG.Data.RACES[config.race] || MG.Data.RACES.human;
    const cls = MG.Data.CLASSES[config.cls] || MG.Data.CLASSES.warrior;

    const base = { ...(config.baseStats || rollRandomBaseStats()) };
    // Race & Class bonuses
    for (const [k, v] of Object.entries(race.bonus)) base[k] += v;
    for (const [k, v] of Object.entries(cls.bonus)) base[k] += v;
    // Upgrade bonus (+1 all stats per rank)
    if (upg.upg_stats > 0) {
      for (const k of Object.keys(base)) base[k] += upg.upg_stats;
    }

    const starterWpn = JSON.parse(JSON.stringify(MG.Data.WEAPONS[cls.starterWeapon]));
    if (cls.id === "barbarian") {
      starterWpn.dmg = Math.round(starterWpn.dmg * 1.2);
      starterWpn.barbBoosted = true;
    }

    const player = {
      name: (config.name || "Muddy Recruit").trim().slice(0, 18),
      gender: config.gender || "male",
      race: race.id,
      cls: cls.id,
      level: 1,
      xp: 0,
      xpToNext: 40,
      unspentPoints: 0,
      gold: 35 + (upg.upg_gold || 0) * 25,
      wins: 0,
      baseStats: base,
      bonusHp: (upg.upg_hp || 0) * 15,
      bonusMp: (upg.upg_mp || 0) * 10,
      appearance: {
        headId: config.headId || MG.Data.HEADS[0].id,
        hairId: config.hairId || "none",
        accId: config.accId || "none",
        skinColor: config.skinColor || race.defaultSkin,
        hairColor: config.hairColor || MG.Data.HAIR_COLORS[0],
        eyeColor: config.eyeColor || MG.Data.EYE_COLORS[0],
        clothColor: config.clothColor || MG.Data.CLOTH_COLORS[0],
        customFaceData: config.customFaceData || null
      },
      equippedWeapon: starterWpn,
      equippedArmor: JSON.parse(JSON.stringify(MG.Data.ARMORS[cls.starterArmor])),
      inventory: [
        { kind: "item", item: JSON.parse(JSON.stringify(MG.Data.ITEMS.itm_red_berry_juice)), qty: 2 }
      ],
      skills: [],
      isBoss: false
    };

    const derived = getDerivedStats(player);
    player.hp = derived.maxHp;
    player.mp = derived.maxMp;
    return player;
  }

  function getEffectiveStats(char) {
    const eff = { ...char.baseStats };
    const addBonus = (b) => {
      if (!b) return;
      for (const [k, v] of Object.entries(b)) {
        eff[k] = (eff[k] || 0) + v;
      }
    };
    if (char.equippedWeapon) addBonus(char.equippedWeapon.bonus);
    if (char.equippedArmor) addBonus(char.equippedArmor.bonus);
    return eff;
  }

  function getDerivedStats(char) {
    const eff = getEffectiveStats(char);
    const maxHp = Math.max(20, eff.tou * 10 + (char.bonusHp || 0));
    const maxMp = Math.max(10, eff.man * 5 + (char.bonusMp || 0));
    const strMult = Math.max(0.2, 1 + (eff.str - 10) * 0.1);
    const intMult = Math.max(0.2, 1 + (eff.int - 10) * 0.1);
    const critChance = Math.min(75, Math.max(0, eff.dex * 1.0));
    const dodgeChance = Math.min(60, Math.max(0, eff.dex * 0.5));
    const rawDef = char.equippedArmor ? char.equippedArmor.def : 0;
    const armorDef = Math.round(rawDef * (char.cls === "warrior" ? 1.5 : 1.0));
    const baseWpnDmg = char.equippedWeapon ? char.equippedWeapon.dmg : 10;
    const luckMult = 1 + eff.luk * 0.05 * (char.cls === "druid" ? 2 : 1);

    return {
      eff,
      maxHp,
      maxMp,
      strMult,
      intMult,
      critChance,
      dodgeChance,
      armorDef,
      baseWpnDmg,
      luckMult
    };
  }

  function generateEnemy(boutIndex) {
    // boutIndex: 0..19 for 20 campaign fighters, 20 for Boss #21
    if (boutIndex === 20) {
      return {
        name: "Drill Sergeant Brock",
        gender: "male",
        race: "orc",
        cls: "warrior",
        level: 10,
        wins: 20,
        isBoss: true,
        bossSpriteId: "boss_drill_sergeant_brock",
        baseStats: { str: 20, dex: 13, int: 10, tou: 26, man: 14, luk: 12 },
        bonusHp: 80,
        bonusMp: 20,
        equippedWeapon: { id: "wpn_fence_post", name: "NO LOITERING Club", type: "two_hand", dmg: 26, bonus: { str: 2 } },
        equippedArmor: { id: "arm_training_plate", name: "Tin Bathtub Plate", type: "heavy", def: 14, bonus: { tou: 2 } },
        skills: [MG.Data.SKILLS.find((s) => s.id === "skl_pommel_strike")],
        hp: 340,
        mp: 90
      };
    }

    const raceKeys = Object.keys(MG.Data.RACES);
    const clsKeys = Object.keys(MG.Data.CLASSES);
    const raceId = raceKeys[Math.floor(Math.random() * raceKeys.length)];
    const clsId = clsKeys[Math.floor(Math.random() * clsKeys.length)];
    const gender = Math.random() < 0.5 ? "male" : "female";
    const race = MG.Data.RACES[raceId];
    const cls = MG.Data.CLASSES[clsId];

    // Scale base stats smoothly from bout 1 to 20
    const scale = Math.floor(boutIndex * 1.15);
    const base = { str: 8, dex: 8, int: 8, tou: 8, man: 8, luk: 8 };
    const statKeys = Object.keys(base);
    for (let i = 0; i < 12 + scale * 2; i++) {
      base[statKeys[Math.floor(Math.random() * statKeys.length)]]++;
    }
    for (const [k, v] of Object.entries(race.bonus)) base[k] += v;
    for (const [k, v] of Object.entries(cls.bonus)) base[k] += v;

    // Pick tier-appropriate weapon & armor
    const tier = Math.min(4, 1 + Math.floor(boutIndex / 5));
    const wpns = Object.values(MG.Data.WEAPONS).filter((w) => w.type === cls.favWeapon && w.tier <= tier);
    const arms = Object.values(MG.Data.ARMORS).filter((a) => a.type === cls.favArmor && a.tier <= tier);
    const wpn = wpns[wpns.length - 1] || MG.Data.WEAPONS[cls.starterWeapon];
    const arm = arms[arms.length - 1] || MG.Data.ARMORS[cls.starterArmor];

    // Pick appropriate head
    const raceHeads = MG.Data.HEADS.filter((h) => h.id.includes(raceId));
    const head = raceHeads[Math.floor(Math.random() * raceHeads.length)] || MG.Data.HEADS[0];
    const hair = MG.Data.HAIRS[Math.floor(Math.random() * MG.Data.HAIRS.length)];

    const enemy = {
      name: MG.Data.ENEMY_NAMES[boutIndex % MG.Data.ENEMY_NAMES.length],
      gender,
      race: raceId,
      cls: clsId,
      level: 1 + Math.floor(boutIndex / 2),
      isBoss: false,
      baseStats: base,
      bonusHp: boutIndex * 4,
      bonusMp: 0,
      appearance: {
        headId: head.id,
        hairId: hair.id,
        accId: Math.random() < 0.35 ? "scar" : "none",
        skinColor: race.skinPalette[Math.floor(Math.random() * race.skinPalette.length)],
        hairColor: MG.Data.HAIR_COLORS[Math.floor(Math.random() * MG.Data.HAIR_COLORS.length)],
        eyeColor: MG.Data.EYE_COLORS[Math.floor(Math.random() * MG.Data.EYE_COLORS.length)],
        clothColor: MG.Data.CLOTH_COLORS[Math.floor(Math.random() * MG.Data.CLOTH_COLORS.length)],
        customFaceData: null
      },
      equippedWeapon: JSON.parse(JSON.stringify(wpn)),
      equippedArmor: JSON.parse(JSON.stringify(arm)),
      skills: boutIndex >= 3 ? [MG.Data.SKILLS.find((s) => s.cls === clsId) || MG.Data.SKILLS[0]] : []
    };

    const d = getDerivedStats(enemy);
    enemy.hp = d.maxHp;
    enemy.mp = d.maxMp;
    return enemy;
  }

  function generateCampaign() {
    const bouts = [];
    for (let i = 0; i < 21; i++) {
      bouts.push({
        index: i,
        beaten: false,
        enemy: generateEnemy(i)
      });
    }
    return bouts;
  }

  // Cache custom face Image objects by dataURL
  const customFaceCache = {};
  function getCustomFaceImg(dataUrl) {
    if (!dataUrl) return null;
    if (!customFaceCache[dataUrl]) {
      const img = new Image();
      img.src = dataUrl;
      customFaceCache[dataUrl] = img;
    }
    return customFaceCache[dataUrl];
  }

  // Race & Sex specific rigging proportions (measured on trimmed 256px bounding boxes, normalized to trimH = 1.0)
  const BODY_RIGS = {
    human_male: {
      trimW: 129, trimH: 236, aspect: 0.5466, bodyScale: 1.00,
      existingHeadTopY: -1.000, existingHeadBotY: -0.797, existingHeadWidth: 0.208,
      headH: 0.28, headY: -1.02,
      shoulderY: -0.720, shoulderWidth: 0.436,
      chestY: -0.640, waistY: -0.483, torsoWidth: 0.254, hipWidth: 0.301,
      torsoW: 0.44, torsoH: 0.42, torsoY: -0.77,
      robeW: 0.47, robeH: 0.62, robeY: -0.77,
      rightHandX: 0.206, rightHandY: -0.390,
      leftHandX: -0.212, leftHandY: -0.390,
      handX: 0.206, handY: -0.390,
      accScale: 0.95
    },
    human_female: {
      trimW: 114, trimH: 230, aspect: 0.4957, bodyScale: 0.96,
      existingHeadTopY: -1.000, existingHeadBotY: -0.835, existingHeadWidth: 0.152,
      headH: 0.25, headY: -1.02,
      shoulderY: -0.756, shoulderWidth: 0.317,
      chestY: -0.660, waistY: -0.617, torsoWidth: 0.222, hipWidth: 0.291,
      torsoW: 0.34, torsoH: 0.40, torsoY: -0.79,
      robeW: 0.38, robeH: 0.60, robeY: -0.79,
      rightHandX: 0.200, rightHandY: -0.483,
      leftHandX: -0.202, leftHandY: -0.483,
      handX: 0.200, handY: -0.483,
      accScale: 0.88
    },
    orc_male: {
      trimW: 149, trimH: 204, aspect: 0.7304, bodyScale: 1.05,
      existingHeadTopY: -1.000, existingHeadBotY: -0.873, existingHeadWidth: 0.206,
      headH: 0.29, headY: -1.02,
      shoulderY: -0.755, shoulderWidth: 0.583,
      chestY: -0.642, waistY: -0.475, torsoWidth: 0.358, hipWidth: 0.407,
      torsoW: 0.58, torsoH: 0.49, torsoY: -0.81,
      robeW: 0.61, robeH: 0.66, robeY: -0.81,
      rightHandX: 0.292, rightHandY: -0.368,
      leftHandX: -0.297, leftHandY: -0.368,
      handX: 0.292, handY: -0.368,
      accScale: 1.06
    },
    orc_female: {
      trimW: 129, trimH: 246, aspect: 0.5244, bodyScale: 1.00,
      existingHeadTopY: -1.000, existingHeadBotY: -0.837, existingHeadWidth: 0.199,
      headH: 0.26, headY: -1.02,
      shoulderY: -0.756, shoulderWidth: 0.382,
      chestY: -0.663, waistY: -0.630, torsoWidth: 0.240, hipWidth: 0.337,
      torsoW: 0.41, torsoH: 0.43, torsoY: -0.79,
      robeW: 0.45, robeH: 0.62, robeY: -0.79,
      rightHandX: 0.213, rightHandY: -0.467,
      leftHandX: -0.217, leftHandY: -0.467,
      handX: 0.213, handY: -0.467,
      accScale: 0.94
    },
    darkelf_male: {
      trimW: 106, trimH: 240, aspect: 0.4417, bodyScale: 1.02,
      existingHeadTopY: -1.000, existingHeadBotY: -0.842, existingHeadWidth: 0.154,
      headH: 0.25, headY: -1.02,
      shoulderY: -0.750, shoulderWidth: 0.338,
      chestY: -0.675, waistY: -0.621, torsoWidth: 0.215, hipWidth: 0.288,
      torsoW: 0.36, torsoH: 0.41, torsoY: -0.79,
      robeW: 0.39, robeH: 0.61, robeY: -0.79,
      rightHandX: 0.179, rightHandY: -0.467,
      leftHandX: -0.183, leftHandY: -0.467,
      handX: 0.179, handY: -0.467,
      accScale: 0.86
    },
    darkelf_female: {
      trimW: 119, trimH: 229, aspect: 0.5197, bodyScale: 0.97,
      existingHeadTopY: -1.000, existingHeadBotY: -0.812, existingHeadWidth: 0.183,
      headH: 0.27, headY: -1.02,
      shoulderY: -0.712, shoulderWidth: 0.297,
      chestY: -0.620, waistY: -0.590, torsoWidth: 0.210, hipWidth: 0.284,
      torsoW: 0.34, torsoH: 0.40, torsoY: -0.76,
      robeW: 0.38, robeH: 0.59, robeY: -0.76,
      rightHandX: 0.207, rightHandY: -0.463,
      leftHandX: -0.212, leftHandY: -0.463,
      handX: 0.207, handY: -0.463,
      accScale: 0.86
    }
  };

  // Per-armor adjustments (scales light armor, robes, and heavy armor to fit each race+sex torso & shoulders)
  const ARMOR_ADJUSTMENTS = {
    // Light Armor
    arm_burlap_tunic: {
      trimW: 198, trimH: 203, aspect: 0.9754, collarY: 0.05, shoulderSpanRatio: 0.965, waistSpanRatio: 0.702,
      wMult: 1.34, hMult: 1.08, yOffset: -0.02,
      perBody: { human_male: { wMult: 1.34, hMult: 1.08, yOffset: -0.02 } }
    },
    arm_patched_leather: {
      trimW: 170, trimH: 237, aspect: 0.7173, collarY: 0.05, shoulderSpanRatio: 1.000, waistSpanRatio: 0.818,
      wMult: 1.35, hMult: 1.08, yOffset: -0.02,
      perBody: { human_male: { wMult: 1.35, hMult: 1.08, yOffset: -0.02 } }
    },
    arm_studded_brigandine: {
      trimW: 227, trimH: 214, aspect: 1.0607, collarY: 0.05, shoulderSpanRatio: 0.956, waistSpanRatio: 0.568,
      wMult: 1.28, hMult: 1.08, yOffset: -0.02
    },
    arm_shadow_jerkin: {
      trimW: 196, trimH: 201, aspect: 0.9751, collarY: 0.12, shoulderSpanRatio: 0.867, waistSpanRatio: 0.526,
      wMult: 1.42, hMult: 1.22, yOffset: -0.09,
      perBody: { human_male: { wMult: 1.42, hMult: 1.22, yOffset: -0.09 } }
    },

    // Robes
    arm_bathrobe: {
      trimW: 160, trimH: 201, aspect: 0.7960, collarY: 0.05, shoulderSpanRatio: 0.806, waistSpanRatio: 0.644,
      cropRect: { x: 0.00, y: 0.00, w: 1.00, h: 0.841 },
      wMult: 1.48, hMult: 0.96, yOffset: -0.07,
      perBody: { human_male: { wMult: 1.48, hMult: 0.96, yOffset: -0.07 } }
    },
    arm_hedge_cloak: {
      trimW: 201, trimH: 252, aspect: 0.7976, collarY: 0.12, shoulderSpanRatio: 0.781, waistSpanRatio: 0.851,
      wMult: 1.48, hMult: 1.08, yOffset: -0.10,
      perBody: { human_male: { wMult: 1.48, hMult: 1.08, yOffset: -0.10 } }
    },
    arm_star_robes: {
      trimW: 175, trimH: 239, aspect: 0.7322, collarY: 0.06, shoulderSpanRatio: 0.737, waistSpanRatio: 0.611,
      wMult: 1.60, hMult: 1.04, yOffset: -0.05,
      perBody: { human_male: { wMult: 1.60, hMult: 1.04, yOffset: -0.05 } }
    },
    arm_silk_vestments: {
      trimW: 181, trimH: 224, aspect: 0.8080, collarY: 0.12, shoulderSpanRatio: 0.790, waistSpanRatio: 0.602,
      wMult: 1.46, hMult: 1.06, yOffset: -0.08,
      perBody: { human_male: { wMult: 1.46, hMult: 1.06, yOffset: -0.08 } }
    },

    // Heavy Armor
    arm_barrel_suspenders: {
      trimW: 191, trimH: 229, aspect: 0.8341, collarY: 0.05, shoulderSpanRatio: 0.864, waistSpanRatio: 0.969,
      wMult: 1.36, hMult: 1.12, yOffset: -0.03,
      perBody: { human_male: { wMult: 1.36, hMult: 1.12, yOffset: -0.03 } }
    },
    arm_rusted_chainmail: {
      trimW: 219, trimH: 229, aspect: 0.9563, collarY: 0.05, shoulderSpanRatio: 0.845, waistSpanRatio: 0.521,
      wMult: 1.30, hMult: 1.08, yOffset: -0.02
    },
    arm_banded_cuirass: {
      trimW: 231, trimH: 229, aspect: 1.0087, collarY: 0.06, shoulderSpanRatio: 0.892, waistSpanRatio: 0.558,
      wMult: 1.36, hMult: 1.12, yOffset: -0.04,
      perBody: { human_male: { wMult: 1.36, hMult: 1.12, yOffset: -0.04 } }
    },
    arm_training_plate: {
      trimW: 237, trimH: 249, aspect: 0.9518, collarY: 0.08, shoulderSpanRatio: 0.886, waistSpanRatio: 0.489,
      wMult: 1.38, hMult: 1.15, yOffset: -0.04,
      perBody: { human_male: { wMult: 1.38, hMult: 1.15, yOffset: -0.04 } }
    }
  };

  // Per-head adjustments (covers base body's default head & normalizes cranium across wide Dark Elf ears)
  const HEAD_ADJUSTMENTS = {
    head_human_male_smirk:            { trimW: 175, trimH: 229, aspect: 0.7642, craniumRatio: 0.90, wMult: 1.02, hMult: 1.02, yOffset:  0.00 },
    head_human_male_missing_tooth:    { trimW: 155, trimH: 204, aspect: 0.7598, craniumRatio: 0.85, wMult: 1.05, hMult: 1.04, yOffset:  0.00 },
    head_human_female_freckles:       { trimW: 155, trimH: 250, aspect: 0.6200, craniumRatio: 0.90, wMult: 1.16, hMult: 1.05, yOffset:  0.00 },
    head_human_female_determined:     { trimW: 181, trimH: 221, aspect: 0.8190, craniumRatio: 0.82, wMult: 1.00, hMult: 1.02, yOffset:  0.00 },
    head_orc_male_tusks:              { trimW: 181, trimH: 229, aspect: 0.7904, craniumRatio: 0.88, wMult: 1.04, hMult: 1.04, yOffset:  0.00 },
    head_orc_male_bruiser:            { trimW: 185, trimH: 193, aspect: 0.9585, craniumRatio: 0.76, wMult: 0.95, hMult: 0.96, yOffset:  0.01 },
    head_orc_female_fierce:           { trimW: 201, trimH: 247, aspect: 0.8138, craniumRatio: 0.84, wMult: 1.02, hMult: 1.04, yOffset:  0.00 },
    head_darkelf_male_sneer:          { trimW: 256, trimH: 236, aspect: 1.0847, craniumRatio: 0.53, wMult: 1.02, hMult: 1.02, yOffset:  0.00 },
    head_darkelf_female_glowing_eyes: { trimW: 247, trimH: 191, aspect: 1.2932, craniumRatio: 0.52, wMult: 0.90, hMult: 0.92, yOffset:  0.01 },
    head_darkelf_female_smirk:        { trimW: 247, trimH: 191, aspect: 1.2932, craniumRatio: 0.52, wMult: 0.90, hMult: 0.92, yOffset:  0.01 }
  };

  // Per-hairstyle fit relative to headH
  const HAIR_RIGS = {
    hair_mohawk:        { trimW: 151, trimH: 172, aspect: 0.8779, wMult: 0.92, hMult: 0.96, xOff: 0.00, yOff: -0.34 },
    hair_bowlcut:       { trimW: 201, trimH: 167, aspect: 1.2036, wMult: 1.14, hMult: 0.92, xOff: 0.00, yOff: -0.14 },
    hair_silver_braids: { trimW: 135, trimH: 242, aspect: 0.5579, wMult: 1.22, hMult: 1.48, xOff: 0.00, yOff: -0.12 },
    hair_ponytail:      { trimW: 182, trimH: 228, aspect: 0.7982, wMult: 1.08, hMult: 1.24, xOff: 0.08, yOff: -0.28 }
  };

  // Per-weapon exact handle/grip rigging, orientation, and dual-split coordinates
  const WEAPON_RIGS = {
    // ---------------- DAGGERS (Rogue) ----------------
    wpn_butter_knife: {
      trimW: 232, trimH: 193, orientation: "diag_up_right",
      hand: "right", anchorX: 0.31, anchorY: 0.76, restAngle: -0.15, scale: 0.28, flipX: false
    },
    wpn_rusty_shiv: {
      trimW: 219, trimH: 224, orientation: "diag_up_left",
      hand: "right", anchorX: 0.72, anchorY: 0.72, restAngle: 1.40, scale: 0.30, flipX: false
    },
    wpn_footpad_dirk: {
      trimW: 88, trimH: 221, orientation: "vert_blade_down",
      hand: "right", anchorX: 0.50, anchorY: 0.22, restAngle: -2.40, scale: 0.34, flipX: false
    },
    wpn_balanced_stiletto: {
      trimW: 50, trimH: 224, orientation: "vert_blade_down",
      hand: "right", anchorX: 0.50, anchorY: 0.27, restAngle: -2.40, scale: 0.36, flipX: false
    },

    // ---------------- BOWS (Archer) ----------------
    wpn_bent_stick_bow: {
      trimW: 188, trimH: 234, orientation: "bow_right_arrow",
      hand: "right", anchorX: 0.68, anchorY: 0.50, restAngle: -0.08, scale: 0.52, flipX: false
    },
    wpn_short_hunting_bow: {
      trimW: 114, trimH: 221, orientation: "arrow_left_bow_right",
      hand: "right", anchorX: 0.86, anchorY: 0.50, restAngle: -0.08, scale: 0.52, flipX: false,
      cropRect: { x: 0.40, y: 0.00, w: 0.60, h: 1.00 }, cropAnchorX: 0.77, cropAnchorY: 0.50
    },
    wpn_ashwood_recurve: {
      trimW: 219, trimH: 221, orientation: "diag_bow_up_left",
      hand: "right", anchorX: 0.38, anchorY: 0.38, restAngle: -0.75, scale: 0.52, flipX: false
    },
    wpn_sniper_longbow: {
      trimW: 79, trimH: 254, orientation: "vert_bow_left",
      hand: "right", anchorX: 0.36, anchorY: 0.53, restAngle: -0.08, scale: 0.58, flipX: false
    },

    // ---------------- STAVES (Mage / Druid) ----------------
    wpn_gnarled_branch: {
      trimW: 103, trimH: 252, orientation: "vertical_staff",
      hand: "right", anchorX: 0.44, anchorY: 0.58, restAngle: 0.12, scale: 0.62, flipX: false
    },
    wpn_apprentice_rod: {
      trimW: 71, trimH: 209, orientation: "vertical_staff",
      hand: "right", anchorX: 0.50, anchorY: 0.68, restAngle: 0.12, scale: 0.58, flipX: false
    },
    wpn_acorn_staff: {
      trimW: 78, trimH: 234, orientation: "vertical_staff",
      hand: "right", anchorX: 0.50, anchorY: 0.64, restAngle: 0.12, scale: 0.64, flipX: false
    },
    wpn_quartz_channeler: {
      trimW: 88, trimH: 255, orientation: "vertical_staff",
      hand: "right", anchorX: 0.50, anchorY: 0.68, restAngle: 0.10, scale: 0.66, flipX: false
    },

    // ---------------- SWORD & SHIELD (Warrior — Dual Split) ----------------
    wpn_wood_sword_pot_lid: {
      trimW: 237, trimH: 162, orientation: "split_diag_sword_shield",
      hand: "dual", anchorX: 0.11, anchorY: 0.83, restAngle: -0.10, scale: 0.42,
      splitX: 0.42,
      swordRect: { x: 0.00, y: 0.00, w: 0.42, h: 1.00 },
      swordAnchorX: 0.26, swordAnchorY: 0.83, swordRestAngle: -0.10, swordScale: 0.38,
      shieldRect: { x: 0.42, y: 0.15, w: 0.58, h: 0.83 },
      shieldAnchorX: 0.50, shieldAnchorY: 0.50, shieldRestAngle: 0.00, shieldScale: 0.34
    },
    wpn_chipped_sword_buckler: {
      trimW: 224, trimH: 221, orientation: "split_up_sword_shield",
      hand: "dual", anchorX: 0.14, anchorY: 0.80, restAngle: 0.25, scale: 0.44,
      splitX: 0.27,
      swordRect: { x: 0.00, y: 0.00, w: 0.27, h: 1.00 },
      swordAnchorX: 0.52, swordAnchorY: 0.80, swordRestAngle: 0.35, swordScale: 0.44,
      shieldRect: { x: 0.27, y: 0.12, w: 0.73, h: 0.76 },
      shieldAnchorX: 0.50, shieldAnchorY: 0.50, shieldRestAngle: 0.00, shieldScale: 0.36
    },
    wpn_footman_kite_shield: {
      trimW: 160, trimH: 185, orientation: "split_up_sword_shield",
      hand: "dual", anchorX: 0.18, anchorY: 0.84, restAngle: 0.25, scale: 0.46,
      splitX: 0.30,
      swordRect: { x: 0.00, y: 0.00, w: 0.30, h: 1.00 },
      swordAnchorX: 0.58, swordAnchorY: 0.84, swordRestAngle: 0.35, swordScale: 0.46,
      shieldRect: { x: 0.30, y: 0.04, w: 0.70, h: 0.90 },
      shieldAnchorX: 0.50, shieldAnchorY: 0.48, shieldRestAngle: 0.00, shieldScale: 0.40
    },
    wpn_knight_tower_shield: {
      trimW: 229, trimH: 234, orientation: "split_down_sword_shield",
      hand: "dual", anchorX: 0.145, anchorY: 0.20, restAngle: 0.00, scale: 0.48,
      splitX: 0.30,
      swordRect: { x: 0.00, y: 0.00, w: 0.30, h: 1.00 },
      swordAnchorX: 0.49, swordAnchorY: 0.20, swordRestAngle: -2.75, swordScale: 0.48,
      shieldRect: { x: 0.30, y: 0.08, w: 0.70, h: 0.90 },
      shieldAnchorX: 0.50, shieldAnchorY: 0.48, shieldRestAngle: 0.00, shieldScale: 0.44
    },

    // ---------------- TWO-HANDED (Barbarian) ----------------
    wpn_fence_post: {
      trimW: 94, trimH: 239, orientation: "vertical_top_heavy",
      hand: "right", anchorX: 0.47, anchorY: 0.78, restAngle: 0.28, scale: 0.56, flipX: false
    },
    wpn_butcher_cleaver_axe: {
      trimW: 139, trimH: 227, orientation: "vertical_blade_left",
      hand: "right", anchorX: 0.62, anchorY: 0.74, restAngle: 0.28, scale: 0.54, flipX: true
    },
    wpn_iron_maul: {
      trimW: 93, trimH: 208, orientation: "vertical_top_heavy",
      hand: "right", anchorX: 0.50, anchorY: 0.76, restAngle: 0.26, scale: 0.58, flipX: false
    },
    wpn_executioner_greataxe: {
      trimW: 135, trimH: 244, orientation: "vertical_top_heavy",
      hand: "right", anchorX: 0.50, anchorY: 0.73, restAngle: 0.25, scale: 0.62, flipX: false
    }
  };

  function drawHandGripOverlay(ctx, h, skinColor) {
    const r = Math.max(2.5, h * 0.022);
    ctx.save();
    ctx.fillStyle = skinColor || "#d1986c";
    ctx.strokeStyle = "#1c0e06";
    ctx.lineWidth = Math.max(1, h * 0.007);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.15, r * 0.85, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Renders a strictly front-facing gladiator at (cx, bottomY) with target height.
   * Uses race & sex specific rigging so armor, heads, hair, accessories, and weapons fit cleanly.
   */
  function drawCharacter(ctx, char, cx, bottomY, targetH = 190, anim = {}) {
    ctx.save();
    const ox = anim.offsetX || 0;
    const oy = anim.offsetY || 0;
    const scaleX = anim.scaleX || 1;
    const scaleY = anim.scaleY || 1;

    ctx.translate(cx + ox, bottomY + oy);
    ctx.scale(scaleX, scaleY);

    // Ground shadow oval (subtle)
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.beginPath();
    ctx.ellipse(0, -4, targetH * 0.28, targetH * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boss override
    if (char.isBoss && char.bossSpriteId) {
      const bossSpr = MG.Assets.get(char.bossSpriteId);
      if (bossSpr) {
        const bh = targetH * 1.18;
        const bw = (bossSpr.width / bossSpr.height) * bh;
        ctx.drawImage(bossSpr, -bw / 2, -bh, bw, bh);
      }
      drawStatusEffects(ctx, anim, targetH * 1.18);
      ctx.restore();
      return;
    }

    // Allow Character Creator preview overrides for armor & weapon
    let activeArmor = char.equippedArmor;
    let activeWeapon = char.equippedWeapon;
    if (MG.UI && typeof MG.UI.getScreen === "function" && MG.UI.getScreen() === "creator") {
      const draft = typeof MG.UI.getCreatorDraft === "function" ? MG.UI.getCreatorDraft() : null;
      if (draft) {
        if (draft.previewArmorId && MG.Data && MG.Data.ARMORS[draft.previewArmorId]) {
          activeArmor = MG.Data.ARMORS[draft.previewArmorId];
        }
        if (draft.previewWeaponId && MG.Data && MG.Data.WEAPONS[draft.previewWeaponId]) {
          activeWeapon = MG.Data.WEAPONS[draft.previewWeaponId];
        }
      }
    }

    const rig = BODY_RIGS[`${char.race}_${char.gender}`] || BODY_RIGS.human_male;
    const h = targetH * rig.bodyScale;
    const app = char.appearance || {};
    const skinCol = app.skinColor || (MG.Data && MG.Data.RACES[char.race] ? MG.Data.RACES[char.race].defaultSkin : "#e8b892");
    const bodyId = `${char.race}_${char.gender}_body`;
    const bodySpr = MG.Assets.get(bodyId) || MG.Assets.get("human_male_body");

    if (bodySpr) {
      const bw = (bodySpr.width / bodySpr.height) * h;
      ctx.drawImage(bodySpr, -bw / 2, -h, bw, h);
    }

    // Wearable Armor Overlay fitted to race & sex torso dimensions + per-armor adjustments
    if (activeArmor && activeArmor.id) {
      const armSpr = MG.Assets.get(activeArmor.id);
      if (armSpr) {
        const isRobe = activeArmor.type === "robe";
        const bodyKey = `${char.race}_${char.gender}`;
        const baseAdj = ARMOR_ADJUSTMENTS[activeArmor.id] || { wMult: 1.15, hMult: 1.05, yOffset: -0.01 };
        const bodyOvr = baseAdj.perBody && baseAdj.perBody[bodyKey] ? baseAdj.perBody[bodyKey] : null;
        const wMult = bodyOvr && bodyOvr.wMult !== undefined ? bodyOvr.wMult : baseAdj.wMult;
        const hMult = bodyOvr && bodyOvr.hMult !== undefined ? bodyOvr.hMult : baseAdj.hMult;
        const yOffset = bodyOvr && bodyOvr.yOffset !== undefined ? bodyOvr.yOffset : baseAdj.yOffset;
        const xOffset = bodyOvr && bodyOvr.xOffset !== undefined ? bodyOvr.xOffset : (baseAdj.xOffset || 0);
        const aw = h * (isRobe ? rig.robeW : rig.torsoW) * wMult;
        const ah = h * (isRobe ? rig.robeH : rig.torsoH) * hMult;
        const ax = -aw / 2 + h * xOffset;
        const ay = h * ((isRobe ? rig.robeY : rig.torsoY) + yOffset);
        if (baseAdj.cropRect) {
          const sx = armSpr.width * baseAdj.cropRect.x;
          const sy = armSpr.height * baseAdj.cropRect.y;
          const sw = armSpr.width * baseAdj.cropRect.w;
          const sh = armSpr.height * baseAdj.cropRect.h;
          ctx.drawImage(armSpr, sx, sy, sw, sh, ax, ay, aw, ah);
        } else {
          ctx.drawImage(armSpr, ax, ay, aw, ah);
        }
      }
    }

    // Head or Custom Pixel-by-Pixel Drawn Face (scaled to cleanly cover base body's default head)
    const headH = h * rig.headH;
    const hAdj = HEAD_ADJUSTMENTS[app.headId] || { wMult: 1.0, hMult: 1.0, yOffset: 0, craniumRatio: 0.82 };
    const drawHeadH = Math.max(headH * hAdj.hMult, h * (rig.existingHeadBotY - rig.existingHeadTopY + 0.04));
    const drawHeadY = h * (rig.headY + hAdj.yOffset);

    if (app.customFaceData) {
      const cImg = getCustomFaceImg(app.customFaceData);
      if (cImg && cImg.complete) {
        ctx.drawImage(cImg, -drawHeadH / 2, drawHeadY, drawHeadH, drawHeadH);
      }
    } else {
      const headSpr = MG.Assets.get(app.headId) || MG.Assets.get("head_human_male_smirk");
      if (headSpr) {
        const rawHeadW = (headSpr.width / headSpr.height) * drawHeadH * hAdj.wMult;
        const minHeadW = (h * (rig.existingHeadWidth + 0.03)) / (hAdj.craniumRatio || 0.82);
        const drawHeadW = Math.max(rawHeadW, minHeadW);
        ctx.drawImage(headSpr, -drawHeadW / 2, drawHeadY, drawHeadW, drawHeadH);
      }
    }

    // Modular Hair Overlay fitted per hairstyle & race/sex head size
    if (app.hairId && app.hairId !== "none") {
      const hairSpr = MG.Assets.get(app.hairId);
      if (hairSpr) {
        const hRig = HAIR_RIGS[app.hairId] || { wMult: 1.05, hMult: 1.05, xOff: 0, yOff: -0.15 };
        const hh = headH * hRig.hMult;
        const hw = headH * hRig.wMult;
        const hx = -hw / 2 + headH * (hRig.xOff || 0);
        const hy = drawHeadY + headH * hRig.yOff;
        ctx.drawImage(hairSpr, hx, hy, hw, hh);
      }
    }

    // Modular Accessories (eyepatch, scar, warpaint, mustache)
    if (app.accId && app.accId !== "none") {
      drawAccessory(ctx, app.accId, headH * rig.accScale, drawHeadY);
    }

    // Equipped Weapon anchored by actual handle/grip at character's hand coordinates
    if (activeWeapon && activeWeapon.id) {
      const wpnSpr = MG.Assets.get(activeWeapon.id);
      if (wpnSpr) {
        const wRig = WEAPON_RIGS[activeWeapon.id] || {
          hand: activeWeapon.type === "sword_shield" ? "dual" : "right",
          anchorX: 0.5,
          anchorY: 0.65,
          restAngle: 0.15,
          scale: 0.46,
          flipX: false
        };

        if (wRig.hand === "dual" && wRig.swordRect && wRig.shieldRect) {
          // 1. Main-hand Sword at rightHand
          const sx = wpnSpr.width * wRig.swordRect.x;
          const sy = wpnSpr.height * wRig.swordRect.y;
          const sw = wpnSpr.width * wRig.swordRect.w;
          const sh = wpnSpr.height * wRig.swordRect.h;
          const dH = h * wRig.swordScale;
          const dW = (sw / sh) * dH;

          ctx.save();
          ctx.translate(h * rig.rightHandX, h * rig.rightHandY);
          ctx.rotate((wRig.swordRestAngle || 0) + (anim.swingAngle || 0));
          ctx.drawImage(wpnSpr, sx, sy, sw, sh, -dW * wRig.swordAnchorX, -dH * wRig.swordAnchorY, dW, dH);
          drawHandGripOverlay(ctx, h, skinCol);
          ctx.restore();

          // 2. Off-hand Shield strapped to left forearm/hand
          const shX = wpnSpr.width * wRig.shieldRect.x;
          const shY = wpnSpr.height * wRig.shieldRect.y;
          const shW = wpnSpr.width * wRig.shieldRect.w;
          const shH = wpnSpr.height * wRig.shieldRect.h;
          const sdH = h * wRig.shieldScale;
          const sdW = (shW / shH) * sdH;

          ctx.save();
          ctx.translate(h * (rig.leftHandX * 0.92), h * (rig.leftHandY - 0.05));
          ctx.rotate((wRig.shieldRestAngle || 0) - (anim.swingAngle || 0) * 0.35);
          ctx.drawImage(wpnSpr, shX, shY, shW, shH, -sdW * wRig.shieldAnchorX, -sdH * wRig.shieldAnchorY, sdW, sdH);
          ctx.restore();
        } else {
          // Single-hand or two-handed weapon / bow / staff
          const crop = wRig.cropRect || { x: 0, y: 0, w: 1, h: 1 };
          const sx = wpnSpr.width * crop.x;
          const sy = wpnSpr.height * crop.y;
          const sw = wpnSpr.width * crop.w;
          const sh = wpnSpr.height * crop.h;
          const ax = wRig.cropAnchorX !== undefined ? wRig.cropAnchorX : wRig.anchorX;
          const ay = wRig.cropAnchorY !== undefined ? wRig.cropAnchorY : wRig.anchorY;
          const dH = h * wRig.scale;
          const dW = (sw / sh) * dH;
          const hx = h * (wRig.hand === "left" ? rig.leftHandX : rig.rightHandX);
          const hy = h * (wRig.hand === "left" ? rig.leftHandY : rig.rightHandY);

          ctx.save();
          ctx.translate(hx, hy);
          ctx.rotate((wRig.restAngle || 0) + (anim.swingAngle || 0));
          if (wRig.flipX) ctx.scale(-1, 1);
          ctx.drawImage(wpnSpr, sx, sy, sw, sh, -dW * ax, -dH * ay, dW, dH);
          drawHandGripOverlay(ctx, h, skinCol);
          ctx.restore();
        }
      }
    }

    drawStatusEffects(ctx, anim, h);
    ctx.restore();
  }

  function drawAccessory(ctx, accId, headSize, headY) {
    const cy = headY + headSize * 0.48;
    if (accId === "eyepatch") {
      ctx.strokeStyle = "#140b05";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-headSize * 0.36, cy - 6);
      ctx.lineTo(headSize * 0.36, cy + 2);
      ctx.stroke();
      ctx.fillStyle = "#1e140e";
      ctx.fillRect(-headSize * 0.24, cy - 5, headSize * 0.2, headSize * 0.15);
    } else if (accId === "scar") {
      ctx.strokeStyle = "#b91c1c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(headSize * 0.08, cy - 8);
      ctx.lineTo(headSize * 0.2, cy + 10);
      ctx.stroke();
    } else if (accId === "warpaint") {
      ctx.fillStyle = "rgba(92, 54, 24, 0.78)";
      ctx.fillRect(-headSize * 0.28, cy + 3, headSize * 0.18, 4);
      ctx.fillRect(headSize * 0.1, cy + 3, headSize * 0.18, 4);
    } else if (accId === "mustache") {
      ctx.fillStyle = "#2b190d";
      ctx.fillRect(-headSize * 0.2, cy + 10, headSize * 0.4, 5);
    }
  }

  function drawStatusEffects(ctx, anim, height) {
    if (anim.stunned) {
      const stunSpr = MG.Assets.get("fx_dizzy_birds_stun");
      if (stunSpr) {
        const sw = height * 0.46;
        const sh = (stunSpr.height / stunSpr.width) * sw;
        const bob = Math.sin(Date.now() * 0.008) * 5;
        ctx.drawImage(stunSpr, -sw / 2, -height - sh * 0.65 + bob, sw, sh);
      }
    }
  }

  return {
    rollRandomBaseStats,
    createNewPlayer,
    getEffectiveStats,
    getDerivedStats,
    generateEnemy,
    generateCampaign,
    drawCharacter,
    BODY_RIGS,
    ARMOR_ADJUSTMENTS,
    HEAD_ADJUSTMENTS,
    HAIR_RIGS,
    WEAPON_RIGS
  };
})();

// =========================================================
// js/data.js — Races, Classes, Equipment, Potions, Skills
// =========================================================
window.MG = window.MG || {};

MG.Data = {
  RACES: {
    human: {
      id: "human",
      name: "Human",
      bonus: { dex: 2 },
      desc: "+2 DEX. Adaptable arena rookies with rounded ears and questionable judgment.",
      skinPalette: ["#f7d2b4", "#e8b892", "#d1986c", "#9c6842", "#6e4326"],
      defaultSkin: "#e8b892"
    },
    orc: {
      id: "orc",
      name: "Orc",
      bonus: { str: 2 },
      desc: "+2 STR. Green-skinned brawlers with notched pointy ears and heavy tusks.",
      skinPalette: ["#93b868", "#749c49", "#5c8035", "#4c6b2d", "#87a354"],
      defaultSkin: "#749c49"
    },
    darkelf: {
      id: "darkelf",
      name: "Dark Elf",
      bonus: { int: 2 },
      desc: "+2 INT. Ash-grey schemers with long horizontal knife-ears and glowing eyes.",
      skinPalette: ["#8d939e", "#6d7482", "#555c6b", "#777485", "#9aa1ad"],
      defaultSkin: "#6d7482"
    }
  },

  CLASSES: {
    rogue: {
      id: "rogue",
      name: "Rogue",
      bonus: { dex: 3 },
      favArmor: "light",
      favWeapon: "dagger",
      starterWeapon: "wpn_butter_knife",
      starterArmor: "arm_burlap_tunic",
      specialName: "Backstab",
      specialCost: 0,
      oncePerFight: true,
      passiveDesc: "Double Critical Damage! Once/fight Backstab (unavoidable guaranteed crit).",
      desc: "+3 DEX | Double Crit Damage | 1/fight Backstab"
    },
    archer: {
      id: "archer",
      name: "Archer",
      bonus: { dex: 3 },
      favArmor: "light",
      favWeapon: "bow",
      starterWeapon: "wpn_bent_stick_bow",
      starterArmor: "arm_burlap_tunic",
      specialName: "Quick Volley",
      specialCost: 0,
      oncePerFight: true,
      passiveDesc: "Arrows pierce 50% of enemy armor! Once/fight Bonus Action.",
      desc: "+3 DEX | 50% Armor Pierce | 1/fight Bonus Action"
    },
    mage: {
      id: "mage",
      name: "Mage",
      bonus: { man: 2, int: 1 },
      favArmor: "robe",
      favWeapon: "staff",
      starterWeapon: "wpn_gnarled_branch",
      starterArmor: "arm_bathrobe",
      specialName: "Arcane Focus",
      specialCost: 10,
      oncePerFight: false,
      passiveDesc: "+50% Magic Resistance! Focus doubles damage/effect of your next spell.",
      desc: "+2 MAN, +1 INT | +50% Magic Res | Focus (2x Spell)"
    },
    druid: {
      id: "druid",
      name: "Druid",
      bonus: { man: 2, int: 1 },
      favArmor: "robe",
      favWeapon: "staff",
      starterWeapon: "wpn_gnarled_branch",
      starterArmor: "arm_hedge_cloak",
      specialName: "Call Beast",
      specialCost: 12,
      oncePerFight: false,
      passiveDesc: "Double Luck effects on all drops! Summon a Grumpy Badger or Angry Goose.",
      desc: "+2 MAN, +1 INT | 2x Luck Drops | Summon Badger/Goose"
    },
    warrior: {
      id: "warrior",
      name: "Warrior",
      bonus: { tou: 2, str: 1 },
      favArmor: "heavy",
      favWeapon: "sword_shield",
      starterWeapon: "wpn_wood_sword_pot_lid",
      starterArmor: "arm_barrel_suspenders",
      specialName: "Shield Bash",
      specialCost: 10,
      oncePerFight: false,
      passiveDesc: "150% Defense from all armors! Shield Bash deals 150% dmg & stuns 1 turn.",
      desc: "+2 TOU, +1 STR | 150% Armor Def | Shield Bash (Stun)"
    },
    barbarian: {
      id: "barbarian",
      name: "Barbarian",
      bonus: { tou: 2, str: 1 },
      favArmor: "heavy",
      favWeapon: "two_hand",
      starterWeapon: "wpn_fence_post",
      starterArmor: "arm_barrel_suspenders",
      specialName: "Berserker",
      specialCost: 12,
      oncePerFight: false,
      passiveDesc: "+20% Base Damage on all weapons in shops & drops! Berserker hits 3x.",
      desc: "+2 TOU, +1 STR | +20% Weapon Dmg | Berserker (3x Hit)"
    }
  },

  // 10+ selectable head styles (available to both Male & Female, paired with race skin tint)
  HEADS: [
    { id: "head_human_male_smirk", label: "Smirking Mug" },
    { id: "head_human_male_missing_tooth", label: "Toothless Grin" },
    { id: "head_human_female_freckles", label: "Freckled Gaze" },
    { id: "head_human_female_determined", label: "Battle Glare" },
    { id: "head_orc_male_tusks", label: "Tusked Scowl" },
    { id: "head_orc_male_bruiser", label: "Broken Nose" },
    { id: "head_orc_female_fierce", label: "Fierce Fang" },
    { id: "head_darkelf_male_sneer", label: "Knife-Ear Sneer" },
    { id: "head_darkelf_female_glowing_eyes", label: "Violet Stare" },
    { id: "head_darkelf_female_smirk", label: "Sly Knife-Ear" }
  ],

  HAIRS: [
    { id: "none", label: "Bald / Natural" },
    { id: "hair_mohawk", label: "Warrior Mohawk" },
    { id: "hair_bowlcut", label: "Peasant Bowlcut" },
    { id: "hair_silver_braids", label: "Silver Braids" },
    { id: "hair_ponytail", label: "Combat Ponytail" }
  ],

  ACCESSORIES: [
    { id: "none", label: "None" },
    { id: "eyepatch", label: "Leather Eyepatch" },
    { id: "scar", label: "Jagged Battle Scar" },
    { id: "warpaint", label: "Mud Warpaint" },
    { id: "mustache", label: "Handlebar Stache" }
  ],

  EYE_COLORS: ["#222222", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#ef4444"],
  HAIR_COLORS: ["#3b2314", "#18181b", "#d97706", "#dc2626", "#e5e7eb", "#60a5fa"],
  CLOTH_COLORS: ["#8b5a2b", "#7f1d1d", "#1e3a8a", "#14532d", "#581c87", "#3f3f46"],

  WEAPONS: {
    // Daggers (Rogue)
    wpn_butter_knife: { id: "wpn_butter_knife", name: "Butter Knife", type: "dagger", tier: 1, dmg: 11, bonus: { dex: 1 }, price: 15, desc: "Slightly greasy. 11 Base Dmg, +1 DEX." },
    wpn_rusty_shiv: { id: "wpn_rusty_shiv", name: "Rusty Shiv", type: "dagger", tier: 2, dmg: 15, bonus: { dex: 2 }, price: 40, desc: "Tetanus included. 15 Base Dmg, +2 DEX." },
    wpn_footpad_dirk: { id: "wpn_footpad_dirk", name: "Footpad Dirk", type: "dagger", tier: 3, dmg: 20, bonus: { dex: 3, luk: 1 }, price: 85, desc: "Balanced steel. 20 Base Dmg, +3 DEX, +1 LUK." },
    wpn_balanced_stiletto: { id: "wpn_balanced_stiletto", name: "Balanced Stiletto", type: "dagger", tier: 4, dmg: 27, bonus: { dex: 5, luk: 2 }, price: 165, desc: "Razor point. 27 Base Dmg, +5 DEX, +2 LUK." },

    // Bows (Archer)
    wpn_bent_stick_bow: { id: "wpn_bent_stick_bow", name: "Bent Stick Bow", type: "bow", tier: 1, dmg: 12, bonus: { dex: 1 }, price: 18, desc: "Strung with twine. 12 Base Dmg, +1 DEX." },
    wpn_short_hunting_bow: { id: "wpn_short_hunting_bow", name: "Short Hunting Bow", type: "bow", tier: 2, dmg: 16, bonus: { dex: 2 }, price: 45, desc: "Snappy aim. 16 Base Dmg, +2 DEX." },
    wpn_ashwood_recurve: { id: "wpn_ashwood_recurve", name: "Ashwood Recurve", type: "bow", tier: 3, dmg: 22, bonus: { dex: 3, str: 1 }, price: 95, desc: "Heavy draw. 22 Base Dmg, +3 DEX, +1 STR." },
    wpn_sniper_longbow: { id: "wpn_sniper_longbow", name: "Sniper Longbow", type: "bow", tier: 4, dmg: 29, bonus: { dex: 5, luk: 2 }, price: 180, desc: "Pierces shields. 29 Base Dmg, +5 DEX, +2 LUK." },

    // Staves (Mage / Druid)
    wpn_gnarled_branch: { id: "wpn_gnarled_branch", name: "Gnarled Branch", type: "staff", tier: 1, dmg: 10, bonus: { int: 2, man: 1 }, price: 16, desc: "Still has leaves. 10 Base Dmg, +2 INT, +1 MAN." },
    wpn_apprentice_rod: { id: "wpn_apprentice_rod", name: "Apprentice Rod", type: "staff", tier: 2, dmg: 14, bonus: { int: 3, man: 2 }, price: 45, desc: "Cracked blue orb. 14 Base Dmg, +3 INT, +2 MAN." },
    wpn_acorn_staff: { id: "wpn_acorn_staff", name: "Golden Acorn Staff", type: "staff", tier: 3, dmg: 18, bonus: { int: 5, man: 3, luk: 1 }, price: 95, desc: "Druid favorite. 18 Base Dmg, +5 INT, +3 MAN, +1 LUK." },
    wpn_quartz_channeler: { id: "wpn_quartz_channeler", name: "Quartz Channeler", type: "staff", tier: 4, dmg: 23, bonus: { int: 7, man: 5 }, price: 180, desc: "Arcane surge. 23 Base Dmg, +7 INT, +5 MAN." },

    // Sword & Shield (Warrior)
    wpn_wood_sword_pot_lid: { id: "wpn_wood_sword_pot_lid", name: "Wood Sword & Pot Lid", type: "sword_shield", tier: 1, dmg: 12, bonus: { tou: 1, str: 1 }, price: 20, desc: "Kitchen tested. 12 Base Dmg, +1 TOU, +1 STR." },
    wpn_chipped_sword_buckler: { id: "wpn_chipped_sword_buckler", name: "Chipped Sword & Buckler", type: "sword_shield", tier: 2, dmg: 17, bonus: { tou: 2, str: 1 }, price: 50, desc: "Iron edge. 17 Base Dmg, +2 TOU, +1 STR." },
    wpn_footman_kite_shield: { id: "wpn_footman_kite_shield", name: "Footman Broadsword & Kite", type: "sword_shield", tier: 3, dmg: 22, bonus: { tou: 3, str: 2 }, price: 105, desc: "Solid defense. 22 Base Dmg, +3 TOU, +2 STR." },
    wpn_knight_tower_shield: { id: "wpn_knight_tower_shield", name: "Knight Sword & Tower", type: "sword_shield", tier: 4, dmg: 28, bonus: { tou: 5, str: 3 }, price: 190, desc: "Fortress in hand. 28 Base Dmg, +5 TOU, +3 STR." },

    // 2-Handed (Barbarian)
    wpn_fence_post: { id: "wpn_fence_post", name: "Barbed Fence Post", type: "two_hand", tier: 1, dmg: 14, bonus: { str: 1 }, price: 20, desc: "Pulled from a pasture. 14 Base Dmg, +1 STR." },
    wpn_butcher_cleaver_axe: { id: "wpn_butcher_cleaver_axe", name: "Butcher Cleaver Axe", type: "two_hand", tier: 2, dmg: 20, bonus: { str: 2 }, price: 55, desc: "Heavy chop. 20 Base Dmg, +2 STR." },
    wpn_iron_maul: { id: "wpn_iron_maul", name: "Spiked Iron Maul", type: "two_hand", tier: 3, dmg: 26, bonus: { str: 4, tou: 1 }, price: 110, desc: "Skull crusher. 26 Base Dmg, +4 STR, +1 TOU." },
    wpn_executioner_greataxe: { id: "wpn_executioner_greataxe", name: "Executioner Greataxe", type: "two_hand", tier: 4, dmg: 34, bonus: { str: 6, tou: 2 }, price: 210, desc: "Pure mayhem. 34 Base Dmg, +6 STR, +2 TOU." }
  },

  ARMORS: {
    // Light
    arm_burlap_tunic: { id: "arm_burlap_tunic", name: "Burlap Sack Tunic", type: "light", tier: 1, def: 2, bonus: { dex: 1 }, price: 15, desc: "Itchy potato sack. 2 DEF, +1 DEX." },
    arm_patched_leather: { id: "arm_patched_leather", name: "Patched Leather", type: "light", tier: 2, def: 4, bonus: { dex: 2 }, price: 42, desc: "Supple scraps. 4 DEF, +2 DEX." },
    arm_studded_brigandine: { id: "arm_studded_brigandine", name: "Studded Brigandine", type: "light", tier: 3, def: 7, bonus: { dex: 3, tou: 1 }, price: 90, desc: "Riveted hide. 7 DEF, +3 DEX, +1 TOU." },
    arm_shadow_jerkin: { id: "arm_shadow_jerkin", name: "Shadow Jerkin", type: "light", tier: 4, def: 10, bonus: { dex: 5, luk: 2 }, price: 170, desc: "Silent & deadly. 10 DEF, +5 DEX, +2 LUK." },

    // Robes
    arm_bathrobe: { id: "arm_bathrobe", name: "Plush Bathrobe", type: "robe", tier: 1, def: 1, bonus: { man: 2, int: 1 }, price: 15, desc: "Comfy cotton. 1 DEF, +2 MAN, +1 INT." },
    arm_hedge_cloak: { id: "arm_hedge_cloak", name: "Hedge Cloak", type: "robe", tier: 2, def: 3, bonus: { man: 2, int: 2, luk: 1 }, price: 42, desc: "Smells like moss. 3 DEF, +2 MAN, +2 INT, +1 LUK." },
    arm_star_robes: { id: "arm_star_robes", name: "Star Constellations Robe", type: "robe", tier: 3, def: 5, bonus: { man: 4, int: 3 }, price: 90, desc: "Celestial weave. 5 DEF, +4 MAN, +3 INT." },
    arm_silk_vestments: { id: "arm_silk_vestments", name: "Archmage Silk Vestments", type: "robe", tier: 4, def: 8, bonus: { man: 6, int: 5 }, price: 175, desc: "Radiant silk. 8 DEF, +6 MAN, +5 INT." },

    // Heavy
    arm_barrel_suspenders: { id: "arm_barrel_suspenders", name: "Pickle Barrel", type: "heavy", tier: 1, def: 4, bonus: { tou: 1 }, price: 18, desc: "Oak plank armor. 4 DEF, +1 TOU." },
    arm_rusted_chainmail: { id: "arm_rusted_chainmail", name: "Rusted Chainmail", type: "heavy", tier: 2, def: 7, bonus: { tou: 2, str: 1 }, price: 50, desc: "Clinks loudly. 7 DEF, +2 TOU, +1 STR." },
    arm_banded_cuirass: { id: "arm_banded_cuirass", name: "Banded Cuirass", type: "heavy", tier: 3, def: 10, bonus: { tou: 3, str: 2 }, price: 100, desc: "Polished steel. 10 DEF, +3 TOU, +2 STR." },
    arm_training_plate: { id: "arm_training_plate", name: "Champion Full Plate", type: "heavy", tier: 4, def: 15, bonus: { tou: 5, str: 3 }, price: 195, desc: "Lion-crested plate. 15 DEF, +5 TOU, +3 STR." }
  },

  ITEMS: {
    itm_red_berry_juice: { id: "itm_red_berry_juice", name: "Red Berry Juice", price: 18, effect: "heal_hp", value: 45, desc: "Restores 45 HP in combat." },
    itm_sparkling_blue_water: { id: "itm_sparkling_blue_water", name: "Sparkling Blue Water", price: 18, effect: "heal_mp", value: 30, desc: "Restores 30 MP in combat." },
    itm_grandma_stew: { id: "itm_grandma_stew", name: "Grandma's Stew", price: 32, effect: "heal_both", hp: 40, mp: 20, desc: "Restores 40 HP & 20 MP." },
    itm_greased_lightning: { id: "itm_greased_lightning", name: "Greased Lightning", price: 28, effect: "buff_dodge", value: 25, desc: "+25% Dodge & +15% Crit for 3 turns." },
    itm_pocket_sand: { id: "itm_pocket_sand", name: "Pocket Sand!", price: 24, effect: "stun_enemy", value: 1, desc: "Blinds & stuns the enemy for 1 turn + 8 dmg!" }
  },

  // Skill Pool for Skill Books (All equally likely, player's own class has 2x weight)
  SKILLS: [
    { id: "skl_kidney_poke", name: "Kidney Poke", cls: "rogue", mp: 8, type: "attack", mult: 1.45, critBonus: 25, fx: "fx_blood_hit_splat", desc: "145% weapon dmg with +25% Crit chance." },
    { id: "skl_smoke_bomb", name: "Smoke Trick", cls: "rogue", mp: 10, type: "buff_dodge", val: 30, fx: "fx_dizzy_birds_stun", desc: "+30% Dodge for 2 turns & 10 dmg." },
    { id: "skl_piercing_arrow", name: "Piercing Arrow", cls: "archer", mp: 9, type: "attack_pierce", mult: 1.5, fx: "fx_blood_hit_splat", desc: "150% dmg ignoring 100% of enemy armor." },
    { id: "skl_knee_shot", name: "Arrow to the Knee", cls: "archer", mp: 12, type: "stun_attack", mult: 1.15, fx: "fx_dizzy_birds_stun", desc: "115% dmg and Stuns enemy for 1 turn." },
    { id: "skl_fireball_ish", name: "Fireball-ish", cls: "mage", mp: 12, type: "spell_dmg", base: 24, fx: "fx_fireball_ish", desc: "24 Base Magic Damage (scales with INT)." },
    { id: "skl_arcane_sip", name: "Minor Mend", cls: "mage", mp: 10, type: "spell_heal", base: 28, fx: "fx_fireball_ish", desc: "Heals 28 Base HP (scales with INT)." },
    { id: "skl_thorn_whip", name: "Potted Plant Drop", cls: "druid", mp: 11, type: "spell_dmg", base: 22, fx: "fx_potted_plant", desc: "Drops a heavy fern pot! 22 Base Magic Dmg (scales with INT)." },
    { id: "skl_nature_balm", name: "Turnip Salve", cls: "druid", mp: 11, type: "spell_heal", base: 32, fx: "fx_potted_plant", desc: "Heals 32 Base HP (scales with INT)." },
    { id: "skl_pommel_strike", name: "Pommel Bonk", cls: "warrior", mp: 9, type: "stun_attack", mult: 1.2, fx: "fx_dizzy_birds_stun", desc: "120% dmg and Stuns enemy for 1 turn." },
    { id: "skl_iron_wall", name: "Brace Shield", cls: "warrior", mp: 8, type: "buff_def", val: 12, fx: "fx_blood_hit_splat", desc: "+12 Bonus Armor for 3 turns & heal 12 HP." },
    { id: "skl_headbutt", name: "Skull Headbutt", cls: "barbarian", mp: 10, type: "attack", mult: 1.75, fx: "fx_blood_hit_splat", desc: "Reckless 175% weapon damage!" },
    { id: "skl_war_roar", name: "Terrifying Roar", cls: "barbarian", mp: 9, type: "buff_str", val: 4, fx: "fx_fireball_ish", desc: "+4 STR for this fight & 10 dmg." },
    { id: "skl_belly_flop", name: "Mud Belly Flop", cls: "universal", mp: 8, type: "attack", mult: 1.4, fx: "fx_blood_hit_splat", desc: "140% silly splash damage!" },
    { id: "skl_taunt_dance", name: "Insulting Jig", cls: "universal", mp: 7, type: "stun_attack", mult: 0.9, fx: "fx_dizzy_birds_stun", desc: "Confuses enemy (Stun 1 turn) + 90% dmg." }
  ],

  // Persistent Warrior Spirit Upgrades (Profile-wide)
  UPGRADES: [
    { id: "upg_hp", name: "Iron Belly", maxLevel: 5, baseCost: 5, stepCost: 4, desc: "+15 Starting Max HP per rank." },
    { id: "upg_mp", name: "Tin Foil Hat", maxLevel: 5, baseCost: 5, stepCost: 4, desc: "+10 Starting Max MP per rank." },
    { id: "upg_stats", name: "Muddy Grit", maxLevel: 5, baseCost: 8, stepCost: 6, desc: "+1 to ALL 6 base stats at new game per rank." },
    { id: "upg_gold", name: "Barnaby's Cousin", maxLevel: 5, baseCost: 4, stepCost: 3, desc: "+25 Starting Gold per rank." },
    { id: "upg_xp", name: "Quick Learner", maxLevel: 4, baseCost: 7, stepCost: 5, desc: "+15% XP gained from arena fights per rank." }
  ],

  ENEMY_NAMES: [
    "Muddy Ned", "Turnip Pete", "Barnacle Bob", "Grog the Damp", "Soggy Wanda",
    "Bitey Bertha", "Sir Drops-a-Lot", "Stinky Steve", "Noodle Arms", "Cranky Olga",
    "Sneaky Vex", "Rotten Greg", "Puddle Jumper", "Biscuit Baron", "Mildred the Mean",
    "Tusked Timmy", "Shady Elara", "Clumsy Cedric", "Gravel Tooth", "Big Bertha"
  ]
};

// =========================================================
// js/assets.js — Asset Loader & Edge-Floodfill Transparency
// =========================================================
window.MG = window.MG || {};

MG.Assets = (function () {
  // Exact paths from ASSET_MANIFEST.json
  const MANIFEST = {
    // Backgrounds (opaque)
    bg_start_menu: { path: "assets/backgrounds/bg_start_menu.png", isolate: false },
    bg_char_creator: { path: "assets/backgrounds/bg_char_creator.png", isolate: false },
    bg_training_hub: { path: "assets/backgrounds/bg_training_hub.png", isolate: false },
    bg_arena_mudpit: { path: "assets/backgrounds/bg_arena_mudpit.png", isolate: false },

    // UI Panels & Bars
    panel_wooden_board: { path: "assets/ui/panels_and_bars/panel_wooden_board.png", isolate: true },
    panel_shop_grid_10slot: { path: "assets/ui/panels_and_bars/panel_shop_grid_10slot.png", isolate: true },
    panel_campaign_chalkboard: { path: "assets/ui/panels_and_bars/panel_campaign_chalkboard.png", isolate: true },
    bar_health_green: { path: "assets/ui/panels_and_bars/bar_health_green.png", isolate: true },
    bar_mana_blue: { path: "assets/ui/panels_and_bars/bar_mana_blue.png", isolate: true },
    icon_gold_coin: { path: "assets/ui/panels_and_bars/icon_gold_coin.png", isolate: true },
    icon_warrior_spirit_flame: { path: "assets/ui/panels_and_bars/icon_warrior_spirit_flame.png", isolate: true },

    // UI Buttons
    btn_new_game: { path: "assets/ui/buttons/btn_new_game.png", isolate: true },
    btn_load_game: { path: "assets/ui/buttons/btn_load_game.png", isolate: true },
    btn_options: { path: "assets/ui/buttons/btn_options.png", isolate: true },
    btn_upgrades: { path: "assets/ui/buttons/btn_upgrades.png", isolate: true },
    btn_start_match: { path: "assets/ui/buttons/btn_start_match.png", isolate: true },
    btn_attack: { path: "assets/ui/buttons/btn_attack.png", isolate: true },
    btn_skills: { path: "assets/ui/buttons/btn_skills.png", isolate: true },
    btn_items: { path: "assets/ui/buttons/btn_items.png", isolate: true },
    btn_surrender: { path: "assets/ui/buttons/btn_surrender.png", isolate: true },
    btn_lock_icon: { path: "assets/ui/buttons/btn_lock_icon.png", isolate: true },
    btn_randomize_dice: { path: "assets/ui/buttons/btn_randomize_dice.png", isolate: true },
    btn_draw_face: { path: "assets/ui/buttons/btn_draw_face.png", isolate: true },

    // Bodies
    human_male_body: { path: "assets/characters/bodies/human_male_body.png", isolate: true },
    human_female_body: { path: "assets/characters/bodies/human_female_body.png", isolate: true },
    orc_male_body: { path: "assets/characters/bodies/orc_male_body.png", isolate: true },
    orc_female_body: { path: "assets/characters/bodies/orc_female_body.png", isolate: true },
    darkelf_male_body: { path: "assets/characters/bodies/darkelf_male_body.png", isolate: true },
    darkelf_female_body: { path: "assets/characters/bodies/darkelf_female_body.png", isolate: true },

    // Heads
    head_human_male_smirk: { path: "assets/characters/heads/head_human_male_smirk.png", isolate: true },
    head_human_male_missing_tooth: { path: "assets/characters/heads/head_human_male_missing_tooth.png", isolate: true },
    head_human_female_freckles: { path: "assets/characters/heads/head_human_female_freckles.png", isolate: true },
    head_human_female_determined: { path: "assets/characters/heads/head_human_female_determined.png", isolate: true },
    head_orc_male_tusks: { path: "assets/characters/heads/head_orc_male_tusks.png", isolate: true },
    head_orc_male_bruiser: { path: "assets/characters/heads/head_orc_male_bruiser.png", isolate: true },
    head_orc_female_fierce: { path: "assets/characters/heads/head_orc_female_fierce.png", isolate: true },
    head_darkelf_male_sneer: { path: "assets/characters/heads/head_darkelf_male_sneer.png", isolate: true },
    head_darkelf_female_glowing_eyes: { path: "assets/characters/heads/head_darkelf_female_glowing_eyes.png", isolate: true },
    head_darkelf_female_smirk: { path: "assets/characters/heads/head_darkelf_female_smirk.png", isolate: true },

    // Hairstyles
    hair_mohawk: { path: "assets/characters/customizations/hair_mohawk.png", isolate: true },
    hair_bowlcut: { path: "assets/characters/customizations/hair_bowlcut.png", isolate: true },
    hair_silver_braids: { path: "assets/characters/customizations/hair_silver_braids.png", isolate: true },
    hair_ponytail: { path: "assets/characters/customizations/hair_ponytail.png", isolate: true },

    // NPCs & Bosses
    npc_honest_barnaby: { path: "assets/npcs_and_bosses/npc_honest_barnaby.png", isolate: true },
    boss_drill_sergeant_brock: { path: "assets/npcs_and_bosses/boss_drill_sergeant_brock.png", isolate: true },
    summon_badger: { path: "assets/npcs_and_bosses/summon_badger.png", isolate: true },
    summon_goose: { path: "assets/npcs_and_bosses/summon_goose.png", isolate: true },
    silhouette_mystery_enemy: { path: "assets/npcs_and_bosses/silhouette_mystery_enemy.png", isolate: false },

    // Weapons (20)
    wpn_butter_knife: { path: "assets/equipment/weapons/wpn_butter_knife.png", isolate: true },
    wpn_rusty_shiv: { path: "assets/equipment/weapons/wpn_rusty_shiv.png", isolate: true },
    wpn_footpad_dirk: { path: "assets/equipment/weapons/wpn_footpad_dirk.png", isolate: true },
    wpn_balanced_stiletto: { path: "assets/equipment/weapons/wpn_balanced_stiletto.png", isolate: true },
    wpn_bent_stick_bow: { path: "assets/equipment/weapons/wpn_bent_stick_bow.png", isolate: true },
    wpn_short_hunting_bow: { path: "assets/equipment/weapons/wpn_short_hunting_bow.png", isolate: true },
    wpn_ashwood_recurve: { path: "assets/equipment/weapons/wpn_ashwood_recurve.png", isolate: true },
    wpn_sniper_longbow: { path: "assets/equipment/weapons/wpn_sniper_longbow.png", isolate: true },
    wpn_gnarled_branch: { path: "assets/equipment/weapons/wpn_gnarled_branch.png", isolate: true },
    wpn_apprentice_rod: { path: "assets/equipment/weapons/wpn_apprentice_rod.png", isolate: true },
    wpn_acorn_staff: { path: "assets/equipment/weapons/wpn_acorn_staff.png", isolate: true },
    wpn_quartz_channeler: { path: "assets/equipment/weapons/wpn_quartz_channeler.png", isolate: true },
    wpn_wood_sword_pot_lid: { path: "assets/equipment/weapons/wpn_wood_sword_pot_lid.png", isolate: true },
    wpn_chipped_sword_buckler: { path: "assets/equipment/weapons/wpn_chipped_sword_buckler.png", isolate: true },
    wpn_footman_kite_shield: { path: "assets/equipment/weapons/wpn_footman_kite_shield.png", isolate: true },
    wpn_knight_tower_shield: { path: "assets/equipment/weapons/wpn_knight_tower_shield.png", isolate: true },
    wpn_fence_post: { path: "assets/equipment/weapons/wpn_fence_post.png", isolate: true },
    wpn_butcher_cleaver_axe: { path: "assets/equipment/weapons/wpn_butcher_cleaver_axe.png", isolate: true },
    wpn_iron_maul: { path: "assets/equipment/weapons/wpn_iron_maul.png", isolate: true },
    wpn_executioner_greataxe: { path: "assets/equipment/weapons/wpn_executioner_greataxe.png", isolate: true },

    // Armor (12)
    arm_burlap_tunic: { path: "assets/equipment/armor/arm_burlap_tunic.png", isolate: true },
    arm_patched_leather: { path: "assets/equipment/armor/arm_patched_leather.png", isolate: true },
    arm_studded_brigandine: { path: "assets/equipment/armor/arm_studded_brigandine.png", isolate: true },
    arm_shadow_jerkin: { path: "assets/equipment/armor/arm_shadow_jerkin.png", isolate: true },
    arm_bathrobe: { path: "assets/equipment/armor/arm_bathrobe.png", isolate: true },
    arm_hedge_cloak: { path: "assets/equipment/armor/arm_hedge_cloak.png", isolate: true },
    arm_star_robes: { path: "assets/equipment/armor/arm_star_robes.png", isolate: true },
    arm_silk_vestments: { path: "assets/equipment/armor/arm_silk_vestments.png", isolate: true },
    arm_barrel_suspenders: { path: "assets/equipment/armor/arm_barrel_suspenders.png", isolate: true },
    arm_rusted_chainmail: { path: "assets/equipment/armor/arm_rusted_chainmail.png", isolate: true },
    arm_banded_cuirass: { path: "assets/equipment/armor/arm_banded_cuirass.png", isolate: true },
    arm_training_plate: { path: "assets/equipment/armor/arm_training_plate.png", isolate: true },

    // Items & Potions (5)
    itm_red_berry_juice: { path: "assets/items_and_potions/itm_red_berry_juice.png", isolate: true },
    itm_sparkling_blue_water: { path: "assets/items_and_potions/itm_sparkling_blue_water.png", isolate: true },
    itm_grandma_stew: { path: "assets/items_and_potions/itm_grandma_stew.png", isolate: true },
    itm_greased_lightning: { path: "assets/items_and_potions/itm_greased_lightning.png", isolate: true },
    itm_pocket_sand: { path: "assets/items_and_potions/itm_pocket_sand.png", isolate: true },

    // Skill Books & Combat FX (9)
    book_rogue_archer: { path: "assets/skills_and_fx/book_rogue_archer.png", isolate: true },
    book_mage_druid: { path: "assets/skills_and_fx/book_mage_druid.png", isolate: true },
    book_warrior_barb: { path: "assets/skills_and_fx/book_warrior_barb.png", isolate: true },
    book_silly_universal: { path: "assets/skills_and_fx/book_silly_universal.png", isolate: true },
    fx_dizzy_birds_stun: { path: "assets/skills_and_fx/fx_dizzy_birds_stun.png", isolate: true },
    fx_blood_hit_splat: { path: "assets/skills_and_fx/fx_blood_hit_splat.png", isolate: true },
    fx_fireball_ish: { path: "assets/skills_and_fx/fx_fireball_ish.png", isolate: true },
    fx_white_surrender_flag: { path: "assets/skills_and_fx/fx_white_surrender_flag.png", isolate: true },
    fx_potted_plant: { path: "assets/skills_and_fx/fx_potted_plant.png", isolate: true }
  };

  const cache = {};
  const urlCache = {};

  /**
   * Downscales large AI-generated PNGs to a crisp working size,
   * then flood-fills from edges to remove solid white backgrounds
   * without touching interior white pixels (eyes, teeth, robes).
   */
  function processSprite(img, isolate) {
    const maxDim = isolate ? 256 : 960;
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    if (w > maxDim || h > maxDim) {
      const scale = Math.min(maxDim / w, maxDim / h);
      w = Math.max(1, Math.round(w * scale));
      h = Math.max(1, Math.round(h * scale));
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, w, h);

    if (!isolate) return canvas;

    try {
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const visited = new Uint8Array(w * h);

      const isNearWhite = (idx) => {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        if (a < 20) return true;
        return r > 228 && g > 228 && b > 228;
      };

      const queue = [];
      // Seed all 4 edges
      for (let x = 0; x < w; x++) {
        queue.push(x, (h - 1) * w + x);
      }
      for (let y = 1; y < h - 1; y++) {
        queue.push(y * w, y * w + (w - 1));
      }

      let head = 0;
      while (head < queue.length) {
        const pos = queue[head++];
        if (visited[pos]) continue;
        visited[pos] = 1;
        const pIdx = pos * 4;
        if (!isNearWhite(pIdx)) continue;

        data[pIdx + 3] = 0;
        const x = pos % w;
        const y = (pos - x) / w;
        if (x > 0 && !visited[pos - 1]) queue.push(pos - 1);
        if (x < w - 1 && !visited[pos + 1]) queue.push(pos + 1);
        if (y > 0 && !visited[pos - w]) queue.push(pos - w);
        if (y < h - 1 && !visited[pos + w]) queue.push(pos + w);
      }

      // Soft anti-halo pass on immediate boundary pixels
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const pos = y * w + x;
          const pIdx = pos * 4;
          if (data[pIdx + 3] > 0 && data[pIdx] > 215 && data[pIdx + 1] > 215 && data[pIdx + 2] > 215) {
            if (
              data[(pos - 1) * 4 + 3] === 0 ||
              data[(pos + 1) * 4 + 3] === 0 ||
              data[(pos - w) * 4 + 3] === 0 ||
              data[(pos + w) * 4 + 3] === 0
            ) {
              data[pIdx + 3] = 0;
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      return trimTransparent(canvas);
    } catch (e) {
      // Fallback if tainted on strict file:// browsers
      return canvas;
    }
  }

  function trimTransparent(canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 15) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) return canvas;
    const cw = maxX - minX + 1;
    const ch = maxY - minY + 1;
    const out = document.createElement("canvas");
    out.width = cw;
    out.height = ch;
    out.getContext("2d").drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
    return out;
  }

  function loadAll(onProgress) {
    const keys = Object.keys(MANIFEST);
    let done = 0;
    const total = keys.length;

    return Promise.all(
      keys.map(
        (key) =>
          new Promise((resolve) => {
            const entry = MANIFEST[key];
            const img = new Image();
            img.onload = () => {
              const processed = processSprite(img, entry.isolate);
              cache[key] = processed;
              try {
                urlCache[key] = entry.isolate ? processed.toDataURL("image/png") : entry.path;
              } catch (e) {
                urlCache[key] = entry.path;
              }
              done++;
              if (onProgress) onProgress(done, total, key);
              resolve();
            };
            img.onerror = () => {
              console.warn("Failed to load asset:", entry.path);
              done++;
              if (onProgress) onProgress(done, total, key);
              resolve();
            };
            img.src = entry.path;
          })
      )
    );
  }

  function get(id) {
    return cache[id] || null;
  }

  function getUrl(id) {
    return urlCache[id] || (MANIFEST[id] ? MANIFEST[id].path : "");
  }

  return { loadAll, get, getUrl, MANIFEST };
})();

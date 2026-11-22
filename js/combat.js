// =========================================================
// js/combat.js — Turn-Based Arena Combat & Animations
// =========================================================
window.MG = window.MG || {};

MG.Combat = (function () {
  let state = null;
  let onEndCallback = null;
  let onUiUpdate = null;

  function startMatch(player, bout, callbacks) {
    onEndCallback = callbacks.onEnd;
    onUiUpdate = callbacks.onUiUpdate;

    const pDerived = MG.Character.getDerivedStats(player);
    const eDerived = MG.Character.getDerivedStats(bout.enemy);

    // Restore full HP/MP at start of arena match
    player.hp = pDerived.maxHp;
    player.mp = pDerived.maxMp;
    bout.enemy.hp = eDerived.maxHp;
    bout.enemy.mp = eDerived.maxMp;

    state = {
      boutIndex: bout.index,
      player,
      enemy: bout.enemy,
      turn: "player", // 'player' | 'anim' | 'enemy' | 'over'
      round: 1,
      log: `Bout #${bout.index + 1}: ${player.name} vs ${bout.enemy.name}!`,
      pBuffs: { stun: 0, dodgeBonus: 0, dodgeTurns: 0, defBonus: 0, defTurns: 0, strBonus: 0, focused: false, specialUsed: false },
      eBuffs: { stun: 0, dodgeBonus: 0, dodgeTurns: 0, defBonus: 0, defTurns: 0, strBonus: 0, focused: false, specialUsed: false },
      summon: null, // { id: 'summon_badger'|'summon_goose', name, dmg, turns }
      pAnim: { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, swingAngle: 0, stunned: false },
      eAnim: { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, swingAngle: 0, stunned: false },
      fxList: [], // { spriteId, x, y, vx, vy, scale, life, maxLife }
      floatTexts: [], // { text, x, y, color, life }
      surrendered: false
    };

    if (onUiUpdate) onUiUpdate(state);
  }

  function getState() {
    return state;
  }

  function addFloatText(text, isPlayerSide, color = "#ffd447") {
    if (!state) return;
    state.floatTexts.push({
      text,
      x: isPlayerSide ? 245 : 715,
      y: 235 + (Math.random() * 24 - 12),
      color,
      life: 1.15
    });
  }

  function spawnFx(spriteId, x, y, life = 0.55, vx = 0, vy = 0, scale = 1) {
    if (!state) return;
    state.fxList.push({ spriteId, x, y, vx, vy, scale, life, maxLife: life });
  }

  function computeAttack(attacker, defender, aBuffs, dBuffs, options = {}) {
    const aDer = MG.Character.getDerivedStats(attacker);
    const dDer = MG.Character.getDerivedStats(defender);

    // Dodge check
    let dodge = dDer.dodgeChance + (dBuffs.dodgeTurns > 0 ? dBuffs.dodgeBonus : 0);
    if (options.berserkHit) {
      // Defender gets +10% of current dodge added to avoid chance
      dodge += dDer.dodgeChance * 0.1;
    }
    if (!options.unavoidable && Math.random() * 100 < dodge) {
      return { dodged: true, dmg: 0, crit: false };
    }

    const strMod = 1 + (aDer.eff.str + (aBuffs.strBonus || 0) - 10) * 0.1;
    let raw = aDer.baseWpnDmg * Math.max(0.2, strMod) * (options.mult || 1.0);

    // Crit check
    const critRoll = options.forceCrit || Math.random() * 100 < aDer.critChance + (options.critBonus || 0);
    if (critRoll) {
      // Rogue gets double critical damage!
      const critMult = attacker.cls === "rogue" ? 5.0 : 2.5;
      raw *= critMult;
    }

    // Armor mitigation
    let def = dDer.armorDef + (dBuffs.defTurns > 0 ? dBuffs.defBonus : 0);
    if (options.ignoreArmorPct) {
      def = def * (1 - options.ignoreArmorPct);
    } else if (attacker.equippedWeapon && attacker.equippedWeapon.type === "bow" && attacker.cls === "archer") {
      // Archer arrows pierce 50% of all armor
      def = def * 0.5;
    }

    const dmg = Math.max(1, Math.round(raw - def));
    return { dodged: false, dmg, crit: critRoll };
  }

  function animateRush(isPlayer, onImpact, onDone) {
    if (!state) return;
    const anim = isPlayer ? state.pAnim : state.eAnim;
    const targetAnim = isPlayer ? state.eAnim : state.pAnim;
    const dir = isPlayer ? 1 : -1;
    const start = performance.now();
    const dur = 520;

    function step(now) {
      if (!state) return;
      const t = Math.min(1, (now - start) / dur);
      if (t < 0.45) {
        const p = t / 0.45;
        anim.offsetX = dir * 340 * p;
        anim.offsetY = -Math.sin(p * Math.PI) * 32;
        anim.swingAngle = dir * (-0.5 + p * 1.4);
      } else if (t < 0.55) {
        if (!anim._impacted) {
          anim._impacted = true;
          onImpact();
          targetAnim.scaleX = 1.15;
          targetAnim.scaleY = 0.85;
        }
      } else {
        const p = (t - 0.55) / 0.45;
        anim.offsetX = dir * 340 * (1 - p);
        anim.offsetY = -Math.sin(p * Math.PI) * 20;
        anim.swingAngle = dir * 0.9 * (1 - p);
        targetAnim.scaleX = 1 + 0.15 * (1 - p);
        targetAnim.scaleY = 1 - 0.15 * (1 - p);
      }

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        anim.offsetX = 0;
        anim.offsetY = 0;
        anim.swingAngle = 0;
        anim._impacted = false;
        targetAnim.scaleX = 1;
        targetAnim.scaleY = 1;
        onDone();
      }
    }
    requestAnimationFrame(step);
  }

  function animateRangedOrSpell(isPlayer, spriteId, onImpact, onDone) {
    if (!state) return;
    const anim = isPlayer ? state.pAnim : state.eAnim;
    const startX = isPlayer ? 270 : 690;
    const endX = isPlayer ? 700 : 260;
    const start = performance.now();
    const dur = 420;

    anim.scaleY = 1.12;
    spawnFx(spriteId, startX, 310, 0.42, (endX - startX) / 0.42, 0, 0.75);

    function step(now) {
      if (!state) return;
      const t = Math.min(1, (now - start) / dur);
      if (t >= 1) {
        anim.scaleY = 1;
        onImpact();
        onDone();
      } else {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function playerBasicAttack() {
    if (!state || state.turn !== "player") return;
    state.turn = "anim";
    const isBow = state.player.equippedWeapon && state.player.equippedWeapon.type === "bow";

    const executeHit = () => {
      const res = computeAttack(state.player, state.enemy, state.pBuffs, state.eBuffs);
      if (res.dodged) {
        MG.Audio.playSfx("dodge");
        state.log = `${state.enemy.name} dodged ${state.player.name}'s attack!`;
        addFloatText("DODGE!", false, "#93c5fd");
      } else {
        state.enemy.hp = Math.max(0, state.enemy.hp - res.dmg);
        MG.Audio.playSfx(res.crit ? "crit" : isBow ? "bow" : "hit");
        spawnFx("fx_blood_hit_splat", 715, 310, 0.45, 0, 0, res.crit ? 1.2 : 0.85);
        addFloatText(res.crit ? `CRIT -${res.dmg}!` : `-${res.dmg}`, false, res.crit ? "#ff4d4d" : "#ffd447");
        state.log = `${state.player.name} strikes ${state.enemy.name} for ${res.dmg} dmg${res.crit ? " (CRITICAL!)" : ""}!`;
      }
      if (onUiUpdate) onUiUpdate(state);
    };

    if (isBow) {
      MG.Audio.playSfx("bow");
      animateRangedOrSpell(true, "fx_blood_hit_splat", executeHit, afterPlayerAction);
    } else {
      animateRush(true, executeHit, afterPlayerAction);
    }
  }

  function playerUseClassSpecial() {
    if (!state || state.turn !== "player") return;
    const cls = MG.Data.CLASSES[state.player.cls];
    if (cls.oncePerFight && state.pBuffs.specialUsed) {
      MG.UI.toast(`${cls.specialName} already used this fight!`);
      return;
    }
    if (state.player.mp < cls.specialCost) {
      MG.UI.toast("Not enough MP!");
      return;
    }

    state.player.mp -= cls.specialCost;
    state.turn = "anim";

    if (cls.id === "rogue") {
      state.pBuffs.specialUsed = true;
      animateRush(true, () => {
        const res = computeAttack(state.player, state.enemy, state.pBuffs, state.eBuffs, {
          unavoidable: true,
          forceCrit: true
        });
        state.enemy.hp = Math.max(0, state.enemy.hp - res.dmg);
        MG.Audio.playSfx("crit");
        spawnFx("fx_blood_hit_splat", 715, 310, 0.55, 0, 0, 1.3);
        addFloatText(`BACKSTAB -${res.dmg}!`, false, "#ff3b3b");
        state.log = `${state.player.name} uses BACKSTAB! Unavoidable ${res.dmg} critical damage!`;
        if (onUiUpdate) onUiUpdate(state);
      }, afterPlayerAction);
    } else if (cls.id === "archer") {
      state.pBuffs.specialUsed = true;
      MG.Audio.playSfx("bow");
      animateRangedOrSpell(true, "fx_blood_hit_splat", () => {
        const res = computeAttack(state.player, state.enemy, state.pBuffs, state.eBuffs);
        if (!res.dodged) {
          state.enemy.hp = Math.max(0, state.enemy.hp - res.dmg);
          addFloatText(`-${res.dmg}`, false, "#ffd447");
          state.log = `Quick Volley! ${res.dmg} dmg — AND ${state.player.name} gets a BONUS ACTION!`;
        } else {
          addFloatText("DODGE!", false, "#93c5fd");
          state.log = `Quick Volley missed, but ${state.player.name} still gets a BONUS ACTION!`;
        }
        if (onUiUpdate) onUiUpdate(state);
      }, () => {
        // Bonus action: stay on player turn if enemy is alive!
        if (state.enemy.hp <= 0) {
          endFight(true);
        } else {
          state.turn = "player";
          if (onUiUpdate) onUiUpdate(state);
        }
      });
    } else if (cls.id === "mage") {
      state.pBuffs.focused = true;
      MG.Audio.playSfx("spell");
      spawnFx("fx_fireball_ish", 245, 290, 0.5, 0, -40, 0.9);
      addFloatText("FOCUS 2x!", true, "#60a5fa");
      state.log = `${state.player.name} channels Arcane Focus! Next spell deals 2x effect!`;
      setTimeout(afterPlayerAction, 450);
    } else if (cls.id === "druid") {
      const isBadger = Math.random() < 0.5;
      const der = MG.Character.getDerivedStats(state.player);
      const dmg = Math.round(11 * der.intMult);
      state.summon = {
        id: isBadger ? "summon_badger" : "summon_goose",
        name: isBadger ? "Grumpy Badger" : "Angry Goose",
        dmg,
        turns: 4
      };
      MG.Audio.playSfx("spell");
      addFloatText(`SUMMON ${state.summon.name.toUpperCase()}!`, true, "#4ade80");
      state.log = `${state.player.name} summons a ${state.summon.name} (${dmg} dmg/turn)!`;
      setTimeout(afterPlayerAction, 500);
    } else if (cls.id === "warrior") {
      animateRush(true, () => {
        const res = computeAttack(state.player, state.enemy, state.pBuffs, state.eBuffs, { mult: 1.5 });
        if (res.dodged) {
          MG.Audio.playSfx("dodge");
          addFloatText("DODGE!", false, "#93c5fd");
          state.log = `Shield Bash missed!`;
        } else {
          state.enemy.hp = Math.max(0, state.enemy.hp - res.dmg);
          state.eBuffs.stun = 1;
          state.eAnim.stunned = true;
          MG.Audio.playSfx("stun");
          spawnFx("fx_dizzy_birds_stun", 715, 210, 0.6, 0, 0, 1.0);
          addFloatText(`BASH -${res.dmg} STUN!`, false, "#facc15");
          state.log = `Shield Bash! ${res.dmg} dmg & ${state.enemy.name} is STUNNED!`;
        }
        if (onUiUpdate) onUiUpdate(state);
      }, afterPlayerAction);
    } else if (cls.id === "barbarian") {
      // Berserker: 3 attacks this round (defender gets +10% of current dodge added)
      let hitsDone = 0;
      const doHit = () => {
        if (!state || state.enemy.hp <= 0 || hitsDone >= 3) {
          afterPlayerAction();
          return;
        }
        hitsDone++;
        animateRush(true, () => {
          const res = computeAttack(state.player, state.enemy, state.pBuffs, state.eBuffs, { berserkHit: true });
          if (res.dodged) {
            MG.Audio.playSfx("dodge");
            addFloatText("DODGE!", false, "#93c5fd");
          } else {
            state.enemy.hp = Math.max(0, state.enemy.hp - res.dmg);
            MG.Audio.playSfx(res.crit ? "crit" : "hit");
            spawnFx("fx_blood_hit_splat", 715, 310, 0.4, 0, 0, 0.9);
            addFloatText(`#${hitsDone} -${res.dmg}`, false, "#fb923c");
          }
          state.log = `BERSERKER flurry (${hitsDone}/3)!`;
          if (onUiUpdate) onUiUpdate(state);
        }, doHit);
      };
      doHit();
    }
  }

  function playerUseSkill(skill) {
    if (!state || state.turn !== "player") return;
    if (state.player.mp < skill.mp) {
      MG.UI.toast("Not enough MP!");
      return;
    }
    state.player.mp -= skill.mp;
    state.turn = "anim";

    const pDer = MG.Character.getDerivedStats(state.player);
    const focusMult = state.pBuffs.focused ? 2.0 : 1.0;

    if (skill.type === "spell_dmg") {
      state.pBuffs.focused = false;
      MG.Audio.playSfx("spell");
      animateRangedOrSpell(true, skill.fx || "fx_fireball_ish", () => {
        let dmg = Math.round(skill.base * pDer.intMult * focusMult);
        if (state.enemy.cls === "mage") dmg = Math.round(dmg * 0.5);
        state.enemy.hp = Math.max(0, state.enemy.hp - dmg);
        addFloatText(`-${dmg} MAGIC`, false, "#c084fc");
        state.log = `${state.player.name} casts ${skill.name} for ${dmg} magic damage!`;
        if (onUiUpdate) onUiUpdate(state);
      }, afterPlayerAction);
    } else if (skill.type === "spell_heal") {
      state.pBuffs.focused = false;
      const heal = Math.round(skill.base * pDer.intMult * focusMult);
      state.player.hp = Math.min(pDer.maxHp, state.player.hp + heal);
      MG.Audio.playSfx("heal");
      addFloatText(`+${heal} HP`, true, "#4ade80");
      state.log = `${state.player.name} casts ${skill.name} and heals ${heal} HP!`;
      setTimeout(afterPlayerAction, 480);
    } else if (skill.type === "buff_dodge") {
      state.pBuffs.dodgeBonus = skill.val;
      state.pBuffs.dodgeTurns = 2;
      state.enemy.hp = Math.max(0, state.enemy.hp - 10);
      MG.Audio.playSfx("spell");
      addFloatText(`+${skill.val}% DODGE`, true, "#60a5fa");
      state.log = `${skill.name}! +${skill.val}% Dodge & 10 dmg!`;
      setTimeout(afterPlayerAction, 480);
    } else if (skill.type === "buff_def") {
      state.pBuffs.defBonus = skill.val;
      state.pBuffs.defTurns = 3;
      state.player.hp = Math.min(pDer.maxHp, state.player.hp + 12);
      MG.Audio.playSfx("heal");
      addFloatText(`+${skill.val} DEF`, true, "#fbbf24");
      state.log = `${skill.name}! +${skill.val} Armor & +12 HP!`;
      setTimeout(afterPlayerAction, 480);
    } else if (skill.type === "buff_str") {
      state.pBuffs.strBonus += skill.val;
      state.enemy.hp = Math.max(0, state.enemy.hp - 10);
      MG.Audio.playSfx("crit");
      addFloatText(`+${skill.val} STR`, true, "#fb923c");
      state.log = `${skill.name}! +${skill.val} STR & 10 dmg!`;
      setTimeout(afterPlayerAction, 480);
    } else {
      // attack / attack_pierce / stun_attack
      animateRush(true, () => {
        const res = computeAttack(state.player, state.enemy, state.pBuffs, state.eBuffs, {
          mult: skill.mult || 1.2,
          critBonus: skill.critBonus || 0,
          ignoreArmorPct: skill.type === "attack_pierce" ? 1.0 : 0
        });
        if (res.dodged) {
          MG.Audio.playSfx("dodge");
          addFloatText("DODGE!", false, "#93c5fd");
          state.log = `${skill.name} was dodged!`;
        } else {
          state.enemy.hp = Math.max(0, state.enemy.hp - res.dmg);
          if (skill.type === "stun_attack") {
            state.eBuffs.stun = 1;
            state.eAnim.stunned = true;
            MG.Audio.playSfx("stun");
          } else {
            MG.Audio.playSfx(res.crit ? "crit" : "hit");
          }
          spawnFx(skill.fx || "fx_blood_hit_splat", 715, 300, 0.5);
          addFloatText(`-${res.dmg}`, false, "#f87171");
          state.log = `${skill.name}! ${res.dmg} dmg${skill.type === "stun_attack" ? " & STUNNED!" : "!"}`;
        }
        if (onUiUpdate) onUiUpdate(state);
      }, afterPlayerAction);
    }
  }

  function playerUseItem(invIndex) {
    if (!state || state.turn !== "player") return;
    const entry = state.player.inventory[invIndex];
    if (!entry || entry.kind !== "item" || entry.qty <= 0) return;
    const itm = entry.item;
    const der = MG.Character.getDerivedStats(state.player);

    entry.qty--;
    if (entry.qty <= 0) state.player.inventory.splice(invIndex, 1);

    state.turn = "anim";
    if (itm.effect === "heal_hp") {
      state.player.hp = Math.min(der.maxHp, state.player.hp + itm.value);
      MG.Audio.playSfx("heal");
      addFloatText(`+${itm.value} HP`, true, "#4ade80");
      state.log = `Drank ${itm.name}! Restored ${itm.value} HP.`;
    } else if (itm.effect === "heal_mp") {
      state.player.mp = Math.min(der.maxMp, state.player.mp + itm.value);
      MG.Audio.playSfx("heal");
      addFloatText(`+${itm.value} MP`, true, "#60a5fa");
      state.log = `Drank ${itm.name}! Restored ${itm.value} MP.`;
    } else if (itm.effect === "heal_both") {
      state.player.hp = Math.min(der.maxHp, state.player.hp + itm.hp);
      state.player.mp = Math.min(der.maxMp, state.player.mp + itm.mp);
      MG.Audio.playSfx("heal");
      addFloatText(`+${itm.hp}HP +${itm.mp}MP`, true, "#4ade80");
      state.log = `Ate ${itm.name}! Restored ${itm.hp} HP & ${itm.mp} MP.`;
    } else if (itm.effect === "buff_dodge") {
      state.pBuffs.dodgeBonus = itm.value;
      state.pBuffs.dodgeTurns = 3;
      MG.Audio.playSfx("spell");
      addFloatText(`+${itm.value}% DODGE!`, true, "#facc15");
      state.log = `Used ${itm.name}! +${itm.value}% Dodge for 3 turns.`;
    } else if (itm.effect === "stun_enemy") {
      state.eBuffs.stun = 1;
      state.eAnim.stunned = true;
      state.enemy.hp = Math.max(0, state.enemy.hp - 8);
      MG.Audio.playSfx("stun");
      spawnFx("fx_dizzy_birds_stun", 715, 220, 0.6);
      addFloatText("POCKET SAND! STUN!", false, "#facc15");
      state.log = `POCKET SAND! ${state.enemy.name} takes 8 dmg and is STUNNED!`;
    }

    if (onUiUpdate) onUiUpdate(state);
    setTimeout(afterPlayerAction, 500);
  }

  function playerSurrender() {
    if (!state || state.turn !== "player") return;
    state.turn = "over";
    state.surrendered = true;
    spawnFx("fx_white_surrender_flag", 245, 220, 1.2);
    state.log = `${state.player.name} waved the white flag and fled the Mud Pit!`;
    if (onUiUpdate) onUiUpdate(state);
    setTimeout(() => {
      const cb = onEndCallback;
      state = null;
      if (cb) cb({ outcome: "surrender" });
    }, 950);
  }

  function afterPlayerAction() {
    if (!state) return;
    if (state.enemy.hp <= 0) {
      endFight(true);
      return;
    }

    // Companion attack if Druid summoned one!
    if (state.summon && state.summon.turns > 0) {
      state.summon.turns--;
      state.enemy.hp = Math.max(0, state.enemy.hp - state.summon.dmg);
      MG.Audio.playSfx("hit");
      spawnFx("fx_blood_hit_splat", 715, 325, 0.4, 0, 0, 0.7);
      addFloatText(`${state.summon.name} -${state.summon.dmg}`, false, "#4ade80");
      state.log = `${state.summon.name} bites ${state.enemy.name} for ${state.summon.dmg} dmg!`;
      if (state.summon.turns <= 0) state.summon = null;
      if (onUiUpdate) onUiUpdate(state);
      if (state.enemy.hp <= 0) {
        setTimeout(() => endFight(true), 450);
        return;
      }
      setTimeout(runEnemyTurn, 480);
    } else {
      runEnemyTurn();
    }
  }

  function runEnemyTurn() {
    if (!state) return;
    state.turn = "enemy";

    // Tick enemy buffs
    if (state.eBuffs.stun > 0) {
      state.eBuffs.stun--;
      state.eAnim.stunned = false;
      MG.Audio.playSfx("stun");
      addFloatText("STUNNED!", false, "#facc15");
      state.log = `${state.enemy.name} is dizzy and loses their turn!`;
      if (onUiUpdate) onUiUpdate(state);
      setTimeout(beginNextPlayerRound, 600);
      return;
    }

    const useSkill = state.enemy.skills && state.enemy.skills.length > 0 && state.enemy.mp >= 12 && Math.random() < 0.28;
    if (useSkill) {
      const sk = state.enemy.skills[0];
      state.enemy.mp -= sk.mp;
      animateRush(false, () => {
        const res = computeAttack(state.enemy, state.player, state.eBuffs, state.pBuffs, { mult: 1.25 });
        if (res.dodged) {
          MG.Audio.playSfx("dodge");
          addFloatText("DODGE!", true, "#93c5fd");
          state.log = `${state.player.name} dodged ${state.enemy.name}'s ${sk.name}!`;
        } else {
          let dmg = res.dmg;
          if (state.player.cls === "mage" && sk.type === "spell_dmg") dmg = Math.round(dmg * 0.5);
          state.player.hp = Math.max(0, state.player.hp - dmg);
          MG.Audio.playSfx("hit");
          spawnFx("fx_blood_hit_splat", 245, 310, 0.45);
          addFloatText(`-${dmg}`, true, "#ef4444");
          state.log = `${state.enemy.name} uses ${sk.name} for ${dmg} dmg!`;
        }
        if (onUiUpdate) onUiUpdate(state);
      }, () => {
        if (state.player.hp <= 0) endFight(false);
        else beginNextPlayerRound();
      });
    } else {
      animateRush(false, () => {
        const res = computeAttack(state.enemy, state.player, state.eBuffs, state.pBuffs);
        if (res.dodged) {
          MG.Audio.playSfx("dodge");
          addFloatText("DODGE!", true, "#93c5fd");
          state.log = `${state.player.name} dodged ${state.enemy.name}'s attack!`;
        } else {
          state.player.hp = Math.max(0, state.player.hp - res.dmg);
          MG.Audio.playSfx(res.crit ? "crit" : "hit");
          spawnFx("fx_blood_hit_splat", 245, 310, 0.45);
          addFloatText(res.crit ? `CRIT -${res.dmg}!` : `-${res.dmg}`, true, "#ef4444");
          state.log = `${state.enemy.name} hits ${state.player.name} for ${res.dmg} dmg!`;
        }
        if (onUiUpdate) onUiUpdate(state);
      }, () => {
        if (state.player.hp <= 0) endFight(false);
        else beginNextPlayerRound();
      });
    }
  }

  function beginNextPlayerRound() {
    if (!state) return;
    state.round++;
    if (state.pBuffs.dodgeTurns > 0) state.pBuffs.dodgeTurns--;
    if (state.pBuffs.defTurns > 0) state.pBuffs.defTurns--;
    state.turn = "player";
    if (onUiUpdate) onUiUpdate(state);
  }

  function endFight(playerWon) {
    if (!state) return;
    state.turn = "over";
    const boutIdx = state.boutIndex;
    const player = state.player;

    if (playerWon) {
      MG.Audio.playSfx("victory");
      const profile = MG.Storage.getProfile();
      const xpBonus = 1 + (profile.upgrades.upg_xp || 0) * 0.15;
      const der = MG.Character.getDerivedStats(player);

      const goldDrop = Math.round((15 + boutIdx * 9 + Math.random() * 10) * (1 + der.eff.luk * 0.02));
      const xpGain = Math.round((22 + boutIdx * 10) * xpBonus);

      // Luck drop odds: baseChance * (1 + 0.05 * LUK * (druid ? 2 : 1))
      const drops = [];
      const potionChance = 0.28 * der.luckMult;
      const equipChance = 0.22 * der.luckMult;
      const bookChance = 0.25 * der.luckMult;

      if (Math.random() < potionChance) {
        const allItems = Object.values(MG.Data.ITEMS);
        const itm = JSON.parse(JSON.stringify(allItems[Math.floor(Math.random() * allItems.length)]));
        drops.push({ kind: "item", item: itm });
      }
      if (Math.random() < equipChance) {
        const tier = Math.min(4, 1 + Math.floor(boutIdx / 5));
        if (Math.random() < 0.5) {
          const pool = Object.values(MG.Data.WEAPONS).filter((w) => w.tier <= tier);
          const wpn = JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)]));
          if (player.cls === "barbarian") {
            wpn.dmg = Math.round(wpn.dmg * 1.2);
            wpn.barbBoosted = true;
          }
          drops.push({ kind: "weapon", item: wpn });
        } else {
          const pool = Object.values(MG.Data.ARMORS).filter((a) => a.tier <= tier);
          const arm = JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)]));
          drops.push({ kind: "armor", item: arm });
        }
      }
      let gotSkillBook = false;
      if (Math.random() < bookChance || boutIdx === 20) {
        gotSkillBook = true;
      }

      setTimeout(() => {
        const cb = onEndCallback;
        state = null;
        if (cb) {
          cb({
            outcome: "win",
            boutIndex: boutIdx,
            goldDrop,
            xpGain,
            drops,
            gotSkillBook
          });
        }
      }, 900);
    } else {
      MG.Audio.playSfx("defeat");
      const spiritEarned = 5 + 2 * (player.wins || 0);
      setTimeout(() => {
        const cb = onEndCallback;
        state = null;
        if (cb) {
          cb({
            outcome: "death",
            spiritEarned
          });
        }
      }, 1100);
    }
  }

  function drawCombatScene(ctx, dt) {
    if (!state) return;

    // Draw Player (Left) & Enemy (Right) strictly front-facing
    MG.Character.drawCharacter(ctx, state.player, 245, 415, 195, state.pAnim);
    MG.Character.drawCharacter(ctx, state.enemy, 715, 415, 195, state.eAnim);

    // Draw Druid Summon beside player
    if (state.summon) {
      const sumSpr = MG.Assets.get(state.summon.id);
      if (sumSpr) {
        const bob = Math.sin(Date.now() * 0.008) * 4;
        const sh = 95;
        const sw = (sumSpr.width / sumSpr.height) * sh;
        ctx.drawImage(sumSpr, 110 - sw / 2, 420 - sh + bob, sw, sh);
      }
    }

    // Update & Draw FX
    for (let i = state.fxList.length - 1; i >= 0; i--) {
      const f = state.fxList[i];
      f.life -= dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.life <= 0) {
        state.fxList.splice(i, 1);
        continue;
      }
      const spr = MG.Assets.get(f.spriteId);
      if (spr) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, f.life / (f.maxLife * 0.4));
        const sz = 92 * (f.scale || 1);
        const w = (spr.width / spr.height) * sz;
        ctx.drawImage(spr, f.x - w / 2, f.y - sz / 2, w, sz);
        ctx.restore();
      }
    }

    // Update & Draw Floating Combat Texts
    ctx.save();
    ctx.font = "bold 20px 'Courier New', monospace";
    ctx.textAlign = "center";
    for (let i = state.floatTexts.length - 1; i >= 0; i--) {
      const ft = state.floatTexts[i];
      ft.life -= dt;
      ft.y -= 36 * dt;
      if (ft.life <= 0) {
        state.floatTexts.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.min(1, ft.life * 1.5);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#000";
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }

  return {
    startMatch,
    getState,
    playerBasicAttack,
    playerUseClassSpecial,
    playerUseSkill,
    playerUseItem,
    playerSurrender,
    drawCombatScene
  };
})();

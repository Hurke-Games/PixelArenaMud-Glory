// =========================================================
// js/ui.js — All Screens, Modals, Shop, Creator & Pixel Face
// =========================================================
window.MG = window.MG || {};

MG.UI = (function () {
  const overlay = () => document.getElementById("ui-overlay");
  const modalBackdrop = () => document.getElementById("modal-backdrop");
  const modalContent = () => document.getElementById("modal-content");
  const toastContainer = () => document.getElementById("toast-container");

  let currentScreen = "start";
  let gameState = null; // { slotIndex, player, campaign, shop, winsSinceRefresh }
  let creatorDraft = null;
  let listeningKeyAction = null;

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast-msg";
    el.textContent = msg;
    toastContainer().appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function closeModal() {
    listeningKeyAction = null;
    modalBackdrop().classList.add("hidden");
    modalContent().innerHTML = "";
  }

  function openModal(html) {
    modalContent().innerHTML = html;
    modalBackdrop().classList.remove("hidden");
  }

  function getScreen() {
    return currentScreen;
  }

  function getGameState() {
    return gameState;
  }

  function getCreatorDraft() {
    return creatorDraft;
  }

  // ---------------- START MENU ----------------
  function showStartMenu() {
    currentScreen = "start";
    closeModal();
    const profile = MG.Storage.getProfile();
    overlay().innerHTML = `
      <div class="start-menu-wrap">
        <div class="hud-top-bar" style="width:100%; border-radius:6px;">
          <div class="hud-pill">
            <img src="${MG.Assets.getUrl("icon_warrior_spirit_flame")}" alt="Spirit"/>
            <span>Warrior Spirit: ${profile.warriorSpirit}</span>
          </div>
          <div style="font-size:12px; color:#f3c88b;">PC Keyboard &amp; Android Touch Ready</div>
        </div>

        <div class="game-logo-banner">
          <h1 class="pixel-title">MUD &amp; GLORY</h1>
          <div class="subtitle" style="margin-bottom:0;">ARENA FIGHTER</div>
        </div>

        <div class="start-buttons-col">
          <button class="img-btn" id="m-new"><img src="${MG.Assets.getUrl("btn_new_game")}" alt="New Game"/></button>
          <button class="img-btn" id="m-load"><img src="${MG.Assets.getUrl("btn_load_game")}" alt="Load Game"/></button>
          <button class="img-btn" id="m-opt"><img src="${MG.Assets.getUrl("btn_options")}" alt="Options"/></button>
          <button class="img-btn" id="m-upg"><img src="${MG.Assets.getUrl("btn_upgrades")}" alt="Upgrades"/></button>
        </div>
      </div>
    `;

    document.getElementById("m-new").onclick = () => {
      MG.Audio.unlock();
      MG.Audio.playSfx("click");
      showCharCreator();
    };
    document.getElementById("m-load").onclick = () => {
      MG.Audio.unlock();
      MG.Audio.playSfx("click");
      openLoadModal();
    };
    document.getElementById("m-opt").onclick = () => {
      MG.Audio.unlock();
      MG.Audio.playSfx("click");
      openOptionsModal();
    };
    document.getElementById("m-upg").onclick = () => {
      MG.Audio.unlock();
      MG.Audio.playSfx("click");
      openUpgradesModal();
    };
  }

  // ---------------- LOAD / SAVE MODAL ----------------
  function openLoadModal() {
    const slots = MG.Storage.listSlots();
    const cards = slots
      .map((s, idx) => {
        if (!s || !s.state || !s.state.player) {
          return `
            <div class="wooden-box" style="padding:10px; text-align:center;">
              <div style="font-weight:bold; color:var(--gold);">Slot ${idx + 1} — Empty</div>
              <p style="font-size:12px; opacity:0.7;">No gladiator saved here.</p>
            </div>
          `;
        }
        const p = s.state.player;
        const clsName = MG.Data.CLASSES[p.cls]?.name || p.cls;
        const raceName = MG.Data.RACES[p.race]?.name || p.race;
        return `
          <div class="wooden-box" style="padding:10px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
            <div>
              <div style="font-weight:bold; color:var(--gold);">Slot ${idx + 1}: ${p.name}</div>
              <div style="font-size:12px;">Lv.${p.level} ${raceName} ${clsName} | Wins: ${p.wins}/21 | Gold: ${p.gold}</div>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="px-btn success small load-slot-btn" data-slot="${idx}">Load</button>
              <button class="px-btn primary small del-slot-btn" data-slot="${idx}">Delete</button>
            </div>
          </div>
        `;
      })
      .join("");

    openModal(`
      <div class="modal-header">
        <h2>LOAD GAME (3 SLOTS)</h2>
        <button class="px-btn small" id="modal-close-btn">Close</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:10px;">${cards}</div>
    `);

    document.getElementById("modal-close-btn").onclick = closeModal;
    document.querySelectorAll(".load-slot-btn").forEach((btn) => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.slot);
        const loaded = MG.Storage.loadGame(idx);
        if (loaded && loaded.state) {
          gameState = loaded.state;
          gameState.slotIndex = idx;
          MG.Audio.playSfx("click");
          closeModal();
          showTrainingHub();
        }
      };
    });
    document.querySelectorAll(".del-slot-btn").forEach((btn) => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.slot);
        MG.Storage.deleteGame(idx);
        openLoadModal();
      };
    });
  }

  function openSaveModal() {
    const slots = MG.Storage.listSlots();
    const cards = slots
      .map((s, idx) => {
        const info = s && s.state && s.state.player
          ? `${s.state.player.name} (Lv.${s.state.player.level}, ${s.state.player.wins} Wins)`
          : "Empty Slot";
        return `
          <div class="wooden-box" style="padding:10px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="color:var(--gold);">Slot ${idx + 1}</strong>
              <div style="font-size:12px;">${info}</div>
            </div>
            <button class="px-btn success small save-slot-btn" data-slot="${idx}">Save Here</button>
          </div>
        `;
      })
      .join("");

    openModal(`
      <div class="modal-header">
        <h2>SAVE GLADIATOR</h2>
        <button class="px-btn small" id="modal-close-btn">Close</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px;">${cards}</div>
    `);
    document.getElementById("modal-close-btn").onclick = closeModal;
    document.querySelectorAll(".save-slot-btn").forEach((b) => {
      b.onclick = () => {
        const idx = Number(b.dataset.slot);
        gameState.slotIndex = idx;
        MG.Storage.saveGame(idx, gameState);
        MG.Audio.playSfx("coin");
        toast(`Saved to Slot ${idx + 1}!`);
        closeModal();
      };
    });
  }

  // ---------------- OPTIONS MODAL ----------------
  function openOptionsModal() {
    const opts = MG.Storage.getOptions();
    const kb = opts.keybindings;
    const kbRows = Object.entries(kb)
      .map(
        ([action, key]) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.1);">
          <span style="text-transform:uppercase; font-size:12px;">${action}</span>
          <button class="px-btn small kb-bind-btn" data-action="${action}">${key}</button>
        </div>`
      )
      .join("");

    openModal(`
      <div class="modal-header">
        <h2>OPTIONS &amp; KEYBINDINGS</h2>
        <button class="px-btn small" id="modal-close-btn">Close</button>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
        <div>
          <div class="creator-section-title">Audio Settings</div>
          <label style="font-size:12px;">Master Volume: <span id="v-master">${Math.round(opts.masterVol * 100)}%</span></label>
          <input type="range" id="opt-master" min="0" max="100" value="${Math.round(opts.masterVol * 100)}" style="width:100%;" />
          <label style="font-size:12px;">SFX Volume: <span id="v-sfx">${Math.round(opts.sfxVol * 100)}%</span></label>
          <input type="range" id="opt-sfx" min="0" max="100" value="${Math.round(opts.sfxVol * 100)}" style="width:100%;" />
          <label style="font-size:12px;">Music Volume: <span id="v-music">${Math.round(opts.musicVol * 100)}%</span></label>
          <input type="range" id="opt-music" min="0" max="100" value="${Math.round(opts.musicVol * 100)}" style="width:100%;" />
          <div style="margin-top:8px; display:flex; flex-direction:column; gap:6px;">
            <label style="font-size:12px;"><input type="checkbox" id="opt-mute" ${opts.muted ? "checked" : ""}/> Mute All Audio</label>
            <label style="font-size:12px;"><input type="checkbox" id="opt-animbg" ${opts.animatedBg ? "checked" : ""}/> Animated Arena/Menu Backgrounds</label>
          </div>
        </div>
        <div>
          <div class="creator-section-title">PC Keybindings (Click to Rebind)</div>
          ${kbRows}
        </div>
      </div>
    `);

    document.getElementById("modal-close-btn").onclick = closeModal;
    const syncAudio = () => {
      const m = Number(document.getElementById("opt-master").value) / 100;
      const s = Number(document.getElementById("opt-sfx").value) / 100;
      const mu = Number(document.getElementById("opt-music").value) / 100;
      document.getElementById("v-master").textContent = `${Math.round(m * 100)}%`;
      document.getElementById("v-sfx").textContent = `${Math.round(s * 100)}%`;
      document.getElementById("v-music").textContent = `${Math.round(mu * 100)}%`;
      MG.Storage.saveOptions({
        masterVol: m,
        sfxVol: s,
        musicVol: mu,
        muted: document.getElementById("opt-mute").checked,
        animatedBg: document.getElementById("opt-animbg").checked
      });
    };
    ["opt-master", "opt-sfx", "opt-music", "opt-mute", "opt-animbg"].forEach((id) => {
      document.getElementById(id).oninput = syncAudio;
    });

    document.querySelectorAll(".kb-bind-btn").forEach((btn) => {
      btn.onclick = () => {
        listeningKeyAction = btn.dataset.action;
        btn.textContent = "Press Key...";
      };
    });
  }

  function handleGlobalKeyDown(e) {
    if (listeningKeyAction) {
      e.preventDefault();
      const opts = MG.Storage.getOptions();
      opts.keybindings[listeningKeyAction] = e.key;
      MG.Storage.saveOptions(opts);
      listeningKeyAction = null;
      openOptionsModal();
      return;
    }

    if (currentScreen === "combat" && modalBackdrop().classList.contains("hidden")) {
      const kb = MG.Storage.getOptions().keybindings;
      if (e.key === kb.attack) MG.Combat.playerBasicAttack();
      else if (e.key === kb.skills) openSkillsModal();
      else if (e.key === kb.items) openItemsModal();
      else if (e.key === kb.surrender) MG.Combat.playerSurrender();
    } else if (e.key === MG.Storage.getOptions().keybindings.menu) {
      if (!modalBackdrop().classList.contains("hidden")) closeModal();
    }
  }

  // ---------------- UPGRADES TAB ----------------
  function openUpgradesModal() {
    const profile = MG.Storage.getProfile();
    const rows = MG.Data.UPGRADES.map((u) => {
      const rank = profile.upgrades[u.id] || 0;
      const maxed = rank >= u.maxLevel;
      const cost = u.baseCost + rank * u.stepCost;
      return `
        <div class="wooden-box" style="padding:8px 12px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div>
            <div style="font-weight:bold; color:var(--gold);">${u.name} (Rank ${rank}/${u.maxLevel})</div>
            <div style="font-size:12px;">${u.desc}</div>
          </div>
          <button class="px-btn ${maxed ? "" : "success"} small upg-buy-btn" data-id="${u.id}" ${maxed || profile.warriorSpirit < cost ? "disabled" : ""}>
            ${maxed ? "MAXED" : `Buy (${cost} Spirit)`}
          </button>
        </div>
      `;
    }).join("");

    openModal(`
      <div class="modal-header">
        <h2>WARRIOR SPIRIT UPGRADES</h2>
        <div class="hud-pill">
          <img src="${MG.Assets.getUrl("icon_warrior_spirit_flame")}" alt="Spirit"/>
          <span>${profile.warriorSpirit} Spirit</span>
        </div>
        <button class="px-btn small" id="modal-close-btn">Close</button>
      </div>
      <p style="font-size:12px; margin-top:0;">Permanent buffs applied to every New Game! Earn <strong>5 + 2×Wins</strong> Warrior Spirit upon death.</p>
      <div style="display:flex; flex-direction:column; gap:8px;">${rows}</div>
    `);

    document.getElementById("modal-close-btn").onclick = closeModal;
    document.querySelectorAll(".upg-buy-btn").forEach((b) => {
      b.onclick = () => {
        const res = MG.Storage.buyUpgrade(b.dataset.id);
        if (res.ok) {
          MG.Audio.playSfx("coin");
          openUpgradesModal();
          if (currentScreen === "start") showStartMenu();
        } else {
          toast(res.msg);
        }
      };
    });
  }

  // ---------------- CHARACTER CREATOR ----------------
  function showCharCreator() {
    currentScreen = "creator";
    closeModal();
    creatorDraft = {
      name: "Muddy Recruit",
      gender: "male",
      race: "human",
      cls: "warrior",
      headId: MG.Data.HEADS[0].id,
      hairId: "none",
      accId: "none",
      skinColor: MG.Data.RACES.human.defaultSkin,
      hairColor: MG.Data.HAIR_COLORS[0],
      eyeColor: MG.Data.EYE_COLORS[0],
      clothColor: MG.Data.CLOTH_COLORS[0],
      customFaceData: null,
      previewArmorId: MG.Data.CLASSES.warrior.starterArmor,
      previewWeaponId: MG.Data.CLASSES.warrior.starterWeapon,
      baseStats: MG.Character.rollRandomBaseStats()
    };
    renderCreatorUI();
  }

  function randomizeCreator() {
    const races = Object.keys(MG.Data.RACES);
    const classes = Object.keys(MG.Data.CLASSES);
    const r = races[Math.floor(Math.random() * races.length)];
    const c = classes[Math.floor(Math.random() * classes.length)];
    const g = Math.random() < 0.5 ? "male" : "female";
    const raceData = MG.Data.RACES[r];
    creatorDraft.gender = g;
    creatorDraft.race = r;
    creatorDraft.cls = c;
    creatorDraft.headId = MG.Data.HEADS[Math.floor(Math.random() * MG.Data.HEADS.length)].id;
    creatorDraft.hairId = MG.Data.HAIRS[Math.floor(Math.random() * MG.Data.HAIRS.length)].id;
    creatorDraft.accId = MG.Data.ACCESSORIES[Math.floor(Math.random() * MG.Data.ACCESSORIES.length)].id;
    creatorDraft.skinColor = raceData.skinPalette[Math.floor(Math.random() * raceData.skinPalette.length)];
    creatorDraft.hairColor = MG.Data.HAIR_COLORS[Math.floor(Math.random() * MG.Data.HAIR_COLORS.length)];
    creatorDraft.eyeColor = MG.Data.EYE_COLORS[Math.floor(Math.random() * MG.Data.EYE_COLORS.length)];
    creatorDraft.clothColor = MG.Data.CLOTH_COLORS[Math.floor(Math.random() * MG.Data.CLOTH_COLORS.length)];
    creatorDraft.customFaceData = null;
    creatorDraft.previewArmorId = MG.Data.CLASSES[c].starterArmor;
    creatorDraft.previewWeaponId = MG.Data.CLASSES[c].starterWeapon;
    creatorDraft.baseStats = MG.Character.rollRandomBaseStats();
    creatorDraft.name = MG.Data.ENEMY_NAMES[Math.floor(Math.random() * MG.Data.ENEMY_NAMES.length)];
    MG.Audio.playSfx("click");
    renderCreatorUI();
  }

  function renderCreatorUI() {
    const race = MG.Data.RACES[creatorDraft.race];
    const cls = MG.Data.CLASSES[creatorDraft.cls];
    const activePrevArmor = creatorDraft.previewArmorId || cls.starterArmor;
    const activePrevWeapon = creatorDraft.previewWeaponId || cls.starterWeapon;

    // Preview combined stats
    const previewStats = { ...creatorDraft.baseStats };
    for (const [k, v] of Object.entries(race.bonus)) previewStats[k] += v;
    for (const [k, v] of Object.entries(cls.bonus)) previewStats[k] += v;

    const headIdx = MG.Data.HEADS.findIndex((h) => h.id === creatorDraft.headId);

    overlay().innerHTML = `
      <div class="hud-top-bar">
        <button class="px-btn small" id="cr-back">← Menu</button>
        <strong style="color:var(--gold);">RECRUIT'S DRESSING TENT — CHARACTER CREATOR</strong>
        <div style="display:flex; gap:6px;">
          <button class="img-btn" id="cr-rand" title="Randomize" style="width:36px;"><img src="${MG.Assets.getUrl("btn_randomize_dice")}"/></button>
          <button class="img-btn" id="cr-draw-face" title="Draw Pixel Face" style="width:36px;"><img src="${MG.Assets.getUrl("btn_draw_face")}"/></button>
        </div>
      </div>

      <div class="creator-layout">
        <div class="creator-preview-pane" style="justify-content:space-between; padding-top:4px;">
          <div class="wooden-box" style="padding:6px 8px; font-size:11px; width:94%; display:flex; flex-direction:column; gap:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="color:var(--gold);">TRY-ON GEAR PREVIEW</strong>
              <button class="px-btn small" id="cr-reset-gear" style="padding:2px 6px; font-size:10px; min-height:20px;" title="Reset to Class Starter Gear">Starter</button>
            </div>
            <div style="display:flex; align-items:center; gap:4px;">
              <span style="min-width:42px; color:#f3c88b;">Armor:</span>
              <select id="cr-prev-armor" style="flex:1; background:#1c0e06; color:#fff; border:1px solid #000; padding:2px 4px; font-family:inherit; font-size:11px;">
                ${Object.values(MG.Data.ARMORS)
                  .map(
                    (a) =>
                      `<option value="${a.id}" ${activePrevArmor === a.id ? "selected" : ""}>[T${a.tier} ${a.type.toUpperCase()}] ${a.name}${a.id === cls.starterArmor ? " ★" : ""}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div style="display:flex; align-items:center; gap:4px;">
              <span style="min-width:42px; color:#f3c88b;">Wpn:</span>
              <select id="cr-prev-weapon" style="flex:1; background:#1c0e06; color:#fff; border:1px solid #000; padding:2px 4px; font-family:inherit; font-size:11px;">
                ${Object.values(MG.Data.WEAPONS)
                  .map(
                    (w) =>
                      `<option value="${w.id}" ${activePrevWeapon === w.id ? "selected" : ""}>[T${w.tier}] ${w.name}${w.id === cls.starterWeapon ? " ★" : ""}</option>`
                  )
                  .join("")}
              </select>
            </div>
          </div>

          <div class="wooden-box" style="padding:6px 12px; font-size:12px; text-align:center; width:94%;">
            <strong style="color:var(--gold);">${race.name} ${cls.name}</strong><br/>
            <span>${cls.desc}</span>
          </div>
        </div>

        <div class="creator-controls-pane">
          <div style="display:flex; gap:8px; align-items:center;">
            <label style="font-size:12px;">Name:</label>
            <input id="cr-name" type="text" value="${creatorDraft.name}" maxlength="18" style="flex:1; padding:4px 8px; font-family:inherit; background:#1c0e06; color:#fff; border:2px solid #000;" />
            <button class="px-btn small ${creatorDraft.gender === "male" ? "active-tab" : ""}" data-gender="male">Male</button>
            <button class="px-btn small ${creatorDraft.gender === "female" ? "active-tab" : ""}" data-gender="female">Female</button>
          </div>

          <div class="creator-section-title">1. Race</div>
          <div class="option-row">
            ${Object.values(MG.Data.RACES)
              .map((r) => `<button class="px-btn small ${creatorDraft.race === r.id ? "active-tab" : ""}" data-race="${r.id}">${r.name}</button>`)
              .join("")}
            <span style="font-size:11px; color:#f3c88b;">${race.desc}</span>
          </div>

          <div class="creator-section-title">2. Class (6 Classes)</div>
          <div class="option-row">
            ${Object.values(MG.Data.CLASSES)
              .map((c) => `<button class="px-btn small ${creatorDraft.cls === c.id ? "active-tab" : ""}" data-cls="${c.id}">${c.name}</button>`)
              .join("")}
          </div>

          <div class="creator-section-title">3. Head (10 Styles), Hair &amp; Accessories</div>
          <div class="option-row">
            <button class="px-btn small" id="hd-prev">◀</button>
            <span style="font-size:12px; min-width:130px; text-align:center;">Head ${headIdx + 1}/10: ${MG.Data.HEADS[headIdx]?.label || ""}</span>
            <button class="px-btn small" id="hd-next">▶</button>
            <select id="cr-hair" style="background:#1c0e06; color:#fff; border:2px solid #000; padding:4px; font-family:inherit;">
              ${MG.Data.HAIRS.map((h) => `<option value="${h.id}" ${creatorDraft.hairId === h.id ? "selected" : ""}>Hair: ${h.label}</option>`).join("")}
            </select>
            <select id="cr-acc" style="background:#1c0e06; color:#fff; border:2px solid #000; padding:4px; font-family:inherit;">
              ${MG.Data.ACCESSORIES.map((a) => `<option value="${a.id}" ${creatorDraft.accId === a.id ? "selected" : ""}>Acc: ${a.label}</option>`).join("")}
            </select>
            ${creatorDraft.customFaceData ? `<button class="px-btn primary small" id="cr-clear-face">Clear Custom Face</button>` : ""}
          </div>

          <div class="creator-section-title">4. Skin, Hair, Eye &amp; Cloth Colors</div>
          <div class="option-row" style="gap:10px;">
            <div style="display:flex; align-items:center; gap:3px;"><span style="font-size:11px;">Skin:</span>${race.skinPalette
              .map((c) => `<button class="swatch-btn ${creatorDraft.skinColor === c ? "selected" : ""}" style="background:${c};" data-swatch="skinColor" data-val="${c}"></button>`)
              .join("")}</div>
            <div style="display:flex; align-items:center; gap:3px;"><span style="font-size:11px;">Hair:</span>${MG.Data.HAIR_COLORS.map(
              (c) => `<button class="swatch-btn ${creatorDraft.hairColor === c ? "selected" : ""}" style="background:${c};" data-swatch="hairColor" data-val="${c}"></button>`
            ).join("")}</div>
            <div style="display:flex; align-items:center; gap:3px;"><span style="font-size:11px;">Eyes:</span>${MG.Data.EYE_COLORS.map(
              (c) => `<button class="swatch-btn ${creatorDraft.eyeColor === c ? "selected" : ""}" style="background:${c};" data-swatch="eyeColor" data-val="${c}"></button>`
            ).join("")}</div>
          </div>

          <div class="creator-section-title">5. Randomized 60-Point Base Stats (+Race/Class)</div>
          <div class="stats-mini-grid">
            <div class="stat-chip"><span>STR</span><strong>${previewStats.str}</strong></div>
            <div class="stat-chip"><span>DEX</span><strong>${previewStats.dex}</strong></div>
            <div class="stat-chip"><span>INT</span><strong>${previewStats.int}</strong></div>
            <div class="stat-chip"><span>TOU</span><strong>${previewStats.tou}</strong></div>
            <div class="stat-chip"><span>MAN</span><strong>${previewStats.man}</strong></div>
            <div class="stat-chip"><span>LUK</span><strong>${previewStats.luk}</strong></div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:4px;">
            <button class="px-btn" id="cr-reroll">Re-roll 60 Stats</button>
            <button class="px-btn success" id="cr-confirm">ENTER ARENA HUB →</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("cr-back").onclick = showStartMenu;
    document.getElementById("cr-rand").onclick = randomizeCreator;
    document.getElementById("cr-draw-face").onclick = openPixelFaceEditor;
    document.getElementById("cr-name").oninput = (e) => (creatorDraft.name = e.target.value);

    document.querySelectorAll("[data-gender]").forEach((b) => {
      b.onclick = () => {
        creatorDraft.gender = b.dataset.gender;
        MG.Audio.playSfx("click");
        renderCreatorUI();
      };
    });
    document.querySelectorAll("[data-race]").forEach((b) => {
      b.onclick = () => {
        creatorDraft.race = b.dataset.race;
        creatorDraft.skinColor = MG.Data.RACES[creatorDraft.race].defaultSkin;
        MG.Audio.playSfx("click");
        renderCreatorUI();
      };
    });
    document.querySelectorAll("[data-cls]").forEach((b) => {
      b.onclick = () => {
        creatorDraft.cls = b.dataset.cls;
        const cObj = MG.Data.CLASSES[creatorDraft.cls];
        if (cObj) {
          creatorDraft.previewArmorId = cObj.starterArmor;
          creatorDraft.previewWeaponId = cObj.starterWeapon;
        }
        MG.Audio.playSfx("click");
        renderCreatorUI();
      };
    });

    document.getElementById("cr-prev-armor").onchange = (e) => {
      creatorDraft.previewArmorId = e.target.value;
      MG.Audio.playSfx("click");
    };
    document.getElementById("cr-prev-weapon").onchange = (e) => {
      creatorDraft.previewWeaponId = e.target.value;
      MG.Audio.playSfx("click");
    };
    document.getElementById("cr-reset-gear").onclick = () => {
      creatorDraft.previewArmorId = cls.starterArmor;
      creatorDraft.previewWeaponId = cls.starterWeapon;
      MG.Audio.playSfx("click");
      renderCreatorUI();
    };

    document.getElementById("hd-prev").onclick = () => {
      const next = (headIdx - 1 + MG.Data.HEADS.length) % MG.Data.HEADS.length;
      creatorDraft.headId = MG.Data.HEADS[next].id;
      creatorDraft.customFaceData = null;
      renderCreatorUI();
    };
    document.getElementById("hd-next").onclick = () => {
      const next = (headIdx + 1) % MG.Data.HEADS.length;
      creatorDraft.headId = MG.Data.HEADS[next].id;
      creatorDraft.customFaceData = null;
      renderCreatorUI();
    };
    document.getElementById("cr-hair").onchange = (e) => (creatorDraft.hairId = e.target.value);
    document.getElementById("cr-acc").onchange = (e) => (creatorDraft.accId = e.target.value);
    if (document.getElementById("cr-clear-face")) {
      document.getElementById("cr-clear-face").onclick = () => {
        creatorDraft.customFaceData = null;
        renderCreatorUI();
      };
    }

    document.querySelectorAll("[data-swatch]").forEach((b) => {
      b.onclick = () => {
        creatorDraft[b.dataset.swatch] = b.dataset.val;
        renderCreatorUI();
      };
    });

    document.getElementById("cr-reroll").onclick = () => {
      creatorDraft.baseStats = MG.Character.rollRandomBaseStats();
      MG.Audio.playSfx("click");
      renderCreatorUI();
    };

    document.getElementById("cr-confirm").onclick = () => {
      MG.Audio.playSfx("victory");
      const player = MG.Character.createNewPlayer(creatorDraft);
      gameState = {
        slotIndex: 0,
        player,
        campaign: MG.Character.generateCampaign(),
        shop: generateShopInventory(player),
        winsSinceRefresh: 0
      };
      creatorDraft = null;
      showTrainingHub();
    };
  }

  // ---------------- PIXEL-BY-PIXEL FACE PAINTER ----------------
  function openPixelFaceEditor() {
    const palette = [
      "#000000", "#ffffff", "#e8b892", "#749c49", "#6d7482",
      "#b91c1c", "#ef4444", "#eab308", "#22c55e", "#3b82f6",
      "#a855f7", "#7c2d12", "#f97316", "ERASE"
    ];
    let activeColor = "#000000";

    openModal(`
      <div class="modal-header">
        <h2>DRAW YOUR OWN FACE (16×16 PIXELS)</h2>
        <button class="px-btn small" id="modal-close-btn">Cancel</button>
      </div>
      <div class="face-editor-wrap">
        <canvas id="face-paint-canvas" width="256" height="256"></canvas>
        <div style="flex:1; min-width:180px; display:flex; flex-direction:column; gap:10px;">
          <div style="font-size:12px;">Click or drag to paint pixels!</div>
          <div class="option-row">
            ${palette
              .map((c) =>
                c === "ERASE"
                  ? `<button class="px-btn small" data-pcol="ERASE">Eraser</button>`
                  : `<button class="swatch-btn ${c === activeColor ? "selected" : ""}" style="background:${c};" data-pcol="${c}"></button>`
              )
              .join("")}
          </div>
          <div style="display:flex; gap:8px;">
            <button class="px-btn small" id="fp-fill-skin">Fill Skin</button>
            <button class="px-btn small" id="fp-clear">Clear</button>
          </div>
          <button class="px-btn success" id="fp-save">Save Custom Face</button>
        </div>
      </div>
    `);

    const pCanvas = document.getElementById("face-paint-canvas");
    const pCtx = pCanvas.getContext("2d");
    const grid = 16;
    const cell = pCanvas.width / grid;

    // Backing 16x16 offscreen canvas
    const off = document.createElement("canvas");
    off.width = grid;
    off.height = grid;
    const oCtx = off.getContext("2d");

    if (creatorDraft.customFaceData) {
      const existing = new Image();
      existing.onload = () => {
        oCtx.drawImage(existing, 0, 0, grid, grid);
        redraw();
      };
      existing.src = creatorDraft.customFaceData;
    } else {
      oCtx.fillStyle = creatorDraft.skinColor;
      oCtx.fillRect(2, 2, 12, 12);
      oCtx.fillStyle = "#000000";
      oCtx.fillRect(5, 6, 2, 2);
      oCtx.fillRect(9, 6, 2, 2);
      oCtx.fillRect(6, 10, 4, 1);
    }

    function redraw() {
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
      pCtx.imageSmoothingEnabled = false;
      pCtx.drawImage(off, 0, 0, pCanvas.width, pCanvas.height);
      pCtx.strokeStyle = "rgba(0,0,0,0.18)";
      pCtx.lineWidth = 1;
      for (let i = 0; i <= grid; i++) {
        pCtx.beginPath();
        pCtx.moveTo(i * cell, 0);
        pCtx.lineTo(i * cell, pCanvas.height);
        pCtx.stroke();
        pCtx.beginPath();
        pCtx.moveTo(0, i * cell);
        pCtx.lineTo(pCanvas.width, i * cell);
        pCtx.stroke();
      }
    }
    redraw();

    let painting = false;
    const paintAt = (clientX, clientY) => {
      const rect = pCanvas.getBoundingClientRect();
      const gx = Math.floor(((clientX - rect.left) / rect.width) * grid);
      const gy = Math.floor(((clientY - rect.top) / rect.height) * grid);
      if (gx < 0 || gx >= grid || gy < 0 || gy >= grid) return;
      if (activeColor === "ERASE") oCtx.clearRect(gx, gy, 1, 1);
      else {
        oCtx.fillStyle = activeColor;
        oCtx.fillRect(gx, gy, 1, 1);
      }
      redraw();
    };

    pCanvas.onpointerdown = (e) => {
      painting = true;
      paintAt(e.clientX, e.clientY);
    };
    pCanvas.onpointermove = (e) => {
      if (painting) paintAt(e.clientX, e.clientY);
    };
    window.addEventListener("pointerup", () => (painting = false), { once: false });

    document.querySelectorAll("[data-pcol]").forEach((b) => {
      b.onclick = () => {
        activeColor = b.dataset.pcol;
        document.querySelectorAll("[data-pcol]").forEach((x) => x.classList.remove("selected"));
        b.classList.add("selected");
      };
    });
    document.getElementById("fp-fill-skin").onclick = () => {
      oCtx.fillStyle = creatorDraft.skinColor;
      oCtx.fillRect(2, 2, 12, 12);
      redraw();
    };
    document.getElementById("fp-clear").onclick = () => {
      oCtx.clearRect(0, 0, grid, grid);
      redraw();
    };
    document.getElementById("fp-save").onclick = () => {
      creatorDraft.customFaceData = off.toDataURL("image/png");
      closeModal();
      renderCreatorUI();
    };
    document.getElementById("modal-close-btn").onclick = closeModal;
  }

  // ---------------- SHOP GENERATOR (10 ITEMS, BARB +20%) ----------------
  function generateShopInventory(player) {
    const slots = [];
    const tierMax = Math.min(4, 1 + Math.floor((player.wins || 0) / 5));
    const wpns = Object.values(MG.Data.WEAPONS).filter((w) => w.tier <= tierMax);
    const arms = Object.values(MG.Data.ARMORS).filter((a) => a.tier <= tierMax);
    const itms = Object.values(MG.Data.ITEMS);

    for (let i = 0; i < 10; i++) {
      let entry = null;
      if (i < 4) {
        const w = JSON.parse(JSON.stringify(wpns[Math.floor(Math.random() * wpns.length)]));
        if (player.cls === "barbarian") {
          w.dmg = Math.round(w.dmg * 1.2);
          w.barbBoosted = true;
        }
        entry = { kind: "weapon", item: w, locked: false, sold: false };
      } else if (i < 7) {
        const a = JSON.parse(JSON.stringify(arms[Math.floor(Math.random() * arms.length)]));
        entry = { kind: "armor", item: a, locked: false, sold: false };
      } else if (i < 9) {
        const it = JSON.parse(JSON.stringify(itms[Math.floor(Math.random() * itms.length)]));
        entry = { kind: "item", item: it, locked: false, sold: false };
      } else {
        entry = {
          kind: "book",
          item: { id: "book_silly_universal", name: "Mystery Skill Book", price: 65, desc: "Learn 1 of 3 random arena skills!" },
          locked: false,
          sold: false
        };
      }
      slots.push(entry);
    }
    return slots;
  }

  function refreshUnlockedShopSlots() {
    const fresh = generateShopInventory(gameState.player);
    gameState.shop = gameState.shop.map((slot, i) => (slot.locked && !slot.sold ? slot : fresh[i]));
  }

  // ---------------- TRAINING HUB ----------------
  function showTrainingHub() {
    currentScreen = "hub";
    closeModal();
    const p = gameState.player;
    const clsName = MG.Data.CLASSES[p.cls].name;
    const raceName = MG.Data.RACES[p.race].name;

    overlay().innerHTML = `
      <div class="hud-top-bar">
        <div style="display:flex; gap:8px; align-items:center;">
          <button class="px-btn small" id="hub-menu">Menu</button>
          <button class="px-btn small" id="hub-save">Save</button>
          <strong>${p.name} — Lv.${p.level} ${raceName} ${clsName}</strong>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          ${p.unspentPoints > 0 ? `<button class="px-btn success small" id="hub-lvlup">+${p.unspentPoints} Stat Pts!</button>` : ""}
          <div class="hud-pill">
            <img src="${MG.Assets.getUrl("icon_gold_coin")}" alt="Gold"/>
            <span>${p.gold}g</span>
          </div>
          <div class="hud-pill">Wins: ${p.wins}/21</div>
        </div>
      </div>

      <div class="hub-layout">
        <div class="hub-middle">
          <button class="hub-hotspot-btn" id="hub-shop">
            <img src="${MG.Assets.getUrl("npc_honest_barnaby")}" style="height:68px; image-rendering:pixelated;" />
            <span>HONEST BARNABY'S SHOP</span>
          </button>

          <button class="hub-hotspot-btn" id="hub-gear">
            <span>GEAR &amp; STATS</span>
            <span style="font-size:10px; color:#fff;">${p.equippedWeapon.name}</span>
          </button>

          <button class="img-btn" id="hub-campaign" style="width:185px;">
            <img src="${MG.Assets.getUrl("btn_start_match")}" alt="Start Match" />
          </button>
        </div>
      </div>
    `;

    document.getElementById("hub-menu").onclick = showStartMenu;
    document.getElementById("hub-save").onclick = openSaveModal;
    document.getElementById("hub-shop").onclick = openShopModal;
    document.getElementById("hub-gear").onclick = openGearModal;
    document.getElementById("hub-campaign").onclick = openCampaignModal;
    if (document.getElementById("hub-lvlup")) {
      document.getElementById("hub-lvlup").onclick = openLevelUpModal;
    }
  }

  function openShopModal() {
    const p = gameState.player;
    const gridHtml = gameState.shop
      .map((slot, idx) => {
        if (slot.sold) {
          return `<div class="shop-slot" style="opacity:0.4;"><span>SOLD</span></div>`;
        }
        return `
          <div class="shop-slot">
            <button class="lock-toggle ${slot.locked ? "locked" : ""}" data-lock="${idx}" title="Lock item across refreshes">
              <img src="${MG.Assets.getUrl("btn_lock_icon")}" alt="Lock"/>
            </button>
            <img class="item-ico" src="${MG.Assets.getUrl(slot.item.id)}" alt="${slot.item.name}"/>
            <strong style="color:var(--gold);">${slot.item.name}${slot.item.barbBoosted ? " (+20%)" : ""}</strong>
            <span style="font-size:10px; color:#ddd;">${slot.item.desc}</span>
            <button class="px-btn success small shop-buy-btn" data-idx="${idx}" ${p.gold < slot.item.price ? "disabled" : ""}>
              Buy ${slot.item.price}g
            </button>
          </div>
        `;
      })
      .join("");

    openModal(`
      <div class="modal-header">
        <h2>HONEST BARNABY'S WAGON (Refreshes every 5 wins)</h2>
        <div class="hud-pill"><img src="${MG.Assets.getUrl("icon_gold_coin")}"/><span>${p.gold}g</span></div>
        <button class="px-btn small" id="modal-close-btn">Close</button>
      </div>
      <div class="shop-grid-10">${gridHtml}</div>
      <div style="margin-top:8px; font-size:11px; color:#f3c88b;">
        Tip: Click the padlock icon to lock any item so it won't swap out! (${5 - gameState.winsSinceRefresh} wins until next shop refresh)
      </div>
    `);

    document.getElementById("modal-close-btn").onclick = closeModal;
    document.querySelectorAll("[data-lock]").forEach((btn) => {
      btn.onclick = () => {
        const i = Number(btn.dataset.lock);
        gameState.shop[i].locked = !gameState.shop[i].locked;
        MG.Audio.playSfx("click");
        openShopModal();
      };
    });
    document.querySelectorAll(".shop-buy-btn").forEach((btn) => {
      btn.onclick = () => {
        const i = Number(btn.dataset.idx);
        const slot = gameState.shop[i];
        if (!slot || slot.sold || p.gold < slot.item.price) return;
        p.gold -= slot.item.price;
        slot.sold = true;
        MG.Audio.playSfx("coin");

        if (slot.kind === "weapon") {
          p.inventory.push({ kind: "weapon", item: slot.item, qty: 1 });
          toast(`Bought ${slot.item.name}! Equip in Gear & Stats.`);
          openShopModal();
        } else if (slot.kind === "armor") {
          p.inventory.push({ kind: "armor", item: slot.item, qty: 1 });
          toast(`Bought ${slot.item.name}! Equip in Gear & Stats.`);
          openShopModal();
        } else if (slot.kind === "item") {
          const existing = p.inventory.find((e) => e.kind === "item" && e.item.id === slot.item.id);
          if (existing) existing.qty++;
          else p.inventory.push({ kind: "item", item: slot.item, qty: 1 });
          toast(`Bought ${slot.item.name}!`);
          openShopModal();
        } else if (slot.kind === "book") {
          openSkillBookPicker();
        }
        showTrainingHubOverlayRefresh();
      };
    });
  }

  function showTrainingHubOverlayRefresh() {
    if (currentScreen === "hub") {
      // Update top bar gold quickly without closing modal
      const pills = document.querySelectorAll("#ui-overlay .hud-pill span");
      if (pills[0]) pills[0].textContent = `${gameState.player.gold}g`;
    }
  }

  function openGearModal() {
    const p = gameState.player;
    const der = MG.Character.getDerivedStats(p);
    const invHtml = p.inventory.length
      ? p.inventory
          .map((e, idx) => {
            const sellVal = Math.max(4, Math.floor((e.item.price || 10) * 0.5));
            return `
              <div class="wooden-box" style="padding:6px 10px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <img src="${MG.Assets.getUrl(e.item.id)}" style="width:32px; height:32px; object-fit:contain;"/>
                  <div>
                    <strong style="font-size:12px;">${e.item.name}${e.qty > 1 ? ` ×${e.qty}` : ""}</strong>
                    <div style="font-size:10px; color:#ddd;">${e.item.desc}</div>
                  </div>
                </div>
                <div style="display:flex; gap:6px;">
                  ${e.kind === "weapon" || e.kind === "armor" ? `<button class="px-btn success small eq-btn" data-idx="${idx}">Equip</button>` : ""}
                  <button class="px-btn small sell-btn" data-idx="${idx}">Sell ${sellVal}g</button>
                </div>
              </div>
            `;
          })
          .join("")
      : `<div style="font-size:12px; opacity:0.7;">Your bag is empty.</div>`;

    openModal(`
      <div class="modal-header">
        <h2>GLADIATOR GEAR &amp; STATS</h2>
        <button class="px-btn small" id="modal-close-btn">Close</button>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <div class="creator-section-title">Effective Stats</div>
          <div class="stats-mini-grid">
            <div class="stat-chip"><span>STR</span><strong>${der.eff.str}</strong></div>
            <div class="stat-chip"><span>DEX</span><strong>${der.eff.dex}</strong></div>
            <div class="stat-chip"><span>INT</span><strong>${der.eff.int}</strong></div>
            <div class="stat-chip"><span>TOU</span><strong>${der.eff.tou}</strong></div>
            <div class="stat-chip"><span>MAN</span><strong>${der.eff.man}</strong></div>
            <div class="stat-chip"><span>LUK</span><strong>${der.eff.luk}</strong></div>
          </div>
          <div style="font-size:12px; margin-top:8px;">
            Max HP: <strong>${der.maxHp}</strong> | Max MP: <strong>${der.maxMp}</strong><br/>
            Crit: <strong>${der.critChance.toFixed(1)}%</strong> | Dodge: <strong>${der.dodgeChance.toFixed(1)}%</strong> | Def: <strong>${der.armorDef}</strong><br/>
            Weapon: <strong>${p.equippedWeapon.name}</strong> (${p.equippedWeapon.dmg} Base Dmg)<br/>
            Armor: <strong>${p.equippedArmor.name}</strong> (${p.equippedArmor.def} Def)
          </div>
          <div class="creator-section-title" style="margin-top:8px;">Learned Skills (${p.skills.length})</div>
          <div style="font-size:11px;">${p.skills.length ? p.skills.map((s) => `• <strong>${s.name}</strong> (${s.mp} MP)`).join("<br/>") : "None yet (find Skill Books!)."}</div>
        </div>
        <div>
          <div class="creator-section-title">Inventory Bag</div>
          <div style="display:flex; flex-direction:column; gap:6px; max-height:260px; overflow-y:auto;">${invHtml}</div>
        </div>
      </div>
    `);

    document.getElementById("modal-close-btn").onclick = closeModal;
    document.querySelectorAll(".eq-btn").forEach((btn) => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.idx);
        const entry = p.inventory[idx];
        if (!entry) return;
        if (entry.kind === "weapon") {
          const old = p.equippedWeapon;
          p.equippedWeapon = entry.item;
          p.inventory.splice(idx, 1, { kind: "weapon", item: old, qty: 1 });
        } else if (entry.kind === "armor") {
          const old = p.equippedArmor;
          p.equippedArmor = entry.item;
          p.inventory.splice(idx, 1, { kind: "armor", item: old, qty: 1 });
        }
        MG.Audio.playSfx("click");
        openGearModal();
        showTrainingHub();
      };
    });
    document.querySelectorAll(".sell-btn").forEach((btn) => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.idx);
        const entry = p.inventory[idx];
        if (!entry) return;
        const val = Math.max(4, Math.floor((entry.item.price || 10) * 0.5));
        p.gold += val;
        if (entry.qty > 1) entry.qty--;
        else p.inventory.splice(idx, 1);
        MG.Audio.playSfx("coin");
        openGearModal();
      };
    });
  }

  function openLevelUpModal() {
    const p = gameState.player;
    const rows = ["str", "dex", "int", "tou", "man", "luk"]
      .map(
        (k) => `
      <div class="wooden-box" style="padding:6px 10px; display:flex; justify-content:space-between; align-items:center;">
        <strong style="text-transform:uppercase;">${k}: ${p.baseStats[k]}</strong>
        <button class="px-btn success small lvl-add-btn" data-stat="${k}" ${p.unspentPoints <= 0 ? "disabled" : ""}>+1</button>
      </div>`
      )
      .join("");

    openModal(`
      <div class="modal-header">
        <h2>LEVEL UP! (${p.unspentPoints} Points Left)</h2>
        <button class="px-btn small" id="modal-close-btn">Done</button>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">${rows}</div>
    `);
    document.getElementById("modal-close-btn").onclick = () => {
      closeModal();
      showTrainingHub();
    };
    document.querySelectorAll(".lvl-add-btn").forEach((b) => {
      b.onclick = () => {
        if (p.unspentPoints <= 0) return;
        p.baseStats[b.dataset.stat]++;
        p.unspentPoints--;
        MG.Audio.playSfx("coin");
        openLevelUpModal();
      };
    });
  }

  // ---------------- CAMPAIGN 4x5 + BOSS CHALKBOARD ----------------
  function openCampaignModal() {
    const bouts = gameState.campaign;
    const unlockedIdx = bouts.findIndex((b) => !b.beaten);

    const grid20 = bouts
      .slice(0, 20)
      .map((b) => {
        const isCurrent = b.index === unlockedIdx;
        const isLocked = !b.beaten && b.index > unlockedIdx;
        const clsName = MG.Data.CLASSES[b.enemy.cls]?.name || "";
        return `
          <div class="bout-card ${b.beaten ? "beaten" : isCurrent ? "current" : "locked"}" data-bout="${b.index}">
            <img src="${isLocked ? MG.Assets.getUrl("silhouette_mystery_enemy") : MG.Assets.getUrl(b.enemy.appearance.headId)}" alt="Enemy"/>
            <strong>#${b.index + 1} ${isLocked ? "???" : b.enemy.name}</strong>
            <span>${isLocked ? "Locked" : b.beaten ? "BEATEN ✓" : `Lv.${b.enemy.level} ${clsName}`}</span>
          </div>
        `;
      })
      .join("");

    const boss = bouts[20];
    const bossUnlocked = unlockedIdx === 20 || boss.beaten;

    openModal(`
      <div class="modal-header">
        <h2>AREA 1 CAMPAIGN CHALKBOARD (4×5 + BOSS)</h2>
        <button class="px-btn small" id="modal-close-btn">Close</button>
      </div>
      <div class="campaign-grid">${grid20}</div>
      <div class="bout-card ${boss.beaten ? "beaten" : bossUnlocked ? "current" : "locked"}" data-bout="20" style="flex-direction:row; justify-content:center; gap:14px; padding:10px;">
        <img src="${bossUnlocked ? MG.Assets.getUrl("boss_drill_sergeant_brock") : MG.Assets.getUrl("silhouette_mystery_enemy")}" style="width:56px; height:56px;"/>
        <div style="text-align:left;">
          <strong style="color:var(--gold); font-size:14px;">#21 AREA BOSS: ${bossUnlocked ? "DRILL SERGEANT BROCK" : "???"}</strong>
          <div>${bossUnlocked ? "Massive Orc Boss — Bathtub Armor &amp; NO LOITERING Club!" : "Beat all 20 arena fighters to challenge the Boss!"}</div>
        </div>
      </div>
    `);

    document.getElementById("modal-close-btn").onclick = closeModal;
    document.querySelectorAll("[data-bout]").forEach((card) => {
      card.onclick = () => {
        const idx = Number(card.dataset.bout);
        if (idx !== unlockedIdx) return;
        MG.Audio.playSfx("click");
        closeModal();
        startArenaFight(bouts[idx]);
      };
    });
  }

  // ---------------- ARENA COMBAT SCREEN ----------------
  function startArenaFight(bout) {
    currentScreen = "combat";
    MG.Combat.startMatch(gameState.player, bout, {
      onUiUpdate: renderCombatHUD,
      onEnd: handleCombatResult
    });
    renderCombatHUD(MG.Combat.getState());
  }

  function renderCombatHUD(st) {
    if (!st || currentScreen !== "combat") return;
    const pDer = MG.Character.getDerivedStats(st.player);
    const eDer = MG.Character.getDerivedStats(st.enemy);
    const pHpPct = Math.max(0, Math.min(100, (st.player.hp / pDer.maxHp) * 100));
    const pMpPct = Math.max(0, Math.min(100, (st.player.mp / pDer.maxMp) * 100));
    const eHpPct = Math.max(0, Math.min(100, (st.enemy.hp / eDer.maxHp) * 100));
    const eMpPct = Math.max(0, Math.min(100, (st.enemy.mp / eDer.maxMp) * 100));
    const cls = MG.Data.CLASSES[st.player.cls];
    const disabled = st.turn !== "player";

    overlay().innerHTML = `
      <div class="combat-layout">
        <div class="combat-bars-row">
          <div class="fighter-hud-card">
            <div class="fighter-name-line">
              <span>${st.player.name}</span>
              <span>Lv.${st.player.level} ${cls.name}</span>
            </div>
            <div class="bar-wrap"><div class="bar-fill-hp" style="width:${pHpPct}%"></div><div class="bar-label">HP ${st.player.hp}/${pDer.maxHp}</div></div>
            <div class="bar-wrap"><div class="bar-fill-mp" style="width:${pMpPct}%"></div><div class="bar-label">MP ${st.player.mp}/${pDer.maxMp}</div></div>
          </div>

          <div class="fighter-hud-card">
            <div class="fighter-name-line">
              <span>${st.enemy.name}</span>
              <span>Lv.${st.enemy.level} ${MG.Data.CLASSES[st.enemy.cls].name}</span>
            </div>
            <div class="bar-wrap"><div class="bar-fill-hp" style="width:${eHpPct}%"></div><div class="bar-label">HP ${st.enemy.hp}/${eDer.maxHp}</div></div>
            <div class="bar-wrap"><div class="bar-fill-mp" style="width:${eMpPct}%"></div><div class="bar-label">MP ${st.enemy.mp}/${eDer.maxMp}</div></div>
          </div>
        </div>

        <div class="combat-log-strip">${st.log}</div>

        <div class="combat-bottom-actions">
          <button class="img-btn" id="c-atk" ${disabled ? "disabled" : ""}><img src="${MG.Assets.getUrl("btn_attack")}" alt="Attack"/></button>
          <button class="px-btn primary" id="c-spec" ${disabled || (cls.oncePerFight && st.pBuffs.specialUsed) ? "disabled" : ""}>
            ★ ${cls.specialName}${cls.specialCost > 0 ? ` (${cls.specialCost}MP)` : ""}
          </button>
          <button class="img-btn" id="c-skl" ${disabled ? "disabled" : ""}><img src="${MG.Assets.getUrl("btn_skills")}" alt="Skills"/></button>
          <button class="img-btn" id="c-itm" ${disabled ? "disabled" : ""}><img src="${MG.Assets.getUrl("btn_items")}" alt="Items"/></button>
          <button class="img-btn" id="c-sur" ${disabled ? "disabled" : ""}><img src="${MG.Assets.getUrl("btn_surrender")}" alt="Surrender"/></button>
        </div>
      </div>
    `;

    document.getElementById("c-atk").onclick = MG.Combat.playerBasicAttack;
    document.getElementById("c-spec").onclick = MG.Combat.playerUseClassSpecial;
    document.getElementById("c-skl").onclick = openSkillsModal;
    document.getElementById("c-itm").onclick = openItemsModal;
    document.getElementById("c-sur").onclick = MG.Combat.playerSurrender;
  }

  function openSkillsModal() {
    const st = MG.Combat.getState();
    if (!st || st.turn !== "player") return;
    const p = st.player;
    const rows = p.skills.length
      ? p.skills
          .map(
            (s, i) => `
          <div class="wooden-box" style="padding:8px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="color:var(--gold);">${s.name} (${s.mp} MP)</strong>
              <div style="font-size:11px;">${s.desc}</div>
            </div>
            <button class="px-btn success small use-skl-btn" data-i="${i}" ${p.mp < s.mp ? "disabled" : ""}>Cast</button>
          </div>`
          )
          .join("")
      : `<p style="font-size:12px;">No learned skills yet! Win fights or buy Skill Books from Honest Barnaby.</p>`;

    openModal(`
      <div class="modal-header">
        <h2>LEARNED SKILLS</h2>
        <button class="px-btn small" id="modal-close-btn">Close</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px;">${rows}</div>
    `);
    document.getElementById("modal-close-btn").onclick = closeModal;
    document.querySelectorAll(".use-skl-btn").forEach((b) => {
      b.onclick = () => {
        const s = p.skills[Number(b.dataset.i)];
        closeModal();
        MG.Combat.playerUseSkill(s);
      };
    });
  }

  function openItemsModal() {
    const st = MG.Combat.getState();
    if (!st || st.turn !== "player") return;
    const consumables = st.player.inventory
      .map((e, idx) => ({ e, idx }))
      .filter((x) => x.e.kind === "item");

    const rows = consumables.length
      ? consumables
          .map(
            ({ e, idx }) => `
          <div class="wooden-box" style="padding:8px; display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:8px;">
              <img src="${MG.Assets.getUrl(e.item.id)}" style="width:34px; height:34px;"/>
              <div>
                <strong style="color:var(--gold);">${e.item.name} ×${e.qty}</strong>
                <div style="font-size:11px;">${e.item.desc}</div>
              </div>
            </div>
            <button class="px-btn success small use-itm-btn" data-idx="${idx}">Use</button>
          </div>`
          )
          .join("")
      : `<p style="font-size:12px;">No potions or items in your bag!</p>`;

    openModal(`
      <div class="modal-header">
        <h2>ITEMS &amp; POTIONS</h2>
        <button class="px-btn small" id="modal-close-btn">Close</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px;">${rows}</div>
    `);
    document.getElementById("modal-close-btn").onclick = closeModal;
    document.querySelectorAll(".use-itm-btn").forEach((b) => {
      b.onclick = () => {
        const idx = Number(b.dataset.idx);
        closeModal();
        MG.Combat.playerUseItem(idx);
      };
    });
  }

  function handleCombatResult(res) {
    if (res.outcome === "surrender") {
      showTrainingHub();
      toast("Retreated to the Courtyard!");
      return;
    }

    if (res.outcome === "death") {
      const totalSpirit = MG.Storage.addWarriorSpirit(res.spiritEarned, true);
      openModal(`
        <div class="modal-header">
          <h2 style="color:#ef4444;">YOU FELL IN THE MUD PIT!</h2>
        </div>
        <p>Your gladiator fought bravely for <strong>${gameState.player.wins} wins</strong>.</p>
        <div class="hud-pill" style="margin-bottom:12px;">
          <img src="${MG.Assets.getUrl("icon_warrior_spirit_flame")}"/>
          <span>+${res.spiritEarned} Warrior Spirit Earned! (Total: ${totalSpirit})</span>
        </div>
        <p style="font-size:12px;">Spend Warrior Spirit in the Start Menu's <strong>Upgrades</strong> tab to unlock permanent starting buffs!</p>
        <button class="px-btn primary" id="death-menu-btn">Return to Start Menu</button>
      `);
      document.getElementById("death-menu-btn").onclick = () => {
        gameState = null;
        showStartMenu();
      };
      return;
    }

    // VICTORY!
    const p = gameState.player;
    const bout = gameState.campaign[res.boutIndex];
    bout.beaten = true;
    p.wins++;
    p.gold += res.goldDrop;
    p.xp += res.xpGain;

    let leveledUp = false;
    while (p.xp >= p.xpToNext) {
      p.xp -= p.xpToNext;
      p.level++;
      p.unspentPoints += 3;
      p.xpToNext = Math.round(p.xpToNext * 1.35);
      leveledUp = true;
    }

    res.drops.forEach((d) => {
      if (d.kind === "item") {
        const ex = p.inventory.find((e) => e.kind === "item" && e.item.id === d.item.id);
        if (ex) ex.qty++;
        else p.inventory.push({ kind: "item", item: d.item, qty: 1 });
      } else {
        p.inventory.push({ kind: d.kind, item: d.item, qty: 1 });
      }
    });

    // Refresh shop every 5 enemies beaten (respecting locked items!)
    gameState.winsSinceRefresh++;
    let shopRefreshed = false;
    if (gameState.winsSinceRefresh >= 5) {
      gameState.winsSinceRefresh = 0;
      refreshUnlockedShopSlots();
      shopRefreshed = true;
    }

    const dropLines = res.drops.map((d) => `• Found <strong>${d.item.name}</strong>!`).join("<br/>");
    openModal(`
      <div class="modal-header">
        <h2>VICTORY! (${res.boutIndex === 20 ? "AREA 1 CHAMPION!" : `Bout #${res.boutIndex + 1}`})</h2>
      </div>
      <div style="font-size:13px; display:flex; flex-direction:column; gap:6px;">
        <div>Gold Looted: <strong style="color:var(--gold);">+${res.goldDrop}g</strong></div>
        <div>XP Gained: <strong>+${res.xpGain} XP</strong> ${leveledUp ? "<strong style='color:#4ade80;'>— LEVEL UP! (+3 Stat Points)</strong>" : ""}</div>
        ${dropLines ? `<div>${dropLines}</div>` : ""}
        ${shopRefreshed ? `<div style="color:#93c5fd;">Honest Barnaby refreshed unlocked shop items!</div>` : ""}
      </div>
      <div style="margin-top:12px;">
        <button class="px-btn success" id="win-cont-btn">${res.gotSkillBook ? "Open Skill Book Drop! →" : "Continue to Courtyard"}</button>
      </div>
    `);

    document.getElementById("win-cont-btn").onclick = () => {
      if (res.gotSkillBook) {
        openSkillBookPicker(() => showTrainingHub());
      } else {
        showTrainingHub();
      }
    };
  }

  function openSkillBookPicker(onDone) {
    const p = gameState.player;
    const learnedIds = new Set(p.skills.map((s) => s.id));
    const available = MG.Data.SKILLS.filter((s) => !learnedIds.has(s.id));

    if (available.length === 0) {
      toast("You already know every skill! +25 Gold instead.");
      p.gold += 25;
      if (onDone) onDone();
      else closeModal();
      return;
    }

    // Weighted pool: player's own class appears twice!
    const weighted = [];
    available.forEach((s) => {
      weighted.push(s);
      if (s.cls === p.cls) weighted.push(s);
    });

    const choices = [];
    const pickedIds = new Set();
    let guard = 0;
    while (choices.length < Math.min(3, available.length) && guard < 100) {
      guard++;
      const pick = weighted[Math.floor(Math.random() * weighted.length)];
      if (!pickedIds.has(pick.id)) {
        pickedIds.add(pick.id);
        choices.push(pick);
      }
    }

    const cards = choices
      .map(
        (s, i) => `
        <div class="wooden-box" style="padding:10px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div>
            <strong style="color:var(--gold);">${s.name}</strong> <span style="font-size:11px; color:#93c5fd;">[${s.cls.toUpperCase()} | ${s.mp} MP]</span>
            <div style="font-size:12px;">${s.desc}</div>
          </div>
          <button class="px-btn success small pick-skl-btn" data-i="${i}">Learn</button>
        </div>`
      )
      .join("");

    openModal(`
      <div class="modal-header">
        <h2>SKILL BOOK — PICK 1 OF ${choices.length}</h2>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px;">${cards}</div>
    `);

    document.querySelectorAll(".pick-skl-btn").forEach((b) => {
      b.onclick = () => {
        const chosen = choices[Number(b.dataset.i)];
        p.skills.push(chosen);
        MG.Audio.playSfx("spell");
        toast(`Learned ${chosen.name}!`);
        if (onDone) onDone();
        else closeModal();
      };
    });
  }

  return {
    toast,
    showStartMenu,
    getScreen,
    getGameState,
    getCreatorDraft,
    handleGlobalKeyDown
  };
})();

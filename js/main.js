// =========================================================
// js/main.js — Game Loop, Canvas Scene Renderer & Boot
// =========================================================
(function () {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const loadingScreen = document.getElementById("loading-screen");
  const loadingBar = document.getElementById("loading-bar");
  const loadingText = document.getElementById("loading-text");

  let lastTime = performance.now();

  function renderScene(dt) {
    const screen = MG.UI.getScreen();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // 1. Background per screen
    let bgId = "bg_start_menu";
    if (screen === "creator") bgId = "bg_char_creator";
    else if (screen === "hub") bgId = "bg_training_hub";
    else if (screen === "combat") bgId = "bg_arena_mudpit";

    const bg = MG.Assets.get(bgId);
    if (bg) {
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    }

    // 2. Screen-specific character & world sprites
    if (screen === "creator") {
      const draft = MG.UI.getCreatorDraft();
      if (draft) {
        const previewChar = {
          gender: draft.gender,
          race: draft.race,
          cls: draft.cls,
          appearance: {
            headId: draft.headId,
            hairId: draft.hairId,
            accId: draft.accId,
            skinColor: draft.skinColor,
            hairColor: draft.hairColor,
            eyeColor: draft.eyeColor,
            clothColor: draft.clothColor,
            customFaceData: draft.customFaceData
          },
          equippedWeapon: MG.Data.WEAPONS[MG.Data.CLASSES[draft.cls].starterWeapon],
          equippedArmor: MG.Data.ARMORS[MG.Data.CLASSES[draft.cls].starterArmor]
        };
        const bob = Math.sin(Date.now() * 0.004) * 3;
        MG.Character.drawCharacter(ctx, previewChar, 180, 415 + bob, 210);
      }
    } else if (screen === "hub") {
      const gs = MG.UI.getGameState();
      if (gs && gs.player) {
        const bob = Math.sin(Date.now() * 0.0035) * 3;
        // Honest Barnaby on left near wagon
        const barnaby = MG.Assets.get("npc_honest_barnaby");
        if (barnaby) {
          const bh = 165;
          const bw = (barnaby.width / barnaby.height) * bh;
          ctx.drawImage(barnaby, 145 - bw / 2, 415 - bh, bw, bh);
        }
        // Player in center yard
        MG.Character.drawCharacter(ctx, gs.player, 480, 425 + bob, 195);
      }
    } else if (screen === "combat") {
      MG.Combat.drawCombatScene(ctx, dt);
    }
  }

  function loop(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    renderScene(dt);
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (e) => {
    MG.UI.handleGlobalKeyDown(e);
  });

  // Boot & Preload all 94+ pixel art assets
  MG.Assets.loadAll((done, total) => {
    const pct = Math.round((done / total) * 100);
    loadingBar.style.width = `${pct}%`;
    loadingText.textContent = `Loading 32-bit pixel art... ${done}/${total} (${pct}%)`;
  }).then(() => {
    loadingScreen.classList.remove("active");
    MG.UI.showStartMenu();
    lastTime = performance.now();
    requestAnimationFrame(loop);
  });
})();

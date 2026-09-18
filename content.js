(() => {
  "use strict";

  const DEFAULT_CFG = {
    toggleRating: true,
    toggleTitle: true,
    togglePremium: true,
    togglePfp: true,
    toggleUsername: false,
    toggleFlag: true,
    toggleFlair: true,
    toggleConnection: true,
    toggleFakeTitle: false,
    fakeTitleValue: "GM",
    toggleFakeElo: false,
    fakeEloValue: 1500,
    toggleFakePremium: false,
    fakeBadgeValue: "diamond",
    toggleFakeFlair: false,
    mode: "question",
    blurStrength: 50
  };

  let cfg = { ...DEFAULT_CFG };

  const HIDE_CLASSES = [
    "ch-hider-question",
    "ch-hider-blur",
    "ch-hider-pfp-question",
    "ch-hider-pfp-blur",
    "ch-hider-image-hidden",
    "ch-hider-image-wrapper-question",
    "ch-hider-image-blur",
    "ch-hider-remove",
    "ch-hider-pfp-remove",
    "ch-hider-image-remove"
  ];

  function getOpponent() {
    // On Chess.com's live-game layout:
    // top = opponent, bottom = current user.
    return document.querySelector(".player-component.player-top");
  }

  function clearOldHiding() {
    document.querySelectorAll(
      HIDE_CLASSES.map(c => "." + c).join(",")
    ).forEach(el => {
      el.classList.remove(...HIDE_CLASSES);
    });
  }

  function hideNormal(el) {
    if (!el) return;

    el.classList.remove(
      "ch-hider-question",
      "ch-hider-blur",
      "ch-hider-remove"
    );

    if (cfg.mode === "blur") {
      el.classList.add("ch-hider-blur");
    } else if (cfg.mode === "remove") {
      el.classList.add("ch-hider-remove");
    } else {
      el.classList.add("ch-hider-question");
    }
  }

  function hideAvatar(img) {
    if (!img) return;

    /*
     * <img> pseudo-elements are unreliable, so use its wrapper
     * for question-mark mode.
     */
    const wrapper = img.parentElement;
    if (!wrapper) return;

    wrapper.classList.remove(
      "ch-hider-pfp-question",
      "ch-hider-pfp-blur",
      "ch-hider-pfp-remove"
    );

    if (cfg.mode === "blur") {
      wrapper.classList.add("ch-hider-pfp-blur");
    } else if (cfg.mode === "remove") {
      wrapper.classList.add("ch-hider-pfp-remove");
    } else {
      wrapper.classList.add("ch-hider-pfp-question");
    }
  }

  function hideImageLike(el) {
    if (!el) return;

    // Remove any previously applied image-hiding classes.
    el.classList.remove(
      "ch-hider-image-hidden",
      "ch-hider-image-wrapper-question",
      "ch-hider-image-blur",
      "ch-hider-image-remove"
    );
    el.parentElement?.classList.remove("ch-hider-image-wrapper-question");

    if (cfg.mode === "blur") {
      el.classList.add("ch-hider-image-blur");
      return;
    }

    if (cfg.mode === "remove") {
      el.classList.add("ch-hider-image-remove");
      return;
    }

    const parent = el.parentElement;
    if (!parent) {
      el.style.visibility = "hidden";
      return;
    }

    el.classList.add("ch-hider-image-hidden");
    parent.classList.add("ch-hider-image-wrapper-question");
  }

  function findTitle(opponent) {
    /*
     * Don't use generic [class*=title] because Chess.com can have
     * unrelated UI elements containing "title".
     *
     * Search small elements inside the opponent card for an actual
     * chess title.
     */
    const TITLE_RE = /^(GM|IM|FM|CM|NM|WGM|WIM|WFM|WCM|WNM)$/i;

    const candidates = opponent.querySelectorAll(
      "span, div, a"
    );

    for (const el of candidates) {
      const text = el.textContent?.trim();

      if (
        text &&
        TITLE_RE.test(text) &&
        el.children.length === 0
      ) {
        return el;
      }
    }

    return null;
  }

  function findPremiumBadge(opponent) {
    /*
     * Premium badge classes may vary by membership tier.
     * First try Chess.com's user-badge components.
     */
    return opponent.querySelector(
      '[class*="cc-user-badge"], [class*="user-badge"]'
    );
  }

  function applyBlurStrength() {
    const strength = Math.max(0, Math.min(100, cfg.blurStrength || 0));

    document.documentElement.style.setProperty(
      "--ch-blur-mult",
      (strength / 50).toFixed(2)
    );
  }

  function applyFakeTitle() {
    const existing = document.querySelector(".ch-hider-fake-title");
    const bottom = document.querySelector(
      ".player-component.player-bottom"
    );

    if (!cfg.toggleFakeTitle) {
      existing?.remove();
      return;
    }

    if (!bottom) return;

    const title = cfg.fakeTitleValue || "GM";

    if (existing) {
      if (existing.textContent !== title) {
        existing.textContent = title;
      }
      return;
    }

    const username = bottom.querySelector(
      '[data-test-element="user-tagline-username"]'
    );

    if (!username) return;

    const span = document.createElement("span");

    span.className =
      "ch-hider-fake-title cc-user-title-component cc-text-x-small-bold";
    span.textContent = cfg.fakeTitleValue || "GM";

    username.insertAdjacentElement("beforebegin", span);
  }

  function applyFakeElo() {
    const bottom = document.querySelector(
      ".player-component.player-bottom"
    );

    if (!bottom) return;

    const rating = bottom.querySelector(
      '[class*="cc-user-rating"]'
    );

    if (!rating) return;

    if (!cfg.toggleFakeElo) {
      if (rating.dataset.chFakeElo !== undefined) {
        rating.textContent = rating.dataset.chFakeElo;
        delete rating.dataset.chFakeElo;
      }
      return;
    }

    if (rating.dataset.chFakeElo === undefined) {
      rating.dataset.chFakeElo = rating.textContent;
    }

    rating.textContent = rating.dataset.chFakeElo.replace(
      /\d+/,
      String(cfg.fakeEloValue ?? 1500)
    );
  }

  const FAKE_BADGE_TIERS = {
    diamond: {
      cls: "cc-user-badge-diamond",
      glyph: "membership-tier-diamond",
      b: "badge-diamond",
      vb: "0 0 24 24",
      path:
        "m22.57 8.87-9.7 12.67c-.63.8-1.1.8-1.73 0l-9.7-12.67c-.63-.8-.6-1.43.13-2.17l3.43-3.67c.73-.73 1.4-1.03 2.43-1.03h9.13c1.03 0 1.7.3 2.43 1.03l3.43 3.67c.73.73.77 1.37.13 2.17zm0 0"
    },
    gold: {
      cls: "cc-user-badge-gold",
      glyph: "membership-tier-gold",
      b: "badge-gold",
      vb: "0 0 24 24",
      path:
        "m2.47 10.57c-1.9-1.57-1.57-2.57.9-2.63l5.3-.13 1.97-5.37c.83-2.33 1.9-2.33 2.73 0l1.97 5.3 5.3.17c2.47.1 2.8 1.1.9 2.67l-4.3 3.5 1.57 5.1c.73 2.37-.13 3-2.2 1.67l-4.6-2.93-4.6 2.97c-2.07 1.33-2.93.7-2.2-1.67l1.57-5.13zm0 0"
    },
    platinum: {
      cls: "cc-user-badge-platinum",
      glyph: "membership-tier-platinum",
      b: "badge-platinum",
      vb: "0 0 90 90",
      path:
        "M16 35.78v18.005a9.16 9.16 0 0 0 2.946 6.73l.393.363c14.691 13.564 37.392 13.381 51.864-.417A9.024 9.024 0 0 0 74 53.931V35.05L69.774 1.206a1.377 1.377 0 0 0-2.621-.395l-21.687 48.11L23.786.822a1.396 1.396 0 0 0-2.653.369L16 35.78z"
    }
  };

  function applyFakePremium() {
    const existing = document.querySelector(".ch-hider-fake-badge");
    const bottom = document.querySelector(
      ".player-component.player-bottom"
    );

    if (!cfg.toggleFakePremium) {
      existing?.remove();
      return;
    }

    const tier =
      FAKE_BADGE_TIERS[cfg.fakeBadgeValue] || FAKE_BADGE_TIERS.diamond;

    if (existing && existing.dataset.chTier === tier.b) return;
    existing?.remove();

    if (!bottom) return;

    const username = bottom.querySelector(
      '[data-test-element="user-tagline-username"]'
    );

    if (!username) return;

    const badge = document.createElement("a");

    badge.className =
      "ch-hider-fake-badge cc-user-badge-component " + tier.cls;
    badge.href = "/membership?b=" + tier.b;
    badge.target = "_blank";
    badge.dataset.chTier = tier.b;

    badge.innerHTML =
      '<span aria-hidden="true" class="cc-icon-glyph_57606db cc-icon-size-12_57606db">' +
      '<svg data-glyph="' + tier.glyph + '" aria-hidden="true" viewBox="' +
      tier.vb + '" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="' + tier.path + '"></path></svg></span>';

    username.insertAdjacentElement("beforebegin", badge);
  }

  function applyFakeFlair() {
    const existing = document.querySelector(".ch-hider-fake-flair");
    const bottom = document.querySelector(
      ".player-component.player-bottom"
    );

    if (!cfg.toggleFakeFlair) {
      existing?.remove();
      return;
    }

    if (!bottom || existing) return;

    const username = bottom.querySelector(
      '[data-test-element="user-tagline-username"]'
    );

    const flag = bottom.querySelector(".cc-country-flag-component");
    const anchor = flag || username;

    if (!anchor) return;

    const img = document.createElement("img");

    img.className = "ch-hider-fake-flair flair-rpc-component flair-rpc-small";
    img.src =
      "https://images.chesscomfiles.com/chess-flair/membership_icons/diamond_traditional.svg";
    img.alt = "Show your flair!";
    img.width = 16;
    img.height = 16;

    anchor.insertAdjacentElement("afterend", img);
  }

  function applyHiding() {
    clearOldHiding();
    applyBlurStrength();
    applyFakeTitle();
    applyFakeElo();
    applyFakePremium();
    applyFakeFlair();

    const opponent = getOpponent();

    // Not currently on a supported live-game layout.
    if (!opponent) return;

    // USERNAME
    if (cfg.toggleUsername) {
      const username = opponent.querySelector(
        '[data-test-element="user-tagline-username"]'
      );

      hideNormal(username);
    }

    // RATING
    if (cfg.toggleRating) {
      const rating = opponent.querySelector(
        '[class*="cc-user-rating"]'
      );

      hideNormal(rating);
    }

    // COUNTRY FLAG
    if (cfg.toggleFlag) {
      const flag = opponent.querySelector(
        ".cc-country-flag-component"
      );

      hideImageLike(flag);
    }

    // PROFILE PICTURE
    if (cfg.togglePfp) {
      const avatar = opponent.querySelector(
        ".cc-avatar-img"
      );

      hideAvatar(avatar);
    }

    // CHESS TITLE
    if (cfg.toggleTitle) {
      const title = findTitle(opponent);
      hideNormal(title);
    }

    // PREMIUM BADGE
    if (cfg.togglePremium) {
      const premium = findPremiumBadge(opponent);
      hideNormal(premium);
    }

    // FLAIR
    if (cfg.toggleFlair) {
      const flair = opponent.querySelector(
        ".flair-rpc-opponent, [class*='flair-rpc']"
      );

      hideImageLike(flair);
    }

    // CONNECTION STRENGTH
    if (cfg.toggleConnection) {
      document.querySelectorAll(
        ".connection-component"
      ).forEach(hideNormal);
    }
  }

  let scheduled = false;

  function scheduleApply() {
    if (scheduled) return;

    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      applyHiding();
    });
  }

  function startObserver() {
    const observer = new MutationObserver(() => {
      scheduleApply();
    });

    /*
     * IMPORTANT:
     * Do NOT observe attributes here.
     *
     * Our extension changes class attributes itself. Watching
     * attributes would make our own hiding classes trigger the
     * observer again.
     */
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  chrome.runtime.onMessage.addListener(message => {
    if (message?.type !== "update-config") return;

    cfg = {
      ...DEFAULT_CFG,
      ...message.config
    };

    scheduleApply();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;

    let changed = false;

    for (const key of Object.keys(changes)) {
      if (key in DEFAULT_CFG && changes[key].newValue !== undefined) {
        cfg[key] = changes[key].newValue;
        changed = true;
      }
    }

    if (changed) {
      cfg = { ...DEFAULT_CFG, ...cfg };
      scheduleApply();
    }
  });

  chrome.storage.local.get(DEFAULT_CFG, stored => {
    cfg = {
      ...DEFAULT_CFG,
      ...stored
    };

    applyHiding();
    startObserver();

    console.log("[Extra Chess.com Focus Mode] loaded");
  });
})();
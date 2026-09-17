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
    mode: "question"
  };

  let cfg = { ...DEFAULT_CFG };

  const HIDE_CLASSES = [
    "ch-hider-question",
    "ch-hider-blur",
    "ch-hider-pfp-question",
    "ch-hider-pfp-blur",
    "ch-hider-image-hidden",
    "ch-hider-image-wrapper-question",
    "ch-hider-image-blur"
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

    el.classList.remove("ch-hider-question", "ch-hider-blur");

    if (cfg.mode === "blur") {
      el.classList.add("ch-hider-blur");
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
      "ch-hider-pfp-blur"
    );

    if (cfg.mode === "blur") {
      wrapper.classList.add("ch-hider-pfp-blur");
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
      "ch-hider-image-blur"
    );
    el.parentElement?.classList.remove("ch-hider-image-wrapper-question");

    if (cfg.mode === "blur") {
      el.classList.add("ch-hider-image-blur");
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

  function applyHiding() {
    clearOldHiding();

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

  chrome.storage.local.get(DEFAULT_CFG, stored => {
    cfg = {
      ...DEFAULT_CFG,
      ...stored
    };

    applyHiding();
    startObserver();

    console.log("[Chess Opponent Hider] loaded");
  });
})();
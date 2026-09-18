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

const IDS = [
  "toggleRating",
  "toggleTitle",
  "togglePremium",
  "togglePfp",
  "toggleUsername",
  "toggleFlag",
  "toggleFlair",
  "toggleConnection",
  "toggleFakeTitle",
  "toggleFakeElo",
  "toggleFakePremium",
  "toggleFakeFlair"
];

function updateBlurVisibility() {
  const row = document.getElementById("blurRow");

  if (!row) return;

  row.style.display =
    document.getElementById("mode")?.value === "blur" ? "" : "none";
}

function updateFakeTitleVisibility() {
  const row = document.getElementById("fakeTitleRow");

  if (!row) return;

  row.style.display =
    document.getElementById("toggleFakeTitle")?.checked ? "" : "none";
}

function updateFakeEloVisibility() {
  const row = document.getElementById("fakeEloRow");

  if (!row) return;

  row.style.display =
    document.getElementById("toggleFakeElo")?.checked ? "" : "none";
}

function updateFakeBadgeVisibility() {
  const row = document.getElementById("fakeBadgeRow");

  if (!row) return;

  row.style.display =
    document.getElementById("toggleFakePremium")?.checked ? "" : "none";
}

function setCfg(cfg) {
  for (const id of IDS) {
    const el = document.getElementById(id);

    if (el) {
      el.checked = Boolean(cfg[id]);
    }
  }

  const mode = document.getElementById("mode");

  if (mode) {
    mode.value = cfg.mode || "question";
    updateBlurVisibility();
  }

  const blur = document.getElementById("blurStrength");

  if (blur) {
    blur.value = cfg.blurStrength ?? 50;

    const value = document.getElementById("blurStrengthValue");

    if (value) {
      value.textContent = blur.value;
    }
  }

  const fakeTitle = document.getElementById("fakeTitleValue");

  if (fakeTitle) {
    fakeTitle.value = cfg.fakeTitleValue || "GM";
  }

  const fakeElo = document.getElementById("fakeEloValue");

  if (fakeElo) {
    fakeElo.value = cfg.fakeEloValue ?? 1500;
  }

  const fakeBadge = document.getElementById("fakeBadgeValue");

  if (fakeBadge) {
    fakeBadge.value = cfg.fakeBadgeValue || "diamond";
  }

  updateFakeTitleVisibility();
  updateFakeEloVisibility();
  updateFakeBadgeVisibility();
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(DEFAULT_CFG, setCfg);

  for (const id of IDS) {
    document.getElementById(id)?.addEventListener(
      "change",
      save
    );
  }

  document.getElementById("mode")?.addEventListener(
    "change",
    () => {
      updateBlurVisibility();
      save();
    }
  );

  document.getElementById("toggleFakeTitle")?.addEventListener(
    "change",
    updateFakeTitleVisibility
  );

  document.getElementById("fakeTitleValue")?.addEventListener(
    "change",
    save
  );

  document.getElementById("toggleFakeElo")?.addEventListener(
    "change",
    updateFakeEloVisibility
  );

  document.getElementById("fakeEloValue")?.addEventListener(
    "change",
    save
  );

  document.getElementById("toggleFakePremium")?.addEventListener(
    "change",
    updateFakeBadgeVisibility
  );

  document.getElementById("fakeBadgeValue")?.addEventListener(
    "change",
    save
  );

  document.getElementById("fakeEloUpdate")?.addEventListener(
    "click",
    save
  );

  document.getElementById("blurStrength")?.addEventListener(
    "input",
    () => {
      const value = document.getElementById("blurStrengthValue");

      if (value) {
        value.textContent = document.getElementById("blurStrength")?.value ?? 50;
      }

      save();
    }
  );
});

function save() {
  const cfg = {
    toggleRating:
      document.getElementById("toggleRating")?.checked ?? true,

    toggleTitle:
      document.getElementById("toggleTitle")?.checked ?? true,

    togglePremium:
      document.getElementById("togglePremium")?.checked ?? true,

    togglePfp:
      document.getElementById("togglePfp")?.checked ?? true,

    toggleUsername:
      document.getElementById("toggleUsername")?.checked ?? false,

    toggleFlag:
      document.getElementById("toggleFlag")?.checked ?? true,

    toggleFlair:
      document.getElementById("toggleFlair")?.checked ?? true,

    toggleConnection:
      document.getElementById("toggleConnection")?.checked ?? true,

    toggleFakeTitle:
      document.getElementById("toggleFakeTitle")?.checked ?? false,

    fakeTitleValue:
      document.getElementById("fakeTitleValue")?.value || "GM",

    toggleFakeElo:
      document.getElementById("toggleFakeElo")?.checked ?? false,

    fakeEloValue:
      Number(document.getElementById("fakeEloValue")?.value) ?? 1500,

    toggleFakePremium:
      document.getElementById("toggleFakePremium")?.checked ?? false,

    fakeBadgeValue:
      document.getElementById("fakeBadgeValue")?.value || "diamond",

    toggleFakeFlair:
      document.getElementById("toggleFakeFlair")?.checked ?? false,

    mode:
      document.getElementById("mode")?.value || "question",

    blurStrength:
      Number(document.getElementById("blurStrength")?.value) ?? 50
  };

  chrome.storage.local.set(cfg);

  sendCfgToTabs(cfg);
}

function sendCfgToTabs(cfg) {
  chrome.tabs.query({}, tabs => {
    for (const tab of tabs) {
      if (!tab.id) continue;

      if (!/^https:\/\/(www\.)?chess\.com\//.test(tab.url || "")) {
        continue;
      }

      chrome.tabs.sendMessage(
        tab.id,
        {
          type: "update-config",
          config: cfg
        },
        () => {
          // Ignore pages where the content script isn't loaded.
          void chrome.runtime.lastError;
        }
      );
    }
  });
}
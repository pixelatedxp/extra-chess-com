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

const IDS = [
  "toggleRating",
  "toggleTitle",
  "togglePremium",
  "togglePfp",
  "toggleUsername",
  "toggleFlag",
  "toggleFlair"
];

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(DEFAULT_CFG, cfg => {
    for (const id of IDS) {
      const el = document.getElementById(id);

      if (el) {
        el.checked = Boolean(cfg[id]);
      }
    }

    const mode = document.getElementById("mode");

    if (mode) {
      mode.value = cfg.mode || "question";
    }
  });

  for (const id of IDS) {
    document.getElementById(id)?.addEventListener(
      "change",
      save
    );
  }

  document.getElementById("mode")?.addEventListener(
    "change",
    save
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

    mode:
      document.getElementById("mode")?.value || "question"
  };

  chrome.storage.local.set(cfg);

  chrome.tabs.query(
    {
      active: true,
      currentWindow: true
    },
    tabs => {
      const tab = tabs[0];

      if (!tab?.id) return;

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
  );
}
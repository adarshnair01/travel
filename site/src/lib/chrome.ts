// Site-wide interactions: theme toggle, mobile menu, ⌘K search (Pagefind, lazy-loaded).

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function setTheme(t: "light" | "dark") {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem("theme", t);
  } catch {}
  document.dispatchEvent(new CustomEvent("themechange", { detail: t }));
}

let searchLoaded: Promise<void> | null = null;

function loadSearch(): Promise<void> {
  if (searchLoaded) return searchLoaded;
  searchLoaded = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = `${BASE}/pagefind/pagefind-ui.css`;
    document.head.append(css);
    const s = document.createElement("script");
    s.src = `${BASE}/pagefind/pagefind-ui.js`;
    s.onload = () => {
      // @ts-expect-error provided by pagefind-ui.js
      new window.PagefindUI({
        element: "#pagefind-search",
        showSubResults: true,
        showImages: false,
        resetStyles: false,
        pageSize: 8,
        autofocus: true,
      });
      resolve();
    };
    s.onerror = () => {
      const el = document.getElementById("pagefind-search");
      if (el) el.innerHTML = `<p class="muted">Search index is built during <code>npm run build</code>. It isn't available in dev mode.</p>`;
      reject();
    };
    document.head.append(s);
  });
  return searchLoaded;
}

export function initChrome() {
  const root = document.documentElement;

  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });

  const menuBtn = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  menuBtn?.addEventListener("click", () => {
    const open = root.classList.toggle("menu-open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });

  const dialog = document.querySelector<HTMLDialogElement>(".search-dialog");
  const open = async (query?: string) => {
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    await loadSearch().catch(() => {});
    const input = dialog.querySelector<HTMLInputElement>(".pagefind-ui__search-input");
    if (input) {
      if (query) {
        input.value = query;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      input.focus();
    }
  };
  document.querySelectorAll("[data-search-open]").forEach((b) => b.addEventListener("click", () => open()));
  document.querySelector("[data-search-close]")?.addEventListener("click", () => dialog?.close());
  dialog?.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  // Warm up the index when the user shows intent.
  document.querySelector("[data-search-open]")?.addEventListener("pointerenter", () => loadSearch().catch(() => {}), { once: true });

  document.addEventListener("keydown", (e) => {
    const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]");
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
      e.preventDefault();
      open();
    }
  });

  const kbd = document.querySelector(".search-trigger .kbd");
  if (kbd && !/Mac|iPhone|iPad/.test(navigator.platform)) kbd.textContent = "Ctrl K";
}

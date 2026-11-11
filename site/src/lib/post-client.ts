// Story pages: reading progress, share, likes/loves/share counts, back-to-top,
// in-article ad placement, and a lightbox for photos in the story body.

import { track } from "./monetize";

interface PostConfig {
  title: string;
  url: string;
  react?: { api: string; ns: string; key: string } | null;
}

/** localStorage can throw (private mode, blocked storage); counts still work without it. */
const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};

function toast(msg: string) {
  const el = document.querySelector<HTMLElement>(".toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1800);
}

function progressAndTop() {
  const bar = document.querySelector<HTMLElement>(".progress");
  const article = document.querySelector<HTMLElement>(".prose");
  const top = document.querySelector<HTMLElement>("[data-to-top]");
  if (!article) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = article.getBoundingClientRect();
    const total = r.height - window.innerHeight * 0.6;
    const p = Math.min(1, Math.max(0, -r.top / Math.max(total, 1)));
    if (bar) bar.style.transform = `scaleX(${p})`;
    top?.classList.toggle("show", window.scrollY > 900);
  };
  addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
  top?.addEventListener("click", () => scrollTo({ top: 0 }));
}

function share(cfg: PostConfig, onShare: (method: string) => void) {
  document.querySelector("[data-share]")?.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: cfg.title, url: cfg.url });
        onShare("native");
        return;
      } catch {
        /* cancelled: fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(cfg.url);
      toast("Link copied");
      onShare("copy");
    } catch {
      toast(cfg.url);
    }
  });
  document.querySelectorAll<HTMLAnchorElement>("[data-share-net]").forEach((a) =>
    a.addEventListener("click", () => onShare(a.dataset.shareNet ?? "link")),
  );
  document.querySelector("[data-copy-link]")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(cfg.url);
      toast("Link copied");
      onShare("copy");
    } catch {
      toast(cfg.url);
    }
  });
}

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K` : String(n));

/**
 * Public view / like / love / share counters. Each browser counts once per story per reaction,
 * and a view counts again only after a day, so refreshes don't inflate it.
 */
function reactions(cfg: PostConfig) {
  const r = cfg.react;
  const noop = (method: string) => track("share", { method, content_type: "story", item_id: location.pathname });
  if (!r) return noop;
  const kinds = ["view", "like", "love", "share"] as const;
  type Kind = (typeof kinds)[number];
  const counts: Record<Kind, number> = { view: 0, like: 0, love: 0, share: 0 };
  const done = (k: Kind) => store.get(`wn:${r.key}:${k}`) === "1";
  const endpoint = (op: "get" | "hit", k: Kind) => `${r.api}/${op}/${r.ns}/${r.key}-${k}`;

  const paint = () => {
    for (const k of kinds) {
      document.querySelectorAll<HTMLElement>(`[data-count="${k}"]`).forEach((el) => {
        el.textContent = compact(counts[k]);
        if (el.closest(".react-btn")) el.hidden = counts[k] === 0;
      });
    }
    const tally = document.querySelector<HTMLElement>("[data-share-tally]");
    if (tally) tally.hidden = counts.share === 0;
    const word = document.querySelector("[data-share-word]");
    if (word) word.textContent = counts.share === 1 ? "time" : "times";
    const views = document.querySelector<HTMLElement>("[data-views]");
    if (views) {
      views.hidden = counts.view === 0;
      const w = views.querySelector("[data-view-word]");
      if (w) w.textContent = counts.view === 1 ? "view" : "views";
    }
    const summary = document.querySelector<HTMLElement>("[data-react-summary]");
    if (summary) summary.hidden = counts.like + counts.love + counts.share === 0;
    document.querySelectorAll<HTMLButtonElement>("[data-react]").forEach((b) => {
      const on = done(b.dataset.react as Kind);
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("on", on);
    });
  };

  // The counter service can be slow: give up after a few seconds so the page never waits on it.
  const fetchCount = async (op: "get" | "hit", k: Kind, tries = op === "hit" ? 2 : 1): Promise<number | null> => {
    try {
      const res = await fetch(endpoint(op, k), { signal: AbortSignal.timeout(6000) });
      if (res.status >= 500 && tries > 1) return fetchCount(op, k, tries - 1);
      if (res.status === 404) return 0;
      if (!res.ok) return null;
      const v = Number((await res.json()).value);
      return Number.isFinite(v) ? v : null;
    } catch {
      return null; // timed out or offline: a timed-out hit may still have counted, so don't retry
    }
  };

  const bump = async (k: Kind) => {
    if (done(k)) return false;
    store.set(`wn:${r.key}:${k}`, "1");
    counts[k] += 1;
    paint();
    const v = await fetchCount("hit", k);
    if (v !== null) {
      counts[k] = Math.max(v, counts[k]);
      paint();
    }
    return true;
  };

  // Count this visit as a view unless this browser already did in the last 24 hours.
  const viewKey = `wn:${r.key}:viewed`;
  const lastView = Number(store.get(viewKey) ?? 0);
  const countView = Date.now() - lastView > 864e5;
  if (countView) store.set(viewKey, String(Date.now()));

  Promise.all(kinds.map((k) => fetchCount(k === "view" && countView ? "hit" : "get", k))).then((vals) => {
    vals.forEach((v, i) => {
      if (v !== null) counts[kinds[i]] = Math.max(v, counts[kinds[i]]);
    });
    paint();
  });
  paint();

  document.querySelectorAll<HTMLButtonElement>("[data-react]").forEach((b) =>
    b.addEventListener("click", async () => {
      const k = b.dataset.react as Kind;
      if (await bump(k)) {
        track(k === "like" ? "story_like" : "story_love", { item_id: location.pathname });
        toast(k === "like" ? "Thanks for the like!" : "Thanks for the love!");
      } else toast("You've already reacted. Thank you!");
    }),
  );

  return (method: string) => {
    noop(method);
    void bump("share");
  };
}

/** Click any photo in the story to view it full-screen. */
function lightbox() {
  const imgs = [...document.querySelectorAll<HTMLImageElement>(".prose img")];
  if (!imgs.length) return;
  const dlg = document.createElement("dialog");
  dlg.className = "lightbox";
  dlg.innerHTML = `<button class="icon-btn" type="button" aria-label="Close">✕</button><img alt="" /><p></p>`;
  document.body.append(dlg);
  const big = dlg.querySelector("img")!;
  const cap = dlg.querySelector("p")!;
  dlg.addEventListener("click", () => dlg.close());
  imgs.forEach((img) => {
    img.tabIndex = 0;
    const open = () => {
      big.src = img.currentSrc || img.src;
      big.alt = img.alt;
      cap.textContent = img.alt;
      dlg.showModal();
    };
    img.addEventListener("click", open);
    img.addEventListener("keydown", (e) => e.key === "Enter" && open());
  });
}

/** Move in-article blocks (ads) after a paragraph at the given fraction of the story. */
function placeInline() {
  const prose = document.querySelector<HTMLElement>(".prose");
  if (!prose) return;
  const paras = [...prose.children].filter((el) => el.tagName === "P" && (el.textContent?.length ?? 0) > 80);
  document.querySelectorAll<HTMLElement>("[data-insert-at]").forEach((block) => {
    if (!block.firstElementChild || paras.length < 6) return block.remove();
    const i = Math.min(paras.length - 2, Math.max(2, Math.round(paras.length * Number(block.dataset.insertAt))));
    paras[i].after(block);
    block.hidden = false;
  });
}

export function initPost() {
  placeInline();
  const raw = document.getElementById("post-config")?.textContent;
  if (!raw) return;
  const cfg = JSON.parse(raw) as PostConfig;
  progressAndTop();
  share(cfg, reactions(cfg));
  lightbox();
}

// Analytics events + lazy AdSense loading.

type Gtag = (...args: unknown[]) => void;
const gtag: Gtag = (...args) => {
  const w = window as unknown as { gtag?: Gtag };
  if (typeof w.gtag === "function") w.gtag(...args);
};

export function track(name: string, params: Record<string, unknown> = {}) {
  gtag("event", name, params);
}

/** GA4 events: affiliate clicks (→ mark as a key event in GA), outbound links, search, share. */
export function initTracking() {
  document.addEventListener(
    "click",
    (e) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (!a) return;
      if (a.dataset.aff) {
        track("affiliate_click", {
          item_id: a.dataset.aff,
          placement: a.dataset.affPlacement,
          paid: a.dataset.affPaid !== "false",
          link_domain: a.hostname,
          page_path: location.pathname,
          transport_type: "beacon",
        });
      } else if (a.hostname && a.hostname !== location.hostname) {
        track("outbound_click", { link_url: a.href, link_domain: a.hostname, transport_type: "beacon" });
      }
    },
    { capture: true },
  );

  // Pagefind search queries (debounced).
  let t: number | undefined;
  document.addEventListener("input", (e) => {
    const el = e.target as HTMLInputElement;
    if (!el.matches?.(".pagefind-ui__search-input, #q")) return;
    clearTimeout(t);
    t = window.setTimeout(() => {
      const q = el.value.trim();
      if (q.length >= 3) track("search", { search_term: q, source: el.id === "q" ? "explore" : "site_search" });
    }, 1200);
  });
}

/**
 * Loads AdSense only after the reader interacts or the page has been idle a few seconds,
 * so ads never slow down the first paint (good for Core Web Vitals and therefore SEO).
 */
export function initAds() {
  const raw = document.getElementById("ads-config")?.textContent;
  const client = raw ? (JSON.parse(raw).client as string) : "";
  if (!client) return;

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    const s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    s.onload = () => {
      const w = window as unknown as { adsbygoogle: unknown[] };
      document.querySelectorAll("ins.adsbygoogle:not([data-adsbygoogle-status])").forEach((ins) => {
        if ((ins as HTMLElement).offsetParent === null) return; // hidden (e.g. sidebar on mobile)
        try {
          (w.adsbygoogle = w.adsbygoogle || []).push({});
        } catch {}
      });
    };
    document.head.append(s);
  };
  for (const ev of ["scroll", "pointerdown", "keydown", "touchstart"]) addEventListener(ev, start, { once: true, passive: true });
  setTimeout(start, 4000);
}

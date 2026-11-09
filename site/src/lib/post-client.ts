// Story pages: reading progress, share, back-to-top, in-article ad placement,
// and a lightbox for photos in the story body.

interface PostConfig {
  title: string;
  url: string;
}

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

function share(cfg: PostConfig) {
  document.querySelector("[data-share]")?.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: cfg.title, url: cfg.url });
        return;
      } catch {
        /* cancelled: fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(cfg.url);
      toast("Link copied");
    } catch {
      toast(cfg.url);
    }
  });
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
  share(cfg);
  lightbox();
}

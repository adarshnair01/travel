// Story comments: loads approved comments from Supabase when the section comes into view,
// and sends new ones to the post-comment Edge Function (Turnstile spam check, then moderation).

interface CommentsConfig {
  url: string;
  key: string;
  turnstile: string;
  post: string;
}

interface Comment {
  id: number;
  name: string;
  body: string;
  created_at: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function renderComment(c: Comment): HTMLElement {
  const li = document.createElement("li");
  li.className = "comment";
  const head = document.createElement("p");
  head.className = "comment-head";
  const who = document.createElement("b");
  who.textContent = c.name;
  const when = document.createElement("time");
  when.dateTime = c.created_at;
  when.textContent = dateFmt.format(new Date(c.created_at));
  head.append(who, " · ", when);
  const body = document.createElement("div");
  body.className = "comment-body";
  // Plain text only: paragraphs from blank lines, never HTML.
  for (const para of c.body.split(/\n{2,}/)) {
    const p = document.createElement("p");
    p.textContent = para;
    body.append(p);
  }
  li.append(head, body);
  return li;
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("script failed"));
    document.head.append(s);
  });
}

export function initComments() {
  const section = document.querySelector<HTMLElement>("[data-comments]");
  const cfgEl = document.getElementById("comments-config");
  if (!section || !cfgEl) return;
  const cfg: CommentsConfig = JSON.parse(cfgEl.textContent || "{}");
  const list = section.querySelector<HTMLOListElement>("[data-comment-list]")!;
  const status = section.querySelector<HTMLElement>("[data-comment-status]")!;
  const count = section.querySelector<HTMLElement>("[data-comment-count]")!;
  const form = section.querySelector<HTMLFormElement>("form")!;
  const note = form.querySelector<HTMLElement>("[data-form-note]")!;
  const button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
  const widget = form.querySelector<HTMLElement>("[data-turnstile]")!;
  const headers = { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` };
  let widgetId: string | undefined;
  let token = "";
  let started = false;

  async function load() {
    try {
      const q = new URLSearchParams({
        select: "id,name,body,created_at",
        post: `eq.${cfg.post}`,
        order: "created_at.asc",
      });
      const res = await fetch(`${cfg.url}/rest/v1/comments?${q}`, { headers });
      if (!res.ok) throw new Error(String(res.status));
      const rows: Comment[] = await res.json();
      list.replaceChildren(...rows.map(renderComment));
      count.textContent = rows.length ? `(${rows.length})` : "";
      status.textContent = rows.length ? "" : "No comments yet. Be the first to share a tip or a question.";
    } catch {
      status.textContent = "Comments couldn't be loaded right now.";
    }
  }

  async function startTurnstile() {
    if (!cfg.turnstile) return;
    try {
      if (!window.turnstile) await loadScript("https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit");
      widgetId = window.turnstile!.render(widget, {
        sitekey: cfg.turnstile,
        theme: document.documentElement.dataset.theme === "dark" ? "dark" : "auto",
        size: "flexible",
        callback: (t: string) => (token = t),
        "expired-callback": () => (token = ""),
        "error-callback": () => {
          token = "";
          note.textContent = "The spam check couldn't load. Please reload the page or disable blockers to comment.";
        },
      });
    } catch {
      note.textContent = "The spam check couldn't load. Please disable blockers for this page to comment.";
    }
  }

  function start() {
    if (started) return;
    started = true;
    load();
    startTurnstile();
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(section);
  } else start();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    if (cfg.turnstile && !token) {
      note.textContent = "Please wait a moment for the spam check, then try again.";
      return;
    }
    button.disabled = true;
    note.textContent = "Sending…";
    try {
      const res = await fetch(`${cfg.url}/functions/v1/post-comment`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          post: cfg.post,
          name: data.get("name"),
          body: data.get("body"),
          website: data.get("website"),
          token,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Couldn't send your comment. Please try again.");
      form.reset();
      note.textContent = "Thanks! Your comment will appear here once it's approved.";
    } catch (err) {
      note.textContent = err instanceof Error ? err.message : "Couldn't send your comment. Please try again.";
    } finally {
      button.disabled = false;
      token = "";
      if (widgetId !== undefined) window.turnstile?.reset(widgetId);
    }
  });
}

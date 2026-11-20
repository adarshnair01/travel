// Receives a new story comment, checks it, and stores it as 'pending' for moderation.
// Deploy: supabase functions deploy post-comment
// Secrets: supabase secrets set TURNSTILE_SECRET=... (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are built in)

const ALLOWED_ORIGINS = ["https://adarshnair.in", "http://localhost:4321"];
const POST_KEY = /^(dev\/)?\d{4}\/[a-z0-9-]{1,120}$/;
const MAX_PER_WINDOW = 3; // comments per visitor…
const WINDOW_MINUTES = 10; // …per this many minutes

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TURNSTILE_SECRET = Deno.env.get("TURNSTILE_SECRET") ?? "";

function cors(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    Vary: "Origin",
  };
}

function reply(status: number, body: unknown, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json" },
  });
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function db(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" }, origin);
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return reply(403, { error: "Forbidden" }, origin);

  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    return reply(400, { error: "Invalid request" }, origin);
  }

  const post = String(input.post ?? "");
  const name = String(input.name ?? "").trim().replace(/\s+/g, " ");
  const body = String(input.body ?? "").trim().replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  const token = String(input.token ?? "");

  // Honeypot: real readers never fill the hidden "website" field. Pretend success.
  if (input.website) return reply(201, { ok: true }, origin);

  if (!POST_KEY.test(post)) return reply(400, { error: "Unknown story" }, origin);
  if (name.length < 1 || name.length > 60) return reply(400, { error: "Please enter a name (up to 60 characters)." }, origin);
  if (body.length < 2 || body.length > 2000) return reply(400, { error: "Comments can be up to 2,000 characters." }, origin);
  if ((body.match(/https?:\/\//g) ?? []).length > 2) return reply(400, { error: "Please include no more than two links." }, origin);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "";

  // Cloudflare Turnstile check.
  if (!TURNSTILE_SECRET) return reply(500, { error: "Comments are not configured yet." }, origin);
  const form = new FormData();
  form.append("secret", TURNSTILE_SECRET);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const check = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form })
    .then((r) => r.json())
    .catch(() => ({ success: false }));
  if (!check.success) return reply(400, { error: "The spam check failed. Please try again." }, origin);

  // Rate limit by a salted hash of the IP (the IP itself is never stored).
  const ipHash = await sha256(`${TURNSTILE_SECRET}:${ip}`);
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const recent = await db(
    `comments?select=id&ip_hash=eq.${ipHash}&created_at=gte.${encodeURIComponent(since)}`,
    { headers: { Prefer: "count=exact", Range: "0-0" } },
  );
  const total = Number(recent.headers.get("content-range")?.split("/")[1] ?? 0);
  if (total >= MAX_PER_WINDOW) return reply(429, { error: "You're commenting very fast. Please wait a few minutes." }, origin);

  const saved = await db("comments", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ post, name, body, ip_hash: ipHash }),
  });
  if (!saved.ok) return reply(500, { error: "Couldn't save your comment. Please try again." }, origin);

  return reply(201, { ok: true }, origin);
});

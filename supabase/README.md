# Story comments (Supabase)

Readers can comment on stories without an account. Comments are stored in a Supabase table,
arrive through a small Edge Function that checks them, and appear only after you approve them.

- `migrations/20261121000000_comments.sql`: the `comments` table and its access rules. Readers can
  read approved comments (name, text, date only) and nothing else.
- `functions/post-comment/index.ts`: receives new comments, checks Cloudflare Turnstile, limits each
  visitor to 3 comments per 10 minutes, and saves them as `pending`.
- `../site/src/lib/comments-client.ts` and the comments section in
  `../site/src/pages/stories/[year]/[slug].astro`: the comment box on story pages.
- `../.github/workflows/supabase-keepalive.yml`: pings the API twice a week so the free project
  doesn't pause.

## One-time setup

1. **Supabase project.** Create a free project at supabase.com. In *SQL Editor*, run the migration
   file above.
2. **Turnstile.** In the Cloudflare dashboard, create a Turnstile widget for `adarshnair.in` (add
   `localhost` too for testing). You get a site key (public) and a secret key (private).
3. **Edge Function.** With the Supabase CLI (`npx supabase login`, then
   `npx supabase link --project-ref <ref>`), from the repo root run:

   ```sh
   npx supabase secrets set TURNSTILE_SECRET=<turnstile secret key>
   npx supabase functions deploy post-comment
   ```

   The secret key stays in Supabase; never put it in the repo.
4. **Site config.** Put the project URL, the `anon` public key and the Turnstile site key in
   `comments` in `site/src/site.ts`. All three are public. An empty `supabaseUrl` hides comments.
5. **Keep-alive.** In the GitHub repo, add the Actions *variables* `SUPABASE_URL` and
   `SUPABASE_ANON_KEY`.

## Moderating

New comments arrive with `status = pending`. In the Supabase dashboard, open *Table Editor →
comments*, filter by `status = pending`, and change a comment to `approved` to publish it, or
`rejected` to hide it. Comments from `npm run dev` are stored under `dev/<year>/<slug>` and never
show on the live site.

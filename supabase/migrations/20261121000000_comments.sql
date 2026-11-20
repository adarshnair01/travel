-- Story comments for Wander Notes.
-- Readers never write to this table directly: new comments arrive through the `post-comment`
-- Edge Function (spam check + rate limit), which inserts them as 'pending'.
-- To publish a comment, set status = 'approved' in the Supabase table editor.

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  post text not null check (char_length(post) between 1 and 200),       -- "<year>/<slug>", e.g. "2026/dubai"
  name text not null check (char_length(name) between 1 and 60),
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  ip_hash text,                                                          -- salted hash, only for rate limiting
  created_at timestamptz not null default now()
);

create index if not exists comments_post_approved_idx
  on public.comments (post, created_at) where status = 'approved';
create index if not exists comments_ip_recent_idx
  on public.comments (ip_hash, created_at);

alter table public.comments enable row level security;

-- Anyone may read approved comments, and only these columns (never ip_hash or status).
revoke all on public.comments from anon, authenticated;
grant select (id, post, name, body, created_at) on public.comments to anon, authenticated;

drop policy if exists "Read approved comments" on public.comments;
create policy "Read approved comments" on public.comments
  for select to anon, authenticated
  using (status = 'approved');

-- No insert/update/delete policies: only the Edge Function (service role) writes.

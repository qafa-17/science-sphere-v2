-- Science Sphere: what the website keeps in Supabase.
-- Paste all of this into Supabase → SQL Editor → New query, and press Run.
-- Running it again is safe: it only adds what's missing.

-- Every pitch sent from /pitch.
create table if not exists public.pitches (
  id uuid primary key,
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  program text not null,
  year text not null,
  story_type text not null,
  story_type_other text not null default '',
  subject text not null,
  subject_other text not null default '',
  formats text[] not null default '{}',
  angle text not null,
  why text not null,
  -- the attached files: [{ "name": "draft.docx", "path": "<pitch id>/1-draft.docx", "size": 12345 }]
  files jsonb not null default '[]',
  -- for the editors to keep track: new, read, accepted, declined...
  status text not null default 'new',
  notes text not null default '',
  -- whether the email to the magazine inbox went out
  emailed boolean not null default false,
  -- a scrambled (hashed) form of the sender's internet address, only to stop floods of pitches
  sender_hash text not null default ''
);

create index if not exists pitches_created_at on public.pitches (created_at desc);
create index if not exists pitches_sender_recent on public.pitches (sender_hash, created_at desc);

-- Row level security on, with no rules: nobody can read or write pitches with the
-- public key. Only the website's server (with the secret service role key) and
-- people signed in to the Supabase dashboard can see them.
alter table public.pitches enable row level security;

-- The files people attach. Private: only the server can hand out links to them,
-- and the links in the emails stop working after a while (see FILE_LINK_DAYS in app/pitch/actions.ts).
insert into storage.buckets (id, name, public, file_size_limit)
values ('pitch-files', 'pitch-files', false, 52428800) -- 50MB, the same as MAX_FILE_MB in lib/pitch.ts
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

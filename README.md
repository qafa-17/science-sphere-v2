# Science Sphere website, v2

The website for Science Sphere, the MRU science experience: Mount Royal University's student science magazine.
Built with [Next.js](https://nextjs.org).

## Run it on your computer (VS Code)

First time:

```bash
cd "C:\Users\<you>\Downloads\Science Sphere"
git clone https://github.com/qafa-17/science-sphere-v2
```

Then open the `science-sphere-v2` folder in VS Code (**File → Open Folder...**), open the terminal (**View → Terminal**) and run:

```bash
npm install
npm run dev
```

Wait for `✓ Ready`, then open **http://localhost:3000**. If that doesn't load, try **http://127.0.0.1:3000**.

When there are new changes: stop it with <kbd>Ctrl</kbd> + <kbd>C</kbd>, then `git pull`, `npm install`, `npm run dev`.

## Where things are

- `/board` is the look and feel board: palettes, type, buttons, cursor, logo, heart
- `/lab/sphere`, `/lab/sky`, `/lab/circuit` are the three landing-page prototypes; `/lab/dive` and `/lab/morph` combine them; `/lab/journey` goes from the sphere down to the sea
- `lib/scenes/` the sky, sphere and circuit drawings, shared by all the prototypes
- `/issues` is the archive: files fan out as you scroll, hover pulls one out, click opens it in the reader below (with zoom and full screen)
- `/issues/3` still opens Issue 3 on its own page, e.g. for links like `/issues/3?page=16`
- `lib/palettes.ts` the colour palettes, and which page uses which
- `lib/team.ts` the editors: role, expertise, degree, bio, fun fact, ID numbers (bios and degrees are placeholders)
- `/team` the poster-style team page; `/team/ids` the flipping ID cards
- `lib/pitch.ts` story types, subjects and which editor looks after them, formats, and the form's checks
- `app/pitch/actions.ts` sending a pitch: saved in Supabase, emailed to the magazine inbox (see below)
- `lib/cpu.ts` the CPU cursor's traces
- `lib/officeHours.ts` office hours (the header's beating heart reads these)
- `public/brand/` the logo, `public/graphics/crow/` the mascot frames

## Pitches: Supabase and email

Every pitch is saved in Supabase (the answers in the `pitches` table, any files in the private `pitch-files` storage bucket), then emailed to sciencesphere@mtroyal.ca with links to the files. Hitting **Reply** on that email answers the person who pitched. They also get a short thank-you email.

Until Supabase is set up, the form says pitches can't be sent yet and gives the email address instead. If only the email part isn't set up (or fails), pitches are still saved: look in Supabase → Table Editor → `pitches` (the `emailed` column says which ones went out).

**One-time setup**

1. **Supabase.** Create a project at supabase.com. Open **SQL Editor → New query**, paste everything from `supabase/schema.sql` and press **Run**. That makes the `pitches` table and the `pitch-files` bucket.
2. **Resend** (sends the emails). Create an account at resend.com. Under **Domains**, add a domain the magazine controls (e.g. the site's own domain) and add the DNS records it shows. Then make an API key under **API Keys**. (Resend can't send *from* an @mtroyal.ca address, since we can't add records to MRU's domain; the emails still go *to* the mtroyal.ca inbox, and replies go to the right people.)
3. **Vercel.** Project → **Settings → Environment Variables**, add the values from `.env.example`: `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `PITCH_FROM_EMAIL`. Then redeploy.

To try it on your computer, copy `.env.example` to `.env.local`, fill it in, and restart `npm run dev`. Never commit `.env.local` or the service role key.

Good to know: the file links in the email work for 30 days (`FILE_LINK_DAYS` in `app/pitch/actions.ts`); after that the files are still in Supabase → **Storage → pitch-files**, in a folder named after the pitch's `id`. One internet address can send at most 5 pitches an hour.

## Share previews, sitemap, 404

- Page titles come from each page's `metadata` (e.g. "Issues"); `app/layout.tsx` adds " · Science Sphere".
- The picture shown when someone shares a link: `app/opengraph-image.png`, and for each issue `public/og/issue-N.png` with its cover. After adding an issue, run `node scripts/og-images.mjs` (the file says what it needs).
- `/sitemap.xml` and `/robots.txt` are made by `app/sitemap.ts` and `app/robots.ts`, using `NEXT_PUBLIC_SITE_URL`.
- `app/not-found.tsx` is the 404 page.

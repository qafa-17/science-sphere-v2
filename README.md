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
- `lib/pitch.ts` story types, subjects and which editor gets them, formats. For now, Send opens the person's email app with the pitch filled in, addressed to the magazine inbox (`lib/pitchMailto.ts`)
- `lib/cpu.ts` the CPU cursor's traces
- `lib/officeHours.ts` office hours (the header's beating heart reads these)
- `public/brand/` the logo, `public/graphics/crow/` the mascot frames

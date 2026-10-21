# Cara's 18th Birthday

A one-page birthday website. No build step, no dependencies, no internet needed. Everything
(fonts, photos, code) is in this folder.

**Live site:** https://j-w-i.github.io/cara-18th-birthday/

[![The site](preview/desktop.png)](https://j-w-i.github.io/cara-18th-birthday/)

## How to open it

Double-click **index.html**. That's it. It opens in your browser and everything works offline.

It's also on GitHub Pages (the link above), so you can just send that link. To serve it yourself,
any static host works - this repo is set up so that pushing to `main` republishes the site.
The page is marked `noindex`, so search engines will leave it alone.

## Visit log (who opened it, and where)

Every time the **hosted** page is opened it sends one small message to a free
[ntfy.sh](https://ntfy.sh) topic, so you can see when it was opened, from roughly where, on what
device and at what time.

- **Watch it:** <https://ntfy.sh/cara18-visits-7qabomli>
- **Get it on your phone:** install the ntfy app, subscribe to the topic above, and each open
  arrives as a notification. (ntfy.sh keeps messages for about 12 hours; the app keeps them
  locally for as long as you like.)

Each entry looks like:

```
Cara's page was opened
Status: opened
From: Canberra, Australian Capital Territory, Australia · Australian Academic and Research Network
Their clock: 22 Oct 2026, 1:30 am (Australia/Sydney)
Device: desktop · 1200x800
Came from: direct link
Language: en-GB
```

(The title is a notification heading; "Status: opened" is the body line. Everything below it is
where it came from, on what, and when.)

- **Where it's set:** `VISIT_LOG_TOPIC` near the bottom of `script.js`. Set it to `""` to switch
  logging off. The topic name is the only "key": anyone who knows it can read the log, and it's in
  this public repo, so treat it as a private-but-not-secret channel.
- **Location** comes from the visitor's IP via ipwho.is, so it's city-level, not a street address.
  If they're on a VPN or block the lookup it will say "unknown".
- **Local previews don't log** — only the hosted page (`https://…`), so double-clicking
  `index.html` while you tweak things won't spam the log.
- **Turn it off for one visit:** add `?nolog` to the URL. **Point it elsewhere for one visit:**
  `?log=your-topic`.

If you'd rather have a proper dashboard with referrers and history (and no per-visit messages),
a free [GoatCounter](https://www.goatcounter.com) account works too: make one, then paste
`https://YOURCODE.goatcounter.com/count.js` as a `<script defer>` tag just before the closing
`</body>` in `index.html`.

## What's on it

1. **Hero** - her name and photo, with a confetti burst on load.
2. **A letter** - the actual message, set like a real letter on paper.
3. **Photos** - a gallery of 7 photos, tap one to open it full size (arrow keys / Esc work too).
4. **18 things about you** - 18 short lines, for 18 years.
5. **The cake** - a cake with 18 candles. Tap each flame to blow it out; when all 18 are out you
   get the wish message, confetti and a "light them again" link. There's also a
   "blow them all out at once" shortcut.
6. **Call me whenever** - a live clock for her time (Manila) and yours (Sydney).
7. Footer. (There's also a small easter egg if you click the "18" in the headline a few times.)

## Things you might want to change

**Sign your name.** In `index.html`, find:

```html
<p class="sign">always, your friend</p>
```

and change it to your name, e.g. `<p class="sign">from Josh</p>`.

**Time zones.** In `script.js`, near the top of the clocks section:

```js
var MY_TZ = "Australia/Sydney";
var HER_TZ = "Asia/Manila";
```

Change `MY_TZ` to your own IANA time zone (e.g. `"Europe/London"`, `"America/Toronto"`) and the
label in `index.html` (`My time <span>· Sydney</span>`) to match.

**Photos.** They live in `assets/img/`. To swap one, replace the file (keep it under ~400KB and
around 1400px on the long side), or point the `<img src="...">` at a different file. There are no
visible captions - the only text attached to a photo is its `alt` attribute, which screen readers
read out, so keep that accurate.

**Wording.** All of the copy is plain HTML in `index.html`, so you can edit any of it directly.

## How it's built

- `index.html` - the page and all the text.
- `styles.css` - styling. Colours and fonts are CSS variables at the top.
- `script.js` - confetti, gallery viewer, candles, clocks, scroll reveals, easter egg.
- `assets/img/` - the 7 optimised photos (about 1.2MB total) plus `manifest.json`.
- `assets/fonts/` - self-hosted Playfair Display, Inter and Great Vibes (SIL Open Font License).
- `preview/` - screenshots of the finished page.
- `photos_raw/` - the original photos as they came out of the zip. Nothing is referenced from
  here; it's just kept so you have the originals. It's gitignored (see the note below), so it
  stays on your machine and never goes into the repo.

Note: the Instagram DM/story screenshots and the video from the zip were deliberately left out -
they had private chat content, a student ID and app UI over the top, so they didn't belong on a
page she might show people. The site only uses the 7 clean photos. For the same reason
`photos_raw/` and the original zip are in `.gitignore`: the public repo only contains the 7
curated photos.

## Publishing

This repo is set up for GitHub Pages: Settings -> Pages -> "Deploy from a branch" -> `main` / `/ (root)`.
Pushing to `main` updates the live site in about a minute. 

## Tweaking the look

At the top of `styles.css`:

```css
:root {
  --ink: #0b0710;      /* page background   */
  --gold: #e9c48c;     /* accent            */
  --rose: #e88fa8;     /* secondary accent  */
  --cream: #f7efe3;    /* headings          */
}
```

Change those and the whole page follows. Motion is dialled down automatically for anyone with
"reduce motion" turned on in their system settings.

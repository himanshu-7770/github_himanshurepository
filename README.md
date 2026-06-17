# The Moon Estate — Website 🌙

An elegant, light-themed, **3D floating** real estate website for **The Moon Estate** —
premium plots & real estate builders in Etah, Uttar Pradesh (serving since 1995).

## ✨ Features

- **Property marketplace** — Buy, Rent and Sell/Rent-out, like MagicBricks / 99acres.
  - **Buy / Rent:** search by location with **area + nearby** matching, plus type, BHK and budget filters.
  - **Sell / Rent-out:** free post form with full details, photo upload, and owner contact.
  - **Property detail modal** with image gallery, **embedded Google map**, and Call / WhatsApp / Email.
  - **Favourites** — save properties with the ♥ button and filter to "Saved" only.
  - **Admin panel** (footer → *Admin*, passcode-protected) to review and delete listings.
- **Shared online database via Supabase** — every visitor sees the same listings.
  Falls back to per-browser `localStorage` when Supabase isn't configured, so it works out of the box.
- **Interactive 3D hero** — a floating skyline built with Three.js that reacts to your mouse.
- **Elegant light palette** — warm ivory + soft gold accents matching the brand logo.
- **3D tilt cards**, reveal animations, animated counters, floating WhatsApp button.
- **Fully responsive** with a mobile menu. **No build step** — pure static HTML/CSS/JS.

## 📁 Structure

```
index.html        # Page markup & content
css/style.css     # Elegant light theme + 3D styles
js/main.js        # Three.js scene, tilt, reveals, counters
js/portal.js      # Marketplace UI: search, post, favourites, admin, maps
js/store.js       # Data layer (Supabase or localStorage)
js/config.js      # Your Supabase keys + admin passcode  ← edit this
supabase.sql      # Table + security policies to run in Supabase
```

## ☁️ Enable the shared database (Supabase)

By default the site runs in **local demo mode** (listings saved per browser). To make
listings shared across all visitors:

1. Create a free project at **[supabase.com](https://supabase.com)**.
2. Open **SQL Editor → New query**, paste the contents of **`supabase.sql`**, and run it.
3. In **Project Settings → API**, copy your **Project URL** and **anon public key**.
4. Paste them into **`js/config.js`**, and change `ADMIN_PASSCODE` to your own.
5. Redeploy. The badge under the search bar will read **☁️ Live shared database**.

> Photos are compressed in the browser and stored with each listing. For very high
> volumes you can later switch image storage to a Supabase Storage bucket.

## 🚀 Deploy

This is a static site — host it anywhere.

**Option A — Drag & drop:** upload the folder to [Netlify Drop](https://app.netlify.com/drop)
or [Vercel](https://vercel.com).

**Option B — GitHub Pages:** push to GitHub, then *Settings → Pages → Deploy from branch*
and pick this branch with the `/root` folder.

**Option C — Local preview:**
```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## 🛠️ Customising

- **Supabase keys / admin passcode:** `js/config.js`.
- **Phone / WhatsApp:** search for `9719910070` in `index.html` and `js/portal.js`.
- **Sample listings:** the `SEED` array in `js/store.js`.
- **Address & hours:** in the Contact section of `index.html`.
- **Images:** swap the Unsplash URLs in `index.html` for your own site photos
  (the real plot photos from your Google Business Profile work great here).
- **Colours:** edit the CSS variables at the top of `css/style.css` (`--gold`, `--bg`, …).

---
Built for The Moon Estate · Vidya Vihar Colony, GT Rd, Etah, Shitalpur, UP 207001.

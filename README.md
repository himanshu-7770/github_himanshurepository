# The Moon Estate — Website 🌙

An elegant, light-themed, **3D floating** real estate website for **The Moon Estate** —
premium plots & real estate builders in Etah, Uttar Pradesh (serving since 1995).

## ✨ Features

- **Interactive 3D hero** — a floating abstract skyline built with Three.js that reacts to your mouse.
- **Elegant light palette** — warm ivory + soft gold accents matching the brand logo.
- **3D tilt cards** — property, gallery and form cards tilt in 3D on hover.
- **Smooth reveal animations**, animated stat counters, and a floating WhatsApp button.
- **Fully responsive** with a mobile menu.
- **Ready to deploy** — pure static HTML/CSS/JS, no build step required.
- **WhatsApp / Call / Maps** integration wired to the business number (+91 97199 10070).

## 📁 Structure

```
index.html        # Page markup & content
css/style.css     # Elegant light theme + 3D styles
js/main.js        # Three.js scene, tilt, reveals, counters, form
```

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

- **Phone / WhatsApp:** search for `9719910070` in `index.html` and `js/main.js`.
- **Address & hours:** in the Contact section of `index.html`.
- **Images:** swap the Unsplash URLs in `index.html` for your own site photos
  (the real plot photos from your Google Business Profile work great here).
- **Colours:** edit the CSS variables at the top of `css/style.css` (`--gold`, `--bg`, …).

---
Built for The Moon Estate · Vidya Vihar Colony, GT Rd, Etah, Shitalpur, UP 207001.

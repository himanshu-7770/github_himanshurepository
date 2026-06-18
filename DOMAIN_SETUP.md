# 🌐 Domain Setup — themoonestate.in

Step-by-step to put The Moon Estate website on your own domain **themoonestate.in**.
Follow the steps **in this order** so your live site never breaks.

Current live site (works right now): https://himanshu-7770.github.io/github_himanshurepository/

---

## STEP 1 — Buy the domain (5 minutes)

Pick one registrar and search for **themoonestate.in**:

| Registrar | Link | Notes |
|---|---|---|
| Hostinger | hostinger.in | Cheapest for `.in`, pay in ₹ — recommended |
| GoDaddy | godaddy.com | Most popular in India |
| BigRock | bigrock.in | Indian registrar, good for `.in` |

At checkout:
- ✅ Turn **Auto-renew ON**  ← this is what keeps the site permanent (renews every year)
- ✅ Turn **Domain Privacy ON** (usually free — hides your personal info)

Expected cost: roughly **₹150–700 for the first year**.

---

## STEP 2 — Add DNS records (10 minutes)

In your registrar, open **DNS / Manage DNS / DNS Zone Editor** and add these
**5 records**. Copy the values exactly.

### Four "A" records (point the main domain to GitHub)
| Type | Host / Name | Value (Points to) |
|------|-------------|-------------------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

### One "CNAME" record (point www to GitHub)
| Type | Host / Name | Value (Points to) |
|------|-------------|-------------------|
| CNAME | `www` | `himanshu-7770.github.io` |

> If the registrar already created default records you don't recognise (parking page,
> etc.), delete those first, then add the 5 above. Leave "TTL" on its default value.

---

## STEP 3 — Connect it in GitHub (2 minutes)

> ⚠️ Do this **after** Step 2, not before — otherwise the live link breaks again.

1. GitHub repo → **Settings → Pages**.
2. In **Custom domain**, type: `themoonestate.in` → click **Save**.
3. Wait for the **DNS check** to turn into a green ✓ (can take 15 min – a few hours).
4. Then tick **Enforce HTTPS** 🔒 (the free secure padlock).

---

## ✅ Done!

Your site will be live at:
- **https://themoonestate.in**
- **https://www.themoonestate.in**

Add this link to your Google Business Profile, WhatsApp, and visiting cards.

---

## Troubleshooting
- **"DNS check unsuccessful" in GitHub** → DNS hasn't spread across the internet yet.
  Wait 30–60 min and click **Check again**. Can take up to 24 h (usually much less).
- **Site shows old/broken page** → hard-refresh with `Ctrl + Shift + R`.
- **Stuck?** Send a screenshot of your registrar's DNS page and the GitHub Pages page.

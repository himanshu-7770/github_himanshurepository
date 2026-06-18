# 🌙 The Moon Estate — Owner's Guide

Everything you need to run your website. No coding required.

- **Your live website:** https://themoonestate.in
- **Backup link (always works):** https://himanshu-7770.github.io/github_himanshurepository/
- **Your database (Supabase):** https://supabase.com/dashboard/project/bugvizmgryafdvpgwgab
- **Admin email:** lucky05290@gmail.com

---

## 1. What your website can do
- Show your business (3D homepage, logo, photos, contact).
- A property marketplace: visitors can **Buy, Rent, or Post** properties.
- Visitors **create their own account** (email OTP or password) to post.
- You collect **leads** (buyer enquiries) automatically.
- Works on mobile and desktop, on your own domain.

---

## 2. Logging in
There are **two kinds of login**:

| Login | Who | Where |
|---|---|---|
| **Your Admin login** | You (owner) | Footer → **Admin** → sign in with `lucky05290@gmail.com` |
| **User login** | Any visitor | Top nav → **Login** (OTP or password) |

Your admin account sees **everything + leads**. Normal users only see/manage **their own** listings.

---

## 3. Post a property
1. Log in (top-right **Login**).
2. Click **＋ Post Property** (or the **Sell / Rent Out** tab).
3. Choose **Sell** or **Rent / Lease out**.
4. Fill in: property type, title, **State → City**, locality, area, price/rent, your contact.
5. Add up to **6 photos** (good photos = more calls).
6. Tick the box → **Post My Property**.

It goes live instantly and you're taken to it.

> 💡 Write clear titles like *"200 Sq.Yd Corner Plot, GT Road, Etah"* — not just "1500".

---

## 4. Edit a property
1. Click your **name (top-right) → My Account**, or footer **Admin** (for any listing).
2. Find the listing → click **Edit**.
3. The form opens pre-filled. Change anything → **💾 Update property**.

You can edit your own listings; as admin you can edit any.

---

## 5. Delete a property
Same place as Edit — click **Delete** → confirm. (Use this to remove sold/old listings or spam.)

---

## 6. See your leads (buyer enquiries) 📥
Whenever someone fills the **"Request a callback"** form on a property (or the homepage contact form), it's saved as a lead.

1. Footer → **Admin** → sign in.
2. Click the **📥 Leads** tab.
3. You'll see each person's **name, phone, the property** they asked about, and a **WhatsApp** button to reply.

Leads are private — only you can see them.

> You can also see everything in Supabase → **Table Editor** → `leads` / `listings`, and export to Excel.

---

## 7. Managing users
- Visitors self-register; you don't create them.
- To view/remove a user: Supabase → **Authentication → Users**.
- To make someone else an admin: tell me their email and I'll add it to the admin list.

---

## 8. Your domain
- **themoonestate.in** is registered on Hostinger with **auto-renew ON** (stays yours).
- DNS is already pointed to the site. Nothing to do unless you change hosts.
- **Renewal:** Hostinger charges your card automatically each year. Keep the card valid.
- When the padlock 🔒 option ("Enforce HTTPS") becomes available in GitHub → Settings → Pages, tick it.

---

## 9. Spread the word
Put **themoonestate.in** on:
- Google Business Profile (Edit profile → Contact → Website)
- WhatsApp Business, Instagram & Facebook bios
- Visiting cards, banners, hoardings
- Property photos / posts

---

## 10. Common questions

**"The site shows 'Unpublish site' — is it down?"**
No. That button means the site **is** published. Never click it.

**"A user says they can't post."**
They must **log in / create an account** first (posting requires login — this blocks spam).

**"Edit/Delete gives a permission error."**
The Supabase security SQL needs to be run once (see README / supabase.sql). Tell me and I'll help.

**"OTP email didn't arrive."**
Supabase's free email has limits. Ask me to set up free SMTP (Brevo/Resend) for reliable, unlimited login emails.

**"I want to change colours / text / logo."**
Tell me what you want — it's a quick change.

---

## 11. Who to contact
For any change — new features, fixes, design tweaks — just describe what you want and it can be added. The whole site is in your GitHub repo:
`himanshu-7770/github_himanshurepository`

---

*Built for The Moon Estate — premium plots & real estate in Etah, Uttar Pradesh. Serving since 1995.* 🌙

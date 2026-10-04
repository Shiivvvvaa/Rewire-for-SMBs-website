# Prompt: Rewire AI two-page brochure

You are a senior brand designer and B2B copywriter. Build a **two-page, print-ready A4 brochure** (front and back) for **Rewire AI (rewireai.co)**. Send it cold to a small or medium business owner who has never heard of us. Two minutes with it should leave them knowing what we do, that it has worked for businesses like theirs, that it is safe, and what to do next: **book a free audit**.

## Source of truth: read these first
The website is in this folder. Before you write or design anything, read `index.html`, `styles.css` and `main.js` (the `CONFIG` block holds the contact details), plus `fonts/` and `img/`. **Every fact, number, name and quote must come from the site.** Do not make up clients, metrics, logos or testimonials. If you want a fact the site doesn't have, leave a clearly marked `[PLACEHOLDER: …]` and list it at the end.

## Brand system (match the site exactly)
- **Concept:** "Indian modernism, engineered." The business is a building and Rewire rewires it. Use jaali (breeze-block) screens, terrazzo, brass, and cream rooms ↔ jade rooms joined by perforated seams.
- **Colours** (use these tokens only, no new hues): ground `#F4F1EA`, raised `#EAE5D8`, rule `#D6CEBD`, ink `#1A1A18`, ink-soft `#514C43`, jade `#0F2E2A`, jade-soft `#1D4A42`, on-jade `#F0EDE3`, terra `#C8763C`, terra-deep `#A65A26` (CTA fills and small terracotta text), terra-jade `#E09A5F` (accents on jade).
- **Type:** Archivo 700 for display/headlines (tight, −0.022em). Source Serif 4 for body. IBM Plex Mono for small uppercase labels, numbers and tags. Embed the woff2 files from `fonts/`.
- **Textures:** reuse the `--breeze`, `--terrazzo`, `--seam` and `--jaali-mask` SVGs from `styles.css`. Build the grid on the 44px breeze tile (11px quarter tile).
- **Logo:** the breeze-tile mark plus "Rewire" with "AI" in a small terracotta tag, as in the site header. No sparkle or star icons, no robots, no glowing brains, no stock photos of people pointing at screens.
- **Voice:** plain words and short sentences, talking to an owner, the way the site does ("Your team keeps doing the same stuff manually. We automate it."). No jargon (LLM, agentic, leverage, synergy, revolutionise, cutting-edge).

## Marketing structure
Use problem → offer → proof → risk reversal → one CTA. The reader skims headlines first, so every headline must make sense on its own.

**Page 1 (cream, the "front of the building"): what we do, and why care**
1. **Hook:** the hero line, plus "We build it inside the tools you already use. Then the work runs on its own."
2. **The pain, in their terms:** the before/after strip from the site: *11 steps, 6 hand-offs, 23 hrs/week → 3 steps, 1 hand-off.*
3. **What we build:** three service blocks, each with its 4 bullets from the site: **AI automation**, **Voice agents**, **Computer vision**. Add one line, "In your own tools. If we stopped tomorrow, it keeps running."
4. **One job, start to end:** a compact visual of the 17-step enquiry → quote → follow-up call → booking → invoice → report flow. Make it a single line of grouped stages, not 17 boxes. Make the point that only one step needs the owner (approving the quote).

**Page 2 (jade, the "inside"): proof, trust, action**
5. **Results:** lead with **Delta Fitness Club** as the hero case and big Plex Mono stats: **23 → 2 hrs/week** fixing notes, **7 days** of calls handed back to sales, plus the quote and the name Ramandeep Chadha. Then **Anthm** (café voice agent, Vijay Bahuguna) and **AIVengers** (no-code, token-optimised MVP stack, Ankit Bhatnagar) as shorter cards. Use the client images from `img/`.
6. **Your data stays yours:** the 3 promises (logins stay yours, scoped access only, a log of every run) plus "None of it is used to train AI."
7. **Who's behind it:** the four founders with their photos and **one line each** of the most recognisable past employers (for example Kamlesh: Exponentia AI, Flipkart, Bajaj Finserv · ISB). Senior people are the credibility lever. Keep it tight.
8. **CTA block (terra-deep):** "Book a free audit: find out where AI fits your business. One line is enough." Add WhatsApp **+1 (310) 690-6999**, **hi@rewireai.co** and **rewireai.co**, plus a QR code to rewireai.co. The CTA must be the most visible thing on page 2.

The ROI calculator figure ($73,710 / 164 hrs) is an illustrative default, **not a client result**. Either leave it out, or show it labelled as "example: 18 people × 6 hrs/week".

## Design rules
- Hierarchy: one dominant element per section. Leave generous cream/jade space. Don't cram text; cut copy before you shrink type. Body text no smaller than 9pt, labels 7pt.
- Use a perforated `--seam` band where page 1 cream meets page 2 jade (or across the fold) so it reads as one building.
- Contrast must meet WCAG AA. White on `--terra` is not allowed; use `--terra-deep`.
- Print: A4, 3mm bleed, 10mm safe margins, colours shown accurately and fonts embedded.

## Build and deliverables
1. Build it as one self-contained `brochure.html` (fonts and images inlined as base64) using CSS `@page { size: A4; margin: 0 }` and exactly 2 `.page` sections.
2. Render `Rewire-AI-Brochure.pdf` with headless Chromium/Playwright (`printBackground: true`), plus a PNG preview of each page.
3. **Check it yourself before handing it over:** look at both PNGs. Confirm there are exactly 2 pages with no overflow, and that no text is clipped or orphaned. Check that every number and quote matches `index.html` word for word, and that the contact details match `CONFIG`. Fix what you find and render again.
4. Save everything to a `brochure/` folder here. Finish with a short list of any placeholders, plus 2–3 copy or layout choices you'd like me to sign off.

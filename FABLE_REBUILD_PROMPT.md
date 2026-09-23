# Rebuild prompt: rewireai.co

> Paste everything below the line into Fable. Attach the current `index.html` and the 9 images in `img/` and `img/rebuild-assets/` with it.

---

## ROLE

You are a senior Framer-style web designer and creative developer. You have shipped Awwwards Site of the Day work and you have strong taste. You design for motion first: every section should have one signature interaction that someone would screen-record and send to a friend. You never use stock "AI startup" looks.

## THE TASK

Rebuild the one-page marketing site for **Rewire AI** (rewireai.co). Rewire AI builds AI automations, voice agents and computer vision for small and medium businesses, inside the tools those businesses already use.

The current site is attached (`index.html`). It has good bones, a real brand and strong copy. **Keep the brand, the colour palette, the fonts and every word of copy.** Redesign the layout, the composition, the motion and the interaction so the site feels hand-made, confident and unlike any other AI company's site.

What I expect back is **production-ready code** (see "Tech and delivery"), not a moodboard.

---

## 1. CREATIVE DIRECTION: "Indian modernism, engineered"

The current site already hints at a unique idea. It uses a **breeze-block (jaali) screen** pattern and a **terrazzo** texture on a warm cream ground with deep jade and terracotta. Lean hard into that. The site should feel like a building by Charles Correa or Le Corbusier's Chandigarh crossed with a machine's wiring diagram: warm stone, concrete, jaali screens, terrazzo floors, brass details, with clean systems drawings running through them.

The metaphor for the whole site: **the business is a building, and Rewire rewires it.** Work flows through it like light through a jaali screen or current through a circuit.

Design principles:

- **Editorial, not techy.** Big confident type, generous whitespace, asymmetric grids, a clear typographic hierarchy. It should look more like a design magazine or an architecture studio's site than a SaaS landing page.
- **Tactile.** Grain, terrazzo flecks, soft paper shadows, pieces that feel physical: faders, switches, stamps, tickets, index cards.
- **Motion with a job.** Every animation should explain something (how work flows, what gets removed, what gets handed back). Nothing moves just for show.
- **Calm, then precise.** Easing is smooth and weighted. Use the site's existing easing `cubic-bezier(.22,.61,.36,1)` as the base, plus spring physics for interactive pieces. No bouncy cartoon motion.

### Hard NOs (AI clichés to avoid)

- No purple/blue gradients, neon glows, glowing orbs, aurora blobs or mesh gradients
- No neural-network particle fields, floating 3D brains, robots, circuit-board stock art or "sparkle ✨" icons
- No glassmorphism cards on dark backgrounds
- No generic bento grid of identical rounded cards
- No lorem ipsum, invented stats, invented testimonials, invented clients or invented team members
- No emoji
- No stock photos

---

## 2. BRAND SYSTEM (keep exactly)

### Colour tokens

Use these exact values as CSS custom properties. Do not add new hues. You may use opacity variants of these.

```css
:root{
  /* grounds */
  --ground:       #F4F1EA;  /* warm cream, main background */
  --raised:       #EAE5D8;  /* raised cream surface */
  --rule:         #D6CEBD;  /* hairlines on cream */

  /* ink */
  --ink:          #1A1A18;  /* body text */
  --ink-soft:     #514C43;  /* secondary text */

  /* jade (primary dark) */
  --jade:         #0F2E2A;  /* dark sections, primary brand */
  --jade-soft:    #1D4A42;
  --rule-jade:    #2F5A52;  /* hairlines on jade */
  --on-jade:      #F0EDE3;  /* text on jade */
  --on-jade-soft: #CFD3C7;

  /* terracotta (accent) */
  --terra:        #C8763C;  /* main accent, CTAs */
  --terra-deep:   #A65A26;  /* accent hover / pressed */
  --terra-jade:   #E09A5F;  /* terracotta used on jade backgrounds */
  --on-terra:     #FFFFFF;
  --glow:         rgba(200,118,60,.30);

  /* support */
  --petrol:       #1E4D5C;
  --state-ok:     #3E6B4F;
  --state-warn:   #7A5C15;
  --lift:         rgba(15,46,42,.07);
  --shade:        rgba(0,0,0,.16);
}
```

Usage: cream is the main ground. Jade is used for full-bleed "dark" sections and for the header when it sits on them. Terracotta is used sparingly: CTAs, the one human step in the pipeline, key numbers, active states. The site should switch section tone (cream ↔ jade) as you scroll, as the current one does, but with a smoother, more cinematic transition, for example a jaali-pattern wipe or a clip-path reveal.

### Typography (keep these three families)

- **Display:** `Archivo` (600, 700). Headlines, big numbers, the wordmark. You may use Archivo's width/expanded variants if available for extra drama on hero-scale type.
- **Body:** `Source Serif 4` (400, 600, optical sizing on). All paragraphs and testimonial quotes.
- **Mono / labels:** `IBM Plex Mono` (500, 600). Step numbers, eyebrow labels, tags, the run log, form labels, small UI.

Fluid type scale (keep or push further at the top end):

```
--fs-h1:    clamp(2.375rem, 1.60rem + 3.30vw, 4.5rem)   /* push to ~7–9rem for the hero if the layout needs it */
--fs-h2:    clamp(1.875rem, 1.42rem + 1.95vw, 3rem)
--fs-h3:    clamp(1.25rem, 1.14rem + 0.48vw, 1.5rem)
--fs-lead:  clamp(1.1875rem, 1.06rem + 0.62vw, 1.5rem)
--fs-body:  clamp(1.0625rem, 1.0rem + 0.30vw, 1.1875rem)
--fs-label: 0.6875rem   /* mono, uppercase, letter-spaced */
```

Layout: max content width `1240px`, gutter `clamp(20px, 5vw, 56px)`, section padding `clamp(64px, 8vw, 128px)`, body text measure `66ch`.

### Brand textures (reuse and elevate)

1. **Breeze block / jaali:** a 44×44 tile. Cream `#F4F1EA` square, a jade `#0F2E2A` circle of r=13 in the centre and quarter circles of r=6.5 at each corner. Use it as the hero's living screen, as section-transition wipes, and as a mask shape.
2. **Terrazzo:** a scattered fleck pattern of small rotated ellipses in jade (13% opacity), terracotta (17%) and ink-soft (11%) on cream. Use it for grain on surfaces, the footer wordmark fill and card backs.

Both SVG sources are in the attached `index.html` as the `--breeze` and `--terrazzo` custom properties. Reuse them.

### Logo

A text wordmark: "Rewire" with "AI" set as a smaller, separate mark. Keep that structure and make it feel crafted. For example, the "AI" can sit in a small terracotta tag, or the wordmark can draw itself on load.

---

## 3. SITE STRUCTURE AND VERBATIM COPY

**Use this copy word for word.** You may change which element a line sits in (eyebrow, heading, caption) and you may split lines across animations. Do not rewrite, shorten, "improve" or add marketing copy. The only new text allowed is tiny UI microcopy (for example "Drag", "Scroll", "Tap a step"), and keep that to one or two words.

Keep these section anchors so existing links still work: `#hero`, `#pipeline`, `#what-we-build`, `#proof`, `#calculator`, `#before-after`, `#data`, `#about`, `#enquiries`.

Keep the **section progress rail**: a thin vertical rail (desktop) that fills as you scroll and shows the current section's name. Section names: Hero, One job, start to end, What we build, Proof, Calculator, Before and after, Your data, Who we are, Enquiries.

---

### 3.0 Header / nav

- Wordmark: **Rewire** **AI**
- Nav: What we build · Work · How we work · Your data · About · Enquiries
- CTA button: **Book a free audit**
- Mobile: "Menu" button opening a full-screen menu.

**Interaction:** the header condenses after 80px of scroll and switches colour with the section tone underneath it. The mobile menu opens as a jaali-pattern reveal, with nav items staggering in as large Archivo type.

---

### 3.1 Hero (`#hero`)

Copy:
- Eyebrow: **AI for small and medium business**
- H1: **Your team keeps doing the same stuff manually. We automate it.**
- Sub: **We build it inside the tools you already use. Then the work runs on its own.**
- CTA: **Book a free audit**
- Three service chips, each a title plus a line:
  - **AI automation**: The work that repeats, running without you.
  - **Voice agents**: Calls answered and made, day or night.
  - **Computer vision**: Cameras that count, track and keep the record.
- Small panel:
  - Label: **In your own tools**
  - H3: **We build where your work already lives.**
  - Line: **If we stopped tomorrow, it keeps running.**

**Signature interaction: "The living jaali."**
A full-bleed breeze-block screen made of the 44px tile sits behind or beside the headline. The circles respond to the cursor like a physical screen catching light: tiles near the pointer rotate, scale or open (the circle shrinks to reveal jade or terracotta behind it), with spring physics and a soft falloff radius. On load, the screen assembles tile by tile in a diagonal wave. On touch devices, drive it with a slow ambient wave plus device tilt if available.

Headline motion: split the H1 into words and lines with a masked rise. Treat "manually" specially: it arrives slightly slower and wobbles, as if typed by a tired human, then **"We automate it."** snaps in cleanly and in one beat. The contrast is the whole brand story in two seconds.

The three service chips arrive as small physical tags (like luggage tags or index cards) that settle with a slight rotation. Hover lifts them and previews that service's micro-animation from section 3.3.

---

### 3.2 Pipeline: "One job, start to end" (`#pipeline`)

This is the showpiece. It is one real automation drawn as a flow diagram (n8n style: trigger, IF, MERGE, WAIT, END nodes).

Copy:
- Eyebrow: **One job, start to end**
- H2: **This is one real build, running end to end.**

The 17 steps (number, title, description, verbatim):

1. **New enquiry**: A WhatsApp voice note, a missed call or a web form. Voice is written out, and translated if it needs to be, so every enquiry is text from here on.
2. **Real enquiry?**: The test is yours: a real person, a job you actually take on, not already in the system. Junk, duplicates and people you have turned down go one way and stop there. Everything else goes on.
3. **Look up your CRM**: Everything you already hold on them is pulled in: past jobs, notes, what they last paid.
4. **Price from stock**: At the same time, your live stock and rate card are read for what the job would actually cost today.
5. **Bin and log**: The run stops here. Nothing reaches your team, but it is written down so you can see what was dropped.
6. **Merge and score**: The two lookups come back together and the job is scored on size, urgency and how likely it is to close. A big one pings you. Every one is handed to an owner by your own rules — the trade it needs, the area it is in, who is free.
7. **Ping the owner**: Score over your threshold — a big job, or a customer you already know — and a message hits your phone straight away, before anything else happens. Under it, nothing is sent and the run carries on.
8. **Draft the quote**: A priced quote is written from your rate card, in your words, with the right files attached.
9. **You approve it**: It waits for one click. Approve and it goes out as a PDF from your own address. Change anything and your edits go back into the draft and it writes the quote again. This is the only step that needs you.
10. **Wait a day**: Nothing happens for a day. If they reply in that time the run stops and the thread lands in your inbox — a person answering always beats a chase.
11. **Voice agent calls**: A day later the agent rings, answers the usual questions and holds a slot in your diary. Picked up and gave an answer, and it goes to booking. Rang out, voicemail or hung up, and it goes round once more.
12. **Text and resend**: A text goes out with the quote again and the wait starts over. It goes round as many times as your rules allow, then stops.
13. **Book the slot**: The slot is written into your diary and the customer gets a confirmation.
14. **Set reminders**: Reminders are scheduled for the day before, so nobody has to remember to send them.
15. **Invoice paid?**: The invoice is raised against the job with a deposit link, and its due date is the test. Paid by it, and the run finishes. Past it, and the job goes round.
16. **Chase late payers**: A reminder goes out on your terms — how long after, how often, how firmly — then it checks the payment again. Nobody has to ask.
17. **File and report**: Everything is written back to your systems and lands in Monday morning's report.

Node types for the diagram: 1 = TRIGGER; 2 = IF; 5 = END; 6 = MERGE; 9 = IF; 10 = WAIT; 11 = IF; 13 → END branch; 15 = IF; 17 = END.
Branch labels on the edges: `real`, `junk`, `big`, `all`, `edits`, `no answer`, `answered`, `later`, `now`, `late`, `paid`.
Branches: 2 → 3 and 4 in parallel ("real"), 2 → 5 ("junk"); 3 + 4 → 6 (merge); 6 → 7 ("big") and 6 → 8 ("all"); 9 → back to 8 on "edits"; 10 → 11 ("later") or stop on reply; 11 → 13 ("answered") or → 12 ("no answer"), and 12 loops back to 10; 15 → 17 ("paid") or → 16 ("late"), and 16 loops back to 15.

**Signature interaction: "Follow one enquiry."**
Pin the section. Vertical scroll drives a horizontal journey along the diagram (scrubbed, not snapped). A single glowing terracotta "packet" (the enquiry) travels along the SVG edges. As it reaches each node, the node lights up and the step's number, title and description swap in a fixed caption panel with a quick mask transition. At IF nodes, the packet visibly chooses a branch while a ghost packet goes down the other path (for example "junk" to Bin and log) and fades out. Loops (edits, no answer, late) show the packet circling once. Edges draw themselves (stroke-dashoffset) just ahead of the packet.

**Step 9, "You approve it", is the only human step.** Make it the emotional peak: the pinned scroll pauses briefly, the node turns full terracotta, the cursor becomes a small "Approve" stamp, and clicking (or simply scrolling on) stamps it with a satisfying press-down and ink-spread. Never block scrolling.

Also provide: a step list (01–17) the user can click to jump the packet to any step, and a mobile version that becomes a vertical, scroll-driven timeline with the same packet running down a single spine and branches shown as short side-stubs.

---

### 3.3 What we build (`#what-we-build`)

Copy:
- H2: **What we build**
- Lead: **Three things. Each one takes a job off your team for good.**
- **01 — AI automation**: Answers enquiries in minutes · Types records once, not twice · Moves jobs without chasing · Builds and sends the reports
- **02 — Voice agents**: Talks like a person · Picks up after hours · Works your old lead lists · Books and writes the notes
- **03 — Computer vision**: Counts stock and footfall · Tracks goods in and out · Checks items, not samples · Keeps the record, with times

**Signature interaction: three live "specimens."** Not three identical cards. Lay them out as an asymmetric editorial spread, like three exhibits in a museum case, each with its own looping micro-demo drawn in SVG/canvas in brand colours:

- **AI automation:** a form's fields fill themselves once, then the same data flies into a spreadsheet row, a CRM card and a report, with no retyping. The mono cursor blinks.
- **Voice agents:** a live waveform in jade that reacts to the pointer's speed, a call timer ticking, and a transcript line writing itself. A small "after hours" moon/clock toggle.
- **Computer vision:** a top-down grid of boxes on a shelf (simple geometric shapes, not photos) with terracotta bounding boxes snapping onto items and a counter ticking up with timestamps in mono.

Each capability line reveals with a stagger as the card enters. On hover, the card tilts subtly (max 4°) and its demo speeds up.

---

### 3.4 Proof: testimonials (`#proof`)

Copy:
- Eyebrow: **In their words**
- H2: **Three builds. Told by the people who paid for them.**
- Lead: **A gym group, a café and a team shipping AI products. Pick a name to hear that one.**

**Case 1: Delta Fitness Club** (logo: `client-delta-fitness-club.webp`)
- Tag: **Gym group · many branches**
- Quote: **My trainers were sending their notes over chat and the front desk was typing them in again. Now what the trainer writes is the record, and nobody fixes a number by hand.**
- Quote 2: **The voice agent worked through our old member list on its own and booked the ones who wanted to come back.**
- Name: **Ramandeep Chadha**, **Owner, Delta Fitness Club**
- Stack: n8n · Client's database · Client's phone system · Voice agent · Client's booking system
- Outcomes (label: **Outcomes at Delta Fitness Club**):
  - **23**: hours a week fixing notes by hand, before
  - **2**: hours a week to check it, after
  - **7**: days of phone calls the sales team got back

**Case 2: Anthm** (logo: `client-anthm.webp`)
- Tag: **Café · bookings and enquiries**
- Quote: **Until now my café staff had to pick up every reservation call and every other enquiry that came in. Rewire built us a voice agent that takes those calls on their behalf, so that is one job off their heads.**
- Quote 2: **Every enquiry it takes becomes a lead, and the right offers and messages go out to them after. We run offers often, so that matters. The team was very professional.**
- Name: **Vijay Bahuguna**, **Owner, Anthm**
- Stack: Voice agent · Lead capture · Email campaigns · WhatsApp campaigns

**Case 3: AIVengers** (logo: `client-aivengers.webp`)
- Tag: **Product team · AI-native MVPs**
- Quote: **Rewire AI helped us build a no-code, token-optimised tech stack for shipping AI-native MVPs. It is the most efficient one we have run.**
- Quote 2: **The team's support and assistance after the project was top-notch.**
- Name: **Ankit Bhatnagar**, **AIVengers**
- Stack: No-code stack · Token-optimised prompts · MVP build

Name switcher: **Delta Fitness Club · Anthm · AIVengers**

**Signature interaction: "Pick a name."** One story is told large and the other two wait at the side as narrow slices. Clicking a name morphs the chosen case into the large slot (shared-element / View Transitions or FLIP, not a crossfade). The quote reveals line by line in Source Serif at a large editorial size. The stack chips then snap together into a mini flow diagram, echoing the pipeline. Auto-advance every 10 seconds with a thin progress line and pause on hover. For Delta, the outcome numbers count up, and the "23 → 2" pair is shown as a bar that visibly collapses from 23 to 2.

---

### 3.5 Calculator: "Hours you get back" (`#calculator`)

Copy:
- Eyebrow: **Hours you get back**
- H2: **Put your own numbers in.**
- Slider 1: **People doing this work**, default **18**, min **2**, max **120**
- Slider 2: **Hours each one spends on this a week**, default **6**, min **1**, max **50**
- Slider 3: **What one month of their time costs**, default **$6,000**, min **$400**, max **$12,000**
- Output 1 label: **Hours your team saves for other important stuff**, value (default **164**), caption **hours handed back to your team**
- Output 2 label: **Money saved each year**, value (default **$73,710**)

**Keep this exact maths:**
```js
const RECOVERY = 0.35;        // share of repetitive time a live build removes
const HOURS_IN_MONTH = 160;   // standard working month
monthlyHours = people * hoursPerWeek * RECOVERY * (52 / 12);
annualMoney  = people * hoursPerWeek * RECOVERY * 52 * (monthlyCost / HOURS_IN_MONTH);
```
(Defaults give 164 hours and $73,710. Check your build reproduces them.)

**Signature interaction: "The mixing desk."** Style the three sliders as physical faders or dials on a jade console with brass-coloured (terracotta) knobs, detents and tick marks in mono. Output numbers roll like an odometer or split-flap display, not a plain counter. Next to the hours figure, show a **week-grid visual**: a calendar of small blocks where the hours handed back fill in with terracotta as you drag. Sliders must stay real `<input type="range">` elements underneath (keyboard and screen-reader friendly).

---

### 3.6 Before and after (`#before-after`)

Copy:
- H2: **Before and after**
- Toggle labels: **Current State** / **Automated**
- Current State diagram caption: **Current State — 11 steps, 6 hand-offs**. Nodes: Enquiry → Inbox → Type again → Manager → Fix it → File → Group chat → Spreadsheet → Chase → 2nd inbox → Report
- Automated diagram caption: **Automated — 3 steps, 1 hand-off**. Nodes: Enquiry → Runs by itself → Handed over to the right person
- Stats (values change with the toggle):
  - steps in the job: **11** → **3**
  - hours: **23** "hours a week across the team" → **20** "hours saved across the team"
  - hand-offs between people: **6** → **1**

**Signature interaction: "Untangle."** In Current State, the 11 nodes sit as a messy, overlapping tangle of paper notes and crossing lines that jitter slightly, like a stressed whiteboard. Flip the switch (a chunky physical toggle) and the tangle **untangles**: lines straighten, 8 nodes fold away or dissolve into the "Runs by itself" node, and the 3 clean nodes line up in a straight run. Morph the positions (FLIP / SVG path morph) rather than crossfading. The stats roll to the new numbers. Scroll into view auto-plays the transition once, then hands control to the user.

---

### 3.7 Your data (`#data`)

Copy:
- Eyebrow: **Your data**
- Statement: **It all runs inside your own accounts. Your data completely is in your control. None of it is used to train AI.**
- Promises:
  - **Your logins stay yours. We keep no copies.**
  - **We only get access to the job you agreed to. Nothing more.**
  - **You can see a log of every run, any time.**

**Signature interaction: "The vault and the log."** A full-bleed jade section. The statement reveals word by word as you scroll (scrubbed text highlight from `--on-jade-soft` to `--on-jade`). The three promises sit as engraved brass-plate style panels. Behind them, a faint mono **run log** scrolls continuously (timestamps and step names from the pipeline, for example `09:14:02  Real enquiry?  → real`), clearly decorative and `aria-hidden`. Hovering a promise briefly locks the log, as if it's being inspected.

---

### 3.8 Who we are (`#about`)

Copy:
- H2: **Who we are**

Team (photos in `img/rebuild-assets/`):

**Kamlesh Pant** (`team-kamlesh-pant.webp`)
- Head of Gen AI, Exponentia AI
- Director of Marketing, CommerceIQ
- Chief Marketing Officer, MIT World University
- National Head, Marketing, Bajaj Finserv
- Head of Communications and Content, Flipkart
- Technical Leader, Siemens
- Studied: ISB · IET

**Saurabh Kandpal** (`team-saurabh-kandpal.webp`)
- Head of Customer Marketing, CommerceIQ
- Head of Ecommerce for Business, Samsung, USA
- Director, Digital Transformation, L&T
- Director, Sales and Client Relations, Brillio
- Technical Lead, Cisco
- Engineering Lead, Huawei, China
- Studied: IIM Calcutta · IIIT Bangalore

**Ajay Joshi** (`team-ajay-joshi.webp`)
- Chief Business Officer, Gravity Classes
- Chief Business Officer, Biddin
- Business Unit Head, BYJU'S
- Studied: United College of Engineering and Research

**Sreekanth Venkatramani** (`team-sreekanth-venkatramani.webp`)
- Associate Partner, Business Consulting, Infosys Consulting
- Manager, Deloitte & Touche
- Associate Consultant, Oracle Financial Services Software
- Consultant, Headstrong Consulting
- Studied: IIM Calcutta · NIT Calicut

**Signature interaction: "Career lines."** Each person's career is drawn as a metro-map line: roles are stations, companies are station names in mono, and the line draws itself as the card scrolls into view. Photos sit inside a jaali-shaped mask (circle-in-square from the breeze tile) and are duotone jade/cream by default, shifting to full colour on hover. On desktop, hovering one person dims the others and brings their line forward. Do not add bios, titles or quotes that are not listed above.

---

### 3.9 Enquiries (`#enquiries`)

Copy:
- Eyebrow: **Enquiries**
- H2: **Book an audit and find out where AI fits your business.**
- Lead: **One line is enough for us to tell you if we can help.**
- WhatsApp panel: label **Best way**, H3 **Message us on WhatsApp**, line **Send one line about the job. We reply in the same chat.** Link: `https://wa.me/00000000000?text=Hello%20Rewire%20AI%2C%20I%20would%20like%20a%20free%20AI%20audit.` (placeholder number, keep it as a clearly marked constant)
- Form fields:
  - **Name** (required, error: "Please add your name.")
  - **Company website** *optional*
  - **Email** (required, error: "Please add an email we can reply to.")
  - **Phone** *optional*
  - **What are your top business challenges?** (required, error: "Please tell us in one line.")
  - Hidden honeypot field **Company**
  - Checkbox: **Happy to be called or messaged about my audit.**
  - Submit: **Book my free audit** (loading state: "Sending…")

**Signature interaction:** the WhatsApp panel is the hero of this section, bigger than the form, with a tiny animated chat preview (one outgoing bubble typing "Hello Rewire AI, I would like a free AI audit."). The form uses floating mono labels, an underline that draws in terracotta on focus, gentle shake-free inline validation, and a submit that turns into a "ticket stamped" confirmation. Keep the form wired to a single `submitEnquiry(data)` function I can connect later.

---

### 3.10 Footer

Copy:
- Wordmark: **Rewire AI**
- Line: **We build it inside the tools you already use.**
- Column "Sections": What we build · Work · How we work · Your data · About
- Column "Enquiries": Send an enquiry · WhatsApp · hi@rewireai.co
- **© 2026 Rewire AI**

**Signature interaction:** a giant, edge-to-edge "Rewire" wordmark filled with the terrazzo texture, which slides up from behind the footer as you reach the bottom (reveal-on-scroll footer). The terrazzo flecks drift slightly with the cursor.

---

## 4. GLOBAL MOTION AND INTERACTION RULES

- **Smooth scroll:** Lenis (or equivalent), synced with GSAP ScrollTrigger.
- **Scroll reveals:** masked line reveals for headings, subtle y+opacity for body, staggered children. Use one consistent vocabulary of 3 or 4 reveal types across the site, not a different trick for every element.
- **Section tone changes** (cream ↔ jade) are transitions, not hard cuts.
- **Custom cursor (desktop, fine pointer only):** a small jade dot that becomes a labelled pill on interactive elements ("Drag", "Open", "Approve", "Play"). The native cursor stays available for text inputs.
- **Magnetic buttons:** primary CTAs pull slightly toward the cursor (max 6px) with spring return.
- **Numbers:** every stat animates in (odometer/roll) once, when first visible.
- **Micro-texture:** a very subtle film grain overlay (≤4% opacity) across the site.
- **Page load:** a short (under 1.2s) intro where the jaali tiles assemble and the wordmark draws. Skippable, and it never shows on repeat visits in the same session.
- **Timing:** fast 150ms, mid 200ms, slow 500ms, tone 900ms. Base ease `cubic-bezier(.22,.61,.36,1)`.

## 5. ACCESSIBILITY AND PERFORMANCE (non-negotiable)

- Honour `prefers-reduced-motion`: turn off pinning, scrubbing, parallax, cursor effects and looping demos, and show final states instead. All content must be readable with motion off.
- All interactive diagrams have text equivalents (the pipeline's ordered step list is real HTML, not only SVG).
- Keyboard: every control is reachable and visibly focused (terracotta focus ring). Include a "Skip to content" link.
- WCAG AA contrast on both cream and jade grounds. Check terracotta text sizes especially.
- Semantic HTML: one `h1`, sensible `h2`/`h3` order, landmarks, labelled form fields, `aria-live` for the form status and calculator outputs.
- Lighthouse targets: Performance ≥ 90 on mobile, Accessibility 100. Lazy-load images, preload the two key font weights, use `font-display: swap`, and keep total JS under ~150KB gzipped.
- Only animate `transform`, `opacity` and `clip-path`. Canvas/SVG loops pause when off-screen (IntersectionObserver) and when the tab is hidden.
- Fully responsive from 360px to 2560px. Design the mobile versions of the pipeline, the before/after and the calculator on purpose, not as squashed desktop.
- Keep the existing `<title>Rewire AI</title>` and meta description: "Rewire AI builds automations inside the tools you already use, so the work your team repeats every week runs on its own."

## 6. TECH AND DELIVERY

- Build as a static site: `index.html`, `styles.css`, `main.js`, plus an `/img` folder using the attached assets. Libraries allowed: GSAP (with ScrollTrigger, SplitText, Flip, MorphSVG, all free now), Lenis. No React, no build step needed. It should open by double-clicking `index.html`.
- CSS: custom properties for every token above, organised by layer (tokens → base → layout → components → sections → motion).
- JS: one module per section, each guarded so a missing element never breaks the page. Comment the non-obvious parts.
- Put every placeholder in one clearly marked `CONFIG` object at the top of `main.js` (WhatsApp number, form endpoint, email).

## 7. HOW TO WORK

1. First, reply with a short **design brief**: the concept in two sentences, the grid, the type scale you'll use at each breakpoint, and a one-line description of the signature interaction for each section. Stop and wait for my go-ahead.
2. Then build section by section, in order, giving me complete files each time.
3. At the end, run a self-check and list: (a) any copy you changed (target: none), (b) any colour outside the palette (target: none), (c) confirmation the calculator defaults output 164 hours and $73,710, (d) the reduced-motion behaviour of each section.

The bar: if someone lands on this site, they should not be able to tell which AI template it came from, because it didn't come from one. It should feel like a studio spent three months on it.

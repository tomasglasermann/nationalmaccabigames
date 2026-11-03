# NMB · Road to Austin 2027 — Landing page

Landing page for the **NMB (North Miami Beach / MARJCC)** delegation on the road
to the **JCC Maccabi Games 2027** in Austin, Texas.

The page is a single self-contained file: **`index.html`** (inline HTML + CSS + JS,
Montserrat typeface from Google Fonts). No build step or dependencies.

## Sections

- **Hero** — "LET'S GO NMB! · Road to Austin 2027"
- **The Games** — what the JCC Maccabi Games are
- **Our Team** — why support NMB (since 1992, 40+ athletes, $2,650/athlete)
- **Sports** — the 12 categories (Soccer, Basketball, Volleyball, Tennis, Swimming)
- **Gallery** — last year's photos (placeholders, see below)
- **Register** — athlete form with the requested fields
- **Sponsorship** — the 6 sponsorship levels ($500 – $12,000)
- **Donate** — RedPodium link

## Your to-do (configuration)

Open `index.html` and find the **`CONFIG`** block near the end (inside the `<script>`):

```js
const CONFIG = {
  salesforceRegistrationUrl: "#", // ← paste the Salesforce registration link here
  redpodiumDonationUrl: "#",      // ← paste the RedPodium donation link here
  ...
};
```

- While they stay `"#"`, the **"Official registration"** button and the **"Donate"**
  buttons degrade gracefully (nothing breaks) and show a "coming soon" note.
- Once you paste the real links, they open automatically in a new tab.

### Other recommended replacements

- **Official logo:** the crest is an SVG placeholder. Drop the official logo file at
  `assets/nmb-logo-white.png` (white version, for the dark backgrounds) and swap the
  `<svg class="crest">` / `<svg class="hero__crest">` blocks for an `<img>`.
- **Last year's photos:** the gallery uses placeholders. Replace the
  `<div class="ph">` tiles with `<img>` elements using the real photos (Drive folder).
  Post photos of minors only with the family consent the MARJCC requires.
- **Form → Salesforce:** today the form shows an on-screen confirmation. To send data
  to Salesforce (Web-to-Lead), connect the `#regForm` submit handler to your endpoint
  and map the field `name` attributes to your Salesforce field IDs (see the note in the
  HTML next to `.formcard`).

## Branding

Navy `#0A2342` · Burgundy `#800020` · White `#FFFFFF` · Montserrat typeface.
Based on the *NMB Brand Book 2027*.

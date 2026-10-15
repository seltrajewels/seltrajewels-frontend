# Seltra Jewels — Frontend

**Seltra** · *Elegance in Every Element*

The official website for Seltra, a brand of thoughtfully curated demi-fine jewellery for everyday moments and life's special occasions.

---

## About Seltra

Seltra offers fine-jewellery inspired pieces designed to be worn every day:

- **18K Gold Plated** — a radiant, luxurious finish
- **Anti-Tarnish** — keeps its shine for confident everyday wear
- **Skin Friendly** — gentle for comfortable, all-day wear
- **Everyday Versatility** — timeless designs for every moment

**Collections:** Necklaces · Earrings · Rings · Bracelets

---

## Project Status

| Phase | Status |
|-------|--------|
| Pre-launch website (home, collections preview, story, gallery, FAQs, contact, email signup) | 🟢 Live |
| Email signup connected to a mailing service | 🟡 To do |
| Full shop pages | ⚪ Planned |
| Product catalogue & inventory | ⚪ Planned |
| Cart & payment gateway | ⚪ Planned |

### Planned Pages

- **Home** — hero, brand highlights, collection preview
- **Collections** — necklaces, earrings, rings, bracelets
- **Our Story** — the brand and its values
- **Gallery** — product and lifestyle photography
- **FAQs** — materials, care, shipping, returns
- **Contact** — enquiries and social links

---

## Brand Guidelines

| Element | Value |
|---------|-------|
| Primary background | Soft blush `#F6E3DC` |
| Accent (rose gold) | `#B07A62` |
| Text | Deep cocoa `#5A3A2E` |
| Headings | Elegant serif (e.g. Cormorant Garamond) |
| Body | Light serif or clean sans-serif |
| Mood | Soft, luxurious, feminine, minimal — satin textures, florals, natural light |

Colour values are approximations from the brand mockups; update them once final brand codes are confirmed.

---

## Tech Stack

- HTML5, CSS3 and vanilla JavaScript (no build step)
- Hosted on [Vercel](https://vercel.com) with automatic deploys from `main`
- Framework and payment provider to be decided for the full store

---

## Project Structure

```
seltrajewels-frontend/
├── index.html            # Pre-launch site (all sections)
├── assets/
│   ├── css/styles.css    # All styles
│   ├── js/main.js        # Menu, search, bag, gallery, FAQs, signup, effects
│   └── images/           # Logo, favicons, product and background images
└── README.md
```

---

## Running Locally

No build step is needed for the coming soon page.

```bash
git clone https://github.com/<owner>/seltrajewels-frontend.git
cd seltrajewels-frontend
```

Then open `index.html` in your browser.

---

## Deployment

Every push to `main` deploys automatically to Vercel and goes live on the custom domain.

---

## License

© 2026 Seltra. All rights reserved.
The Seltra name, logo, and imagery are proprietary and may not be used without permission.

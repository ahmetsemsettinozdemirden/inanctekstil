# Perde Tasarla Homepage Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current inanctekstil.store homepage with the Perde Tasarla landing page (hero, category cards, measurement videos, FAQ) and add navigation link.

**Architecture:** Shopify Horizon theme customization using custom Liquid sections wired into the `index.json` homepage template. No backend needed — all static content with YouTube embeds. Theme pulled via Shopify CLI, edited locally, pushed back.

**Tech Stack:** Shopify CLI, Liquid, HTML, CSS, Shopify JSON templates

**Spec:** `docs/superpowers/specs/2026-03-16-perde-tasarla-design.md` — Section 3 (Homepage Design)

**Design tokens (from `docs/ecommerce/frontend-configuration.md`):**
- Primary Navy: `#1B2A4A`
- Light BG: `#F8F8F8`
- Border: `#E5E5E5`
- Heading font: Playfair Display
- Body font: Inter / system-ui

---

## Chunk 1: Theme Setup & Hero Section

### Task 1: Pull Shopify theme and set up local development

**Context:** No theme files exist in the repo. We need to pull the live Horizon theme using Shopify CLI to get a working copy we can modify.

**Files:**
- Create: `theme/` directory (entire Horizon theme)
- Create: `theme/.shopify/` CLI config

- [ ] **Step 1: Install Shopify CLI (if not present)**

```bash
brew install shopify-cli
```

Verify: `shopify version` outputs a version number.

- [ ] **Step 2: Authenticate with Shopify store**

```bash
cd /Users/semsettin/workspace/inanc-tekstil
shopify theme pull --store inanctekstil.store --path theme/
```

This will open a browser for OAuth. Select the live Horizon theme when prompted. The full theme downloads into `theme/`.

- [ ] **Step 3: Verify theme structure**

```bash
ls theme/sections/ theme/templates/ theme/assets/ theme/snippets/ theme/layout/
```

Expected: Standard Shopify theme directories with Horizon's default files.

- [ ] **Step 4: Start theme dev server for live preview**

```bash
cd /Users/semsettin/workspace/inanc-tekstil/theme
shopify theme dev --store inanctekstil.store
```

Expected: Local dev URL (e.g., `http://127.0.0.1:9292`) serving a preview of the theme. Keep this running in a separate terminal during development.

- [ ] **Step 5: Inspect current homepage template**

Read `theme/templates/index.json` to see the current section layout. Note which sections exist so we know what we're replacing.

- [ ] **Step 6: Add theme/ to .gitignore selectively**

We want to track only our custom sections and the index.json, not the entire Horizon theme (which is Shopify-managed). Add to `.gitignore`:

```
# Shopify theme - track only our custom files
theme/*
!theme/sections/perde-*.liquid
!theme/templates/index.json
!theme/assets/perde-homepage.css
!theme/layout/theme.liquid
```

> **Note:** This is a starting point. Adjust based on what Horizon has by default. The goal is to commit only files we create or modify, not the entire vendor theme.

- [ ] **Step 7: Commit**

```bash
git add .gitignore
git commit -m "chore: add shopify theme gitignore rules"
```

---

### Task 2: Create homepage CSS

**Files:**
- Create: `theme/assets/perde-homepage.css`

All homepage sections share one CSS file to avoid multiple network requests. Scoped with `.perde-` prefix.

- [ ] **Step 1: Create the CSS file with all section styles**

Create `theme/assets/perde-homepage.css`:

```css
/* ============================================
   Perde Tasarla Homepage Styles
   ============================================ */

/* --- Hero Section --- */
.perde-hero {
  position: relative;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #fff;
  overflow: hidden;
}

.perde-hero__overlay {
  position: absolute;
  inset: 0;
  background: rgba(27, 42, 74, 0.6);
  z-index: 1;
}

.perde-hero__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.perde-hero__content {
  position: relative;
  z-index: 2;
  max-width: 720px;
  padding: 48px 24px;
}

.perde-hero__title {
  font-family: 'Playfair Display', serif;
  font-size: 3rem;
  margin: 0 0 16px;
  font-weight: 700;
}

.perde-hero__subtitle {
  font-size: 1.125rem;
  line-height: 1.6;
  margin: 0 0 32px;
  opacity: 0.9;
}

.perde-hero__buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.perde-hero__btn {
  display: inline-block;
  padding: 14px 28px;
  border: 2px solid #fff;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9375rem;
  transition: background 0.2s, color 0.2s;
}

.perde-hero__btn:hover {
  background: #fff;
  color: #1B2A4A;
}

/* --- Category Cards --- */
.perde-categories {
  padding: 64px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.perde-categories__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.perde-categories__card {
  border: 1px solid #E5E5E5;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s;
}

.perde-categories__card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.perde-categories__image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.perde-categories__body {
  padding: 20px;
}

.perde-categories__name {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  margin: 0 0 8px;
  color: #1B2A4A;
}

.perde-categories__desc {
  font-size: 0.875rem;
  color: #666;
  margin: 0 0 16px;
  line-height: 1.5;
}

.perde-categories__link {
  display: inline-block;
  padding: 10px 24px;
  background: #1B2A4A;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.perde-categories__link:hover {
  background: #2a3f6a;
}

/* --- Measurement Guide --- */
.perde-measurement {
  padding: 64px 24px;
  background: #F8F8F8;
}

.perde-measurement__inner {
  max-width: 1200px;
  margin: 0 auto;
}

.perde-measurement__title {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  text-align: center;
  margin: 0 0 12px;
  color: #1B2A4A;
}

.perde-measurement__intro {
  text-align: center;
  color: #666;
  margin: 0 0 40px;
  font-size: 1rem;
}

.perde-measurement__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.perde-measurement__item {
  text-align: center;
}

.perde-measurement__video-wrap {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  margin-bottom: 16px;
  background: #ddd;
}

.perde-measurement__video-wrap iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.perde-measurement__video-title {
  font-weight: 600;
  font-size: 0.9375rem;
  margin: 0 0 4px;
  color: #1B2A4A;
}

.perde-measurement__video-desc {
  font-size: 0.8125rem;
  color: #666;
  margin: 0;
}

/* --- FAQ Accordion --- */
.perde-faq {
  padding: 64px 24px;
  max-width: 800px;
  margin: 0 auto;
}

.perde-faq__title {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  text-align: center;
  margin: 0 0 32px;
  color: #1B2A4A;
}

.perde-faq__item {
  border-bottom: 1px solid #E5E5E5;
}

.perde-faq__question {
  width: 100%;
  background: none;
  border: none;
  padding: 20px 0;
  font-size: 1rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #1B2A4A;
}

.perde-faq__question::after {
  content: '+';
  font-size: 1.5rem;
  font-weight: 300;
  transition: transform 0.2s;
}

.perde-faq__item[open] .perde-faq__question::after {
  content: '-';
}

.perde-faq__answer {
  padding: 0 0 20px;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #444;
}

/* --- Mobile --- */
@media (max-width: 768px) {
  .perde-hero__title {
    font-size: 2rem;
  }

  .perde-hero__buttons {
    flex-direction: column;
    align-items: center;
  }

  .perde-categories__grid,
  .perde-measurement__grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Verify CSS loads in browser**

Open the Shopify dev server URL. The CSS file won't be linked yet, but verify it exists:
```bash
ls -la theme/assets/perde-homepage.css
```

- [ ] **Step 3: Commit**

```bash
git add theme/assets/perde-homepage.css
git commit -m "feat: add perde homepage CSS styles"
```

---

### Task 3: Create Hero Section

**Files:**
- Create: `theme/sections/perde-hero.liquid`

**Context:** The hero section shows a full-width lifestyle image with overlay text, title "Perde Tasarla", subtitle, and 3 CTA buttons linking to collections. Uses Shopify section schema for image/text configurability through the theme editor.

- [ ] **Step 1: Create the hero section**

Create `theme/sections/perde-hero.liquid`:

```liquid
<section class="perde-hero">
  {% if section.settings.image != blank %}
    {{ section.settings.image | image_url: width: 1920 | image_tag: class: 'perde-hero__image', alt: section.settings.title, loading: 'eager' }}
  {% endif %}
  <div class="perde-hero__overlay"></div>
  <div class="perde-hero__content">
    <h1 class="perde-hero__title">{{ section.settings.title }}</h1>
    <p class="perde-hero__subtitle">{{ section.settings.subtitle }}</p>
    <div class="perde-hero__buttons">
      {% for block in section.blocks %}
        <a href="{{ block.settings.link }}" class="perde-hero__btn">
          {{ block.settings.label }}
        </a>
      {% endfor %}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Perde Hero",
  "settings": [
    {
      "type": "image_picker",
      "id": "image",
      "label": "Arka plan gorseli"
    },
    {
      "type": "text",
      "id": "title",
      "label": "Baslik",
      "default": "Perde Tasarla"
    },
    {
      "type": "textarea",
      "id": "subtitle",
      "label": "Alt yazi",
      "default": "Pile secimi, olculer ve astar tipi gibi detaylari kisisellestirerek, mekaniniza uygun sik ve fonksiyonel perdeler olusturabilirsiniz."
    }
  ],
  "blocks": [
    {
      "type": "cta_button",
      "name": "CTA Buton",
      "settings": [
        {
          "type": "text",
          "id": "label",
          "label": "Buton metni",
          "default": "Tul Perdeler"
        },
        {
          "type": "url",
          "id": "link",
          "label": "Buton linki"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Perde Hero",
      "blocks": [
        { "type": "cta_button", "settings": { "label": "Tul Perdeler" } },
        { "type": "cta_button", "settings": { "label": "Fon Perdeler" } },
        { "type": "cta_button", "settings": { "label": "Blackout Perdeler" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Add hero to index.json**

Read `theme/templates/index.json`, then replace its content. The exact edit depends on the current structure, but the goal is to add the hero section. Example structure:

```json
{
  "sections": {
    "perde_hero": {
      "type": "perde-hero",
      "settings": {
        "title": "Perde Tasarla",
        "subtitle": "Pile secimi, olculer ve astar tipi gibi detaylari kisisellestirerek, mekaniniza uygun sik ve fonksiyonel perdeler olusturabilirsiniz."
      },
      "blocks": {
        "btn_tul": {
          "type": "cta_button",
          "settings": {
            "label": "Tul Perdeler",
            "link": "/collections/tul-perdeler"
          }
        },
        "btn_fon": {
          "type": "cta_button",
          "settings": {
            "label": "Fon Perdeler",
            "link": "/collections/fon-perdeler"
          }
        },
        "btn_blk": {
          "type": "cta_button",
          "settings": {
            "label": "Blackout Perdeler",
            "link": "/collections/blackout-perdeler"
          }
        }
      },
      "block_order": ["btn_tul", "btn_fon", "btn_blk"]
    }
  },
  "order": ["perde_hero"]
}
```

> **Important:** Preserve any existing sections you want to keep (like featured products). Remove sections being replaced (old hero, old category cards, trust badges).

- [ ] **Step 3: Test in browser**

Open the Shopify dev preview URL. Verify:
- Hero section renders with title, subtitle, overlay
- Three CTA buttons display and link correctly
- Image placeholder works (actual image set via Shopify Admin later)

- [ ] **Step 4: Commit**

```bash
git add theme/sections/perde-hero.liquid theme/templates/index.json
git commit -m "feat: add Perde Tasarla hero section to homepage"
```

---

## Chunk 2: Category Cards, Measurement Guide & FAQ

### Task 4: Create Category Cards Section

**Files:**
- Create: `theme/sections/perde-categories.liquid`
- Modify: `theme/templates/index.json`

**Context:** Three cards (Tul, Fon, Blackout) side by side, each with image + title + description + "Incele" button. Saten is NOT shown (it's a lining add-on, not a standalone category). Cards stack on mobile.

- [ ] **Step 1: Create the categories section**

Create `theme/sections/perde-categories.liquid`:

```liquid
<section class="perde-categories">
  <div class="perde-categories__grid">
    {% for block in section.blocks %}
      <div class="perde-categories__card" {{ block.shopify_attributes }}>
        {% if block.settings.image != blank %}
          {{ block.settings.image | image_url: width: 600 | image_tag: class: 'perde-categories__image', alt: block.settings.title, loading: 'lazy' }}
        {% else %}
          <div class="perde-categories__image" style="background:#ddd;aspect-ratio:4/3;"></div>
        {% endif %}
        <div class="perde-categories__body">
          <h3 class="perde-categories__name">{{ block.settings.title }}</h3>
          <p class="perde-categories__desc">{{ block.settings.description }}</p>
          <a href="{{ block.settings.link }}" class="perde-categories__link">Incele</a>
        </div>
      </div>
    {% endfor %}
  </div>
</section>

{% schema %}
{
  "name": "Perde Kategoriler",
  "blocks": [
    {
      "type": "category",
      "name": "Kategori",
      "settings": [
        {
          "type": "image_picker",
          "id": "image",
          "label": "Gorsel"
        },
        {
          "type": "text",
          "id": "title",
          "label": "Baslik",
          "default": "Tul Perdeler"
        },
        {
          "type": "textarea",
          "id": "description",
          "label": "Aciklama",
          "default": "Isik geciren, hafif ve sik tul perde cesitlerimizi inceleyin."
        },
        {
          "type": "url",
          "id": "link",
          "label": "Koleksiyon linki"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Perde Kategoriler",
      "blocks": [
        {
          "type": "category",
          "settings": {
            "title": "Tul Perdeler",
            "description": "Isik geciren, hafif ve sik tul perde cesitlerimizi inceleyin."
          }
        },
        {
          "type": "category",
          "settings": {
            "title": "Fon Perdeler",
            "description": "Dekoratif ve islevsel fon perde seceneklerimize goz atin."
          }
        },
        {
          "type": "category",
          "settings": {
            "title": "Blackout Perdeler",
            "description": "Tam karartma saglayan blackout perde modellerimizi kesfin."
          }
        }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Add to index.json**

Add `perde_categories` section to `theme/templates/index.json` after the hero. Add it to both the `sections` object and the `order` array:

```json
"perde_categories": {
  "type": "perde-categories",
  "blocks": {
    "cat_tul": {
      "type": "category",
      "settings": {
        "title": "Tul Perdeler",
        "description": "Isik geciren, hafif ve sik tul perde cesitlerimizi inceleyin.",
        "link": "/collections/tul-perdeler"
      }
    },
    "cat_fon": {
      "type": "category",
      "settings": {
        "title": "Fon Perdeler",
        "description": "Dekoratif ve islevsel fon perde seceneklerimize goz atin.",
        "link": "/collections/fon-perdeler"
      }
    },
    "cat_blk": {
      "type": "category",
      "settings": {
        "title": "Blackout Perdeler",
        "description": "Tam karartma saglayan blackout perde modellerimizi kesfin.",
        "link": "/collections/blackout-perdeler"
      }
    }
  },
  "block_order": ["cat_tul", "cat_fon", "cat_blk"]
}
```

Update `"order"` to: `["perde_hero", "perde_categories"]`

- [ ] **Step 3: Test in browser**

Verify:
- Three cards render in a row on desktop
- Cards stack on mobile (resize browser to <768px)
- Placeholder image area shows when no image set
- "Incele" buttons link to correct collections

- [ ] **Step 4: Commit**

```bash
git add theme/sections/perde-categories.liquid theme/templates/index.json
git commit -m "feat: add category cards section to homepage"
```

---

### Task 5: Create Measurement Guide Section

**Files:**
- Create: `theme/sections/perde-measurement-guide.liquid`
- Modify: `theme/templates/index.json`

**Context:** Section title + intro text + 3 YouTube embeds (TAC's measurement guide videos). Videos are lazy-loaded using `srcdoc` pattern to avoid loading YouTube iframes until clicked. Each video has a title and 1-line description.

- [ ] **Step 1: Create the measurement guide section**

Create `theme/sections/perde-measurement-guide.liquid`:

```liquid
<section class="perde-measurement">
  <div class="perde-measurement__inner">
    <h2 class="perde-measurement__title">{{ section.settings.title }}</h2>
    <p class="perde-measurement__intro">{{ section.settings.intro }}</p>
    <div class="perde-measurement__grid">
      {% for block in section.blocks %}
        <div class="perde-measurement__item" {{ block.shopify_attributes }}>
          <div class="perde-measurement__video-wrap">
            <iframe
              src="https://www.youtube-nocookie.com/embed/{{ block.settings.video_id }}"
              title="{{ block.settings.title }}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
          <h3 class="perde-measurement__video-title">{{ block.settings.title }}</h3>
          <p class="perde-measurement__video-desc">{{ block.settings.description }}</p>
        </div>
      {% endfor %}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Perde Olcu Rehberi",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Baslik",
      "default": "Perde Olcusu Nasil Alinir?"
    },
    {
      "type": "textarea",
      "id": "intro",
      "label": "Giris metni",
      "default": "Dogru olcu, mukemmel perdenin ilk adimidir. Asagidaki videolardan olcu alma yontemlerini ogrenin."
    }
  ],
  "blocks": [
    {
      "type": "video",
      "name": "Video",
      "settings": [
        {
          "type": "text",
          "id": "video_id",
          "label": "YouTube Video ID",
          "info": "URL'deki v= parametresinden sonraki kisim"
        },
        {
          "type": "text",
          "id": "title",
          "label": "Video basligi"
        },
        {
          "type": "textarea",
          "id": "description",
          "label": "Video aciklamasi"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Perde Olcu Rehberi",
      "blocks": [
        {
          "type": "video",
          "settings": {
            "video_id": "k8r_DUzKrlI",
            "title": "Kalorifer Ustu Olcu Alma",
            "description": "Kalorifer ustune monte edilecek perdeler icin dogru olcu alma yontemi."
          }
        },
        {
          "type": "video",
          "settings": {
            "video_id": "1BR3onEeMxk",
            "title": "Cam Hizasinda Olcu Alma",
            "description": "Cam hizasinda asilan perdeler icin en ve boy olculerinin nasil alinacagi."
          }
        },
        {
          "type": "video",
          "settings": {
            "video_id": "2yQDL8eXHc8",
            "title": "Yere Kadar Uzanan Olcu Alma",
            "description": "Yere kadar uzanan perdeler icin dogru olcu alma teknikleri."
          }
        }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Add to index.json**

Add `perde_measurement` section to `theme/templates/index.json`:

```json
"perde_measurement": {
  "type": "perde-measurement-guide",
  "settings": {
    "title": "Perde Olcusu Nasil Alinir?",
    "intro": "Dogru olcu, mukemmel perdenin ilk adimidir. Asagidaki videolardan olcu alma yontemlerini ogrenin."
  },
  "blocks": {
    "vid_kalorifer": {
      "type": "video",
      "settings": {
        "video_id": "k8r_DUzKrlI",
        "title": "Kalorifer Ustu Olcu Alma",
        "description": "Kalorifer ustune monte edilecek perdeler icin dogru olcu alma yontemi."
      }
    },
    "vid_cam": {
      "type": "video",
      "settings": {
        "video_id": "1BR3onEeMxk",
        "title": "Cam Hizasinda Olcu Alma",
        "description": "Cam hizasinda asilan perdeler icin en ve boy olculerinin nasil alinacagi."
      }
    },
    "vid_yer": {
      "type": "video",
      "settings": {
        "video_id": "2yQDL8eXHc8",
        "title": "Yere Kadar Uzanan Olcu Alma",
        "description": "Yere kadar uzanan perdeler icin dogru olcu alma teknikleri."
      }
    }
  },
  "block_order": ["vid_kalorifer", "vid_cam", "vid_yer"]
}
```

Update `"order"` to: `["perde_hero", "perde_categories", "perde_measurement"]`

- [ ] **Step 3: Test in browser**

Verify:
- Title and intro text render centered
- Three YouTube embeds display in a row on desktop
- Videos play when clicked
- Stacks to single column on mobile
- Privacy-enhanced mode (`youtube-nocookie.com`) used

- [ ] **Step 4: Commit**

```bash
git add theme/sections/perde-measurement-guide.liquid theme/templates/index.json
git commit -m "feat: add measurement guide video section to homepage"
```

---

### Task 6: Create FAQ Accordion Section

**Files:**
- Create: `theme/sections/perde-faq.liquid`
- Modify: `theme/templates/index.json`

**Context:** Uses native HTML `<details>/<summary>` for zero-JS accordion behavior. Six FAQ items per spec Section 3.

- [ ] **Step 1: Create the FAQ section**

Create `theme/sections/perde-faq.liquid`:

```liquid
<section class="perde-faq">
  <h2 class="perde-faq__title">{{ section.settings.title }}</h2>
  {% for block in section.blocks %}
    <details class="perde-faq__item" {{ block.shopify_attributes }}>
      <summary class="perde-faq__question">{{ block.settings.question }}</summary>
      <div class="perde-faq__answer">{{ block.settings.answer }}</div>
    </details>
  {% endfor %}
</section>

{% schema %}
{
  "name": "Perde SSS",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Baslik",
      "default": "Sikca Sorulan Sorular"
    }
  ],
  "blocks": [
    {
      "type": "faq",
      "name": "Soru",
      "settings": [
        {
          "type": "text",
          "id": "question",
          "label": "Soru"
        },
        {
          "type": "richtext",
          "id": "answer",
          "label": "Cevap"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Perde SSS",
      "blocks": [
        {
          "type": "faq",
          "settings": {
            "question": "Olculeri nasil almam gerekiyor?",
            "answer": "<p>Yukaridaki olcu alma videolarimizi izleyerek dogru olculeri alabilirsiniz. En (genislik) ve boy (yukseklik) olculerinizi santimetre cinsinden girin. Emin degilseniz WhatsApp uzerinden bize ulasabilirsiniz.</p>"
          }
        },
        {
          "type": "faq",
          "settings": {
            "question": "Ozel dikilen perdeler iade edilebilir mi?",
            "answer": "<p>Ozel olculerinize gore dikilen perdeler iade edilemez. Bu nedenle siparis vermeden once olculerinizi dikkatlice kontrol etmenizi oneririz.</p>"
          }
        },
        {
          "type": "faq",
          "settings": {
            "question": "Siparisim ne kadar surede hazirlaniyor?",
            "answer": "<p>Siparisleriniz 5-7 is gunu icerisinde dikilip kargoya verilir.</p>"
          }
        },
        {
          "type": "faq",
          "settings": {
            "question": "Kargo ucreti ne kadar?",
            "answer": "<p>1.000 TL ve uzeri siparislerde kargo ucretsizdir. Alti siparislerde kargo ucreti odeme sirasinda hesaplanir.</p>"
          }
        },
        {
          "type": "faq",
          "settings": {
            "question": "Yikama ve bakim talimatlariniz nelerdir?",
            "answer": "<p>Tul perdeler 30 derecede hassas yikama programinda yikanabilir. Fon ve blackout perdeler icin kuru temizlik onerilir. Detayli bilgi urun sayfalarinda yer almaktadir.</p>"
          }
        },
        {
          "type": "faq",
          "settings": {
            "question": "Taksit secenekleriniz nelerdir?",
            "answer": "<p>PayTR altyapisi ile kredi kartina taksit secenekleri sunulmaktadir. Taksit secenekleri odeme sayfasinda goruntulenir.</p>"
          }
        }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Add to index.json**

Add `perde_faq` section to `theme/templates/index.json`:

```json
"perde_faq": {
  "type": "perde-faq",
  "settings": {
    "title": "Sikca Sorulan Sorular"
  },
  "blocks": {
    "q1": {
      "type": "faq",
      "settings": {
        "question": "Olculeri nasil almam gerekiyor?",
        "answer": "<p>Yukaridaki olcu alma videolarimizi izleyerek dogru olculeri alabilirsiniz. En (genislik) ve boy (yukseklik) olculerinizi santimetre cinsinden girin. Emin degilseniz WhatsApp uzerinden bize ulasabilirsiniz.</p>"
      }
    },
    "q2": {
      "type": "faq",
      "settings": {
        "question": "Ozel dikilen perdeler iade edilebilir mi?",
        "answer": "<p>Ozel olculerinize gore dikilen perdeler iade edilemez. Bu nedenle siparis vermeden once olculerinizi dikkatlice kontrol etmenizi oneririz.</p>"
      }
    },
    "q3": {
      "type": "faq",
      "settings": {
        "question": "Siparisim ne kadar surede hazirlaniyor?",
        "answer": "<p>Siparisleriniz 5-7 is gunu icerisinde dikilip kargoya verilir.</p>"
      }
    },
    "q4": {
      "type": "faq",
      "settings": {
        "question": "Kargo ucreti ne kadar?",
        "answer": "<p>1.000 TL ve uzeri siparislerde kargo ucretsizdir. Alti siparislerde kargo ucreti odeme sirasinda hesaplanir.</p>"
      }
    },
    "q5": {
      "type": "faq",
      "settings": {
        "question": "Yikama ve bakim talimatlariniz nelerdir?",
        "answer": "<p>Tul perdeler 30 derecede hassas yikama programinda yikanabilir. Fon ve blackout perdeler icin kuru temizlik onerilir. Detayli bilgi urun sayfalarinda yer almaktadir.</p>"
      }
    },
    "q6": {
      "type": "faq",
      "settings": {
        "question": "Taksit secenekleriniz nelerdir?",
        "answer": "<p>PayTR altyapisi ile kredi kartina taksit secenekleri sunulmaktadir. Taksit secenekleri odeme sayfasinda goruntulenir.</p>"
      }
    }
  },
  "block_order": ["q1", "q2", "q3", "q4", "q5", "q6"]
}
```

Update `"order"` to: `["perde_hero", "perde_categories", "perde_measurement", "perde_faq"]`

- [ ] **Step 3: Test in browser**

Verify:
- FAQ title renders centered
- Six FAQ items display as collapsible details/summary elements
- Clicking a question toggles the answer open/closed
- `+` / `-` indicator toggles correctly
- Rich text answers render properly (paragraphs, links)

- [ ] **Step 4: Commit**

```bash
git add theme/sections/perde-faq.liquid theme/templates/index.json
git commit -m "feat: add FAQ accordion section to homepage"
```

---

### Task 7: Update Navigation

**Context:** Add "Perde Tasarla" link to the main navigation menu with accent color styling. This is done partly through Shopify Admin (menu item) and partly through theme CSS (accent styling).

Current nav per `docs/ecommerce/frontend-configuration.md`:
```
Tul Perdeler | Fon Perdeler | Blackout Perdeler | Saten
```

New nav:
```
Perde Tasarla | Tul Perdeler | Fon Perdeler | Blackout Perdeler | Saten
```

- [ ] **Step 1: Add nav accent CSS**

Add the following to the end of `theme/assets/perde-homepage.css`:

```css
/* --- Navigation accent for "Perde Tasarla" --- */
.header__menu-item[href="/"] {
  color: #1B2A4A;
  font-weight: 700;
  position: relative;
}

.header__menu-item[href="/"]::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #1B2A4A;
}
```

> **Note:** The exact CSS selector depends on Horizon's nav markup. After pulling the theme, inspect the header HTML to get the correct selector. The `href="/"` selector targets the homepage link which serves as the "Perde Tasarla" landing page.

- [ ] **Step 2: Add menu item via Shopify Admin (MANUAL)**

> **Human action required.** This step must be done by the user in Shopify Admin — it cannot be automated via CLI or theme files.

```
Shopify Admin > Online Magaza > Navigasyon > Ana menu
  Yeni menu ogesi ekle:
    Ad: Perde Tasarla
    Link: / (Ana sayfa)
    Sirayi degistir: En basa tasi
```

- [ ] **Step 3: Make CSS load on all pages**

The `perde-homepage.css` is currently only loaded by the hero section. For the nav accent to work on all pages, add the stylesheet to the theme layout.

Check `theme/layout/theme.liquid` for the `</head>` tag and add before it:

```liquid
{{ 'perde-homepage.css' | asset_url | stylesheet_tag }}
```

> **Alternative:** If loading all homepage CSS on every page feels wasteful, extract just the nav CSS into a separate `perde-nav.css` file. For now, the homepage CSS is small enough that loading it everywhere is fine.

- [ ] **Step 4: Test in browser**

Verify:
- "Perde Tasarla" appears first in the nav
- It links to the homepage
- It has bold/accent styling distinguishing it from other nav items
- Styling works on non-homepage pages too

- [ ] **Step 5: Commit**

```bash
git add theme/assets/perde-homepage.css theme/layout/theme.liquid
git commit -m "feat: add Perde Tasarla nav link with accent styling"
```

---

## Chunk 3: Final Integration & Deploy

### Task 8: Push theme to Shopify and verify live

- [ ] **Step 1: Review all changes**

```bash
cd /Users/semsettin/workspace/inanc-tekstil/theme
shopify theme check
```

Fix any Liquid lint errors reported.

- [ ] **Step 2: Push to development theme first**

```bash
shopify theme push --unpublished --store inanctekstil.store
```

This creates an unpublished preview theme. Shopify returns a preview URL.

- [ ] **Step 3: Full visual QA on preview**

Open the preview URL and verify the complete homepage flow:

| Check | Expected |
|---|---|
| Hero section | Full-width image, title, subtitle, 3 CTA buttons |
| Category cards | 3 cards in a row, correct collection links |
| Measurement videos | 3 YouTube embeds, playable |
| FAQ accordion | 6 items, expandable/collapsible |
| Navigation | "Perde Tasarla" link first, accent styled |
| Mobile (resize to 375px) | All sections stack properly |
| Page speed | No layout shift, images lazy-loaded |

- [ ] **Step 4: Set hero background image**

Via Shopify Admin on the preview theme:
```
Online Magaza > Temalar > [preview tema] > Ozellestir > Ana Sayfa
  Perde Hero bolumu > "Arka plan gorseli" > Upload a lifestyle curtain image
```

- [ ] **Step 5: Set category card images**

Via Shopify Admin on the preview theme:
```
Ana Sayfa > Perde Kategoriler bolumu
  Tul Perdeler > Gorsel > Upload
  Fon Perdeler > Gorsel > Upload
  Blackout Perdeler > Gorsel > Upload
```

- [ ] **Step 6: Publish theme**

After QA passes, publish the preview theme to make it live:

```bash
shopify theme publish --store inanctekstil.store
```

Or via Shopify Admin: Online Magaza > Temalar > [preview tema] > Yayinla

- [ ] **Step 7: Final commit**

```bash
git add -A theme/
git commit -m "feat: perde tasarla homepage complete - hero, categories, videos, FAQ"
```

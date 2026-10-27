---
name: landing-page-design
description: Use when designing a marketing homepage or a product / course landing page that must sell - page structure, band rhythm, hero, trust band, problem and solution, audience, proof, FAQ and final CTA, imagery, motion, mobile and performance - or when turning a client's reference mocks, voice notes or chat into a buildable spec. Not for admin tools (see admin-ui-design), app screens (see mobile-ui-design) or rendering promo videos (see marketing-video).
---

# Landing Page Design

## Overview

A landing page that converts reads like **slides, not a page**. It's a sequence of full-width bands that alternate tone. Each band carries **one idea, one headline and one visual device**, and the story moves from wanting it, to believing it, to deciding. Imagery does most of the work; text stays short.

**Core principle:** every band has one job. If a band has no job, cut it. If it has two, split it.

## When to Use

- Designing or redesigning a homepage or product / course landing page.
- A page "has all the content but doesn't sell": text-only slabs, uniform boxes, competing stats.
- A client sent reference mocks, screenshots or voice notes and you need a spec.

## 1. Turn References Into a Spec

- **Record the client's own instructions verbatim** first. References are usually **layout and flow references, not colour schemes**. Colours come from the brand's tokens.
- **Write one shared design language** across all the references (rhythm, type, colour, imagery, components), then an **image-by-image record**, so nothing is lost.
- **Translate, don't copy:** map each reference section to your page type. A product-page mock's "glance card" may have no homepage equivalent.
- **Hard don'ts** go at the end, taken from the references and the site rules.
- **Positioning:** note what competitors look like. Plain, content-first rivals leave room for a cinematic, editorial look.

## 2. The Page Model

Three layers, in order:

| Layer | Bands | Job |
|---|---|---|
| **Conversion** (top) | Hero, trust band, problem, solution | Create demand in the first screens. A hook right after the hero, not logistics |
| **Transformation** (middle) | "Imagine your life after this", "Is this for you?", community and trust | Make the reader see themselves in it |
| **Decision** (from about the third screen) | Experts, the experience, proof, FAQ, final CTA | Remove doubt and ask |

Decision content never appears before the transformation layer has run. Aim for **6–7 visually distinct bands** and a **one-minute attention budget**.

## 3. Band Grammar

Every band (except the hero and CTA) follows the same order:
1. **A numbered eyebrow:** `01 · THE PROBLEM`, about 11px, letter-spaced (~0.2em), in the accent colour on dark and muted on light.
2. **A display headline:** 20 characters or fewer per line. Optionally the **emotional phrase in accent italic**, once per band.
3. **One or two lines of support:** 16–18px, 1.6 line height, max ~52ch, muted.
4. **One visual device:** a photo, an icon strip, a step flow, cards or a map.
5. An optional quiet CTA at the end of a chapter.

**Tone sequence:** light → dark → light → warm neutral → dark → light → warm neutral → dark. Generous vertical padding (around 80–136px); white space is part of the design.

## 4. Type, Colour, Imagery

- **Type:** a display serif for H1 and H2, sized with `clamp()` (H1 around 40–68px, H2 around 30–48px, line height 1.05–1.12). A clean sans for body and UI. Stats in large display numerals.
- **Colour:** use the brand's tokens only.
  - **Bands:** near-black dark bands (a subtle vertical gradient is fine), and white alternating with a warm neutral for light ones.
  - **Accent:** one accent colour for eyebrows, numbers, stars, italic phrases and hairlines.
  - **CTA:** one CTA colour, in **at most two places** (the hero primary and the final CTA). Other buttons are ink-on-light or light-on-dark pills.
  - **Pastels** appear only in small icon circles, never on surfaces. **Red and green tints** appear only inside problem / solution panels.
  - Check accent-on-dark contrast; it often passes only at 18px bold.
- **Imagery:** this is usually the biggest gap.
  - Warm, real, on-brand photography: engaged people, not stock smiles; real portraits for experts.
  - **Blend images, don't box them:** photos fade into the band through masks, with no hard rectangles floating on white.
  - In banner bands, images carry about **70%** of the visual weight and text about **30%**.
  - Every image is optimised (AVIF / WebP), lazy below the fold, and has its aspect ratio reserved.

## 5. Band Recipes

| Band | Anatomy |
|---|---|
| **Hero** (light) | Eyebrow, an H1 of 3 lines max with the accent italic phrase, 2 support lines, a dark pill primary CTA (plus an optional "Watch intro"), and a proof row (overlapping avatars, a star rating, "Join N+ customers"). A photo on the right 50–60%, fading into the page. A product page adds a floating **glance card**: icon / label / value rows, price "From £X/month", the CTA, and a payment-plans link |
| **Trust band** (directly under the hero) | One pill-shaped or flat dark strip with 4–6 stats (line icon, bold number, small label). **One set of numbers per page** |
| **Problem** (dark) | A question-form H2, a pensive photo blended into one half, and an **icon pain strip** of 5–6 items with the key words bolded and thin dividers between them |
| **Solution** (light) | An H2 answering the problem, and a **5-step circle flow** (pastel icon circles joined by thin arrows, each with one bold word and two lines; the last step in the accent). Alternative: side-by-side "Problem" (✕) and "Our solution" (✓) panels |
| **Imagine** (warm neutral) | A centred H2 and one line, then 5 photo cards in a carousel: a 4:3 photo, an icon chip overlapping its edge, a dark card body, a 2-line title and 3 lines of copy |
| **Is this for you?** | 6–7 audience tiles (an icon in a rounded square, a bold label, one line), then "If you see yourself here, this was made for you" |
| **Community / trust** (dark) | An H2 and support line, a dotted world map with glow points (or a fitting photo), 4 stats. Optionally a full-width quote band |
| **Experts** | An eyebrow, an H2 on credentials, 3 cards (photo, serif name, credential, a 1–2 line bio, "View profile →"). Or one featured card plus compact rows |
| **Experience** | 6 tiles in a 3×2 grid (photo or icon, a bold label, one line). This is where you answer "I can get this for free elsewhere": structure, accountability, live experts |
| **Journey** | 5 phases on a horizontal line (desktop) or a vertical rail (mobile), each with 2 lines |
| **Testimonials** | A video card with a duration chip, plus 2–3 quote cards (stars, a 2–3 line quote, avatar, name, country), in a carousel |
| **FAQ** | 8–9 questions as an accordion with + icons. Two columns on desktop |
| **Final CTA** (dark, cinematic) | A strong photo, an H2 ("Ready to begin?"), a support line, a feature checklist row, the price block, the CTA plus "Talk to us", and honest microcopy about plans or intake |
| **Footer** (dark) | Logo, a one-line mission, social links, 4 link columns, copyright |

## 6. Mobile

- **Hero:** text first, the photo below with a bottom fade.
- **Stats:** 2×2.
- **Rails:** swipe carousels with a peek and dots, using scroll-snap inside their container.
- **Wrapping and stacking:**
  - the pain strip stacks as icon rows;
  - the step flow wraps 3 + 2;
  - experts become one featured card plus rows;
  - the experience grid goes to 2 columns;
  - timelines go vertical;
  - the FAQ is a single accordion.
- **Final CTA:** a full-bleed photo overlay.
- **Sizing:** touch targets 44px or more, body text 16px or more, and no sideways page scroll.

## 7. Motion and Performance

- **Reveal on scroll:** opacity plus translateY(16–24px), 400ms ease-out, a 40ms stagger, once per element.
- **Hover:** card hover lifts 4px and deepens the shadow, with micro-interactions of 150–300ms. Animate transform and opacity only.
- **Reduced motion:** all motion sits inside `prefers-reduced-motion: no-preference`. No parallax, no scroll-jacking, no endless decorative animation.
- **Performance:** prerender statically with no cookies, a priority hero image, and everything else lazy. Targets: LCP under 2.0s and CLS under 0.1. The only client JS is the reveal observer and the carousels.
- **Accessibility:** 4.5:1 contrast (audit accent-on-dark), visible focus, keyboard-reachable carousels, alt text on every image, and headings in order.

## 8. Build Order

1. **See it fast:** build a bespoke composed page on a hidden route (noindex), reusing existing section primitives and data, with copy hard-coded from the spec.
2. **Review gates:** the hero and first three bands in a browser first, then the full page at desktop and 375px.
3. **Make it editable** after visual sign-off: one CMS block type per band that needs editing.
4. **Swap in final assets** (photography, portraits, screenshots) with no layout changes.

Don't restyle old section components into new ones. New bands are new components that share one card skin.

## Hard Don'ts

- Text-only colour-slab banners.
- Paragraph walls. Use 2–3 lines, then icon lines or chips.
- More than one set of stats per page.
- Boxed, floating photos.
- More than two CTA-colour buttons.
- Reserved brand colours used on surfaces.
- A band without a job.
- Proof, FAQ or the final CTA before the transformation layer.

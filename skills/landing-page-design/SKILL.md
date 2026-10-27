---
name: landing-page-design
description: Use when designing a marketing homepage, product or offer landing page, or design variations of one - story and section structure, hero, proof, pricing, FAQ, the conversion action, imagery, motion, mobile, accessibility, SEO and performance - or when turning a client's reference mocks, notes or voice memos into a buildable spec. Not for admin tools (admin-ui-design), app screens (mobile-ui-design) or promo videos (marketing-video).
---

# Landing Page Design

## Overview

A landing page helps a visitor decide, quickly and honestly. Design it in two layers:
- **Structure:** the story, the sections, the conversion action and its states.
- **Look:** a direction expressed as tokens, imagery and motion. Swapping it gives variations.

Each section carries one idea, one heading and one visual device.

**Core principle:** every section has one job, every claim is true, and everything the visitor needs to decide is easy to find.

[examples.md](examples.md) has one offer page in three variations, a two-pass plan, a section map, hero copy, honest-microcopy pairs, and a voice note turned into spec lines.

## Process

1. **Define success:** the one action (book a trial, buy, sign up), who the visitor is, and the measure (conversion rate, completed bookings).
2. **Gather the real material:** offer details, prices and terms, verified numbers, real testimonials with permission, real photography. Mark anything missing as a placeholder.
3. **Turn references into a spec** (when a client sends mocks or notes):
   - record their instructions word for word;
   - treat references as layout and flow unless they say otherwise;
   - write one shared design language plus a note for each reference;
   - map each reference section onto this page type.
4. **Write a two-pass plan:**
   - first pass: 4–6 named colours, the type roles, an ASCII wireframe of the sections, and the page's one memorable element;
   - second pass: check the plan against the brief, and replace anything that would appear on any similar page with a choice made for this one.
5. **Design the structure, then the look, then any variations.**
6. **Build, review and launch** with the checks below.

## Structure

### The story

A strong default order:

| Part | Sections | Job |
|---|---|---|
| Hook | Hero, proof strip, problem, solution | Create interest and show it's credible |
| Picture it | Outcomes, "who it's for", community | Help visitors see themselves in it |
| Decide | People behind it, what's included, proof, pricing, FAQ, final call to action | Answer doubts and ask |

- **Facts are reachable from the top:** price, what's included and the main action can be found from the hero (a glance card, a pricing link, or sticky navigation), for visitors who arrive ready to decide.
- **Size:** about 6–9 distinct sections, so the page is scannable in about a minute.
- **One heading per section, in order** (one H1, then H2s).

### Section recipes

| Section | Contains |
|---|---|
| Hero | A headline (the promise), a one- or two-line subhead, the primary action, an optional secondary action, and one strong visual. An offer page adds a glance card with the key facts, the full price and terms, and the action |
| Proof strip | 3–5 verified figures or recognisable names, each with its source and date where it matters |
| Problem | The visitor's situation in their own words: a short list or a few lines |
| Solution | How the offer changes that, as steps or a before/after |
| Outcomes | 3–5 concrete results, as photo cards or short items |
| Who it's for | 4–7 audience tiles, and who it isn't for |
| People | The real team, trainers or experts, with credentials |
| What's included | Features, format, schedule, support |
| Testimonials | Real quotes from named customers, with permission, a photo or initials, and context |
| Pricing | Every plan with its full price, billing period, total commitment, renewal and cancellation terms, and what's included |
| FAQ | 6–10 real questions, including the hard ones (cancellation, refunds, requirements) |
| Final call to action | The promise restated, the action, and a way to ask a question |
| Footer | Contact, legal and policy links, social links |

Use the sections the offer needs. Write down why any section is dropped or added.

### The conversion action

- **Form:** the fewest fields that complete the action. Visible labels, the right input types and `autocomplete`, and errors that say how to fix them, with an error summary.
- **States:** submitting (button progress, no double submits), success (what happens next and when, plus a confirmation email), failure (input kept, the reason, a retry), and an alternative way to get in touch.
- **Payment and booking flows** show the total before commitment, and every fee.
- **Completed journey:** test it end to end on a real phone, including the confirmation.

### Honest persuasion

- **Proof is real:** figures are verified, with a source and date; testimonials come from real customers, with permission; ratings link to where they come from. When none exists yet, leave the section out.
- **Urgency is real:** a deadline or limit appears only when it exists, and states its date or number.
- **Prices are complete:** the full price, the billing period, the total commitment, renewal and how to cancel, near the action. A per-month figure sits next to the total.
- **Actions are clear:** buttons say what happens ("Book a free trial"). Declining is a plain choice, without guilt-trip wording.

### Interactive parts

- **Carousels:** visible previous and next controls, keyboard support, a position indicator, no autoplay (or a pause control when it moves), and every item reachable without the carousel.
- **Accordions:** real buttons with `aria-expanded`, the content in the page source, and keyboard toggling.
- **Video:** captions, a transcript for key content, no autoplay with sound, and a poster image.
- **Images:** alt text that says what the image shows for the decision. Decorative images get empty alt.

### Responsive and accessibility

- **Small screens:** sections reflow by content priority: the message first, then the visual. Grids drop columns, rails become swipeable lists that are also reachable by keyboard, and long timelines go vertical.
- **Reflow:** the page works at 320 CSS px and 400% zoom without sideways page scroll.
- **Size:** body text 16px or larger. Touch targets 44px or larger.
- **Contrast:**
  - text 4.5:1 (3:1 at 24px+, or 18.66px+ bold), including text over images (use an overlay or a solid panel);
  - controls and focus 3:1.
- **Keyboard:** the page works with a visible focus style throughout.

## Look

Set the tokens and imagery from the brand, or start from a direction:

| | Editorial | Product | Bold graphic |
|---|---|---|---|
| Suits | Premium, story-led offers | Software and services that sell on clarity | Launches, events, young brands |
| Sections | Full-width bands alternating light, dark and a warm neutral | White space, screenshots and diagrams | Solid colour blocks, big type |
| Type | A display serif with a sans | One sans with a tight scale | A heavy display face with a sans |
| Imagery | Warm real photography blended into the bands | Product UI and real screenshots | Illustration or cut-out photography |
| Accent | One accent for small details | The brand colour on actions | Two brand colours used boldly |
| Motion | One slow reveal | Product demos | Playful transitions |

Every direction:
- **One action colour,** used on the primary actions.
- **A palette of 4–6 named colours,** each with one job.
- **Imagery:** real and specific to the offer, compressed (AVIF or WebP), with aspect ratios reserved and lazy-loaded below the fold.
- **Motion:**
  - one deliberate moment beats many small ones;
  - content is visible without JavaScript or animation, and motion only enhances it;
  - animate transform and opacity;
  - follow `prefers-reduced-motion`;
  - no parallax that moves text, and no scroll-jacking.
- **Section devices** (numbered labels, an accent phrase in the headline, uppercase eyebrows) are expressive choices. Use them where they carry meaning, such as numbering for a real sequence, or because the brand calls for them.

## Variations

Keep the structure and content fixed, and vary the look along named axes:

| Axis | Range |
|---|---|
| Direction | Editorial · Product · Bold graphic · the brand's own |
| Hero composition | Split image/text · full-bleed image · type only · product demo |
| Rhythm | Alternating bands · continuous white · colour blocks |
| Type | Serif display · one sans · heavy display |
| Imagery | Photography · product UI · illustration |
| Motion | None · one reveal · interactive demo |

- **Distinct:** each variation differs on at least two axes.
- **Named for its idea.**
- **Checked:** each one passes the honesty and accessibility rules.
- **Compared fairly:** shown side by side at desktop and phone width, with the same copy and one line each on when to pick it.

## Launch Checks

- **Performance:** a statically rendered page where possible, a priority hero image, and minimal client JavaScript. Targets: LCP under 2.5s, CLS under 0.1 and INP under 200ms on a mid-range phone.
- **SEO:**
  - a unique title and meta description;
  - one H1 and logical headings;
  - descriptive link text;
  - a canonical URL;
  - Open Graph and social images;
  - structured data where it applies (Organization, Product, Event, FAQ);
  - indexable content in the HTML.
- **Privacy:**
  - analytics and marketing tags load only with consent where the law requires it;
  - forms link the privacy policy and collect only what they need.
- **Previews:** draft pages live behind authentication or a password on a preview deployment.
- **Language:** copy works when translated. Layouts allow longer text, and right-to-left languages are mirrored when offered.
- **Measurement:** the success measure from step 1 is tracked, with consent, and reviewed after launch.

## Review Checklist

- [ ] Success measure and primary action defined.
- [ ] Every section has one job; key facts reachable from the hero.
- [ ] All proof real and sourced; prices complete; urgency real.
- [ ] The conversion action's states designed and tested end to end.
- [ ] Carousels, accordions and video operable and accessible.
- [ ] Reflow at 320px and 400% zoom; contrast, including text over images.
- [ ] Content visible without JS; reduced motion honoured.
- [ ] Performance, SEO, consent and preview protection checked.

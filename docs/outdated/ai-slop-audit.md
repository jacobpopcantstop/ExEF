# AI Slop Audit (2026-03-10)

## Summary
EFI does not look broken. It looks generic in a very specific 2024-2026 way: gradient-heavy, card-heavy, polished-but-anonymous, and structurally similar to dozens of AI-assisted SaaS marketing sites.

The problem is not "too modern." The problem is that the visual language implies a startup product shell instead of a research-grounded institute. The current system overuses interchangeable UI signals and underuses institutional signals, editorial texture, human presence, and domain-specific hierarchy.

## Primary Findings
### 1. The brand system is generic SaaS, not institute-grade
- Shared typography and color choices default to `Inter` + `Merriweather`, blue/teal gradients, pill badges, and rounded cards. That is competent, but it is also the safest possible AI-generated visual stack.
- The fixed glass nav and glowing gradient square logo push the site toward "AI tools company" rather than "trusted educational institution."
- References:
  - [css/styles.css](/Users/jacobrozansky/exef/css/styles.css#L39)
  - [css/styles.css](/Users/jacobrozansky/exef/css/styles.css#L243)
  - [css/styles.css](/Users/jacobrozansky/exef/css/styles.css#L286)

### 2. Hero treatment reads like a template, not a point of view
- The homepage opens with a three-stop gradient hero, highlighted span headline, badge, metrics row, and three CTA buttons. This is a textbook AI-site composition.
- The hero says the right things, but the structure is mechanically familiar: big abstract promise, stacked CTAs, stats, no immediate evidence artifact.
- References:
  - [index.html](/Users/jacobrozansky/exef/index.html#L69)
  - [index.html](/Users/jacobrozansky/exef/index.html#L80)
  - [css/styles.css](/Users/jacobrozansky/exef/css/styles.css#L509)

### 3. Too many sections use the same "tag + headline + paragraph + cards" rhythm
- Homepage, About, and Curriculum all repeat centered section tags, soft explanatory paragraphs, and card grids. The repetition makes the site feel auto-composed even when the underlying content is strong.
- The problem is not the components themselves. The problem is that almost every page relies on the same rhythm, spacing, and reveal pattern.
- References:
  - [index.html](/Users/jacobrozansky/exef/index.html#L105)
  - [index.html](/Users/jacobrozansky/exef/index.html#L215)
  - [about.html](/Users/jacobrozansky/exef/about.html#L56)
  - [curriculum.html](/Users/jacobrozansky/exef/curriculum.html#L135)
  - [css/styles.css](/Users/jacobrozansky/exef/css/styles.css#L796)

### 4. Motion and hover polish are doing generic "premium" work instead of meaningful work
- Card lift, button lift, stagger reveals, and decorative nav pixel effects create motion volume without adding comprehension.
- These patterns are common AI-generated embellishments because they make a site feel "finished" quickly, but they do not create trust or clarity here.
- References:
  - [css/styles.css](/Users/jacobrozansky/exef/css/styles.css#L300)
  - [css/styles.css](/Users/jacobrozansky/exef/css/styles.css#L667)
  - [css/styles.css](/Users/jacobrozansky/exef/css/styles.css#L706)
  - [css/styles.css](/Users/jacobrozansky/exef/css/styles.css#L1771)

### 5. The site under-signals real people, real practice, and real artifacts
- EFI is strongest when it is specific: Barkley, Brown, Ward, capstones, rubrics, applied frameworks, tools. The UI often wraps that specificity in abstract marketing chrome instead of leading with visible proof.
- There is very little institutional texture: annotated syllabus pages, research excerpts, faculty voice, workshop scenes, whiteboard diagrams, real coaching artifacts, or document previews.
- References:
  - [index.html](/Users/jacobrozansky/exef/index.html#L174)
  - [about.html](/Users/jacobrozansky/exef/about.html#L83)
  - [curriculum.html](/Users/jacobrozansky/exef/curriculum.html#L141)

### 6. The design system over-rounds and over-softens everything
- Rounded pills, rounded cards, rounded tags, soft shadows, gradient buttons, and muted borders flatten distinction between content types.
- When everything is equally softened, nothing feels authoritative.
- References:
  - [css/styles.css](/Users/jacobrozansky/exef/css/styles.css#L56)
  - [css/styles.css](/Users/jacobrozansky/exef/css/styles.css#L426)
  - [css/styles.css](/Users/jacobrozansky/exef/css/styles.css#L654)
  - [css/styles.css](/Users/jacobrozansky/exef/css/styles.css#L1172)

### 7. Inline one-off styling reinforces the assembled feel
- Several pages rely on inline spacing, color, and border tweaks on top of the shared system. That usually happens when a site is iterated quickly without a strong editorial art direction.
- The result is visually coherent enough, but it feels composited rather than designed.
- References:
  - [index.html](/Users/jacobrozansky/exef/index.html#L76)
  - [about.html](/Users/jacobrozansky/exef/about.html#L58)
  - [about.html](/Users/jacobrozansky/exef/about.html#L87)
  - [curriculum.html](/Users/jacobrozansky/exef/curriculum.html#L141)

### 8. Shared runtime templating is flattening page identity
- The site is not only reusing the same visual components. `js/main.js` rewrites navigation and footer structures so pages converge toward the same shell even when their source markup differs.
- That is efficient, but it also means page identity is being erased by the runtime layer.
- References:
  - [js/main.js](/Users/jacobrozansky/exef/js/main.js#L119)
  - [js/main.js](/Users/jacobrozansky/exef/js/main.js#L133)

## What To Preserve
- The content base is substantially better than the average AI-built site.
- The information architecture is broad and useful.
- The curriculum detail is a real differentiator.
- Accessibility basics are present.
- The system is consistent enough that a visual reset can be done without rewriting the site.

## Recommended Direction
Shift EFI away from "clean SaaS landing page" and toward "applied institute + field manual."

That means:
- less gradient atmosphere
- fewer floating cards
- stronger typographic hierarchy
- more visible evidence and source material
- more document-like and workshop-like surfaces
- fewer CTA clusters
- more real human and institutional texture

## Execution Plan
### Phase 1. Remove the most obvious AI vibe signals
- Replace the glass nav with a solid, quiet header.
- Remove `nav-pixel` effects and most hover lift transforms.
- Reduce rounded corners globally.
- Kill the green gradient primary button treatment in favor of flat, high-contrast fills.
- Simplify hero backgrounds on `index.html` and `.page-header` to mostly flat or minimally textured surfaces.

### Phase 2. Reframe the homepage around proof, not polish
- Replace the current hero stats row with one concrete evidence strip: frameworks taught, downloadable tools, and capstone/rubric preview.
- Cut the homepage hero CTAs from three to one primary plus one secondary.
- Pull a real artifact above the fold: syllabus spread, rubric excerpt, coaching worksheet preview, or annotated framework diagram.
- Rewrite section order so visitors see proof before claims.

### Phase 3. Introduce institutional texture
- Add photography or documentary imagery that is specific to EFI: coaching sessions, annotated lesson materials, workshop boards, printed forms, books, binders, or founder/faculty presence.
- Create a reusable "evidence block" component for citations, excerpts, or downloadable artifacts.
- Create a reusable "faculty voice" or "teaching note" pattern so expertise feels authored, not merely arranged.

### Phase 4. Break the template rhythm
- Give homepage, About, and Curriculum different compositional logics instead of reusing the same centered intro and card grid.
- Make Curriculum more document-like and outline-like.
- Make About more narrative and people-centered.
- Make the homepage more directional and decision-oriented.

### Phase 5. System cleanup
- Replace inline styles with named utilities or dedicated component classes.
- Create 3-4 page archetypes and stop inventing micro-variants ad hoc.
- Tighten the token set so emphasis styles are rare and meaningful.

## First Three Changes I Would Actually Ship
1. Restyle the header, buttons, cards, and hero backgrounds in [css/styles.css](/Users/jacobrozansky/exef/css/styles.css) to remove the fastest "AI startup" tells.
2. Rebuild the top of [index.html](/Users/jacobrozansky/exef/index.html) so the first screen shows proof artifacts and only two actions.
3. Redesign [curriculum.html](/Users/jacobrozansky/exef/curriculum.html) as an academic outline / workbook page instead of a sequence of polished product cards.

## Success Criteria
- A first-time visitor should think "credible institute" before "template site."
- The homepage should communicate evidence within the first screen, not just positioning.
- Internal pages should feel intentionally different from each other.
- The design should become more specific, not more decorative.

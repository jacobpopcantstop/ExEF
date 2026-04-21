# EF Tools & Resources Guide Section — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new collapsible "Executive Function Tools & Resources Guide" section to `resources.html` that organizes the content from the comprehensive guide into browsable, non-overwhelming accordion categories. Every tool/org/creator name links out to its real website.

**Architecture:** A single new `<section>` inserted between the existing Library section and the CTA section. Uses the existing accordion component pattern already on the page. Content organized by *challenge* (not tool type) per the guide's own recommendation. Each accordion panel contains a brief intro + a compact comparison table with linked names + a key insight callout. No new CSS needed — reuses `.accordion`, `.table-wrapper`, and `.section--alt` patterns already in `styles.css`.

**Tech Stack:** HTML only — all CSS patterns already exist in the codebase.

---

## File Structure

- **Modify:** `resources.html:557` — Insert new section before the CTA section (line 559)
- **No new files needed** — all CSS classes already exist

---

### Task 1: Insert section shell and first two accordion panels

**Files:**
- Modify: `resources.html:559` (insert before CTA section)

- [ ] **Step 1: Insert section shell, Panel 1, and Panel 2**

Insert after line 557 (`</section>` closing the library section) and before the CTA section:

```html
<section class="section section--alt" id="tools-guide">
  <div class="container">
    <div class="section-header section-header--left">
      <span class="section-header__tag">Tools &amp; Resources Guide</span>
      <h2>External EF Support Ecosystem</h2>
      <p>Tools, platforms, and communities organized by the challenge they address — not by product category. Based on current research and practitioner recommendations.</p>
    </div>
    <div class="accordion resources-library-panels">

      <div class="accordion__item">
        <button type="button" class="accordion__header">
          Advocacy &amp; Institutional Knowledge
          <span class="accordion__icon">+</span>
        </button>
        <div class="accordion__body">
          <div class="accordion__content">
            <p>These organizations serve as clearinghouses for evidence-based EF interventions, bridging clinical research and daily application.</p>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Organization</th><th>Focus</th><th>Key Resources</th><th>Audience</th></tr>
                </thead>
                <tbody>
                  <tr><td><a href="https://www.understood.org/" target="_blank" rel="noopener">Understood.org</a></td><td>Learning and thinking differences</td><td>Checklists, AI Assistant, transition guides</td><td>Parents, students, educators</td></tr>
                  <tr><td><a href="https://chadd.org/" target="_blank" rel="noopener">CHADD</a></td><td>ADHD advocacy and education</td><td>Webinars, National Resource Center, local chapters</td><td>Families, adults, professionals</td></tr>
                  <tr><td><a href="https://www.additudemag.com/" target="_blank" rel="noopener">ADDitude Magazine</a></td><td>Comprehensive ADHD lifestyle</td><td>Expert webinars, print magazine, lifestyle strategies</td><td>Professionals, neurodivergent adults</td></tr>
                  <tr><td><a href="https://transitionta.org/" target="_blank" rel="noopener">NTACT:C</a></td><td>Transition assistance</td><td>Government-sponsored transition resources</td><td>Young adults entering the workforce</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>Key insight:</strong> EF challenges are not laziness — they represent a "stuck" state in the brain's planning circuitry. These organizations help make the invisible planning steps visible.</p>
          </div>
        </div>
      </div>

      <div class="accordion__item">
        <button type="button" class="accordion__header">
          Task Management &amp; Cognitive Externalization
          <span class="accordion__icon">+</span>
        </button>
        <div class="accordion__body">
          <div class="accordion__content">
            <p>The smartphone as "external prefrontal cortex" — these platforms address capture friction, prioritization paralysis, and the need to micro-chunk goals into steps small enough to start.</p>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>App</th><th>Core Approach</th><th>Standout Feature</th><th>Platforms</th></tr>
                </thead>
                <tbody>
                  <tr><td><a href="https://www.todoist.com/" target="_blank" rel="noopener">Todoist</a></td><td>Frictionless capture</td><td>Natural language processing for quick entry</td><td>Web, iOS, Android</td></tr>
                  <tr><td><a href="https://workspace.google.com/products/tasks/" target="_blank" rel="noopener">Google Tasks</a></td><td>Ecosystem integration</td><td>Seamless Gmail and Calendar sync</td><td>Web, iOS, Android</td></tr>
                  <tr><td><a href="https://culturedcode.com/things/" target="_blank" rel="noopener">Things 3</a></td><td>Aesthetic clarity</td><td>Elegant "Today" view that clears mental clutter</td><td>iOS, Mac</td></tr>
                  <tr><td><a href="https://trello.com/" target="_blank" rel="noopener">Trello</a></td><td>Visual workflow</td><td>Kanban board with drag-and-drop progress tracking</td><td>Web, iOS, Android</td></tr>
                  <tr><td><a href="https://asana.com/" target="_blank" rel="noopener">Asana</a></td><td>Team coordination</td><td>Collaborative visual boards</td><td>Web, iOS, Android</td></tr>
                  <tr><td><a href="https://www.notion.com/" target="_blank" rel="noopener">Notion</a></td><td>Centralized knowledge</td><td>Customizable database "command center"</td><td>Web, Desktop, Mobile</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>Key insight:</strong> The most critical step is immediate capture before tasks vanish from working memory. Visual evidence of progress (like moving a Trello card) provides dopamine reward often lacking in neurodivergent reward systems.</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>
```

- [ ] **Step 2: Verify the page loads correctly**

- [ ] **Step 3: Commit**

```bash
git add resources.html
git commit -m "feat(resources): add EF tools guide section with advocacy and task management panels"
```

---

### Task 2: Add accordion panels 3 and 4 (Focus/Time and Body Doubling)

**Files:**
- Modify: `resources.html` — insert before the closing `</div>` of the accordion container

- [ ] **Step 1: Add Panels 3 and 4**

Insert inside the `.accordion` div, after the Task Management panel:

```html
      <div class="accordion__item">
        <button type="button" class="accordion__header">
          Focus, Time, &amp; Attention
          <span class="accordion__icon">+</span>
        </button>
        <div class="accordion__body">
          <div class="accordion__content">
            <p>"Time blindness" — the inability to sense time passing or estimate task duration — is a hallmark of executive dysfunction. These tools make time visible and use gamification to sustain attention.</p>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Tool</th><th>Mechanism</th><th>Addresses</th><th>Cost</th></tr>
                </thead>
                <tbody>
                  <tr><td><a href="https://www.timetimer.com/" target="_blank" rel="noopener">Time Timer</a></td><td>Disappearing red disk</td><td>Abstract time visualization</td><td>Free / Paid</td></tr>
                  <tr><td><a href="https://www.forestapp.cc/" target="_blank" rel="noopener">Forest</a></td><td>Gamified virtual tree growth</td><td>Distraction inhibition</td><td>Freemium</td></tr>
                  <tr><td><a href="https://focuskeeper.co/" target="_blank" rel="noopener">Focus Keeper</a></td><td>Pomodoro intervals</td><td>Sustained attention via work sprints</td><td>Free / Premium</td></tr>
                  <tr><td><a href="https://www.brain.fm/" target="_blank" rel="noopener">Brain.fm</a></td><td>AI-designed neural phase locking audio</td><td>Flow state facilitation</td><td>Subscription</td></tr>
                  <tr><td><a href="https://endel.io/" target="_blank" rel="noopener">Endel</a></td><td>Adaptive soundscapes</td><td>Circadian rhythm alignment</td><td>Subscription</td></tr>
                  <tr><td><a href="https://www.tiimoapp.com/" target="_blank" rel="noopener">Tiimo</a></td><td>Visual daily schedule</td><td>Transition management</td><td>Freemium</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>Key insight:</strong> Gamification addresses the deficit in intrinsic motivation by providing immediate, extrinsic rewards. In Forest, leaving the app kills your tree — over time, users build a visual record of sustained focus.</p>
          </div>
        </div>
      </div>

      <div class="accordion__item">
        <button type="button" class="accordion__header">
          Accountability &amp; Body Doubling
          <span class="accordion__icon">+</span>
        </button>
        <div class="accordion__body">
          <div class="accordion__content">
            <p>Body doubling — working in the presence of another person — is one of the most effective non-pharmacological interventions for executive dysfunction. The presence of an observer provides enough dopamine and social pressure to anchor attention on under-stimulating tasks.</p>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Platform</th><th>Format</th><th>How It Works</th></tr>
                </thead>
                <tbody>
                  <tr><td><a href="https://www.focusmate.com/" target="_blank" rel="noopener">Focusmate</a></td><td>1-on-1 video sessions</td><td>Paired with a partner, state goals, work silently on camera</td></tr>
                  <tr><td><a href="https://www.flow.club/" target="_blank" rel="noopener">Flow Club</a></td><td>Facilitated group sessions</td><td>Shared-purpose work sessions with a host</td></tr>
                  <tr><td><a href="https://www.caveday.org/" target="_blank" rel="noopener">Caveday</a></td><td>Facilitated group sprints</td><td>Structured deep-work sessions with guided breaks</td></tr>
                  <tr><td><a href="https://www.dubbii.app/" target="_blank" rel="noopener">Dubbii</a></td><td>Pre-recorded guided doubling</td><td>Video companions for specific chores (cleaning, laundry, etc.)</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>Key insight:</strong> The social contract of having someone "waiting" for you provides a powerful external trigger for task initiation — particularly for remote workers and students who feel isolated.</p>
          </div>
        </div>
      </div>
```

- [ ] **Step 2: Verify and commit**

```bash
git add resources.html
git commit -m "feat(resources): add focus/time and body doubling accordion panels"
```

---

### Task 3: Add accordion panels 5 and 6 (Physical Tools and Browser/AI)

**Files:**
- Modify: `resources.html` — insert inside the accordion div

- [ ] **Step 1: Add Panels 5 and 6**

```html
      <div class="accordion__item">
        <button type="button" class="accordion__header">
          Physical Tools &amp; Sensory Supports
          <span class="accordion__icon">+</span>
        </button>
        <div class="accordion__body">
          <div class="accordion__content">
            <p>Many experts emphasize that analogue systems provide tactile engagement and distraction-free focus that digital tools cannot replicate. Physically writing a task improves memory retention and helps "glue" the intention in the brain.</p>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Category</th><th>Examples</th><th>What It Does</th></tr>
                </thead>
                <tbody>
                  <tr><td>EF Planners</td><td><a href="https://www.orderoochaos.com/" target="_blank" rel="noopener">Order Out of Chaos</a>, <a href="https://pandaplanner.com/" target="_blank" rel="noopener">Panda Planner</a>, <a href="https://cleverfoxplanner.com/" target="_blank" rel="noopener">Clever Fox</a>, <a href="https://adhdforlife.com/uforward-planner" target="_blank" rel="noopener">UForward</a></td><td>Flexible layouts with brain-dump sections and goal tracking</td></tr>
                  <tr><td>Visual Prompts</td><td>Desk cards, Post-it systems</td><td>Working memory scaffolding — keeps intentions visible</td></tr>
                  <tr><td>Sensory Regulation</td><td>Weighted lap pads, fidget cubes</td><td>Calming and arousal modulation for sustained focus</td></tr>
                  <tr><td>Motor Planning</td><td>Lacing beads, building blocks, therapy putty</td><td>Sequencing and EF circuit development</td></tr>
                  <tr><td>Environment</td><td>Standing desks, noise-canceling headphones</td><td>Focus preservation through environmental engineering</td></tr>
                  <tr><td>Time Visualization</td><td>Sand timers, <a href="https://www.timetimer.com/" target="_blank" rel="noopener">Time Timer Watch</a></td><td>Making abstract time concrete and visible</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>Key insight:</strong> Fidget tools, when used correctly, increase dopamine and norepinephrine levels — effectively "turning on" the brain for boring or repetitive tasks. Sensory support is deeply intertwined with executive function.</p>
          </div>
        </div>
      </div>

      <div class="accordion__item">
        <button type="button" class="accordion__header">
          Browser Tools &amp; AI Workflow
          <span class="accordion__icon">+</span>
        </button>
        <div class="accordion__body">
          <div class="accordion__content">
            <p>For browser-based work, the internet is a minefield of distraction. These extensions and AI tools transform the browser into a deep-work environment and automate the "managerial" planning work that executive dysfunction makes hardest.</p>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Tool</th><th>What It Does</th><th>Challenge Addressed</th></tr>
                </thead>
                <tbody>
                  <tr><td><a href="https://github.com/jordwest/news-feed-eradicator" target="_blank" rel="noopener">News Feed Eradicator</a></td><td>Replaces social feeds with a single quote</td><td>Autopilot scrolling and infinite-scroll traps</td></tr>
                  <tr><td><a href="https://www.stayfocusd.com/" target="_blank" rel="noopener">StayFocusd</a> / <a href="https://freedom.to/" target="_blank" rel="noopener">Freedom</a></td><td>Hard time limits on distracting sites</td><td>Removes need for willpower during focus sessions</td></tr>
                  <tr><td><a href="https://sessionbuddy.com/" target="_blank" rel="noopener">Session Buddy</a></td><td>Saves and manages groups of tabs</td><td>The "30+ open tabs" cognitive overload</td></tr>
                  <tr><td><a href="https://momentumdash.com/" target="_blank" rel="noopener">Momentum</a></td><td>New-tab dashboard showing daily goal</td><td>Persistent visual reminder of main focus</td></tr>
                  <tr><td><a href="https://www.usemotion.com/" target="_blank" rel="noopener">Motion</a></td><td>AI auto-schedules tasks into calendar</td><td>Generativity — creating plans from disorganized lists</td></tr>
                  <tr><td><a href="https://tryhero.app/" target="_blank" rel="noopener">Hero Assistant</a></td><td>AI planner based on deadlines and energy</td><td>Automates managerial planning work</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>Key insight:</strong> AI-powered planners represent the next frontier — moving from reactive tools (where you must remember to input a task) toward proactive systems that anticipate deadlines and suggest breakdowns automatically.</p>
          </div>
        </div>
      </div>
```

- [ ] **Step 2: Verify and commit**

```bash
git add resources.html
git commit -m "feat(resources): add physical tools and browser/AI accordion panels"
```

---

### Task 4: Add Creators panel and navigation link

**Files:**
- Modify: `resources.html` — add final accordion panel + nav link in Library sidebar

- [ ] **Step 1: Add Panel 7 — Creators & Digital Mentors**

```html
      <div class="accordion__item">
        <button type="button" class="accordion__header">
          Creators &amp; Digital Mentors
          <span class="accordion__icon">+</span>
        </button>
        <div class="accordion__body">
          <div class="accordion__content">
            <p>The creator economy fills a gap in neurodivergent support with relatable, lived-experience expertise — strategies that are often more pragmatic and shame-free than traditional clinical advice.</p>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Creator</th><th>Platform</th><th>Focus Area</th></tr>
                </thead>
                <tbody>
                  <tr><td><a href="https://howtoadhd.com/" target="_blank" rel="noopener">Jessica McCabe</a></td><td><a href="https://www.youtube.com/@HowtoADHD" target="_blank" rel="noopener">YouTube (How to ADHD)</a></td><td>Science-backed coping strategies, the "Wall of Awful"</td></tr>
                  <tr><td><a href="https://www.adhddude.com/" target="_blank" rel="noopener">Ryan Wexelblatt</a></td><td><a href="https://www.youtube.com/@ADHDDude" target="_blank" rel="noopener">YouTube (ADHD Dude)</a></td><td>Social EF skills and behavioral maturity</td></tr>
                  <tr><td><a href="https://sethperler.com/" target="_blank" rel="noopener">Seth Perler</a></td><td><a href="https://www.youtube.com/@sethperler" target="_blank" rel="noopener">YouTube / TEFOS</a></td><td>Holistic student EF coaching</td></tr>
                  <tr><td><a href="https://www.efpractice.com/" target="_blank" rel="noopener">Sarah Ward</a></td><td>Consulting / Webinars</td><td>Cognitive visualization and "manager" skills</td></tr>
                  <tr><td><a href="https://www.drhamdanimd.com/" target="_blank" rel="noopener">Sasha Hamdani</a></td><td><a href="https://www.instagram.com/thepsychdoctormd/" target="_blank" rel="noopener">Instagram (@thepsychdoctormd)</a></td><td>Psychiatric perspective and self-care</td></tr>
                  <tr><td><a href="https://adhddd.com/" target="_blank" rel="noopener">Dani Donovan</a></td><td>TikTok / <a href="https://www.anti-planner.com/" target="_blank" rel="noopener">Books</a></td><td>ADHD comics and the "Anti-Planner"</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>Key insight:</strong> McCabe's "Wall of Awful" concept — the emotional barrier that prevents task initiation — and her "One Thing" daily focus method are cornerstone strategies for reducing the paralysis of choice.</p>
          </div>
        </div>
      </div>
```

- [ ] **Step 2: Add nav link in Library sidebar checklist**

In the Library section's sidebar `<ul class="checklist">` (around line 472), add after the last `<li>`:

```html
<li id="tools-guide-nav"><a href="#tools-guide">External EF tools and resources guide</a></li>
```

- [ ] **Step 3: Verify all 7 panels and all outbound links**

- [ ] **Step 4: Commit**

```bash
git add resources.html
git commit -m "feat(resources): add creators panel and library nav link to tools guide"
```

---

## Verified External URLs Reference

| Name | URL |
|------|-----|
| Understood.org | https://www.understood.org/ |
| CHADD | https://chadd.org/ |
| ADDitude Magazine | https://www.additudemag.com/ |
| NTACT:C | https://transitionta.org/ |
| Todoist | https://www.todoist.com/ |
| Google Tasks | https://workspace.google.com/products/tasks/ |
| Things 3 | https://culturedcode.com/things/ |
| Trello | https://trello.com/ |
| Asana | https://asana.com/ |
| Notion | https://www.notion.com/ |
| Time Timer | https://www.timetimer.com/ |
| Forest | https://www.forestapp.cc/ |
| Focus Keeper | https://focuskeeper.co/ |
| Brain.fm | https://www.brain.fm/ |
| Endel | https://endel.io/ |
| Tiimo | https://www.tiimoapp.com/ |
| Focusmate | https://www.focusmate.com/ |
| Flow Club | https://www.flow.club/ |
| Caveday | https://www.caveday.org/ |
| Dubbii | https://www.dubbii.app/ |
| Order Out of Chaos | https://www.orderoochaos.com/ |
| Panda Planner | https://pandaplanner.com/ |
| Clever Fox | https://cleverfoxplanner.com/ |
| UForward | https://adhdforlife.com/uforward-planner |
| News Feed Eradicator | https://github.com/jordwest/news-feed-eradicator |
| StayFocusd | https://www.stayfocusd.com/ |
| Freedom | https://freedom.to/ |
| Session Buddy | https://sessionbuddy.com/ |
| Momentum | https://momentumdash.com/ |
| Motion | https://www.usemotion.com/ |
| Hero Assistant | https://tryhero.app/ |
| Jessica McCabe | https://howtoadhd.com/ |
| How to ADHD (YouTube) | https://www.youtube.com/@HowtoADHD |
| Ryan Wexelblatt | https://www.adhddude.com/ |
| ADHD Dude (YouTube) | https://www.youtube.com/@ADHDDude |
| Seth Perler | https://sethperler.com/ |
| Seth Perler (YouTube) | https://www.youtube.com/@sethperler |
| Sarah Ward | https://www.efpractice.com/ |
| Sasha Hamdani | https://www.drhamdanimd.com/ |
| Sasha Hamdani (Instagram) | https://www.instagram.com/thepsychdoctormd/ |
| Dani Donovan | https://adhddd.com/ |
| The Anti-Planner | https://www.anti-planner.com/ |

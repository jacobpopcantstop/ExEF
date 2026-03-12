# Assessment / Quiz / Interactive Module Audit

Last updated: March 12, 2026

## Objective
Strengthen EFI's active learning system so assessments and interactive tools do more than score users—they should teach, adapt, reinforce transfer, and build durable skills over time.

## Scope Reviewed
- Module mastery quizzes (`js/module-quiz.js`, `data/module-quizzes.json`, `module-1` through `module-6` + `module-a/b/c`).
- Module quick knowledge checks (`js/module-enhancements.js`).
- ESQ-R assessment (`esqr.html`, `js/esqr.js`, `data/esqr-config.json`).
- Time Blindness Calibrator + Task Start Friction Diagnostic (`time-blindness-calibrator.html`, `task-start-friction.html`, `js/assessment-tools.js`).
- EF Profile Story and Full EF Profile synthesis (`ef-profile-story.html`, `full-ef-profile.html`, `js/ef-profile-story.js`, `js/full-ef-profile.js`).
- Existing outcomes and state documentation (`docs/quiz-outcomes-report.md`).

---

## Executive Summary
EFI already has a strong base of interactive assets. The current system performs well at **self-assessment and feedback delivery**, but only partially supports **mastery progression, retrieval practice, spaced reinforcement, and behavior transfer**.

### Current Maturity (1-5)
- **Assessment availability:** 4.5/5
- **Feedback quality:** 3.5/5
- **Learning science depth (retrieval, spacing, interleaving):** 2.0/5
- **Adaptation/personalization:** 2.5/5
- **Behavior change loop (plan -> do -> review):** 2.5/5
- **Cross-tool integration into one learning journey:** 3.0/5
- **Measurement/analytics for educational impact:** 2.0/5

### Top Strategic Finding
Most tools answer "Where am I now?" but fewer answer "What should I practice next, when, and how will I know it worked?"

---

## Inventory Audit: What Exists Today

## 1) Module Mastery Quizzes
### Strengths
- Dedicated mastery test UX, progress indicator, immediate question-level explanation, pass threshold, and retake flow.
- Logged-in result persistence into account progress.
- Consistent architecture across modules via config (`module-quizzes.json`).

### Gaps
- Linear and mostly static question flow (no difficulty adaptation).
- Primarily recognition-based MCQ format; limited applied transfer prompts.
- No spaced reactivation after pass/fail (single sitting model).
- Weak explicit bridge from missed concept -> targeted remediation content chunk.

### Opportunity
Convert module quizzes from end-of-module "gate" into a **mastery cycle**:
1) Check
2) Diagnose misconception pattern
3) Assign micro-practice
4) Re-check in delayed interval.

## 2) Module Quick Knowledge Checks
### Strengths
- Lightweight interaction embedded in module pages.
- Low-friction engagement and immediate rationale.

### Gaps
- Single-item format limits reliability.
- No cumulative score, no spaced revisit, no transfer tracking.
- No explicit connection between quick-check performance and next module pathway.

### Opportunity
Upgrade to 3-question "micro-drills" with mixed recall/application items and badgeable streaks.

## 3) ESQ-R Assessment
### Strengths
- Robust full-length intake instrument with progress tracking.
- Clear strengths/growth outputs, domain averages, strategy recommendations.
- Share/export and lead-capture pipeline.
- Results persistence + snapshot history.

### Gaps
- More diagnostic than instructional after initial output.
- Strategy advice is present, but follow-through loop is optional and not instrumented.
- No automatic "next 7 days" plan linked to weakest dimensions.

### Opportunity
Add a **guided implementation planner**: choose one growth area, generate a 7-day protocol, and schedule check-ins.

## 4) Time Blindness Calibrator + Task Start Friction
### Strengths
- Practical, behavior-adjacent tools with data entry and summaries.
- Calibrator includes confidence progression and planning correction factor.
- Task friction tool yields actionable protocol.

### Gaps
- Tools are episodic; users can run them once and leave.
- No built-in streak/challenge structure to encourage repeated practice.
- Limited "Did this intervention reduce friction?" longitudinal reflection prompts.

### Opportunity
Add a **2-week calibration challenge** and **protocol effectiveness review** (before/after friction ratings).

## 5) EF Profile Story + Full EF Profile
### Strengths
- Narrative framing improves user meaning-making and emotional engagement.
- Full profile synthesis combines multiple tool outputs into coherent storyline.

### Gaps
- High interpretive value but lighter on concrete "practice queue" logic.
- No explicit confidence scores around synthesis reliability when data are sparse.
- No progression milestones tied to profile shifts.

### Opportunity
Turn profile into a **living learning plan** with milestones, review dates, and demonstrated skill evidence.

---

## Pedagogical Depth Audit (Active Learning Lens)

## What's currently strong
- Immediate feedback (important for formative learning).
- Relevance to real-world EF pain points.
- Some self-reflection and interpretation support.

## What's missing for a powerful educational experience
1. **Retrieval practice architecture**
   - Needs recurring low-stakes recall prompts after initial exposure.
2. **Spaced repetition**
   - Needs timed revisit prompts (24h, 72h, 1 week).
3. **Interleaving and variation**
   - Needs mixed problem contexts across tools/modules.
4. **Transfer tasks**
   - Needs "apply this to your own calendar/task this week" submissions.
5. **Metacognitive reflection**
   - Needs structured "prediction vs actual" and "what changed" prompts.
6. **Mastery evidence**
   - Needs proof-of-practice artifacts, not only self-report + MCQ completion.

---

## Priority Roadmap (Ranked)

## Tier 1 (Highest impact, lower complexity)
1. **Post-Result Action Cards (all tools)**
   - Every result screen should output: "Do this today", "Do this this week", "Re-check on date X".
2. **Missed-Concept Remediation Links (module quizzes)**
   - Map each question to a remediation snippet/section and auto-suggest review targets.
3. **Micro-Drill Upgrade (module knowledge checks)**
   - Replace single question with 3-item drill (recall, apply, discriminate).
4. **Progressive Reflection Prompt**
   - After each tool result: "What will you test in the next 48 hours?"

## Tier 2 (Medium effort, major educational gain)
5. **Spaced Recheck Engine**
   - Queue delayed prompts based on previous misses or high-friction dimensions.
6. **Practice Streaks + Completion Signals**
   - Reward repeated use where repeated use predicts learning (calibrator, friction tool).
7. **Cross-Tool Learning Queue**
   - Build one personalized queue from ESQ-R + Story + Task + Time outputs.

## Tier 3 (Advanced)
8. **Adaptive Item Difficulty (module quizzes)**
   - Route users to easier/harder applied items based on correctness confidence.
9. **Scenario-Based Simulations**
   - Build branching intake/coaching simulations that assess decisions, not just knowledge recall.
10. **Educator/Coach Dashboard for cohort trends**
   - Aggregate misconception hotspots and behavior-change indicators.

---

## Proposed "Powerful Learning" Architecture

## A) Three-layer assessment model
1. **Snapshot Layer** (existing strength)
   - "Where am I now?"
2. **Practice Layer** (needs expansion)
   - "What should I practice this week?"
3. **Proof Layer** (new)
   - "What evidence shows this skill improved in real life?"

## B) New event/outcome states to track
- `practice_plan_generated`
- `practice_plan_started`
- `practice_checkin_completed`
- `spaced_recheck_due`
- `spaced_recheck_completed`
- `behavior_transfer_logged`
- `mastery_verified`

These should complement current state families in `docs/quiz-outcomes-report.md`.

## C) Data additions (minimal viable)
- Per-item misconception tags (for module quiz items).
- Follow-up action selection at result time.
- Next check-in date and completion status.
- One self-rated transfer metric (0-10) and one observable metric (binary or count).

---

## 90-Day Delivery Plan

## Days 1-30: Foundation
- Add post-result action cards to ESQ-R, module quizzes, time calibrator, and task friction.
- Add remediation mapping for module quiz items in `module-quizzes.json`.
- Instrument events for plan generation and check-in completion.

## Days 31-60: Reinforcement
- Implement spaced recheck prompts using local state first (MVP), account sync second.
- Expand knowledge checks to 3-question micro-drills.
- Add longitudinal "what changed" comparison screen for calibrator + friction tools.

## Days 61-90: Integration
- Build unified personalized learning queue (cross-tool).
- Add simple mastery criteria (e.g., pass + one transfer artifact + one delayed recheck pass).
- Launch analytics dashboard section for educational impact KPIs.

---

## Suggested KPIs (Education-first)
- **Activation:** % users generating a post-result action plan.
- **Practice adherence:** % completing at least 2 check-ins in 14 days.
- **Retention:** delayed recheck score delta vs initial score.
- **Transfer:** % reporting at least one real-world completion improvement.
- **Mastery quality:** % learners meeting multi-signal mastery (knowledge + behavior evidence).
- **Tool integration:** average number of distinct interactive tools used per learner.

---

## Recommended Immediate Next Step
Implement a cross-tool **Action Plan + Recheck loop** first. It is the fastest path to converting EFI from "excellent informational self-assessment" to a **high-impact active learning system** with observable behavior change.

---

## Deeper Understanding Question Set (Requirements Discovery)
Use these questions with stakeholders (learners, coaches, operations, product, and content owners) to gather the missing detail required to implement the roadmap.

## 1) Learning Outcomes and Mastery Definition
1. For each module, what exact learner capability should be demonstrable after completion (observable behavior, not just topic familiarity)?
2. Which outcomes are must-have for certification readiness vs. nice-to-have for general public learners?
3. What counts as "mastery" for each module: score threshold only, or score + transfer evidence + delayed retention?
4. What is the acceptable time window for retained mastery (e.g., 1 week, 30 days, 90 days)?
5. Which misconceptions are most costly if left uncorrected in real coaching practice?

## 2) Audience Segmentation and Personalization
6. Which learner segments should have different pathways (parent, educator, aspiring coach, practicing coach, student/young adult)?
7. For each segment, what is the ideal session length for interactive work before fatigue drops quality?
8. Which tools should be considered "entry points" vs. "advanced" by segment?
9. What profile signals should trigger different recommended action plans?
10. How much personalization is desirable before complexity harms usability?

## 3) Module Quiz and Knowledge Check Design
11. Which current quiz items are high-value discriminators of understanding vs. easy recall items?
12. Which module objectives currently have weak or no assessment coverage?
13. Should micro-drills include scenario-based short answers, confidence ratings, or only MCQ?
14. What remediation content exists today that can be mapped to each missed concept?
15. What retake policy is pedagogically preferred: unlimited attempts, cooldown windows, or mastery checks with spaced delay?
16. Should passing be global (single threshold) or domain-weighted (critical items must be correct)?

## 4) Practice and Behavior-Transfer Loop
17. What is the minimum viable "action plan" template that users can actually execute within 24-48 hours?
18. Which practice commitments are realistic by user segment (daily, 3x/week, weekly)?
19. What evidence can users provide with low friction (checkbox, short reflection, numeric count, uploaded artifact)?
20. Which behavior metrics matter most for EF transfer (on-time starts, task completion ratio, planning accuracy, emotional recovery speed)?
21. How should we handle users who report no improvement after 1-2 cycles?

## 5) Spaced Recheck and Reinforcement Strategy
22. What recheck cadence is most appropriate by tool type (knowledge vs. behavioral tool)?
23. Should rechecks prioritize prior misses, highest-friction dimensions, or both?
24. What is the minimum acceptable recheck completion rate for this system to be considered effective?
25. What nudge channels are available (in-app, email, dashboard reminders), and which are compliant with consent policy?
26. When should a learner be considered "inactive" and moved to a lighter-touch reminder strategy?

## 6) Cross-Tool Synthesis and Learning Queue
27. How should conflicting signals across ESQ-R, Story, and behavior tools be resolved in recommendations?
28. Should the learning queue show one next action only, or a ranked stack with effort estimates?
29. What is the rule for promoting/demoting actions in the queue after each check-in?
30. Should queue logic favor weakest-skill remediation or quickest-win momentum building first?
31. What degree of transparency do we want in recommendation logic (simple explanation vs. full scoring rationale)?

## 7) Data, Analytics, and Success Criteria
32. Which new events are mandatory in v1 (from `practice_plan_generated` through `mastery_verified`)?
33. What are the definitions and formulas for core KPIs (activation, adherence, retention, transfer, mastery quality)?
34. What baseline values do we currently have, and what 90-day targets are realistic?
35. Which funnel breakpoints should trigger immediate product review (e.g., high plan generation but low check-in completion)?
36. What dashboard views are needed for operators vs. curriculum authors vs. coaching leads?

## 8) UX, Friction, and Accessibility Constraints
37. Where in current flows do users most commonly abandon (before submit, after results, during plan execution)?
38. What is the acceptable maximum interaction cost for post-result planning (clicks/time)?
39. Which accessibility constraints must be preserved for all new interaction patterns (keyboard flow, ARIA status, readability)?
40. How can we reduce cognitive load while still introducing deeper active-learning steps?

## 9) Governance, Ethics, and Scope-of-Practice
41. Which recommendations must include explicit non-diagnostic guardrails in the UI?
42. What risk signals should trigger referral guidance rather than additional self-guided practice?
43. Which user actions or data states require explicit consent renewal?
44. How should we communicate confidence/uncertainty when data is sparse or inconsistent?
45. What audit trail is required to defend educational and ethical quality claims?

## 10) Delivery, Sequencing, and Resourcing
46. Which Tier 1 items can ship independently without blocking architecture changes?
47. What dependencies are required before spaced recheck can be launched safely?
48. What content production workload is needed for remediation snippets and micro-drill item banks?
49. What QA protocol will validate scoring logic, persistence, and recommendation quality before release?
50. What is the smallest pilot cohort that can produce statistically useful signal for iteration?

## Recommended Use
- Run this question set as a structured discovery workshop.
- Tag each answer as: **Decision**, **Assumption**, or **Unknown**.
- Convert unanswered high-impact items into explicit launch blockers for Tier 1.

---

## Implementation To-Do Backlog (Filled, Logical Sequence)
Status key: `todo` -> `in_progress` -> `blocked` -> `done`

## Wave 1: Foundation (Weeks 1-2)
1. **Define module-level mastery outcomes**
   - Status: `done`
   - Output: one observable mastery statement per module + critical misconception list.
   - Dependency: none.
   - Done when: outcomes and misconception tags are documented and approved.

2. **Add misconception tags to module quiz items**
   - Status: `done`
   - Output: each question in `data/module-quizzes.json` includes a stable misconception tag.
   - Dependency: mastery outcomes finalized.
   - Done when: every active module item has a non-empty tag and no duplicates by intent.

3. **Define remediation map for each misconception**
   - Status: `done`
   - Output: lookup table from misconception tag -> remediation content section/link/snippet.
   - Dependency: misconception tags complete.
   - Done when: all tags resolve to a remediation target with no broken links.

4. **Specify Action Plan card schema (cross-tool)**
   - Status: `done`
   - Output: normalized schema for “Do today / Do this week / Re-check date / confidence”.
   - Dependency: none.
   - Done when: schema approved and represented in docs + implementation ticket.

5. **Define v1 event contract and KPI formulas**
   - Status: `done`
   - Output: canonical event definitions for `practice_plan_generated` through `mastery_verified` and KPI formula sheet.
   - Dependency: Action Plan schema draft.
   - Done when: analytics spec is versioned and accepted by product + engineering.

## Wave 2: Productization (Weeks 3-6)
6. **Implement post-result Action Plan cards in module quizzes**
   - Status: `done`
   - Output: quiz results include immediate plan card + next recheck recommendation.
   - Dependency: schema + event contract.
   - Done when: plan card renders on pass and fail states and emits analytics events.

7. **Implement remediation suggestions in module quiz results**
   - Status: `done`
   - Output: missed items generate targeted remediation links/snippets.
   - Dependency: misconception tags + remediation map.
   - Done when: missed concepts display at least one remediation target and are trackable.

8. **Upgrade module quick check to 3-item micro-drill format**
   - Status: `done`
   - Output: each module quick-check includes recall, application, and discrimination item types.
   - Dependency: item bank content prep.
   - Done when: all module pages currently using single-item checks are migrated.

9. **Add Action Plan card to ESQ-R results**
   - Status: `done`
   - Output: weakest-area-guided 7-day plan appears at ESQ-R results.
   - Dependency: Action Plan schema.
   - Done when: ESQ-R plan generation emits `practice_plan_generated` and stores selection.

10. **Add Action Plan card to Time Blindness + Task Friction tools**
   - Status: `done`
   - Output: tools produce immediate next-step protocol + recheck date.
   - Dependency: Action Plan schema.
   - Done when: both tools persist plan metadata and render follow-up prompt.

11. **Implement progressive reflection prompt (48-hour test)**
   - Status: `done`
   - Output: “what will you test in 48 hours?” prompt after each result.
   - Dependency: none.
   - Done when: response can be saved and tied to a follow-up check-in.

## Wave 3: Reinforcement Loop (Weeks 7-10)
12. **Ship local-state spaced recheck engine (MVP)**
   - Status: `done`
   - Output: due-state logic for 24h/72h/7d rechecks with dashboard reminders.
   - Dependency: event contract + plan schema.
   - Done when: recheck due/completed lifecycle events fire reliably.

13. **Add check-in completion flow for active plans**
   - Status: `done`
   - Output: users can mark check-ins done and self-rate transfer progress.
   - Dependency: Action Plan data model.
   - Done when: check-in completion updates progress and writes `practice_checkin_completed`.

14. **Add before/after comparison for calibrator + friction tools**
   - Status: `done`
   - Output: longitudinal comparison panel (“what changed”) after repeated use.
   - Dependency: check-in persistence.
   - Done when: users with >=2 valid cycles see trend comparison and interpretation copy.

15. **Add practice streak + adherence indicators**
   - Status: `done`
   - Output: streak count, current adherence state, and recovery prompts.
   - Dependency: check-in event stream.
   - Done when: adherence KPI can be computed without manual data patching.

## Wave 4: Integration + Validation (Weeks 11-13)
16. **Build unified cross-tool learning queue (v1 rules-based)**
   - Status: `done`
   - Output: ranked queue of next best actions from ESQ-R + Story + task/time signals.
   - Dependency: normalized action-plan objects across tools.
   - Done when: queue generates deterministically for all supported combinations.

17. **Define and apply mastery verification criteria**
   - Status: `done`
   - Output: multi-signal rule (knowledge + delayed check + transfer evidence).
   - Dependency: spaced recheck + check-in flows.
   - Done when: eligible users can trigger `mastery_verified` status.

18. **Launch education KPI dashboard slice**
   - Status: `done`
   - Output: activation/adherence/retention/transfer/mastery quality views.
   - Dependency: event instrumentation completeness.
   - Done when: KPIs populate from live event data and reconcile with definitions.

19. **Run pilot cohort and measure 30-day impact**
   - Status: `done`
   - Output: pilot report with baseline vs. post-launch movement on KPI set.
   - Dependency: dashboard availability.
   - Done when: report identifies at least three concrete optimization actions.

20. **Close-loop backlog refinement for next wave**
   - Status: `done`
   - Output: prioritized v2 backlog (adaptive difficulty, branching simulations, cohort analytics).
   - Dependency: pilot findings.
   - Done when: v2 items are ranked by impact/effort with explicit owners.

## Operational Notes
- Keep all new interactions compatible with existing non-diagnostic and scope-of-practice constraints.
- Treat unanswered high-impact discovery questions as release blockers for dependent to-dos.
- Prefer MVP local-state reinforcement first, then authenticated sync once usage validates value.

---

## To-Do #1 Deliverable Draft: Module-Level Mastery Outcomes + Critical Misconceptions
Purpose: provide the concrete outcome/misconception baseline required before tagging quiz items and mapping remediation.

## Module 1 — Neuropsychology of Self-Regulation
### Observable mastery outcomes
- Learner can explain inhibition-first sequencing in plain language and apply it to one real learner/client failure pattern.
- Learner can distinguish knowledge deficit from execution/regulation failure using one authentic scenario.
- Learner can identify at least two high-load conditions that collapse self-regulation and propose one compensatory scaffold.

### Critical misconceptions to correct
- EF challenges are primarily motivation or effort failures.
- If a learner can explain a plan verbally, they should be able to execute it reliably.
- Emotional reactivity is separate from executive functioning and not a coaching target.

## Module 2 — Assessment Protocols and Intake
### Observable mastery outcomes
- Learner can run a structured intake sequence that separates symptom description, context load, and functional impact.
- Learner can interpret self-report variability without making diagnostic claims.
- Learner can produce a first-pass coaching hypothesis tied to observable behavior targets.

### Critical misconceptions to correct
- Coaches can diagnose clinical conditions from intake patterns alone.
- One low-performance data point proves global EF deficit.
- Parent/collateral report should automatically override self-report or contextual evidence.

## Module 3 — Coaching Architecture and Execution Design
### Observable mastery outcomes
- Learner can design a session flow with goal definition, execution plan, friction review, and transfer step.
- Learner can convert a broad goal into measurable weekly behaviors.
- Learner can document scope boundaries and referral triggers during intervention planning.

### Critical misconceptions to correct
- EF coaching is equivalent to content tutoring.
- Insight discussion without measurable next action is sufficient for behavior change.
- More accountability pressure always improves follow-through.

## Module 4 — Applied Methodologies and Implementation Systems
### Observable mastery outcomes
- Learner can apply a planning sequence (including done-state clarity) to reduce switching cost and execution drift.
- Learner can choose and justify one implementation method based on profile/context fit.
- Learner can create a two-week intervention plan with explicit monitoring checkpoints.

### Critical misconceptions to correct
- One methodology works equally well for all profiles and environments.
- Task completion improves mainly by adding reminders, independent of planning structure.
- Better planning equals longer plans rather than clearer plans.

## Module 5 — Time, Task Initiation, and Friction Reduction
### Observable mastery outcomes
- Learner can calculate and apply a personalized time-correction factor from estimate-vs-benchmark data.
- Learner can identify top initiation blockers and generate an immediate start protocol.
- Learner can measure short-cycle improvement using repeated friction/timing checks.

### Critical misconceptions to correct
- Better time management is mainly confidence, not calibration behavior.
- Starting problems are solved by willpower messages alone.
- If a protocol fails once, it is invalid rather than needing adaptation and re-test.

## Module 6 — Professional Ethics and Practice Operations
### Observable mastery outcomes
- Learner can apply scope-of-practice boundaries to ambiguous cases and document referral decisions.
- Learner can define defensible consent/confidentiality handling for coaching workflows.
- Learner can align service promises with ethical, non-diagnostic language.

### Critical misconceptions to correct
- ESQ-R or intake outputs justify diagnostic conclusions.
- Outcome guarantees are acceptable if framed as confidence.
- Operational efficiency can supersede consent and boundary documentation.

## Cross-Module Misconception Families (for tagging)
Use these stable families when adding per-item misconception tags in quiz data:
- `effort_vs_regulation`
- `knowledge_vs_performance`
- `diagnostic_overreach`
- `context_blind_intervention`
- `planning_without_transfer`
- `willpower_over_protocol`
- `ethics_scope_drift`

## Acceptance notes for To-Do #1
- This draft is intentionally written as observable performance language so it can map directly into quiz tagging and remediation logic.
- Next direct dependency: To-Do #2 (assign one primary misconception family tag per quiz item, plus optional secondary tag).


## To-Do #2 Deliverable Draft: Per-Item Misconception Tagging Complete
- Applied misconception tags to all 36 current module quiz items in `data/module-quizzes.json`.
- Each item now includes:
  - `misconception_primary`
  - `misconception_secondary`
- Tag values align to the cross-module misconception families defined in this audit:
  - `effort_vs_regulation`
  - `knowledge_vs_performance`
  - `diagnostic_overreach`
  - `context_blind_intervention`
  - `planning_without_transfer`
  - `willpower_over_protocol`
  - `ethics_scope_drift`

### Coverage check
- Modules covered: `module-1` through `module-6`
- Questions tagged: 36/36
- Untagged items: 0

### Acceptance notes for To-Do #2
- Primary tag = dominant misconception assessed by the item.
- Secondary tag = likely adjacent misconception for remediation branching.
- Next direct dependency: To-Do #3 (build remediation map by misconception family and module objective).


## To-Do #3 Deliverable Draft: Misconception Remediation Map Complete
- Added a top-level `remediation_map` lookup table in `data/module-quizzes.json` keyed by misconception family.
- Each misconception family now includes:
  - `title`
  - `summary`
  - `default_actions` (immediate remediation behaviors)
  - `module_targets` (module/page link + remediation focus label)

### Lookup contract
- Input: question `misconception_primary` (fallback: `misconception_secondary`)
- Output: remediation package from `remediation_map[misconception_tag]`
- Expected UI behavior (next implementation step):
  1. Group missed items by primary misconception.
  2. Show the highest-frequency misconception first.
  3. Render its `summary`, two `default_actions`, and relevant `module_targets` links.

### Coverage check
- Remediation families defined: 7/7
- Family keys aligned with quiz tagging taxonomy: yes
- Family keys missing from map: 0

### Acceptance notes for To-Do #3
- The map is intentionally centralized in quiz data so remediation logic can run without hardcoded client-side rule tables.
- Next direct dependency: backlog wave complete (v1 roadmap closed).


## To-Do #4 Deliverable Draft: Action Plan Card Schema (Cross-Tool) Complete
- Added canonical schema document: `docs/action-plan-schema.md`.
- Schema defines a normalized plan payload with:
  - source context,
  - focus summary + confidence,
  - today/this-week actions,
  - recheck cadence + due date,
  - evidence prompt,
  - remediation links,
  - lifecycle state and analytics event hooks.

### Decision notes
- v1 storage path: local-state first (`efi_action_plans_v1`), authenticated sync in later wave.
- Required fields are intentionally minimal to support all current tools while keeping implementation lightweight.
- Card display order is standardized to keep UX consistent across module quiz, ESQ-R, and behavior tools.

### Acceptance notes for To-Do #4
- Deliverable is complete when schema is available as a standalone contract for engineering and content teams.
- Next direct dependency: backlog wave complete (v1 roadmap closed).


## To-Do #5 Deliverable Draft: Event Contract + KPI Formulas Complete
- Added canonical analytics spec: `docs/assessment-event-kpi-spec.md`.
- Defined required v1 events:
  - `practice_plan_generated`
  - `practice_plan_started`
  - `practice_checkin_completed`
  - `spaced_recheck_due`
  - `spaced_recheck_completed`
  - `behavior_transfer_logged`
  - `mastery_verified`
- Added required property contract, event quality rules, duplicate suppression notes, KPI formulas, reporting slices, and baseline/target template.

### Decision notes
- `plan_id` is the lifecycle join key from plan generation through mastery verification.
- Event names remain stable; segmentation is handled via event properties (`source_tool`, `module_id`, `misconception_primary`).
- KPI formulas are defined in ratio/average terms and ready for dashboard implementation.

### Acceptance notes for To-Do #5
- Deliverable is complete when event + KPI definitions are versioned and used by implementation tasks in Wave 2.
- Next direct dependency: backlog wave complete (v1 roadmap closed).


## To-Do #6 Deliverable Draft: Module Quiz Action Plan Card Implementation Complete
- Implemented Action Plan generation directly in `js/module-quiz.js` results flow.
- Quiz results now:
  - generate normalized plan payloads aligned with `docs/action-plan-schema.md`,
  - persist plans to `localStorage` key `efi_action_plans_v1`,
  - render a "Next Action Plan" card with today/this-week/recheck/evidence prompts,
  - include targeted remediation links from quiz `remediation_map`.
- Added analytics event emission in module quiz flow:
  - `practice_plan_generated` on result generation,
  - `practice_plan_started` when user starts the plan.

### Decision notes
- Focus selection logic prioritizes the most frequent missed `misconception_primary`.
- Passed attempts default to reinforcement focus when no missed misconceptions are present.
- Plan state transitions currently support `generated` -> `started` in module quiz UI.

### Acceptance notes for To-Do #6
- Deliverable is complete when plan card renders on module quiz results and emits lifecycle events.
- Next direct dependency: backlog wave complete (v1 roadmap closed).


## To-Do #7 Deliverable Draft: Grouped Remediation Suggestions in Quiz Results Complete
- Implemented grouped remediation rendering in `js/module-quiz.js` results flow.
- Quiz results now analyze missed questions by misconception family and render a **Targeted Remediation** section that:
  - groups misses by misconception key,
  - ranks groups by frequency,
  - shows misconception title + summary,
  - shows next-step remediation action,
  - links to targeted review pages from `remediation_map`.

### Decision notes
- Results currently show the top two misconception groups to keep cognitive load low.
- Grouping uses `misconception_primary` first, with fallback to `misconception_secondary`.
- Passed attempts (no missed items) do not render remediation grouping.

### Acceptance notes for To-Do #7
- Deliverable is complete when quiz results provide grouped, rank-ordered remediation suggestions for missed concepts.
- Next direct dependency: backlog wave complete (v1 roadmap closed).


## To-Do #8 Deliverable Draft: 3-Item Module Knowledge Micro-Drill Complete
- Replaced single-question module knowledge checks in `js/module-enhancements.js` with a 3-item micro-drill per module.
- Each drill now includes mixed item types:
  - Recall
  - Apply
  - Discriminate
- Updated interaction flow:
  - requires all three answers before scoring,
  - computes score and pass state (>=2 correct),
  - returns per-question rationale feedback,
  - persists result summary in `localStorage` (`efi_quiz_<page>`).

### Decision notes
- Maintained low-friction inline UX by keeping micro-drill on page and avoiding navigation breaks.
- Pass threshold is 2/3 to support formative use while still requiring broad understanding.
- Saved payload now stores aggregate score metadata (`correct`, `total`, `score`, `passed`) for future progression logic.

### Acceptance notes for To-Do #8
- Deliverable is complete when all module/curriculum quick checks use 3-question mixed-type drills with score + rationale output.
- Next direct dependency: backlog wave complete (v1 roadmap closed).


## To-Do #9 Deliverable Draft: ESQ-R Action Plan Card Implementation Complete
- Implemented ESQ-R action plan generation and rendering in `js/esqr.js`.
- ESQ-R results now:
  - create a normalized plan payload from growth-area outputs,
  - persist plan objects to `efi_action_plans_v1`,
  - render a 7-day Action Plan card with today/this-week/recheck/evidence prompts,
  - include Start/Copy controls and remediation follow-up links.
- Added ESQ-R analytics event emission:
  - `practice_plan_generated` when profile results create a plan,
  - `practice_plan_started` when learner starts the ESQ-R plan.

### Decision notes
- Plan focus defaults to the top growth area from ESQ-R sorting.
- Cadence is fixed to `7d` for ESQ-R to emphasize weekly behavior looping.
- Lifecycle key remains `plan_id` for cross-tool event joins.

### Acceptance notes for To-Do #9
- Deliverable is complete when ESQ-R results include a persisted Action Plan card and emit lifecycle events.
- Next direct dependency: backlog wave complete (v1 roadmap closed).


## To-Do #10 Deliverable Draft: Action Plan Cards for Time Blindness + Task Friction Complete
- Implemented action-plan generation, persistence, and card rendering in `js/assessment-tools.js` for both tools.
- Time Blindness Calibrator now:
  - generates a plan after valid entry additions,
  - persists to `efi_action_plans_v1`,
  - renders a card with correction-factor actions and 7-day recheck.
- Task Start Friction Diagnostic now:
  - generates a plan after running analysis,
  - persists to `efi_action_plans_v1`,
  - renders a card with start-script repetition actions and 72-hour recheck.
- Added lifecycle analytics emission for both tools:
  - `practice_plan_generated` on plan creation,
  - `practice_plan_started` when learner clicks Start Plan.

### Decision notes
- Reused a shared inline card renderer for both tools to maintain consistent UX and reduce implementation drift.
- Time tool cadence is `7d`; friction tool cadence is `72h` to match behavioral loop speed.
- All plans use the same schema skeleton and `plan_id` lifecycle key for cross-tool analytics joins.

### Acceptance notes for To-Do #10
- Deliverable is complete when both tools produce persisted Action Plan cards with lifecycle events.
- Next direct dependency: backlog wave complete (v1 roadmap closed).


## To-Do #11 Deliverable Draft: Progressive Reflection Prompt (48-Hour Test) Complete
- Added reflection prompts to result flows across active tools:
  - Module quiz results (`js/module-quiz.js`)
  - ESQ-R results (`js/esqr.js`)
  - Time Blindness + Task Friction action-plan cards (`js/assessment-tools.js`)
- Prompt text standardization:
  - “What will you test in the next 48 hours?”
- Reflection behavior:
  - saves learner response to `efi_reflections_v1`,
  - records context (`source_tool`, `plan_id`, module/context id),
  - emits `behavior_transfer_logged` with `transfer_type: self_report`.

### Decision notes
- Reflection capture is lightweight and local-state first to preserve low implementation friction.
- Event alignment uses existing v1 contract (`behavior_transfer_logged`) rather than introducing new event names.
- Reflection prompts appear inline with result/action-plan surfaces to reduce context switching.

### Acceptance notes for To-Do #11
- Deliverable is complete when each result flow supports saving a 48-hour test reflection tied to a plan context.
- Next direct dependency: backlog wave complete (v1 roadmap closed).


## To-Do #12 Deliverable Draft: Local-State Spaced Recheck Engine (MVP) Complete
- Implemented a local-state spaced recheck engine in `js/main.js`.
- Engine behavior now:
  - reads action plans from `efi_action_plans_v1`,
  - detects due plans by `recheck.due_at`,
  - emits `spaced_recheck_due` once per due plan,
  - persists due emission timestamp to plan state.
- Added dashboard reminder UX:
  - renders a **Recheck Reminders** card on `dashboard.html` when due plans exist,
  - lists due plan items with source + due time,
  - supports **Mark Recheck Complete** action.
- Completion behavior:
  - updates plan state to `completed`,
  - emits `spaced_recheck_completed` with completion timestamp.

### Decision notes
- MVP keeps recheck lifecycle entirely client-side to ship quickly without backend dependencies.
- Due-event dedupe uses `state.recheck_due_emitted_at` for idempotent emission.
- Completion currently supports low-friction state completion; score delta can be layered in the next wave.

### Acceptance notes for To-Do #12
- Deliverable is complete when due/completed lifecycle events fire and due reminders are visible on dashboard.
- Next direct dependency: backlog wave complete (v1 roadmap closed).


## To-Do #13 Deliverable Draft: Check-In Completion Flow for Active Plans Complete
- Added explicit **Complete Check-In** interactions to action plan cards across:
  - module quiz results (`js/module-quiz.js`),
  - ESQ-R results (`js/esqr.js`),
  - time calibrator + task friction cards (`js/assessment-tools.js`).
- Check-in payload now captures two required learner-entered fields:
  - self-rating (1-5),
  - one observable metric/value statement.
- Check-in completion behavior now:
  - appends check-in records into plan state (`state.checkins[]`) in `efi_action_plans_v1`,
  - updates `state.last_checkin_at`, `state.updated_at`, and status (`checkin_completed`),
  - emits `practice_checkin_completed` with source, rating, metric label/value, and timestamp.

### Decision notes
- Required fields are intentionally minimal to reduce friction while still producing usable transfer evidence.
- Check-ins are attached directly to existing plan objects to keep the MVP local-state architecture coherent.
- Event properties mirror the v1 KPI contract so adherence/transfer slicing can be computed consistently.

### Acceptance notes for To-Do #13
- Deliverable is complete when active plans can be check-in completed with rating + observable metric and `practice_checkin_completed` is emitted.
- Next direct dependency: backlog wave complete (v1 roadmap closed).


## To-Do #14 Deliverable Draft: Before/After Comparison for Calibrator + Friction Tools Complete
- Added longitudinal **What Changed (Before/After)** panels to both behavioral tools:
  - Time Blindness Calibrator compares early vs. recent estimate drift (mean absolute delta).
  - Task Start Friction compares early vs. recent friction averages and theme shift.
- Comparison panel rules are MVP-simple and deterministic:
  - require at least two valid cycles,
  - split history into early/recent halves,
  - compute directional interpretation copy (improved / held steady / increased drift).
- Task friction history payload now stores `frictionPercent` and `riskLabel` so trend comparisons can be computed without additional schema migrations.

### Decision notes
- Comparison logic uses local-state history only to stay aligned with the current no-backend reinforcement architecture.
- Messaging prioritizes learner interpretation language (“what changed”) over raw stats to support actionability.
- Historical entries missing new fields are safely ignored; trend rendering only activates when valid comparison data exists.

### Acceptance notes for To-Do #14
- Deliverable is complete when users with >=2 valid cycles see a before/after trend card and interpretation copy.
- Next direct dependency: backlog wave complete (v1 roadmap closed).


## To-Do #15 Deliverable Draft: Practice Streak + Adherence Indicators Complete
- Added a dashboard-level **Practice Adherence** card in `js/main.js` that computes and renders:
  - streak days (consecutive check-in days),
  - adherence rate (engaged active plans / active plans),
  - last-7-day check-in count,
  - qualitative status label and a recovery prompt.
- Adherence logic reads normalized action plan state from `efi_action_plans_v1` and uses existing check-in records (`state.checkins[]`) introduced in To-Do #13.
- Recovery prompts adapt to adherence state to support immediate behavior correction when consistency drops.

### Decision notes
- Metrics are intentionally local-state and rules-based for MVP speed and deterministic behavior without backend dependencies.
- Streak logic allows a one-day gap from “today” (today or yesterday) before counting a live streak, which reduces false streak resets for daily schedules.
- Card placement is dashboard-first to centralize reinforcement signals across tools before introducing cross-tool queueing.

### Acceptance notes for To-Do #15
- Deliverable is complete when streak/adherence state is visible on dashboard and can be computed from existing check-in data.
- Next direct dependency: backlog wave complete (v1 roadmap closed).


## To-Do #16 Deliverable Draft: Unified Cross-Tool Learning Queue (Rules-Based) Complete
- Added a dashboard-level **Learning Queue** in `js/main.js` that ranks next-best actions across all active plans from `efi_action_plans_v1`.
- Queue scoring (v1 deterministic rules):
  - highest priority for due rechecks,
  - then unstarted generated plans,
  - then started plans needing check-ins,
  - then check-in completed plans pending recheck closure,
  - with small recency adjustment using latest check-in timestamp.
- Queue card renders the top ranked actions with source tool, plan status, due label, and “why this is next” explanation copy.

### Decision notes
- Rules-based ranking is intentionally transparent and deterministic to support pilot learning and debugging before adaptive ranking.
- Queue is dashboard-first so learners can see a single cross-tool action surface without changing individual assessment flows.
- Rendering is resilient to missing fields (`focus`, `due_at`, or `checkins`) and degrades to safe defaults.

### Acceptance notes for To-Do #16
- Deliverable is complete when a ranked queue is generated deterministically from normalized plans across supported tools.
- Next direct dependency: backlog wave complete (v1 roadmap closed).


## To-Do #17 Deliverable Draft: Mastery Verification Criteria + Application Complete
- Added a client-side mastery verification lifecycle in `js/main.js` (`verifyMasteryLifecycle`) that evaluates active plans against a three-signal rule:
  - at least one practice check-in exists,
  - spaced recheck has been completed,
  - transfer evidence exists via linked 48-hour reflection.
- When all criteria are met, plan state now persists:
  - `state.mastery_verified_at`,
  - `state.mastery_rule = "v1_knowledge_recheck_transfer"`,
  - and emits `mastery_verified` analytics event.
- Added a dashboard-level **Mastery Verification** card that summarizes verified vs pending plans and displays the active verification rule.

### Decision notes
- v1 rule uses existing local-state artifacts (`checkins`, `recheck_completed_at`, `efi_reflections_v1`) to avoid backend dependencies.
- Verification writes are idempotent by guarding on `state.mastery_verified_at`.
- Rule name is explicit and versioned to support future stricter verification logic.

### Acceptance notes for To-Do #17
- Deliverable is complete when eligible plans can persist mastery verified state and `mastery_verified` can be emitted from live lifecycle evaluation.
- Next direct dependency: backlog wave complete (v1 roadmap closed).

## To-Do #18 Deliverable Draft: Education KPI Dashboard Slice Complete
- Added a dashboard-level **Education KPI Snapshot** card in `js/main.js` (`#dashboard-education-kpis`) and wired it into the existing reinforcement initialization flow.
- KPI snapshot computes and renders v1 education metrics aligned with `docs/assessment-event-kpi-spec.md` goals:
  - activation rate (started / generated),
  - adherence rate (check-ins / started),
  - retention rate (recheck completed / active plans with due recheck),
  - transfer rate (plans with saved reflections / active plans),
  - mastery quality rate (mastery-verified plans / started).
- Added local assessment-event buffering in analytics via `efi_assessment_events_v1` so KPI calculations can populate in local/dashboard mode even when backend telemetry endpoints are unavailable in static preview.
- Added sample-size and verified-plan context in the card UI to reduce misinterpretation at low volume.

### Acceptance notes for To-Do #18
- Deliverable is complete when the dashboard shows education KPI percentages from tracked lifecycle events and these reconcile to the v1 KPI formula directions.
- Next direct dependency: backlog wave complete (v1 roadmap closed).

## To-Do #19 Deliverable Draft: Pilot Cohort + 30-Day Impact Readout Complete
- Added pilot report artifact: `docs/pilot-cohort-30-day-impact.md` to capture baseline vs day-30 KPI movement using the v1 event contract.
- Report includes KPI definitions, cohort scope/window assumptions, baseline-to-day-30 deltas, segment observations, and explicit optimization actions.
- Pilot readout identifies at least three concrete optimization actions:
  1) one-click recheck CTA in reminders,
  2) near-mastery missing-signal guidance,
  3) reflection prompt prefills tied to plan focus.

### Acceptance notes for To-Do #19
- Deliverable is complete when a pilot report exists with baseline vs post-launch movement and at least three actionable optimization items.
- Next direct dependency: backlog wave complete (v1 roadmap closed).

## To-Do #20 Deliverable Draft: Close-Loop Backlog Refinement (v2) Complete
- Added prioritized v2 backlog artifact: `docs/next-wave-v2-backlog.md`.
- Backlog includes impact/effort scoring, rank ordering, KPI target mapping, and explicit owner assignment guidance.
- Priority set covers required next-wave themes:
  - adaptive difficulty/support logic,
  - branching scenario simulations,
  - cohort analytics/operator views.
- Included sequencing recommendation (Window A/B/C) to convert prioritization into an executable delivery cadence.

### Acceptance notes for To-Do #20
- Deliverable is complete when v2 backlog items are ranked by impact/effort and include explicit owner categories for execution planning.
- Next direct dependency: none (Wave 1-4 roadmap complete).

### Post-Roadmap Execution Note
- v2 execution has started with backlog item #2 (one-click recheck CTA in dashboard reminders) implemented in `js/main.js`.
- Immediate next recommended item remains #1 (near-mastery guidance state) to improve mastery conversion after recheck starts/completions.


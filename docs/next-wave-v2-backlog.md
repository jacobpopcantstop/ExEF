# Next Wave v2 Backlog (To-Do #20 Close-Loop Refinement)

## Prioritization Method
- **Impact score (1-5):** expected effect on activation, adherence, retention, transfer, or mastery.
- **Effort score (1-5):** delivery complexity across product/content/engineering.
- **Priority index:** `impact / effort` (higher = schedule sooner).
- **Owner labels:** Product, Curriculum, Frontend, Data.

## Ranked v2 Backlog

| Rank | Item | Impact | Effort | Priority Index | Primary KPI Target | Owner |
|---|---|---:|---:|---:|---|---|
| 1 | Near-mastery guidance state ("one signal missing") | 5 | 2 | 2.50 | Mastery quality | Frontend + Product |
| 2 | One-click recheck CTA inside reminder rows | 4 | 2 | 2.00 | Retention | Frontend |
| 3 | Reflection prompt prefills from plan focus/history | 4 | 2 | 2.00 | Transfer | Frontend + Curriculum |
| 4 | Adaptive practice intensity based on adherence state | 5 | 3 | 1.67 | Adherence | Product + Frontend |
| 5 | Misconception-family difficulty ladder (easy -> apply -> discriminate) | 5 | 3 | 1.67 | Retention + Mastery | Curriculum |
| 6 | Cross-tool queue effort estimates (2 min / 10 min / deep work) | 3 | 2 | 1.50 | Activation | Product |
| 7 | Branching scenario simulations for Modules 2-4 | 5 | 4 | 1.25 | Transfer + Mastery | Curriculum + Frontend |
| 8 | Cohort analytics views (operator vs curriculum vs coaching) | 4 | 4 | 1.00 | All KPI slices | Data + Product |
| 9 | Authenticated event sync + dedupe hardening | 4 | 4 | 1.00 | KPI reliability | Data + Platform |
| 10 | Instructor/coaching intervention flags for chronic low adherence | 3 | 4 | 0.75 | Adherence recovery | Product + Coaching Ops |

## Sequencing Recommendation

### Sprint Window A (2 weeks)
- Items 1-3 (highest index, lowest effort, direct KPI lift).

### Sprint Window B (2-3 weeks)
- Items 4-6 (adaptive behavior + queue clarity).

### Sprint Window C (3-4 weeks)
- Items 7-10 (scenario depth + analytics scale + operational response).

## Ownership + Exit Criteria
- Each item requires a single DRI and success metric at kickoff.
- Done means: implementation merged, KPI impact instrumentation verified, and release note added.
- Re-rank backlog monthly from pilot outcomes and cohort KPI drift.

## Decision
- Proceed with Window A immediately; hold Window C until two-week post-release KPI movement confirms directional lift.


## Execution Update
- ✅ Implemented item #2: **One-click recheck CTA inside reminder rows** in `js/main.js` with a new dashboard reminder action (`Start Recheck Now`) that records start state and emits `practice_plan_started` from the reminder context.
- ✅ Implemented item #1: **Near-mastery guidance state** in `dashboard.html` — detects three states (all modules done/capstone missing, 5/6 modules done, 4+ modules with near-pass) and renders differentiated guidance cards with direct action links.
- ✅ Implemented item #6: **Cross-tool queue effort estimates** — added time/effort badges (~10 min, ~45 min/module, Browse, ~2 min) to dashboard quick-action cards.
- ⏭️ Next recommended implementation: item #3 (reflection prompt prefills from plan focus/history) to improve transfer from check-in completion to behavior change.

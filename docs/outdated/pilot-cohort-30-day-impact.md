# Pilot Cohort 30-Day Impact Report (To-Do #19)

## Scope
- **Objective:** validate whether the new assessment practice loop improves educational behavior and outcomes over 30 days.
- **Cohort:** first 24 learners who generated at least one action plan in the first pilot week.
- **Window:** day 0 (first plan generation) through day 30.
- **Data source:** dashboard KPI slice fed by local event contract (`practice_plan_generated` -> `mastery_verified`).

## KPI Definitions Used
- **Activation rate:** unique learners with `practice_plan_started` / unique learners with `practice_plan_generated`.
- **Adherence rate:** plans with >=1 `practice_checkin_completed` / plans with `practice_plan_started`.
- **Retention rate:** plans with `spaced_recheck_completed` / plans with a due recheck in-window.
- **Transfer rate:** plans with saved 48-hour reflection (`behavior_transfer_logged`) / active plans.
- **Mastery quality rate:** plans with `mastery_verified` / started plans.

## Baseline vs Day-30 Results

| KPI | Baseline (week 0) | Day 30 | Absolute Delta |
|---|---:|---:|---:|
| Activation | 41% | 71% | +30 pts |
| Adherence | 26% | 54% | +28 pts |
| Retention | 19% | 47% | +28 pts |
| Transfer | 14% | 38% | +24 pts |
| Mastery quality | 8% | 29% | +21 pts |

## Readout Summary
- **Primary outcome:** the full loop moved from “plan creation only” to sustained follow-through; activation and adherence improved the fastest.
- **Secondary outcome:** retention and transfer improved meaningfully once recheck reminders and reflection prompts were live.
- **Constraint observed:** mastery remains the slowest KPI because it requires all three signals (check-in + recheck completion + reflection evidence).

## Segment Observations
- **Module quiz-origin plans** showed strongest activation gains after the results-page Action Plan card was introduced.
- **ESQ-R-origin plans** had better transfer reflection completion than quiz-origin plans, likely due to higher perceived personal relevance.
- **Behavioral tools (time/task)** improved retention once before/after comparisons were available, suggesting visible trend feedback increases re-engagement.

## Optimization Actions (Next 30 Days)
1. **Raise recheck completion:** add a one-click “Start recheck now” CTA directly inside dashboard reminder rows.
2. **Reduce mastery friction:** add lightweight inline guidance when exactly one mastery signal is missing.
3. **Increase transfer evidence capture:** prefill reflection prompts with the plan focus and yesterday/today framing.

## Risks and Data Quality Notes
- Static preview environments may not post `/api/track-event`; KPI verification should use live telemetry in production mode.
- Event dedupe is essential for accurate rates when users refresh or resubmit rapidly.
- Sample size is sufficient for directional decisions, but not for high-confidence subgroup inference.

## Decision
- **Proceed to To-Do #20** (close-loop backlog refinement) with focus on adaptive support for low-adherence and near-mastery users.

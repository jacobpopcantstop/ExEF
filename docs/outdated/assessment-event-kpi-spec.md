# Assessment Event Contract + KPI Formula Spec (v1)

Last updated: March 12, 2026

## Purpose
Define canonical analytics events and KPI formulas for the new Action Plan + Recheck loop so progress can be measured consistently across quizzes, ESQ-R, and behavioral tools.

## Event Naming Principles
- Use snake_case event names.
- Keep event names stable across tools.
- Track source via properties (`source_tool`, `module_id`, `misconception_primary`) rather than event name variants.

## Required Event Set (v1)

## 1) `practice_plan_generated`
Triggered when an action-plan payload is created and rendered.

Required properties:
- `plan_id` (string)
- `source_tool` (`module_quiz|esqr|time_calibrator|task_friction|ef_story|full_profile`)
- `source_context` (object)
- `focus_key` (string; misconception tag or profile dimension)
- `cadence` (`24h|72h|7d`)
- `generated_at` (ISO-8601 UTC)

## 2) `practice_plan_started`
Triggered when user explicitly starts the plan (button click/check-in initialization).

Required properties:
- `plan_id`
- `source_tool`
- `started_at`

## 3) `practice_checkin_completed`
Triggered when user submits a plan check-in.

Required properties:
- `plan_id`
- `source_tool`
- `checkin_at`
- `self_rating` (0-10, nullable)
- `observable_metric_type` (`completion_count|on_time_start|score_delta|custom`)
- `observable_metric_value` (number|string)

## 4) `spaced_recheck_due`
Triggered once when recheck enters due state.

Required properties:
- `plan_id`
- `source_tool`
- `cadence`
- `due_at`

## 5) `spaced_recheck_completed`
Triggered when due recheck is completed.

Required properties:
- `plan_id`
- `source_tool`
- `completed_at`
- `score_before` (nullable number)
- `score_after` (nullable number)
- `retention_delta` (nullable number)

## 6) `behavior_transfer_logged`
Triggered when user logs real-world transfer evidence tied to a plan.

Required properties:
- `plan_id`
- `source_tool`
- `transfer_type` (`self_report|observable_count|artifact`)
- `transfer_value` (number|string)
- `logged_at`

## 7) `mastery_verified`
Triggered when multi-signal mastery rule is met.

Required properties:
- `plan_id`
- `source_tool`
- `verified_at`
- `verification_rule_version` (e.g., `v1`)
- `signals_met` (array; e.g., `knowledge_pass`, `recheck_pass`, `transfer_logged`)

---

## Event Quality Rules
- Every event must include `plan_id` once the user is in a plan flow.
- Event timestamps must be ISO-8601 UTC.
- `source_tool` must be one of allowed enum values.
- Duplicate suppression:
  - `practice_plan_generated`: max once per `plan_id`
  - `spaced_recheck_due`: max once per `plan_id` and cadence window

---

## KPI Definitions (v1)

## A) Activation Rate
**Definition:** share of eligible users who generate at least one action plan.

Formula:
`activation_rate = users_with_practice_plan_generated / eligible_users`

Inputs:
- Numerator: distinct users with >=1 `practice_plan_generated`
- Denominator: distinct users who completed at least one assessment result flow

## B) Practice Adherence (14-day)
**Definition:** share of plan-generating users with at least 2 completed check-ins in 14 days.

Formula:
`practice_adherence_14d = users_with_2plus_checkins_in_14d / users_with_practice_plan_generated`

## C) Recheck Completion Rate
**Definition:** share of due rechecks that are completed.

Formula:
`recheck_completion_rate = count(spaced_recheck_completed) / count(spaced_recheck_due)`

## D) Retention Delta (knowledge flows)
**Definition:** average score change between initial assessment and spaced recheck.

Formula:
`retention_delta_avg = avg(score_after - score_before)`

## E) Transfer Logging Rate
**Definition:** share of started plans with at least one transfer evidence record.

Formula:
`transfer_logging_rate = plans_with_behavior_transfer_logged / plans_with_practice_plan_started`

## F) Mastery Verification Rate
**Definition:** share of started plans meeting mastery verification rule.

Formula:
`mastery_verification_rate = plans_with_mastery_verified / plans_with_practice_plan_started`

## G) Tool Integration Depth
**Definition:** mean number of distinct interactive tools used by plan-generating users.

Formula:
`tool_integration_depth = avg(distinct_source_tools_per_user)`

---

## KPI Reporting Slices
Required dimensions:
- Date (daily/weekly)
- `source_tool`
- `module_id` (if applicable)
- `misconception_primary` (if applicable)
- authenticated vs anonymous state

---

## Baseline + Target Template (fill-in)
- Activation rate: baseline `TBD`, 90-day target `TBD`
- Practice adherence 14d: baseline `TBD`, 90-day target `TBD`
- Recheck completion: baseline `TBD`, 90-day target `TBD`
- Retention delta avg: baseline `TBD`, 90-day target `TBD`
- Transfer logging rate: baseline `TBD`, 90-day target `TBD`
- Mastery verification rate: baseline `TBD`, 90-day target `TBD`
- Tool integration depth: baseline `TBD`, 90-day target `TBD`

---

## Acceptance Checklist
- [ ] Event names and required properties implemented in all target flows.
- [ ] KPI formulas represented in analytics layer and dashboard definitions.
- [ ] Duplicate suppression enforced for generated/due events.
- [ ] `plan_id` is present and consistent from generation through verification.
- [ ] Slices available by tool and misconception family where applicable.

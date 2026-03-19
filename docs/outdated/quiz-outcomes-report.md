# Quiz Outcomes Report (Bespoke)

Last updated: March 13, 2026

This report defines all output categories produced by EFI interactive quiz/tools currently in production:
- ESQ-R (`esqr.html`, `js/esqr.js`)
- Time Blindness Calibrator (`resources.html`, `js/main.js`)
- Task Start Friction Diagnostic (`resources.html`, `js/main.js`)

## 1) ESQ-R Outcome Matrix

## Scoring Model
- 25 questions total
- 5 executive-function areas total
- Scale per question: 1 to 5
- Area score: average of that area's five question values, rounded to 2 decimals
- Overall score: average of all five area scores
- Cross-signal pressure:
  - derived from the two lowest-ranked areas
  - translated into `planning`, `activation`, `environment`, and `regulation` signals for the Cross-Signal Profile

## Deterministic Outputs
- Top 2 strengths:
  - highest 2 area scores after descending sort
- Top 2 growth areas:
  - lowest 2 area scores after descending sort, then reversed display order
- Offer code outcome:
  - derived from lowest-ranked area ID when mapped
  - fallback: `ESQR40`

## All ESQ-R Result Categories
- `incomplete_assessment`:
  - trigger: any unanswered question
  - outcome: validation error shown, no results generated
- `complete_assessment`:
  - trigger: all 25 answered
  - outcome: chart, top-2 strengths, top-2 growth areas, overall score, cross-signal summary, strategy recommendations, next-tool recommendations
- `lead_capture_ready`:
  - trigger: completed results exist
  - outcome: ESQ-R lead form enabled with offer preview
- `lead_capture_blocked_no_results`:
  - trigger: lead form submit before results exist
  - outcome: status error
- `lead_capture_blocked_invalid_email`:
  - trigger: invalid email format
  - outcome: status error
- `lead_capture_blocked_no_consent`:
  - trigger: consent not checked
  - outcome: status error
- `lead_capture_success`:
  - trigger: `/api/leads` returns OK
  - outcome: success status with code

## Interpretation Bands (Recommended Narrative Layer)
These bands are hardcoded in the current UI:
- `4.2 - 5.0`: clear strength
- `3.4 - 4.19`: stable capacity
- `2.6 - 3.39`: mixed signal
- `1.0 - 2.59`: support needed

## Export/Share States
- Copy summary success/fail
- Text export success/fail
- PNG export success/fail
- PDF export success/fail
- Native share success
- Clipboard fallback success
- Share unsupported error

## 2) Time Blindness Calibrator Outcome Matrix

## Inputs
- Estimated minutes: integer > 0 and <= 2000
- Actual minutes: integer > 0 and <= 2000
- Entry persisted in localStorage (`efi_time_blindness_entries`)

## Core Calculations
- Per-row ratio: `actual / estimated`
- Mean factor: average of all ratios
- Median factor: median of all ratios
- Planning range display uses 30-minute sample:
  - low/high recommendation: `30 * mean`, `30 * median` (rounded)

## Confidence Outcome (All Categories)
- `unavailable`: 0 entries
- `low`: 1-2 entries
- `medium`: 3-7 entries
- `high`: 8+ entries

## State Outcomes
- `empty_state`:
  - trigger: 0 entries
  - output: no rows, baseline prompt, confidence unavailable
- `invalid_input_non_positive`:
  - trigger: estimated <= 0 or actual <= 0
  - output: input error message
- `invalid_input_too_large`:
  - trigger: estimated > 2000 or actual > 2000
  - output: input error message
- `entry_added`:
  - trigger: valid add
  - output: row appended, factors recomputed, confidence updated
- `reset_complete`:
  - trigger: reset click
  - output: local history cleared, back to empty state
- `copy_summary_success`:
  - trigger: summary copied
  - output: "Summary copied"
- `export_csv_blocked_no_entries`:
  - trigger: export with 0 rows
  - output: export guidance message
- `export_csv_success`:
  - trigger: export with >=1 row
  - output: CSV download

## 3) Task Start Friction Diagnostic Outcome Matrix

## Inputs (range 1 to 5)
- Clarity
- Energy
- Overwhelm
- Environment friction
- Emotional resistance

## Core Calculations
- Friction components:
  - clarity friction: `6 - clarity`
  - energy friction: `6 - energy`
  - overwhelm friction: `overwhelm`
  - environment friction: `environment`
  - emotion friction: `emotion`
- Total friction:
  - min = 5
  - max = 25
- Percent:
  - `round((total / 25) * 100)`
  - possible range: 20% to 100%

## Risk Outcomes (All Categories)
- `low` risk: <45%
- `moderate` risk: 45% to 69%
- `high` risk: >=70%

## Protocol Outputs
- Top 2 blockers selected by highest friction components
- Protocol includes:
  - blocker action #1
  - blocker action #2
  - universal 10-minute start action

## State Outcomes
- `default_state`:
  - trigger: page load
  - output: instruction text, sliders at 3
- `analysis_complete`:
  - trigger: Analyze button
  - output: percent, risk, blockers, protocol
- `reset_state`:
  - trigger: Reset Sliders
  - output: sliders back to 3, no active protocol
- `copy_blocked_no_protocol`:
  - trigger: copy before analysis
  - output: guidance message
- `copy_protocol_success`:
  - trigger: copy after analysis
  - output: "Protocol copied"

## 4) Cross-Tool Combined Outcome Families

For operations and QA, all quiz/tool interactions resolve into these combined families:
- `input_error` (validation blocking state)
- `computable_result` (scores produced)
- `actionable_protocol` (specific next steps produced)
- `exportable_artifact` (copy/CSV/image/PDF/share)
- `persistence_state` (history/local snapshot present or cleared)

These five families cover all current observable outcomes across the three tools.

# Action Plan Card Schema (v1)

Last updated: March 12, 2026

## Purpose
Define a normalized cross-tool action-plan payload so module quizzes, ESQ-R, and behavioral tools can generate consistent next-step plans and recheck flows.

## Schema (JSON)

```json
{
  "schema_version": "1.0",
  "plan_id": "uuid-or-stable-id",
  "source_tool": "module_quiz|esqr|time_calibrator|task_friction|ef_story|full_profile",
  "source_context": {
    "module_id": "module-1",
    "question_ids": ["m1q4", "m1q7"],
    "misconception_primary": "willpower_over_protocol",
    "misconception_secondary": "context_blind_intervention"
  },
  "focus": {
    "title": "Protocol over Willpower",
    "summary": "Replace motivation-only advice with external supports and startup scripts.",
    "confidence": "low|medium|high"
  },
  "actions": {
    "today": [
      "Turn one repeated failure into a checklist/timer protocol."
    ],
    "this_week": [
      "Run the same protocol for 3 attempts and log completion outcomes."
    ],
    "evidence_prompt": "What changed in your completion reliability this week?"
  },
  "recheck": {
    "cadence": "24h|72h|7d",
    "due_at": "2026-03-19T16:00:00.000Z",
    "metric_type": "score_delta|self_rating|completion_count",
    "success_threshold": {
      "type": "numeric_or_state",
      "value": 1
    }
  },
  "remediation_links": [
    {
      "label": "Extended Phenotype external supports",
      "href": "module-1.html"
    },
    {
      "label": "Task-start protocol and time-bridging tools",
      "href": "module-5.html"
    }
  ],
  "analytics": {
    "plan_generated_event": "practice_plan_generated",
    "plan_started_event": "practice_plan_started",
    "checkin_completed_event": "practice_checkin_completed"
  },
  "state": {
    "status": "generated|started|completed|expired",
    "created_at": "2026-03-12T12:00:00.000Z",
    "updated_at": "2026-03-12T12:00:00.000Z"
  }
}
```

## Required fields
- `schema_version`
- `plan_id`
- `source_tool`
- `focus.title`
- `actions.today`
- `actions.this_week`
- `recheck.cadence`
- `recheck.due_at`
- `state.status`
- `state.created_at`

## Field rules
- `source_tool` must map to one currently supported interactive surface.
- `actions.today` and `actions.this_week` should each contain at least one specific behavior.
- `recheck.due_at` must be in UTC ISO-8601.
- `confidence` should default to `medium` unless tool-specific evidence indicates otherwise.
- `remediation_links` should prefer local EFI pages when equivalents exist.

## UI card contract
Each card render should show, in order:
1. Focus title + short summary.
2. One “Do today” action.
3. One “Do this week” action.
4. Recheck date and cadence.
5. One evidence prompt.
6. Optional remediation links.

## Event contract alignment (v1)
- Generate card -> emit `practice_plan_generated`
- User starts plan -> emit `practice_plan_started`
- User submits check-in -> emit `practice_checkin_completed`
- Recheck becomes due -> emit `spaced_recheck_due`
- Recheck submitted -> emit `spaced_recheck_completed`

## Storage recommendation
- Anonymous mode: `localStorage` key `efi_action_plans_v1`.
- Authenticated mode: server-side sync (future wave) with same object shape.

## Backward compatibility
- Future versions should preserve top-level keys and only add optional subfields where possible.

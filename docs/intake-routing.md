# Intake routing: Calendly questions + the tutoring redirect

The site now says what coaching *is not* before anyone books. This doc covers the part
that lives outside the repo — the Calendly event configuration — plus the on-site form
that mirrors it.

Two calls (Tracy, and the second parent call) turned into live discoveries that the
parent wanted subject tutoring, or that in-person meant driving well outside North
County. Both are answerable before a slot is taken. That is the whole point of these
questions.

---

## 1. Calendly: questions to add to the 30-minute discovery call

Event: `calendly.com/jacobansky/30min` → **Invitee Questions**.

Add all three **above** the existing free-text box. Calendly renders questions in
order, so the free-text field must be moved to last if it isn't already.

| # | Question | Type | Options | Required |
|---|----------|------|---------|----------|
| 1 | Who is the coaching for? | Single select | `Myself` · `My child` · `Someone else I support` | Yes |
| 2 | If for a student, what grade? | Single select | `Kindergarten – 4th grade` · `5th – 8th grade` · `9th – 12th grade` · `College or post-secondary` · `Not currently in school` | No |
| 3 | Are you looking for EF coaching, subject tutoring, or both? | Single select | `EF coaching — planning, starting, tracking, following through` · `Subject tutoring — help with the actual coursework` · `Both` · `Not sure yet` | Yes |

Question 3 is the one that matters. It is the only question on the form whose answer
can cancel the meeting.

Add this as the help text under question 3 so the answer is informed:

> EF coaching is not tutoring. We don't work on the assignment — we work on how you get
> to the assignment: planning, starting, tracking, following through, and what to do
> when you're stuck. If you need someone to teach the material itself, that's a tutor,
> and we'll point you to one.

## 2. The redirect

Calendly cannot branch on an answer within a single event type, so the redirect is
manual and it needs to happen the same day the booking lands.

**Anyone who answers `Subject tutoring` or `Both` gets a redirect email instead of a
slot.** Cancel the booking with the note below rather than letting it run.

**Answer = `Subject tutoring`** — cancel, send referrals:

> Thanks for booking. Based on your answer I want to save you the call: what you're
> describing is subject tutoring, and ExEF doesn't do that. EF coaching works on
> planning, starting, tracking, and following through — the scaffolding around the
> work, not the work itself. Here are two tutors I'd send my own students to: […]
> If the picture changes and it turns out the problem is getting started rather than
> understanding the material, the door is open.

**Answer = `Both`** — cancel or keep, but split the ask first:

> Thanks for booking. You marked both, so let me separate them before we meet.
> Tutoring — someone working through the coursework with your student — isn't
> something ExEF provides; here are referrals: […]. Coaching would cover the other
> half: the missing-assignment list, the starting problem, the routine that collapses
> by Wednesday. If that half is worth 30 minutes, keep the slot and we'll talk about
> exactly that. If not, cancel with no hard feelings.

**Answer = `Not sure yet`** — keep the slot. Open the call with the distinction rather
than the intake.

**Question 2 answers of K–4 or 5–8** — keep the slot, but flag it. Coaching primarily
serves adults and students from about 9th grade up; younger students usually route to
the educational specialist lane.

## 3. The on-site form mirrors this

`coaching-contact.html` carries the same three questions in a "A few routing questions"
fieldset, placed above the free-text box:

- `#coaching-for` (required)
- `#student-grade` (revealed only when the answer is *My child* / *Someone else*)
- `#service-type` (required)

Selecting `tutoring`, `both`, or `not-sure` shows an inline callout explaining the
distinction before submission, and the submit confirmation for `tutoring` / `both`
promises referrals rather than a booking link.

The lead payload (`js/coaching.js`) sends `coaching_for`, `student_grade`,
`service_type`, and a boolean `needs_tutoring_redirect`. The lead-notification email
(`netlify/functions/_common.js`) prints a `>> TUTORING REDIRECT` banner when that flag
is set, so it is visible in the notification without opening the record.

`student_age` is still sent, mirroring `student_grade`, so the existing notification
template and any saved leads stay consistent.

## 4. Stated defaults, for consistency across site and calls

Keep these identical wherever they appear — site copy, Calendly description, email:

- **Sessions:** weekly, one hour, remote by default.
- **In-person:** North County San Diego only.
- **Rates:** discussed on the discovery call. Existing clients keep their current rate.
- **Credentials:** ADDCA program in progress, ICF Level 1, high school special educator.

The rate line is deliberate. No number appears on the public site right now, because a
stale low number anchors the conversation before it starts. When a number is set,
replace the "Rates discussed on the discovery call" line in these places:

- `coaching-home.html` — `#how-sessions-run` list, `.package-note`, Beta Sprint card, FAQ "What does it cost?"
- `index.html` — coaching lede fine print
- `coaching-contact.html` — consultation lane card, "How soon can we start?" FAQ
- `beta-sprint.html` — hero
- `beta-announcement.html`, `meet-the-team.html`
- `coaching-agreement.html` — §4 Payment

Keep the "existing clients keep their current rate" sentence when the number goes back.

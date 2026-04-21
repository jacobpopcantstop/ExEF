# Gmail AI Organizer Guide — Design Spec

**Date:** 2026-04-05
**Status:** Reviewed
**Audience:** Non-technical users (parents, educators) — no terminal, no coding background

## Summary

A single-page resource on exef.org that teaches users how to set up a free AI-powered Gmail organizer using Google Apps Script and the Gemini API. The page includes a step-by-step walkthrough for the generic setup, followed by a 12-question customization questionnaire that generates a tailored AI prompt. The user copies that prompt into their AI of choice (Claude, Gemini, ChatGPT), gets back a ready-to-paste script, and follows the walkthrough to deploy it.

## Core Concept

The page does NOT generate code. It generates a **prompt** — a structured set of instructions the user pastes into any AI to get their custom script. This keeps the guide evergreen: if APIs change, the AI handles it. The walkthrough teaches the deployment steps, which are stable.

## SEO & Meta

- `<title>`: "Build a Free AI Email Organizer | EFI"
- `<meta name="description">`: "Step-by-step guide to building a free AI-powered Gmail organizer using Google Apps Script and the Gemini API. Includes a customization questionnaire that generates your personal setup prompt."
- OG title: "Build a Free AI Email Organizer | EFI"
- OG description: "Set up an AI Gmail organizer for under $1/month. No coding required — customize with a questionnaire, copy a prompt, paste into any AI."
- Canonical: `https://executivefunctioninginstitute.com/gmail-ai-organizer.html`

## Files

| File | Purpose |
|------|---------|
| `gmail-ai-organizer.html` | The page |
| `js/gmail-ai-organizer.js` | Questionnaire logic, prompt builder, copy button (IIFE) |
| No new CSS | Uses existing site classes |

## Page Sections (top to bottom)

### 1. Page Header
- Breadcrumb: Home > Resources > Gmail AI Organizer
- Title: "Build a Free AI Email Organizer"
- Subtitle: "Use the Gemini API and Google Apps Script to sort, summarize, and manage your inbox automatically — no coding required."

### 2. What You'll Build
Card explaining the end result:
- An AI bot that lives inside your Google account
- Sorts emails into categories you define
- Sends you a daily digest
- Can draft replies and auto-archive low-priority mail
- Runs on autopilot every day

**Cost notice:** "The Gemini API costs pennies per day for this kind of usage — typically under $1/month. Paid email organizer services that do the same thing charge $20/month or more."

### 3. Before You Start
Prerequisites checklist:
- A Gmail account (personal or Google Workspace)
- About 15 minutes
- Willingness to copy and paste
- Access to any AI chatbot (Claude, Gemini, ChatGPT, etc.)

### 4. Walkthrough (6 steps)

Each step in its own numbered card.

**Step 1: Open Google Apps Script**
- Go to script.google.com, sign in with the Gmail account to organize
- Click "New project," name it "Email Organizer"
- Callout: "Make sure you're signed into the right Google account if you have multiple."

**Step 2: Get a Gemini API Key**
- Go to aistudio.google.com/apikey
- Click "Create API key," copy it
- In Apps Script: Project Settings > Script Properties > add `GEMINI_API_KEY` with the key value
- Notice: "Your API key is private. Don't share it or post it publicly."

**Step 3: Generate Your Custom Script**
- Complete the questionnaire below
- Copy the generated prompt
- Paste into AI of choice, ask it to generate the Apps Script code
- Copy the code the AI returns

**Step 4: Paste the Code**
- Back in Apps Script editor, select all the default code and delete it
- Paste the AI-generated code
- Click the save icon (floppy disk)

**Step 5: Authorize & Test**
- Click "Run" on the main function
- Click "Review Permissions" > choose your account > "Allow"
- Check inbox to confirm labels appeared and it worked
- Callout: "Google will warn you the app isn't verified. This is normal for personal scripts — click 'Advanced' then 'Go to Email Organizer (unsafe)' to proceed."

**Step 6: Set Up the Daily Trigger**
- In Apps Script sidebar: Triggers (clock icon) > "Add Trigger"
- Function: select main function, time-driven, at preferred interval
- If digest enabled: add a second trigger for the digest function
- Notice: "You can always come back and change the schedule or re-run the questionnaire to update your prompt."

### 5. Questionnaire

All questions visible on one scrollable form, grouped into 4 sections.

#### Section A: Email Categories
1. **Which categories do you want?** (checkboxes)
   - Presets: School, Work, Bills/Finance, Family, Health, Shopping/Orders, Newsletters, Social Media, Promotions/Spam
   - Custom text input for adding more
2. **Catch-all label for uncategorized email?** (yes/no radio, default yes)

#### Section B: Actions & Automation
3. **What should happen with low-priority emails?** (radio)
   - Label only
   - Label + archive out of inbox
   - Label + archive + mark as read
   - Leave them alone
4. **Draft reply suggestions for which categories?** (checkboxes matching Q1's preset list, plus "None")
   - Static checkbox list matching the same preset categories from Q1 — NOT dynamically generated from Q1 selections. At prompt-generation time, only categories checked in BOTH Q1 and Q4 are included. This avoids reactive DOM complexity.
5. **Reply tone?** (radio: Formal / Friendly & brief / Casual / Match the sender's tone)

#### Section C: Daily Digest
6. **Send a daily digest email?** (yes/no radio)
7. **What should the digest include?** (checkboxes, shown if Q6=yes)
   - Count per category
   - List of action-required emails
   - Flagged sender highlights
   - Summary of what was auto-archived
8. **Digest delivery time?** (dropdown, shown if Q6=yes)
   - Morning (7–9am)
   - Midday (12–1pm)
   - Evening (5–7pm)
   - Custom time input

#### Section D: Schedule & Preferences
9. **How often should the bot run?** (radio: Every hour / Every 6 hours / Once daily / Twice daily)
10. **Which days?** (checkboxes: Every day / Weekdays only / custom day picker)
11. **VIP senders — never auto-archive or sort?** (textarea)
12. **Any additional instructions?** (textarea, e.g. "Flag anything from my kid's school as urgent")

Submit button: "Generate My Prompt"

### 6. Generated Prompt Output

Shown after form submission. Two parts:

**Plain-English summary** (above the prompt):
> "Your bot will run every 6 hours on weekdays, sort emails into 4 categories (School, Bills, Family, Newsletters), auto-archive and mark newsletters as read, draft friendly replies for school and bills emails, and send you a morning digest at 8am."

**Prompt block** (styled code block with copy button):
A structured prompt addressed to an AI, containing:
- System context (build a Google Apps Script with Gemini API)
- Sorting rules with the user's categories
- Automation rules (archive behavior, draft replies, tone)
- Digest configuration
- Schedule
- VIP list
- Additional instructions
- Standard footer requesting comments, error handling, and a modular structure

The prompt is self-contained — no EFI branding or external dependencies in the output.

**Sample prompt output:**
```
Build me a Google Apps Script that connects to the Gemini API to organize my Gmail inbox.
Store the API key in Script Properties under the key "GEMINI_API_KEY".

SORTING RULES:
- Create these Gmail labels and sort incoming unread emails into them: School, Bills/Finance, Family, Newsletters
- Anything that doesn't match a category goes to a label called "Other"

AUTOMATION:
- Newsletters and Promotions: archive out of inbox and mark as read
- Draft reply suggestions for: School, Bills/Finance
- Reply tone: friendly and brief

DAILY DIGEST:
- Send me a summary email every morning between 7-9am
- Include: count of emails per category, list of action-required emails, summary of what was auto-archived

SCHEDULE:
- Process unread emails every 6 hours
- Run on weekdays only

VIP LIST (never auto-archive or auto-sort these senders):
- principal@school.edu
- doctor@health.com

ADDITIONAL INSTRUCTIONS:
- Flag anything from my kid's school as urgent

IMPLEMENTATION REQUIREMENTS:
- Include a main function that processes unread emails using the Gemini API
- Include a separate digest function that composes and sends the summary email
- Add clear comments explaining each section so a non-developer can modify it later
- Add error handling that sends me an email notification if the script fails
- Use GmailApp and UrlFetchApp (no external libraries)
```

Copy button uses `navigator.clipboard.writeText` (same pattern as CAP assessment).

### 7. Troubleshooting / FAQ

3–5 cards covering common non-technical issues:
- "I got a scary Google permissions warning" — explain the unverified app screen
- "The script ran but nothing happened" — check label spelling, check the execution log
- "I want to change my categories later" — re-run the questionnaire, paste new prompt into AI, replace the code
- "How much will this cost?" — reiterate the under-$1/month point, link to Google AI Studio pricing
- "Can I use this with Outlook / Yahoo?" — this guide is Gmail-specific, but the prompt approach works for other setups with modifications

## Technical Details

### JS Architecture
- Single IIFE in `js/gmail-ai-organizer.js`
- Gate: `document.getElementById('gao-questionnaire')`
- No localStorage, no external state — reads form DOM at generation time
- Prompt built via string concatenation from form values
- Conditional sections (Q7/Q8 shown/hidden based on Q6 radio) via `hidden` attribute toggle
- Q4 uses static preset checkboxes; at prompt-generation time, only categories selected in both Q1 and Q4 are included
- Validation: at least one category selected, inline error messages
- Estimated size: 350–450 lines

### CSS
- No new CSS file or classes
- Reuses: `card`, `callout`, `notice`, `checklist`, `section--alt`, `btn`, `grid`, `container--narrow`
- Form inputs styled inline (same pattern as `coaching-contact.html`)

### Integration
- Add a card to `resources.html` linking to this page
- Nav: use same link set as `resources.html`, with `nav__link--active` on Resources
- Include `theme-init.min.js` in head
- Scripts: `nav-auth.min.js`, `gmail-ai-organizer.min.js`, `main.min.js`
- JS file added to minification pipeline (handled automatically by `scripts/minify_page_scripts.py`)

### Accessibility
- Questionnaire sections wrapped in `<fieldset>` with `<legend>` for each group (A–D)
- Output area uses `aria-live="polite"` so screen readers announce the generated prompt
- Conditional Q7/Q8 use `hidden` attribute (not `display:none`) for accessibility
- All form inputs have associated `<label>` elements

### Validation Rules
- Required: at least one category in Q1, one radio selected in Q3/Q5/Q9, at least one day in Q10
- Optional: Q2 (defaults yes), Q4 (defaults none), Q6 (defaults no), Q11, Q12
- Errors shown inline below the relevant question as a `<span>` with `color: var(--color-warm)`
- Form scrolls to first error on failed validation

### Estimated JS Size
350–450 lines (revised upward from initial 200–300 to account for prompt template, summary builder, and validation)

### No External Dependencies
- No API calls from the page
- No localStorage
- No third-party scripts
- All AI interaction happens on the user's end after they copy the prompt

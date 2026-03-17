/**
 * Module Quiz System
 * Saves module mastery test results into the learner account progress state.
 *
 * Product Learning Loop additions:
 *   #3  Reflection prompt prefills from plan focus / history
 *   #4  Adaptive practice intensity based on adherence state
 *   #5  Misconception-family difficulty ladder for quiz remediation
 */

(function() {
  'use strict';

  var PASSING_SCORE = 80;
  var ACTION_PLAN_STORAGE_KEY = 'efi_action_plans_v1';
  var REFLECTION_STORAGE_KEY = 'efi_reflections_v1';
  var ADHERENCE_STORAGE_KEY = 'efi_adherence_v1';
  var currentQuiz = null;
  var userAnswers = {};
  var quizData = null;
  var lastSavedResult = null;
  var statusMessage = '';
  // Per-question remediation ladder state for this session
  // Shape: { [questionId]: { ladderIndex: Number, resolved: Boolean } }
  var remediationLadderState = {};

  // ── #4  Adherence tracking ──────────────────────────────────────────────────
  // Reads/writes a lightweight session log.  Each entry records whether a quiz
  // session was completed or abandoned.  The last 10 sessions determine the
  // adherence level: high (≥70 % completed), medium (40–69 %), low (<40 %).

  function readAdherenceData() {
    try { return JSON.parse(localStorage.getItem(ADHERENCE_STORAGE_KEY)) || { sessions: [] }; } catch (e) { return { sessions: [] }; }
  }

  function writeAdherenceData(data) {
    try { localStorage.setItem(ADHERENCE_STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    if (window.EFI && window.EFI.Auth && typeof window.EFI.Auth.syncLearningLoopState === 'function') {
      window.EFI.Auth.syncLearningLoopState();
    }
  }

  function recordAdherenceSession(moduleId, completed) {
    var data = readAdherenceData();
    data.sessions = Array.isArray(data.sessions) ? data.sessions : [];
    data.sessions.push({ at: new Date().toISOString(), moduleId: moduleId || '', completed: !!completed });
    data.sessions = data.sessions.slice(-30); // keep last 30
    var recent = data.sessions.slice(-10);
    var doneCount = recent.filter(function(s) { return s.completed; }).length;
    var ratio = recent.length ? doneCount / recent.length : 0;
    data.computed = {
      level: ratio >= 0.7 ? 'high' : (ratio >= 0.4 ? 'medium' : 'low'),
      score: ratio,
      sample_size: recent.length
    };
    writeAdherenceData(data);
    return data.computed;
  }

  function getAdherenceLevel() {
    var data = readAdherenceData();
    return (data.computed && data.computed.level) ? data.computed.level : 'medium';
  }

  // ── #4  Adaptive question selection ────────────────────────────────────────
  // high  → 5–6 questions, harder misconception families first
  // medium → all questions, standard order
  // low   → all questions, simpler concepts first (more reinforcement)

  var HARDER_MISCONCEPTIONS = ['willpower_over_protocol', 'planning_without_transfer', 'ethics_scope_drift'];

  function selectAdaptiveQuestions(questions, adherenceLevel) {
    if (!Array.isArray(questions) || !questions.length) return questions;

    if (adherenceLevel === 'high') {
      var hard = questions.filter(function(q) {
        return HARDER_MISCONCEPTIONS.indexOf(q.misconception_primary) !== -1 ||
               HARDER_MISCONCEPTIONS.indexOf(q.misconception_secondary) !== -1;
      });
      var easy = questions.filter(function(q) {
        return HARDER_MISCONCEPTIONS.indexOf(q.misconception_primary) === -1 &&
               HARDER_MISCONCEPTIONS.indexOf(q.misconception_secondary) === -1;
      });
      // Present harder items first; cap at 6, floor at 5
      return hard.concat(easy).slice(0, Math.max(5, Math.min(6, questions.length)));
    }

    if (adherenceLevel === 'low') {
      // Simpler concepts first for maximum reinforcement
      var simpleFirst = questions.filter(function(q) {
        return HARDER_MISCONCEPTIONS.indexOf(q.misconception_primary) === -1 &&
               HARDER_MISCONCEPTIONS.indexOf(q.misconception_secondary) === -1;
      });
      var harderLast = questions.filter(function(q) {
        return HARDER_MISCONCEPTIONS.indexOf(q.misconception_primary) !== -1 ||
               HARDER_MISCONCEPTIONS.indexOf(q.misconception_secondary) !== -1;
      });
      return simpleFirst.concat(harderLast);
    }

    return questions; // medium: standard order, all questions
  }

  // ── #5  Misconception difficulty ladder ─────────────────────────────────────
  // When a learner gets a question wrong the ladder activates: it serves
  // progressively simpler scaffold questions until the learner gets one right,
  // then marks the family resolved and lets them advance.
  // Questions are ordered simplest (index 0) → harder (higher index).

  var MISCONCEPTION_LADDER = {
    knowledge_vs_performance: [
      {
        id: 'scaffold_kvp_1',
        scaffoldLevel: 1,
        question: 'Can someone fully understand how executive function works but still struggle to perform the skill reliably?',
        options: [
          'Yes — understanding and doing are separate processes',
          'No — if you understand it, you can do it'
        ],
        correct: 0,
        explanation: 'Correct. EF coaching distinguishes declarative knowledge ("I know I should plan") from procedural execution reliability. Understanding alone does not create consistent behavior — this is the knowledge–performance gap.'
      },
      {
        id: 'scaffold_kvp_2',
        scaffoldLevel: 2,
        question: 'A client correctly explains the concept of temporal horizon but continues to miss every deadline. What does this best illustrate?',
        options: [
          'The client is not motivated enough',
          'The knowledge vs. performance gap: insight does not automatically produce behavior change',
          'The client needs to study the material more',
          'The coach needs to re-explain the concept'
        ],
        correct: 1,
        explanation: 'The knowledge–performance gap is central to Barkley\'s model. EF coaching should focus on observable execution behaviors with real-world checkpoints, not just verbal understanding.'
      }
    ],
    effort_vs_regulation: [
      {
        id: 'scaffold_evr_1',
        scaffoldLevel: 1,
        question: 'When someone with an EF deficit fails to start a task, what is the PRIMARY explanation according to the neurobiological model?',
        options: [
          'Laziness or lack of effort',
          'A regulation deficit in the brain\'s executive system',
          'Low intelligence',
          'Poor upbringing'
        ],
        correct: 1,
        explanation: 'Task-initiation failures in EF deficits are neurobiological, not character-based. Framing them as regulation problems — not effort problems — reduces shame and points toward effective supports.'
      },
      {
        id: 'scaffold_evr_2',
        scaffoldLevel: 2,
        question: 'A coach tells a client: "You just need to try harder." Which coaching principle does this violate?',
        options: [
          'None — encouraging effort is always helpful',
          'It misattributes a regulation-load problem to a motivation or character failure',
          'Coaches should never encourage clients',
          'This is fully consistent with EF coaching principles'
        ],
        correct: 1,
        explanation: 'Effort-framing ignores the neurobiological root of EF deficits and compounds shame. EF coaching uses regulation-load analysis and externalized supports, not willpower exhortations.'
      }
    ],
    willpower_over_protocol: [
      {
        id: 'scaffold_wop_1',
        scaffoldLevel: 1,
        question: 'What is the "Extended Phenotype" strategy in EF coaching?',
        options: [
          'Training clients to rely more on willpower',
          'Using external tools, reminders, and environmental structures to substitute for impaired EF',
          'A medication management protocol',
          'A formal diagnostic framework'
        ],
        correct: 1,
        explanation: 'Extended Phenotype = designing the environment to do the work the internal EF system cannot reliably do. External scaffolds (timers, checklists, reminders) replace — not supplement — internal regulation.'
      },
      {
        id: 'scaffold_wop_2',
        scaffoldLevel: 2,
        question: 'A client keeps forgetting daily medication. A protocol-over-willpower response would be:',
        options: [
          'Tell the client to remember harder',
          'Design a visual cue or alarm tied to an existing morning habit',
          'Reduce coaching session frequency',
          'Explain again why the medication is important'
        ],
        correct: 1,
        explanation: 'Behavioral design — habit stacking, environmental cues — is more reliable than willpower-based reminders. EF coaching externalizes cognitive demand rather than demanding internal vigilance.'
      }
    ],
    planning_without_transfer: [
      {
        id: 'scaffold_pwt_1',
        scaffoldLevel: 1,
        question: 'A coaching plan is created but the client never implements it. What element is most likely missing?',
        options: [
          'A specific first action step tied to a real context and a checkpoint date',
          'More detailed written notes',
          'A longer planning session',
          'A more complex strategy'
        ],
        correct: 0,
        explanation: 'Plans without a concrete first action in a specific context and a scheduled checkpoint rarely transfer to real behavior. Transfer requires specifying: what, when, where, and how you will know it happened.'
      },
      {
        id: 'scaffold_pwt_2',
        scaffoldLevel: 2,
        question: 'What does "second-context transfer" mean in the EF coaching model?',
        options: [
          'Practicing the same skill in a different real-world situation to confirm generalization',
          'Reviewing session notes a second time',
          'Having a second coach confirm the plan',
          'Creating a backup plan'
        ],
        correct: 0,
        explanation: 'A skill is not mastered until it transfers across contexts. Requiring a second-context performance rep before marking mastery prevents the "session room only" learning trap.'
      }
    ],
    context_blind_intervention: [
      {
        id: 'scaffold_cbi_1',
        scaffoldLevel: 1,
        question: 'What does "Goodness of Fit" mean in EF coaching?',
        options: [
          'All clients benefit from the same evidence-based intervention',
          'Matching the coaching strategy to the client\'s unique profile, environment, and life context',
          'Finding the most affordable intervention',
          'Using the intervention with the most research citations'
        ],
        correct: 1,
        explanation: 'Goodness of Fit means tailoring interventions to the individual — their EF profile, environment, values, and constraints — rather than applying a one-size-fits-all solution.'
      }
    ],
    diagnostic_overreach: [
      {
        id: 'scaffold_dr_1',
        scaffoldLevel: 1,
        question: 'A client asks after an EF assessment: "Do I have ADHD?" The correct coach response is:',
        options: [
          'Yes, based on your pattern scores you likely have ADHD',
          'No, our tools show no ADHD present',
          'This assessment identifies functional patterns, not diagnoses. A qualified clinician makes diagnoses.',
          'That is a question I am not allowed to answer at all'
        ],
        correct: 2,
        explanation: 'EF coaches identify functional patterns — not diagnoses. Offering a diagnostic opinion (positive or negative) exceeds scope of practice. All diagnostic questions must be referred to qualified professionals.'
      }
    ],
    ethics_scope_drift: [
      {
        id: 'scaffold_esd_1',
        scaffoldLevel: 1,
        question: 'A coaching client begins describing severe depression and suicidal ideation. What should the coach do first?',
        options: [
          'Continue coaching and reframe it as an EF regulation problem',
          'Diagnose the depression and adjust the coaching plan',
          'Recognize the clinical threshold, pause the coaching agenda, and facilitate referral to a mental health professional',
          'Ignore it — coaches focus on function, not emotional content'
        ],
        correct: 2,
        explanation: 'When risk signals exceed coaching scope, coaches must recognize the boundary, pause the coaching agenda, document the concern, and facilitate an appropriate clinical referral. Scope drift harms clients.'
      }
    ]
  };

  // ── #5  Ladder helpers ──────────────────────────────────────────────────────

  function renderRemediationLadderQuestion(container, questionId, misconceptionKey) {
    if (!container || !questionId || !misconceptionKey) return;
    var ladder = MISCONCEPTION_LADDER[misconceptionKey];
    if (!ladder || !ladder.length) return;

    // Initialise ladder state for this question if not already done
    if (!remediationLadderState[questionId]) {
      remediationLadderState[questionId] = { ladderIndex: 0, resolved: false };
    }
    var state = remediationLadderState[questionId];
    if (state.resolved) return;

    var ladderQ = ladder[state.ladderIndex];
    if (!ladderQ) return;

    // Remove any existing ladder widget for this question
    var existing = container.querySelector('.remediation-ladder-wrap');
    if (existing) existing.remove();

    var wrap = document.createElement('div');
    wrap.className = 'remediation-ladder-wrap';
    wrap.style.marginTop = 'var(--space-md)';
    wrap.style.padding = 'var(--space-md)';
    wrap.style.background = 'rgba(255, 193, 7, 0.08)';
    wrap.style.borderLeft = '4px solid #FFC107';
    wrap.style.borderRadius = 'var(--border-radius)';

    var badge = document.createElement('p');
    badge.style.fontWeight = '600';
    badge.style.fontSize = '0.85rem';
    badge.style.color = '#b8860b';
    badge.style.marginBottom = 'var(--space-xs)';
    badge.textContent = 'Scaffolding question — build up to mastery (level ' + ladderQ.scaffoldLevel + '):';
    wrap.appendChild(badge);

    var qText = document.createElement('p');
    qText.style.fontWeight = '600';
    qText.style.marginBottom = 'var(--space-sm)';
    qText.textContent = ladderQ.question;
    wrap.appendChild(qText);

    var optionsDiv = document.createElement('div');
    optionsDiv.style.display = 'flex';
    optionsDiv.style.flexDirection = 'column';
    optionsDiv.style.gap = 'var(--space-xs)';

    var ladderAnswer = { selected: null, answered: false };

    ladderQ.options.forEach(function(option, idx) {
      var lbl = document.createElement('label');
      lbl.style.display = 'flex';
      lbl.style.gap = 'var(--space-sm)';
      lbl.style.padding = 'var(--space-xs) var(--space-sm)';
      lbl.style.background = 'transparent';
      lbl.style.borderRadius = 'var(--border-radius)';
      lbl.style.cursor = 'pointer';

      var inp = document.createElement('input');
      inp.type = 'radio';
      inp.name = 'ladder-' + ladderQ.id;
      inp.value = idx;
      inp.addEventListener('change', function() {
        if (ladderAnswer.answered) return;
        ladderAnswer.selected = idx;
        Array.from(optionsDiv.querySelectorAll('label')).forEach(function(l, i) {
          l.style.background = i === idx ? 'var(--color-accent-light)' : 'transparent';
        });
      });
      lbl.appendChild(inp);

      var span = document.createElement('span');
      span.textContent = option;
      lbl.appendChild(span);
      optionsDiv.appendChild(lbl);
    });

    wrap.appendChild(optionsDiv);

    var checkBtn = document.createElement('button');
    checkBtn.type = 'button';
    checkBtn.className = 'btn btn--secondary btn--sm';
    checkBtn.style.marginTop = 'var(--space-sm)';
    checkBtn.textContent = 'Check Answer';

    var feedbackP = document.createElement('p');
    feedbackP.style.marginTop = 'var(--space-sm)';
    feedbackP.style.fontSize = '0.92rem';
    feedbackP.style.lineHeight = '1.5';

    checkBtn.addEventListener('click', function() {
      if (ladderAnswer.answered) return;
      if (ladderAnswer.selected === null) {
        feedbackP.textContent = 'Select an answer first.';
        return;
      }
      ladderAnswer.answered = true;
      checkBtn.disabled = true;
      var isCorrect = ladderAnswer.selected === ladderQ.correct;
      feedbackP.style.color = isCorrect ? '#4CAF50' : '#d32f2f';
      feedbackP.textContent = (isCorrect ? 'Correct! ' : 'Not quite. ') + ladderQ.explanation;

      if (isCorrect) {
        // Ladder up: advance index; if we've exhausted the ladder, mark resolved
        state.ladderIndex++;
        if (state.ladderIndex >= ladder.length) {
          state.resolved = true;
          var resolvedNote = document.createElement('p');
          resolvedNote.style.marginTop = 'var(--space-sm)';
          resolvedNote.style.fontWeight = '600';
          resolvedNote.style.color = '#4CAF50';
          resolvedNote.textContent = 'Scaffolding complete — you\'ve worked through this concept. Return to the quiz when ready.';
          wrap.appendChild(resolvedNote);
        } else {
          // Offer next ladder step
          var nextBtn = document.createElement('button');
          nextBtn.type = 'button';
          nextBtn.className = 'btn btn--secondary btn--sm';
          nextBtn.style.marginTop = 'var(--space-sm)';
          nextBtn.textContent = 'Next scaffolding step →';
          nextBtn.addEventListener('click', function() {
            renderRemediationLadderQuestion(container, questionId, misconceptionKey);
          });
          wrap.appendChild(nextBtn);
        }
      } else {
        // Ladder down: try same or simpler level again on retry
        var retryBtn = document.createElement('button');
        retryBtn.type = 'button';
        retryBtn.className = 'btn btn--secondary btn--sm';
        retryBtn.style.marginTop = 'var(--space-sm)';
        retryBtn.textContent = 'Try again';
        retryBtn.addEventListener('click', function() {
          // Reset so the same scaffold question re-renders fresh
          ladderAnswer.answered = false;
          ladderAnswer.selected = null;
          renderRemediationLadderQuestion(container, questionId, misconceptionKey);
        });
        wrap.appendChild(retryBtn);
      }
    });

    wrap.appendChild(checkBtn);
    wrap.appendChild(feedbackP);
    container.appendChild(wrap);
  }

  // ── #3  Reflection prefill helpers ─────────────────────────────────────────
  // Reads recent action plans and reflections from localStorage to construct a
  // contextual prefill string for the 48-hour reflection textarea.

  function buildReflectionPrefill(context) {
    var lines = [];

    // Pull the most recent plan for this module (or any module as fallback)
    try {
      var plans = JSON.parse(localStorage.getItem(ACTION_PLAN_STORAGE_KEY)) || [];
      var modulePlans = plans.filter(function(p) {
        return p && p.source_context && p.source_context.module_id === (context.module_id || '');
      });
      var latestPlan = modulePlans.length ? modulePlans[modulePlans.length - 1] : (plans.length ? plans[plans.length - 1] : null);

      if (latestPlan && latestPlan.focus && latestPlan.focus.title) {
        lines.push('Last focus: ' + latestPlan.focus.title);
        if (latestPlan.actions && latestPlan.actions.today && latestPlan.actions.today[0]) {
          lines.push('Pending action: ' + latestPlan.actions.today[0]);
        }
      }
    } catch (e) {}

    // Pull the most recent reflection for context
    try {
      var reflections = JSON.parse(localStorage.getItem(REFLECTION_STORAGE_KEY)) || [];
      var moduleReflections = reflections.filter(function(r) {
        return r && r.module_id === (context.module_id || '');
      });
      var lastRefl = moduleReflections.length ? moduleReflections[moduleReflections.length - 1] : null;
      if (lastRefl && lastRefl.reflection_48h) {
        lines.push('Previous reflection: "' + lastRefl.reflection_48h.slice(0, 80) + (lastRefl.reflection_48h.length > 80 ? '…' : '') + '"');
      }
    } catch (e) {}

    if (lines.length) {
      return lines.join('\n') + '\n\nWhat will you test in the next 48 hours?';
    }
    return '';
  }

  // ── Core helpers ────────────────────────────────────────────────────────────

  function loadQuizData() {
    fetch('/data/module-quizzes.json')
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to load quiz data');
        return response.json();
      })
      .then(function(data) {
        quizData = data;
        var moduleId = getModuleIdFromPage();
        if (moduleId && quizData.quizzes[moduleId]) {
          initializeQuiz(moduleId);
        }
      })
      .catch(function(error) {
        console.warn('[Module Quiz] Could not load quiz data:', error);
      });
  }

  function trackAssessmentEvent(eventName, properties) {
    if (window.EFI && window.EFI.Analytics && typeof window.EFI.Analytics.track === 'function') {
      window.EFI.Analytics.track(eventName, properties || {});
    }
  }

  function readActionPlans() {
    try {
      return JSON.parse(localStorage.getItem(ACTION_PLAN_STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function writeActionPlans(plans) {
    localStorage.setItem(ACTION_PLAN_STORAGE_KEY, JSON.stringify((plans || []).slice(-50)));
    if (window.EFI && window.EFI.Auth && typeof window.EFI.Auth.syncLearningLoopState === 'function') {
      window.EFI.Auth.syncLearningLoopState();
    }
  }

  function clearNode(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function appendLabeledParagraph(container, label, text, options) {
    var p = document.createElement('p');
    if (options && options.marginTop) p.style.marginTop = options.marginTop;
    if (options && options.marginBottom) p.style.marginBottom = options.marginBottom;
    if (options && options.color) p.style.color = options.color;
    if (options && options.fontSize) p.style.fontSize = options.fontSize;
    var strong = document.createElement('strong');
    strong.textContent = label;
    p.appendChild(strong);
    p.appendChild(document.createTextNode(' ' + text));
    container.appendChild(p);
    return p;
  }

  function getAdaptiveCadence(baselineCadence) {
    var plans = readActionPlans();
    var active = plans.filter(function(p) { return p && p.state && p.state.status !== 'expired'; });
    if (!active.length) return baselineCadence;
    var engaged = active.filter(function(p) {
      var s = p.state.status;
      return s === 'started' || s === 'checkin_completed' || s === 'completed';
    }).length;
    var rate = engaged / active.length;
    if (rate >= 0.8) return baselineCadence;
    if (rate >= 0.5) return baselineCadence === '7d' ? '72h' : baselineCadence;
    return '24h';
  }

  function updatePlanStatus(planId, status) {
    var plans = readActionPlans();
    var updated = false;
    plans.forEach(function(plan) {
      if (plan && plan.plan_id === planId) {
        plan.state = plan.state || {};
        plan.state.status = status;
        plan.state.updated_at = new Date().toISOString();
        updated = true;
      }
    });
    if (updated) writeActionPlans(plans);
  }

  function completePlanCheckin(planId, payload) {
    var plans = readActionPlans();
    var updated = false;
    var checkinAt = new Date().toISOString();
    plans.forEach(function(plan) {
      if (plan && plan.plan_id === planId) {
        plan.state = plan.state || {};
        plan.state.checkins = Array.isArray(plan.state.checkins) ? plan.state.checkins : [];
        plan.state.checkins.push({
          at: checkinAt,
          self_rating: payload.self_rating,
          metric_label: payload.metric_label,
          metric_value: payload.metric_value
        });
        plan.state.last_checkin_at = checkinAt;
        plan.state.status = 'checkin_completed';
        plan.state.updated_at = checkinAt;
        updated = true;
      }
    });
    if (updated) writeActionPlans(plans);
    return checkinAt;
  }

  function getTopMisconceptionTag(missedQuestions, remediationMap) {
    if (!missedQuestions || !missedQuestions.length) {
      if (remediationMap.planning_without_transfer) return 'planning_without_transfer';
      var fallbackKeys = Object.keys(remediationMap || {});
      return fallbackKeys.length ? fallbackKeys[0] : '';
    }

    var counts = {};
    missedQuestions.forEach(function(question) {
      var key = question.misconception_primary || question.misconception_secondary;
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });

    var ranked = Object.keys(counts).sort(function(a, b) { return counts[b] - counts[a]; });
    return ranked.length ? ranked[0] : '';
  }

  function getMissedDifficultyLevel(missedQuestions, topMisconception) {
    var relevant = missedQuestions.filter(function(q) {
      return q.misconception_primary === topMisconception || q.misconception_secondary === topMisconception;
    });
    if (!relevant.length) return 'medium';
    var counts = { easy: 0, medium: 0, hard: 0 };
    relevant.forEach(function(q) { var d = q.difficulty || 'medium'; counts[d] = (counts[d] || 0) + 1; });
    if (counts.easy >= 1) return 'easy';
    if (counts.medium >= 1) return 'medium';
    return 'hard';
  }

  function buildActionPlanPayload(summary) {
    var remediationMap = (quizData && quizData.remediation_map) ? quizData.remediation_map : {};
    var missedQuestions = currentQuiz.data.questions.filter(function(question) {
      return userAnswers[question.id] !== question.correct;
    });
    var focusKey = getTopMisconceptionTag(missedQuestions, remediationMap);
    var adaptiveDifficulty = getMissedDifficultyLevel(missedQuestions, focusKey);
    var remediation = remediationMap[focusKey] || {
      title: summary.passed ? 'Retention and Transfer Reinforcement' : 'Concept Reinforcement Plan',
      summary: summary.passed
        ? 'You passed. Use this short plan to reinforce and transfer mastery into real tasks.'
        : 'Use this plan to reinforce weak concepts and retest with better transfer.',
      default_actions: [
        'Review one concept summary and convert it into one practical behavior for this week.',
        'Run one short recheck after implementation and log what changed.'
      ],
      module_targets: [{ module: currentQuiz.id, label: 'Review this module', href: currentQuiz.id + '.html' }]
    };

    var planId = 'plan_' + String(currentQuiz.id || 'module') + '_' + Date.now();
    var now = new Date();
    var cadence = getAdaptiveCadence(summary.passed ? '7d' : '72h');
    var dueMs = cadence === '24h' ? 24 * 60 * 60 * 1000 : (cadence === '72h' ? 72 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);

    return {
      schema_version: '1.0',
      plan_id: planId,
      source_tool: 'module_quiz',
      source_context: {
        module_id: currentQuiz.id,
        question_ids: missedQuestions.map(function(question) { return question.id; }),
        misconception_primary: focusKey,
        misconception_secondary: missedQuestions.length && missedQuestions[0] ? missedQuestions[0].misconception_secondary || '' : ''
      },
      focus: {
        title: remediation.title,
        summary: remediation.summary,
        confidence: missedQuestions.length >= 3 ? 'high' : (missedQuestions.length >= 1 ? 'medium' : 'low')
      },
      actions: {
        today: [String((remediation.default_actions || [])[0] || 'Review one missed concept and rehearse one practical step.')],
        this_week: [String((remediation.default_actions || [])[1] || 'Complete one recheck and record what improved.')],
        evidence_prompt: 'What changed in your ability to execute this concept in a real task this week?'
      },
      recheck: {
        cadence: cadence,
        due_at: new Date(now.getTime() + dueMs).toISOString(),
        metric_type: 'score_delta',
        success_threshold: {
          type: 'numeric_or_state',
          value: summary.passed ? 0 : 1
        },
        adaptive_difficulty: adaptiveDifficulty
      },
      remediation_links: (remediation.module_targets || []).map(function(target) {
        return { label: target.label, href: target.href };
      }).slice(0, 3),
      analytics: {
        plan_generated_event: 'practice_plan_generated',
        plan_started_event: 'practice_plan_started',
        checkin_completed_event: 'practice_checkin_completed'
      },
      state: {
        status: 'generated',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
    };
  }

  function renderActionPlanCard(container, plan) {
    if (!container || !plan) return;

    var card = document.createElement('section');
    card.className = 'card';
    card.style.marginTop = 'var(--space-lg)';
    card.style.borderLeft = '4px solid var(--color-primary)';

    var dueLabel = plan.recheck && plan.recheck.due_at ? new Date(plan.recheck.due_at).toLocaleString() : 'upcoming';

    var title = document.createElement('h5');
    title.style.marginTop = '0';
    title.textContent = 'Next Action Plan';
    card.appendChild(title);

    var focusTitle = document.createElement('p');
    focusTitle.style.marginBottom = 'var(--space-sm)';
    var focusStrong = document.createElement('strong');
    focusStrong.textContent = plan.focus.title;
    focusTitle.appendChild(focusStrong);
    card.appendChild(focusTitle);

    var focusSummary = document.createElement('p');
    focusSummary.style.marginTop = '0';
    focusSummary.style.color = 'var(--color-text-light)';
    focusSummary.textContent = plan.focus.summary;
    card.appendChild(focusSummary);

    appendLabeledParagraph(card, 'Do today:', plan.actions.today[0] || '');
    appendLabeledParagraph(card, 'Do this week:', plan.actions.this_week[0] || '');
    appendLabeledParagraph(card, 'Re-check:', dueLabel + ' (' + plan.recheck.cadence + ')');
    appendLabeledParagraph(card, 'Evidence prompt:', plan.actions.evidence_prompt, { color: 'var(--color-text-light)' });

    if (plan.remediation_links && plan.remediation_links.length) {
      var linksHeading = document.createElement('p');
      linksHeading.style.marginBottom = 'var(--space-xs)';
      var linksStrong = document.createElement('strong');
      linksStrong.textContent = 'Targeted review links';
      linksHeading.appendChild(linksStrong);
      card.appendChild(linksHeading);

      var linkList = document.createElement('ul');
      linkList.className = 'checklist';
      linkList.style.marginTop = '0';
      plan.remediation_links.forEach(function(link) {
        var item = document.createElement('li');
        var anchor = document.createElement('a');
        anchor.href = link.href;
        anchor.textContent = link.label;
        item.appendChild(anchor);
        linkList.appendChild(item);
      });
      card.appendChild(linkList);
    }

    var buttonRow = document.createElement('div');
    buttonRow.className = 'button-group';
    buttonRow.style.marginTop = 'var(--space-md)';

    var startBtn = document.createElement('button');
    startBtn.type = 'button';
    startBtn.className = 'btn btn--primary btn--sm';
    startBtn.textContent = 'Start Plan';

    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn--secondary btn--sm';
    copyBtn.textContent = 'Copy Plan';

    var status = document.createElement('p');
    status.style.marginTop = 'var(--space-sm)';
    status.style.color = 'var(--color-text-light)';
    status.style.fontSize = '0.9rem';

    var checkinWrap = document.createElement('div');
    checkinWrap.style.marginTop = 'var(--space-sm)';
    var checkinTitle = document.createElement('p');
    checkinTitle.style.margin = '0 0 var(--space-xs) 0';
    var checkinStrong = document.createElement('strong');
    checkinStrong.textContent = 'Quick check-in';
    checkinTitle.appendChild(checkinStrong);
    checkinTitle.appendChild(document.createTextNode(' (captures transfer evidence)'));
    checkinWrap.appendChild(checkinTitle);

    var checkinRow = document.createElement('div');
    checkinRow.style.display = 'flex';
    checkinRow.style.gap = 'var(--space-sm)';
    checkinRow.style.flexWrap = 'wrap';
    checkinRow.style.alignItems = 'end';

    var ratingLabel = document.createElement('label');
    ratingLabel.style.display = 'flex';
    ratingLabel.style.flexDirection = 'column';
    ratingLabel.style.gap = '4px';
    ratingLabel.style.minWidth = '140px';
    ratingLabel.textContent = 'Self-rating (1-5)';
    var ratingSelect = document.createElement('select');
    ratingSelect.className = 'quiz-plan-checkin-rating';
    ['', '1', '2', '3', '4', '5'].forEach(function(value, index) {
      var option = document.createElement('option');
      option.value = value;
      option.textContent = index === 0 ? 'Select' : value;
      ratingSelect.appendChild(option);
    });
    ratingLabel.appendChild(ratingSelect);
    checkinRow.appendChild(ratingLabel);

    var metricLabel = document.createElement('label');
    metricLabel.style.display = 'flex';
    metricLabel.style.flexDirection = 'column';
    metricLabel.style.gap = '4px';
    metricLabel.style.minWidth = '220px';
    metricLabel.textContent = 'Observable metric';
    var metricInput = document.createElement('input');
    metricInput.className = 'quiz-plan-checkin-metric';
    metricInput.type = 'text';
    metricInput.placeholder = 'ex: started within 10 min 3/4 days';
    metricLabel.appendChild(metricInput);
    checkinRow.appendChild(metricLabel);
    checkinWrap.appendChild(checkinRow);
    var checkinBtn = document.createElement('button');
    checkinBtn.type = 'button';
    checkinBtn.className = 'btn btn--secondary btn--sm';
    checkinBtn.style.marginTop = 'var(--space-xs)';
    checkinBtn.textContent = 'Complete Check-In';

    startBtn.addEventListener('click', function() {
      if (startBtn.disabled) return;
      startBtn.disabled = true;
      startBtn.textContent = 'Plan Started';
      status.textContent = 'Plan started. Recheck is scheduled and will appear in your learning flow.';
      updatePlanStatus(plan.plan_id, 'started');
      trackAssessmentEvent('practice_plan_started', {
        plan_id: plan.plan_id,
        source_tool: 'module_quiz',
        module_id: currentQuiz.id,
        started_at: new Date().toISOString()
      });
    });

    copyBtn.addEventListener('click', function() {
      var text = 'Focus: ' + plan.focus.title + '\n' +
        'Do today: ' + (plan.actions.today[0] || '') + '\n' +
        'Do this week: ' + (plan.actions.this_week[0] || '') + '\n' +
        'Re-check: ' + dueLabel;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
          status.textContent = 'Plan copied.';
        }).catch(function() {
          status.textContent = 'Copy unavailable on this browser.';
        });
      } else {
        status.textContent = 'Copy unavailable on this browser.';
      }
    });

    checkinBtn.addEventListener('click', function() {
      var ratingEl = checkinWrap.querySelector('.quiz-plan-checkin-rating');
      var metricEl = checkinWrap.querySelector('.quiz-plan-checkin-metric');
      var rating = Number(ratingEl && ratingEl.value ? ratingEl.value : 0);
      var metric = String(metricEl && metricEl.value || '').trim();
      if (!rating || !metric) {
        status.textContent = 'Add a 1-5 rating and one observable metric to complete the check-in.';
        return;
      }
      var checkinAt = completePlanCheckin(plan.plan_id, {
        self_rating: rating,
        metric_label: plan.recheck && plan.recheck.metric_type ? plan.recheck.metric_type : 'self_report',
        metric_value: metric
      });
      status.textContent = 'Check-in saved. Keep iterating and recheck on schedule.';
      trackAssessmentEvent('practice_checkin_completed', {
        plan_id: plan.plan_id,
        source_tool: 'module_quiz',
        module_id: currentQuiz.id,
        self_rating: rating,
        metric_label: plan.recheck && plan.recheck.metric_type ? plan.recheck.metric_type : 'self_report',
        metric_value: metric,
        completed_at: checkinAt
      });
    });

    buttonRow.appendChild(startBtn);
    buttonRow.appendChild(copyBtn);
    card.appendChild(buttonRow);
    card.appendChild(checkinWrap);
    card.appendChild(checkinBtn);
    card.appendChild(status);
    container.appendChild(card);
  }


  function renderGroupedRemediation(container) {
    if (!container || !currentQuiz || !quizData || !quizData.remediation_map) return;

    var missedQuestions = currentQuiz.data.questions.filter(function(question) {
      return userAnswers[question.id] !== question.correct;
    });
    if (!missedQuestions.length) return;

    var remediationMap = quizData.remediation_map || {};
    var grouped = {};

    missedQuestions.forEach(function(question) {
      var key = question.misconception_primary || question.misconception_secondary;
      if (!key || !remediationMap[key]) return;
      if (!grouped[key]) {
        grouped[key] = {
          count: 0,
          sampleQuestion: question,
          remediation: remediationMap[key]
        };
      }
      grouped[key].count += 1;
    });

    var rankedKeys = Object.keys(grouped).sort(function(a, b) {
      return grouped[b].count - grouped[a].count;
    });
    if (!rankedKeys.length) return;

    var wrap = document.createElement('section');
    wrap.className = 'card';
    wrap.style.marginTop = 'var(--space-lg)';
    wrap.style.borderLeft = '4px solid var(--color-accent)';

    var heading = document.createElement('h5');
    heading.style.marginTop = '0';
    heading.textContent = 'Targeted Remediation';
    wrap.appendChild(heading);

    var intro = document.createElement('p');
    intro.style.color = 'var(--color-text-light)';
    intro.textContent = 'Your missed items cluster around the patterns below. Review these first, then retake.';
    wrap.appendChild(intro);

    rankedKeys.slice(0, 2).forEach(function(key) {
      var item = grouped[key];
      var rem = item.remediation;
      var actions = rem.default_actions || [];

      var diffLevel = getMissedDifficultyLevel(missedQuestions, key);
      var ladder = rem.difficulty_ladder && rem.difficulty_ladder[diffLevel];
      var diffLabel = diffLevel === 'easy' ? 'Foundational' : (diffLevel === 'hard' ? 'Advanced' : 'Applied');
      var diffGuidance = ladder && ladder.guidance ? ladder.guidance : '';

      var section = document.createElement('div');
      section.style.marginTop = 'var(--space-md)';
      section.style.paddingTop = 'var(--space-sm)';
      section.style.borderTop = '1px solid var(--color-border)';

      var titleLine = document.createElement('p');
      titleLine.style.margin = '0 0 var(--space-xs) 0';
      var titleStrong = document.createElement('strong');
      titleStrong.textContent = rem.title;
      titleLine.appendChild(titleStrong);
      var meta = document.createElement('span');
      meta.style.color = 'var(--color-text-muted)';
      meta.style.fontSize = '0.9rem';
      meta.textContent = ' (' + item.count + ' missed · ' + diffLabel + ' level)';
      titleLine.appendChild(document.createTextNode(' '));
      titleLine.appendChild(meta);
      section.appendChild(titleLine);

      var summary = document.createElement('p');
      summary.style.margin = '0 0 var(--space-xs) 0';
      summary.style.color = 'var(--color-text-light)';
      summary.textContent = rem.summary;
      section.appendChild(summary);

      if (diffGuidance) {
        appendLabeledParagraph(section, 'Where to focus:', diffGuidance, { marginBottom: 'var(--space-xs)' });
      }
      if (actions[0]) {
        appendLabeledParagraph(section, 'Try next:', actions[0], { marginBottom: 'var(--space-xs)' });
      }
      if (rem.module_targets && rem.module_targets.length) {
        var linksList = document.createElement('ul');
        linksList.className = 'checklist';
        linksList.style.marginTop = '0';
        rem.module_targets.slice(0, 2).forEach(function(target) {
          var listItem = document.createElement('li');
          var anchor = document.createElement('a');
          anchor.href = target.href;
          anchor.textContent = target.label;
          listItem.appendChild(anchor);
          linksList.appendChild(listItem);
        });
        section.appendChild(linksList);
      }
      wrap.appendChild(section);
    });
    container.appendChild(wrap);
  }


  function saveReflectionEntry(entry) {
    var items = [];
    try { items = JSON.parse(localStorage.getItem(REFLECTION_STORAGE_KEY)) || []; } catch (e) { items = []; }
    items.push(entry);
    localStorage.setItem(REFLECTION_STORAGE_KEY, JSON.stringify(items.slice(-100)));
    if (window.EFI && window.EFI.Auth && typeof window.EFI.Auth.syncLearningLoopState === 'function') {
      window.EFI.Auth.syncLearningLoopState();
    }
  }

  function buildReflectionPrefill(plan) {
    if (!plan) return '';
    var lines = [];
    var focusTitle = plan.focus && plan.focus.title ? plan.focus.title : '';
    var todayAction = plan.actions && plan.actions.today && plan.actions.today[0] ? plan.actions.today[0] : '';
    var evidencePrompt = plan.actions && plan.actions.evidence_prompt ? plan.actions.evidence_prompt : '';
    var checkins = plan.state && Array.isArray(plan.state.checkins) ? plan.state.checkins : [];
    var lastCheckin = checkins.length > 0 ? checkins[checkins.length - 1] : null;

    if (focusTitle) { lines.push('Testing: ' + focusTitle); lines.push(''); }
    if (lastCheckin && lastCheckin.metric_value) {
      lines.push('Yesterday: ' + lastCheckin.metric_value);
    } else {
      lines.push('Yesterday: first attempt');
    }
    if (todayAction) { lines.push("Today I\u2019ll: " + todayAction); }
    if (evidencePrompt) { lines.push("I\u2019ll know it worked when: " + evidencePrompt); }
    return lines.join('\n');
  }

  function renderReflectionPrompt(container, context) {
    if (!container || !context) return;
    var plan = context.plan || null;
    if (!plan && context.plan_id) {
      var allPlans = readActionPlans();
      for (var i = 0; i < allPlans.length; i++) {
        if (allPlans[i] && allPlans[i].plan_id === context.plan_id) { plan = allPlans[i]; break; }
      }
    }
    var prefill = buildReflectionPrefill(plan);

    var card = document.createElement('section');
    card.className = 'card';
    card.style.marginTop = 'var(--space-md)';
    card.style.borderLeft = '4px solid var(--color-accent)';

    // Build prefill text from stored plan/reflection history
    var prefill = buildReflectionPrefill(context);

    var heading = document.createElement('h5');
    heading.style.marginTop = '0';
    heading.textContent = '48-Hour Reflection Prompt';
    card.appendChild(heading);

    var intro = document.createElement('p');
    intro.style.color = 'var(--color-text-light)';
    if (prefill) intro.style.fontSize = '0.9rem';
    intro.textContent = prefill
      ? 'Pre-filled from your recent plan history — edit or replace as needed.'
      : 'What will you test in the next 48 hours?';
    card.appendChild(intro);

    var input = document.createElement('textarea');
    input.id = 'quiz-reflection-input';
    input.rows = 4;
    input.style.width = '100%';
    input.style.padding = 'var(--space-sm)';
    input.style.border = '1px solid var(--color-border)';
    input.style.borderRadius = 'var(--border-radius)';
    input.style.fontFamily = 'inherit';
    input.style.lineHeight = '1.5';
    card.appendChild(input);

    var actions = document.createElement('div');
    actions.className = 'button-group';
    actions.style.marginTop = 'var(--space-sm)';
    var saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.id = 'quiz-reflection-save';
    saveBtn.className = 'btn btn--secondary btn--sm';
    saveBtn.textContent = 'Save Reflection';
    actions.appendChild(saveBtn);
    card.appendChild(actions);

    var status = document.createElement('p');
    status.id = 'quiz-reflection-status';
    status.style.marginTop = 'var(--space-xs)';
    status.style.fontSize = '0.9rem';
    status.style.color = 'var(--color-text-light)';
    card.appendChild(status);
    container.appendChild(card);

    if (input && prefill) { input.value = prefill; }
    if (!input || !saveBtn || !status) return;

    // Apply prefill
    if (prefill) {
      input.value = prefill;
      // Place cursor at end so learner can add to / replace the prefilled text
      input.setSelectionRange(input.value.length, input.value.length);
    }

    saveBtn.addEventListener('click', function () {
      var text = String(input.value || '').trim();
      if (!text) {
        status.textContent = 'Write one testable action before saving.';
        return;
      }
      var payload = {
        id: 'refl_' + Date.now(),
        source_tool: context.source_tool,
        plan_id: context.plan_id,
        module_id: context.module_id || '',
        reflection_48h: text,
        at: new Date().toISOString()
      };
      saveReflectionEntry(payload);
      trackAssessmentEvent('behavior_transfer_logged', {
        plan_id: context.plan_id,
        source_tool: context.source_tool,
        module_id: context.module_id || '',
        transfer_type: 'self_report',
        transfer_value: text,
        logged_at: payload.at
      });
      status.textContent = 'Reflection saved.';
    });
  }

  function getModuleIdFromPage() {
    var pathname = window.location.pathname;
    var match = pathname.match(/(module-\d+|module-[a-z-]+)/);
    if (match) return match[1];

    var container = document.getElementById('module-quiz');
    if (container && container.getAttribute('data-module-id')) {
      return container.getAttribute('data-module-id');
    }

    return null;
  }

  function getModuleNumber(moduleId) {
    var match = String(moduleId || '').match(/module-(\d+)/);
    return match ? match[1] : String(moduleId || '');
  }

  function isLoggedIn() {
    return !!(window.EFI && window.EFI.Auth && typeof window.EFI.Auth.isLoggedIn === 'function' && window.EFI.Auth.isLoggedIn());
  }

  function hydrateSavedAssessment(moduleId) {
    lastSavedResult = null;
    statusMessage = '';
    if (!window.EFI || !window.EFI.Auth || typeof window.EFI.Auth.getModuleAssessment !== 'function') return;
    lastSavedResult = window.EFI.Auth.getModuleAssessment(getModuleNumber(moduleId));
  }

  // #4  initializeQuiz — apply adaptive question selection before rendering
  function initializeQuiz(moduleId) {
    if (!quizData || !quizData.quizzes[moduleId]) return;

    var adherenceLevel = getAdherenceLevel();
    var rawQuestions = quizData.quizzes[moduleId].questions || [];
    var adaptedQuestions = selectAdaptiveQuestions(rawQuestions, adherenceLevel);

    // Clone the quiz data so we don't mutate the cached quizData object
    var quizDef = Object.assign({}, quizData.quizzes[moduleId], { questions: adaptedQuestions });

    currentQuiz = {
      id: moduleId,
      data: quizDef,
      currentQuestion: 0,
      adherenceLevel: adherenceLevel
    };

    // Record that this learner started a quiz session (not yet completed)
    recordAdherenceSession(moduleId, false);

    hydrateSavedAssessment(moduleId);
    renderQuizInterface(adherenceLevel);
    renderQuestion(0);
  }

  function renderSavedStatus(container) {
    if (!container) return;

    var box = document.createElement('div');
    box.id = 'quiz-save-status';
    box.style.marginTop = 'var(--space-md)';
    box.style.padding = 'var(--space-md)';
    box.style.borderRadius = 'var(--border-radius)';
    box.style.background = 'var(--color-bg-alt)';
    box.style.fontSize = '0.92rem';
    box.style.color = 'var(--color-text-light)';

    var message = '';
    if (lastSavedResult && typeof lastSavedResult.score === 'number') {
      var completedAt = lastSavedResult.completedAt ? new Date(lastSavedResult.completedAt).toLocaleString() : 'recently';
      message = (lastSavedResult.passed ? 'Saved pass' : 'Saved attempt') +
        ': ' + lastSavedResult.score + '% recorded on ' + completedAt + '.';
    } else if (isLoggedIn()) {
      message = 'Finish the test to save your score into this account and update course progress.';
    } else {
      message = 'Log in before finishing if you want this module result saved to your dashboard.';
    }

    if (statusMessage) {
      message += ' ' + statusMessage;
    }

    box.textContent = message;
    container.appendChild(box);
  }

  function updateSavedStatus() {
    var container = document.getElementById('module-quiz');
    if (!container) return;
    var existing = document.getElementById('quiz-save-status');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    renderSavedStatus(container);
  }

  // #4  renderQuizInterface — show adaptive intensity badge
  function renderQuizInterface(adherenceLevel) {
    var container = document.getElementById('module-quiz');
    if (!container) return;

    clearNode(container);

    var intensityLabels = {
      high: 'Focused review (high adherence — harder concepts, fewer questions)',
      medium: 'Standard practice',
      low: 'Reinforced practice (extra repetition mode)'
    };
    var intensityLabel = intensityLabels[adherenceLevel] || intensityLabels.medium;

    var header = document.createElement('div');
    header.className = 'module-quiz__header';
    var heading = document.createElement('h3');
    heading.style.marginBottom = 'var(--space-sm)';
    heading.textContent = 'Module Mastery Test';
    header.appendChild(heading);
    var intro = document.createElement('p');
    intro.style.margin = '0';
    intro.style.color = 'var(--color-text-light)';
    intro.style.fontSize = '0.9rem';
    intro.textContent = 'Finish this assessment to check for module mastery. Scores of ' + PASSING_SCORE + '% or higher save as passed progress when you are logged in.';
    header.appendChild(intro);
    var mode = document.createElement('p');
    mode.style.margin = 'var(--space-xs) 0 0 0';
    mode.style.fontSize = '0.82rem';
    mode.style.color = 'var(--color-text-muted)';
    mode.textContent = 'Practice mode: ' + intensityLabel;
    header.appendChild(mode);
    container.appendChild(header);
    renderSavedStatus(container);

    var questionsWrapper = document.createElement('div');
    questionsWrapper.className = 'module-quiz__questions';
    questionsWrapper.id = 'quiz-questions';
    container.appendChild(questionsWrapper);

    var controls = document.createElement('div');
    controls.className = 'module-quiz__controls';
    controls.style.marginTop = 'var(--space-xl)';
    controls.style.display = 'flex';
    controls.style.gap = 'var(--space-md)';
    controls.style.justifyContent = 'space-between';
    controls.style.flexWrap = 'wrap';

    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.id = 'quiz-prev-btn';
    prevBtn.className = 'btn btn--secondary btn--sm';
    prevBtn.textContent = '← Previous';
    prevBtn.addEventListener('click', function() { previousQuestion(); });
    controls.appendChild(prevBtn);

    var progress = document.createElement('span');
    progress.id = 'quiz-progress';
    progress.style.alignSelf = 'center';
    progress.style.color = 'var(--color-text-muted)';
    progress.style.fontSize = '0.9rem';
    controls.appendChild(progress);

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.id = 'quiz-next-btn';
    nextBtn.className = 'btn btn--primary btn--sm';
    nextBtn.textContent = 'Next →';
    nextBtn.addEventListener('click', function() { nextQuestion(); });
    controls.appendChild(nextBtn);

    container.appendChild(controls);

    var resultsSection = document.createElement('div');
    resultsSection.id = 'quiz-results';
    resultsSection.style.display = 'none';
    resultsSection.className = 'module-quiz__results';
    resultsSection.setAttribute('role', 'region');
    resultsSection.setAttribute('aria-live', 'polite');
    resultsSection.setAttribute('aria-label', 'Module quiz results');
    resultsSection.tabIndex = -1;
    resultsSection.style.marginTop = 'var(--space-xl)';
    resultsSection.style.padding = 'var(--space-lg)';
    resultsSection.style.background = 'var(--color-bg-alt)';
    resultsSection.style.borderRadius = 'var(--border-radius)';
    container.appendChild(resultsSection);
  }

  // #5  renderQuestion — activate ladder for wrong answers
  function renderQuestion(index) {
    if (!currentQuiz || !currentQuiz.data.questions[index]) return;

    var question = currentQuiz.data.questions[index];
    var container = document.getElementById('quiz-questions');
    if (!container) return;

    clearNode(container);

    var questionDiv = document.createElement('div');
    questionDiv.className = 'module-quiz__question';
    questionDiv.style.marginBottom = 'var(--space-xl)';

    var questionText = document.createElement('p');
    questionText.style.fontSize = '1.05rem';
    questionText.style.fontWeight = '600';
    questionText.style.marginBottom = 'var(--space-lg)';
    questionText.textContent = (index + 1) + '. ' + question.question;
    questionDiv.appendChild(questionText);

    var optionsDiv = document.createElement('div');
    optionsDiv.className = 'module-quiz__options';
    optionsDiv.style.display = 'flex';
    optionsDiv.style.flexDirection = 'column';
    optionsDiv.style.gap = 'var(--space-sm)';

    question.options.forEach(function(option, optionIndex) {
      var label = document.createElement('label');
      label.style.display = 'flex';
      label.style.gap = 'var(--space-sm)';
      label.style.padding = 'var(--space-sm) var(--space-md)';
      label.style.background = userAnswers[question.id] === optionIndex ? 'var(--color-accent-light)' : 'transparent';
      label.style.borderRadius = 'var(--border-radius)';
      label.style.cursor = 'pointer';
      label.style.transition = 'background 0.2s ease';

      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'question-' + question.id;
      input.value = optionIndex;
      input.checked = userAnswers[question.id] === optionIndex;
      input.addEventListener('change', function() {
        recordAnswer(question.id, optionIndex);
        Array.from(optionsDiv.querySelectorAll('label')).forEach(function(lbl, idx) {
          lbl.style.background = idx === optionIndex ? 'var(--color-accent-light)' : 'transparent';
        });
      });
      label.appendChild(input);

      var span = document.createElement('span');
      span.textContent = option;
      label.appendChild(span);

      optionsDiv.appendChild(label);
    });

    questionDiv.appendChild(optionsDiv);

    if (userAnswers[question.id] !== undefined) {
      var isCorrect = userAnswers[question.id] === question.correct;

      var explanationDiv = document.createElement('div');
      explanationDiv.className = 'module-quiz__explanation';
      explanationDiv.style.marginTop = 'var(--space-lg)';
      explanationDiv.style.padding = 'var(--space-md)';
      explanationDiv.style.background = isCorrect ? 'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)';
      explanationDiv.style.borderLeft = '4px solid ' + (isCorrect ? '#4CAF50' : '#2196F3');
      explanationDiv.style.borderRadius = 'var(--border-radius)';

      var labelEl = document.createElement('strong');
      labelEl.style.display = 'block';
      labelEl.style.marginBottom = 'var(--space-xs)';
      labelEl.textContent = isCorrect ? '✓ Correct!' : 'Learn More:';
      labelEl.style.color = isCorrect ? '#4CAF50' : '#2196F3';
      explanationDiv.appendChild(labelEl);

      var text = document.createElement('p');
      text.style.margin = '0';
      text.style.fontSize = '0.95rem';
      text.style.lineHeight = '1.5';
      text.textContent = question.explanation;
      explanationDiv.appendChild(text);

      questionDiv.appendChild(explanationDiv);

      // #5  If wrong, activate the misconception ladder
      if (!isCorrect) {
        var misconceptionKey = question.misconception_primary || question.misconception_secondary || '';
        if (misconceptionKey && MISCONCEPTION_LADDER[misconceptionKey]) {
          var ladderState = remediationLadderState[question.id];
          var alreadyResolved = ladderState && ladderState.resolved;
          if (!alreadyResolved) {
            renderRemediationLadderQuestion(questionDiv, question.id, misconceptionKey);
          }
        }
      }
    }

    container.appendChild(questionDiv);
    updateControls();
    updateProgress();
  }

  function recordAnswer(questionId, optionIndex) {
    userAnswers[questionId] = optionIndex;
  }

  function nextQuestion() {
    if (!currentQuiz) return;
    if (currentQuiz.currentQuestion < currentQuiz.data.questions.length - 1) {
      currentQuiz.currentQuestion++;
      renderQuestion(currentQuiz.currentQuestion);
    } else {
      showResults();
    }
  }

  function previousQuestion() {
    if (!currentQuiz) return;
    if (currentQuiz.currentQuestion > 0) {
      currentQuiz.currentQuestion--;
      renderQuestion(currentQuiz.currentQuestion);
    }
  }

  function updateControls() {
    if (!currentQuiz) return;
    var prevBtn = document.getElementById('quiz-prev-btn');
    var nextBtn = document.getElementById('quiz-next-btn');

    if (prevBtn) prevBtn.disabled = currentQuiz.currentQuestion === 0;
    if (nextBtn) {
      nextBtn.textContent = currentQuiz.currentQuestion === currentQuiz.data.questions.length - 1
        ? 'Show Results'
        : 'Next →';
    }
  }

  function updateProgress() {
    if (!currentQuiz) return;
    var progress = document.getElementById('quiz-progress');
    if (progress) {
      progress.textContent = (currentQuiz.currentQuestion + 1) + ' of ' + currentQuiz.data.questions.length;
    }
  }

  function persistResults(result) {
    statusMessage = '';
    if (!isLoggedIn()) {
      updateSavedStatus();
      return;
    }
    if (!window.EFI || !window.EFI.Auth || typeof window.EFI.Auth.recordModuleAssessment !== 'function') {
      updateSavedStatus();
      return;
    }

    var saved = window.EFI.Auth.recordModuleAssessment(getModuleNumber(result.moduleId), result);
    if (saved && saved.ok) {
      lastSavedResult = saved.assessment;
      statusMessage = result.passed
        ? 'Dashboard progress has been updated.'
        : 'Your dashboard now reflects this saved attempt.';
    } else if (saved && saved.error) {
      statusMessage = saved.error;
    }
    updateSavedStatus();
  }

  function showResults() {
    if (!currentQuiz) return;

    var correct = 0;
    currentQuiz.data.questions.forEach(function(question) {
      if (userAnswers[question.id] === question.correct) {
        correct++;
      }
    });

    var total = currentQuiz.data.questions.length;
    var percentage = Math.round((correct / total) * 100);
    var passed = percentage >= PASSING_SCORE;

    // #4  Record completed session so adherence improves over time
    recordAdherenceSession(currentQuiz.id, true);

    persistResults({
      moduleId: currentQuiz.id,
      correct: correct,
      total: total,
      score: percentage,
      passed: passed
    });

    var resultsDiv = document.getElementById('quiz-results');
    if (!resultsDiv) return;

    resultsDiv.style.display = 'block';
    clearNode(resultsDiv);

    var title = document.createElement('h4');
    title.style.marginBottom = 'var(--space-md)';
    title.textContent = 'Test Results';
    resultsDiv.appendChild(title);

    var scoreDiv = document.createElement('div');
    scoreDiv.style.fontSize = '1.1rem';
    scoreDiv.style.marginBottom = 'var(--space-md)';
    scoreDiv.style.lineHeight = '1.8';
    appendLabeledParagraph(scoreDiv, 'Score:', correct + ' of ' + total + ' (' + percentage + '%)');
    appendLabeledParagraph(scoreDiv, 'Status:', passed ? 'Passed' : 'Needs Retake');
    appendLabeledParagraph(scoreDiv, 'Feedback:', getResultsMessage(percentage));
    resultsDiv.appendChild(scoreDiv);

    var note = document.createElement('p');
    note.style.fontSize = '0.9rem';
    note.style.color = 'var(--color-text-light)';
    note.style.marginBottom = 'var(--space-md)';
    if (isLoggedIn()) {
      note.textContent = passed
        ? 'This passing score was saved to your account and now counts toward course completion.'
        : 'This attempt was saved to your account. Retake the test until you reach the passing score.';
    } else {
      note.textContent = 'This result was not saved because you are not logged in. Log in and retake the test to store progress.';
    }
    resultsDiv.appendChild(note);

    renderGroupedRemediation(resultsDiv);

    var plan = buildActionPlanPayload({
      moduleId: currentQuiz.id,
      correct: correct,
      total: total,
      score: percentage,
      passed: passed
    });
    var plans = readActionPlans();
    plans.push(plan);
    writeActionPlans(plans);
    trackAssessmentEvent('practice_plan_generated', {
      plan_id: plan.plan_id,
      source_tool: 'module_quiz',
      module_id: currentQuiz.id,
      source_context: plan.source_context,
      focus_key: plan.source_context.misconception_primary || 'general_reinforcement',
      cadence: plan.recheck.cadence,
      generated_at: plan.state.created_at
    });
    renderActionPlanCard(resultsDiv, plan);

    // #3  Reflection prompt with prefill
    renderReflectionPrompt(resultsDiv, {
      source_tool: 'module_quiz',
      plan_id: plan.plan_id,
      module_id: currentQuiz.id
    });

    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn btn--secondary btn--sm';
    resetBtn.textContent = 'Retake Test';
    resetBtn.addEventListener('click', function() { resetQuiz(); });
    resultsDiv.appendChild(resetBtn);

    var controls = document.querySelector('.module-quiz__controls');
    if (controls) controls.style.display = 'none';

    document.getElementById('quiz-questions').style.display = 'none';
    resultsDiv.focus();
  }

  function getResultsMessage(percentage) {
    if (percentage === 100) return 'Perfect! You have mastered this module.';
    if (percentage >= PASSING_SCORE) return 'Great work! You understand the key concepts and have passed this module test.';
    if (percentage >= 60) return 'Good effort. Review the explanations above to solidify your understanding.';
    return 'Keep studying. Read through the module again and retake the test.';
  }

  function resetQuiz() {
    userAnswers = {};
    remediationLadderState = {};
    currentQuiz.currentQuestion = 0;
    document.getElementById('quiz-results').style.display = 'none';
    document.getElementById('quiz-questions').style.display = 'block';
    document.querySelector('.module-quiz__controls').style.display = 'flex';
    renderQuestion(0);
    var firstOption = document.querySelector('#quiz-questions input[type="radio"]');
    if (firstOption) firstOption.focus();
  }

  document.addEventListener('DOMContentLoaded', function() {
    var container = document.getElementById('module-quiz');
    if (container) {
      loadQuizData();
    }
  });

  window.ModuleQuiz = {
    getScore: function() {
      if (!currentQuiz) return null;
      var correct = 0;
      currentQuiz.data.questions.forEach(function(question) {
        if (userAnswers[question.id] === question.correct) {
          correct++;
        }
      });
      return { correct: correct, total: currentQuiz.data.questions.length };
    },
    getPassingScore: function() {
      return PASSING_SCORE;
    },
    getAdherenceLevel: getAdherenceLevel
  };
})();

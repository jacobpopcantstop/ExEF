(function () {
  function clearNode(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function appendTextLink(container, item, className) {
    var link = document.createElement('a');
    link.href = item.href;
    if (item.external) {
      link.target = '_blank';
      link.rel = 'noopener';
    }
    if (className) link.className = className;
    link.textContent = item.label;
    container.appendChild(link);
    return link;
  }

  function buildHighlightTitle(titleText, badgeText) {
    var titleWrap = document.createElement('div');
    titleWrap.className = 'module-reading-highlight__title';
    var title = document.createElement('h3');
    title.style.marginBottom = '0';
    title.textContent = titleText;
    var badge = document.createElement('span');
    badge.className = 'module-reading-highlight__badge';
    badge.textContent = badgeText;
    titleWrap.appendChild(title);
    titleWrap.appendChild(badge);
    return titleWrap;
  }

  function buildChecklist(items, mapper) {
    var list = document.createElement('ul');
    list.className = 'checklist';
    list.style.marginTop = 'var(--space-md)';
    items.forEach(function (item) {
      var li = document.createElement('li');
      mapper(li, item);
      list.appendChild(li);
    });
    return list;
  }

  function appendInfoParagraph(container, text) {
    var p = document.createElement('p');
    p.style.marginTop = 'var(--space-sm)';
    p.style.color = 'var(--color-text-light)';
    p.textContent = text;
    container.appendChild(p);
    return p;
  }

  (function injectSectionCitationFootnotes() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (!/^module-(1|2|3|4|5|6)\.html$/.test(currentPage)) return;

    var citationsByPage = {
      'module-1.html': {
        'the neuropsychology of self-regulation': 'Citations: Barkley (1997), Barkley EF/SR Fact Sheet, Brown EF model summaries.',
        'the prefrontal cortex: the brain\'s ceo': 'Citations: Barkley (2012), Center on the Developing Child EF resources.'
      },
      'module-2.html': {
        'assessment protocols': 'Citations: ESQ-R psychometrics, Brown EF/A overview materials.',
        'the intake simulation': 'Citations: ICF competency language, scope-of-practice guardrails.'
      },
      'module-3.html': {
        'the coaching architecture': 'Citations: Dawson & Guare intervention logic, ICF core competency framework.',
        'ethics and boundaries': 'Citations: ICF Code of Ethics, EFI Scope of Practice policy.'
      },
      'module-4.html': {
        'applied methodologies': 'Citations: Ward/Jacobsen 360 Thinking resources, GDD implementation materials.',
        'time systems': 'Citations: Barkley time blindness education segments and temporal discounting literature.'
      },
      'module-5.html': {
        'time management across populations': 'Citations: Barkley temporal model, Ward visual time strategies, population-specific adaptation literature.',
        'task initiation: overcoming the "wall of awful"': 'Citations: initiation-friction coaching literature and applied ADHD practice frameworks.'
      },
      'module-6.html': {
        'professional ethics': 'Citations: ICF ethics code, EFI terms and scope policies.',
        'practice management': 'Citations: coaching operations templates and credential quality-control standards.'
      }
    };

    var map = citationsByPage[currentPage] || {};
    if (!Object.keys(map).length) return;

    function normalize(text) {
      return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
    }

    document.querySelectorAll('main section').forEach(function (section) {
      if (section.querySelector('.section-cite')) return;
      var heading = section.querySelector('h2');
      if (!heading) return;
      var key = normalize(heading.textContent);
      var note = map[key];
      if (!note) return;
      var cite = document.createElement('p');
      cite.className = 'section-cite';
      cite.textContent = note;
      heading.insertAdjacentElement('afterend', cite);
    });
  })();

  (function injectModuleReadingPanel() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var readingByModule = {
      'module-1.html': [
        { title: 'Barkley (2012): Executive Functions, What They Are', url: 'https://www.routledge.com/Executive-Functions-What-They-Are-How-They-Work-and-Why-They-Evolved/Barkley/p/book/9781462506965' },
        { title: 'Harvard Center on the Developing Child: InBrief', url: 'https://developingchild.harvard.edu/resources/inbrief-executive-function/' }
      ],
      'module-2.html': [
        { title: 'Dawson & Guare ESQ-R materials', url: 'resources.html#assessments' },
        { title: 'BRIEF-2 overview', url: 'https://www.parinc.com/Products/Pkey/39' }
      ],
      'module-3.html': [
        { title: 'Dawson & Guare coaching framework excerpts', url: 'resources.html#reading' },
        { title: 'ICF Core Competencies', url: 'https://coachingfederation.org/credentials-and-standards/core-competencies' }
      ],
      'module-4.html': [
        { title: 'Sarah Ward 360 Thinking tools', url: 'resources.html#tools' },
        { title: 'Time blindness and scaffolding talk', url: 'resources.html#video' }
      ],
      'module-5.html': [
        { title: 'Harvard EF skill-building guide', url: 'https://developingchild.harvard.edu/resource-guides/guide-executive-function/' },
        { title: 'Enhancing & Practicing EF Skills (paper)', url: 'Enhancing-and-Practicing-Executive-Function-Skills-with-Children-from-Infancy-to-Adolescence-1.pdf' }
      ],
      'module-6.html': [
        { title: 'ICF Code of Ethics', url: 'https://coachingfederation.org/ethics/code-of-ethics' },
        { title: 'Certification requirements and rubric', url: 'certification.html' }
      ]
    };

    var requiredReadings = readingByModule[currentPage];
    if (!requiredReadings) return;

    var moduleContainer = document.querySelector('main .container');
    var anchorSection = document.querySelector('main .cta-section') || document.querySelector('main section:last-of-type');
    if (!moduleContainer || !anchorSection || document.getElementById('module-reading-highlight')) return;

    var card = document.createElement('div');
    card.id = 'module-reading-highlight';
    card.className = 'card module-reading-highlight';
    card.appendChild(buildHighlightTitle('Required Further Reading', 'Required'));
    appendInfoParagraph(card, 'Complete these references before marking this module done. They are used by rubric-based grading and capstone evaluation.');
    card.appendChild(buildChecklist(requiredReadings, function (li, reading) {
      appendTextLink(li, {
        href: reading.url,
        label: reading.title,
        external: /^https?:/.test(reading.url)
      });
    }));
    var packetLink = appendTextLink(card, {
      href: 'resources.html#reading',
      label: 'Open Complete Reading Packet'
    }, 'btn btn--secondary btn--sm');
    packetLink.style.marginTop = 'var(--space-md)';

    anchorSection.parentNode.insertBefore(card, anchorSection);
  })();

  (function injectModuleCitationPanel() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var citationByModule = {
      'module-1.html': ['Barkley (2012)', 'Brown (2013)', 'Harvard Center on the Developing Child'],
      'module-2.html': ['Dawson & Guare ESQ-R', 'BRIEF-2 Technical Manual', 'Barkley Point-of-Performance principle'],
      'module-3.html': ['Dawson & Guare intervention framework', 'ICF Core Competencies'],
      'module-4.html': ['Ward & Jacobsen 360 Thinking', 'Temporal management literature'],
      'module-5.html': ['Harvard EF activities guide', 'ADHD/ASD coaching adaptations literature'],
      'module-6.html': ['ICF Code of Ethics', 'NBEFC guidance', 'Scope of practice resources']
    };
    var citations = citationByModule[currentPage];
    if (!citations || document.getElementById('module-citation-panel')) return;
    var anchorSection = document.querySelector('main .cta-section') || document.querySelector('main section:last-of-type');
    if (!anchorSection || !anchorSection.parentNode) return;
    var panel = document.createElement('div');
    panel.id = 'module-citation-panel';
    panel.className = 'card module-reading-highlight';
    panel.appendChild(buildHighlightTitle('Evidence & Citation Check', 'Reviewed'));
    appendInfoParagraph(panel, 'This module currently maps to the following foundational references:');
    panel.appendChild(buildChecklist(citations, function (li, item) {
      li.textContent = item;
    }));
    var citationsLink = appendTextLink(panel, {
      href: 'resources.html#reading',
      label: 'Open Reading Citations'
    }, 'btn btn--secondary btn--sm');
    citationsLink.style.marginTop = 'var(--space-md)';
    anchorSection.parentNode.insertBefore(panel, anchorSection);
  })();

  (function injectModuleAssessmentPreview() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var previewByModule = {
      'module-1.html': { test: 'Unit Test 1: Inhibition + Time Blindness', assignment: 'Assignment 1.1 Temporal Horizon Analysis' },
      'module-2.html': { test: 'Unit Test 2: Intake + Assessment Interpretation', assignment: 'Assignment 2.1 Intake Simulation Packet' },
      'module-3.html': { test: 'Unit Test 3: Coaching Architecture + Ethics', assignment: 'Assignment 3.1 Ethics & Competency Portfolio' },
      'module-4.html': { test: 'Unit Test 4: 360 Thinking + Time Systems', assignment: 'Assignment 4.1 Applied Method Integration' },
      'module-5.html': { test: 'Unit Test 5: Special Population Strategy Design', assignment: 'Assignment 5.1 Intervention Design Project' },
      'module-6.html': { test: 'Unit Test 6: Practice Ops + Credential Standards', assignment: 'Assignment 6.1 Launch Kit Capstone' }
    };

    var item = previewByModule[currentPage];
    if (!item || document.getElementById('module-assessment-preview')) return;
    var anchorSection = document.querySelector('main .cta-section') || document.querySelector('main section:last-of-type');
    if (!anchorSection || !anchorSection.parentNode) return;

    var panel = document.createElement('div');
    panel.id = 'module-assessment-preview';
    panel.className = 'card module-reading-highlight';
    panel.appendChild(buildHighlightTitle('Tests + Assignments Preview', 'Enrollment Required'));
    appendInfoParagraph(panel, 'This module includes one graded unit test and one applied assignment. Public pages show the framework; full assessment tools, scoring, and credential feedback unlock after paid enrollment.');
    panel.appendChild(buildChecklist([
      { label: 'Test Preview:', value: item.test },
      { label: 'Assignment Preview:', value: item.assignment }
    ], function (li, entry) {
      var strong = document.createElement('strong');
      strong.textContent = entry.label;
      li.appendChild(strong);
      li.appendChild(document.createTextNode(' ' + entry.value));
    }));
    var buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    buttonGroup.style.marginTop = 'var(--space-md)';
    appendTextLink(buttonGroup, { href: 'store.html', label: 'View Paid Path' }, 'btn btn--primary btn--sm');
    appendTextLink(buttonGroup, { href: 'store.html', label: 'View Certification Pricing' }, 'btn btn--secondary btn--sm');
    panel.appendChild(buttonGroup);
    anchorSection.parentNode.insertBefore(panel, anchorSection);
  })();

  (function injectModuleKnowledgeCheck() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var checks = {
      'module-1.html': {
        items: [
          {
            type: 'Recall',
            question: 'A learner can explain a plan but fails under time pressure and emotional friction. Which mechanism is MOST likely failing first in Barkley\'s sequence?',
            options: ['Lexical retrieval', 'Response inhibition under load', 'Long-term semantic memory', 'Phonological decoding'],
            answer: 1,
            rationale: 'In Barkley\'s model, inhibition failure under load prevents downstream use of self-talk, future simulation, and emotional modulation.'
          },
          {
            type: 'Apply',
            question: 'Which coaching move best externalizes the inhibition bottleneck?',
            options: ['Ask for higher confidence only', 'Add one external brake (timer/cue) before high-friction starts', 'Increase lecture time on neuroscience', 'Delay planning until motivation improves'],
            answer: 1,
            rationale: 'External brakes reduce reliance on internal inhibition and make starts more executable under load.'
          },
          {
            type: 'Discriminate',
            question: 'Which interpretation fits EF science best?',
            options: ['Inconsistent execution usually means low character', 'Execution variance can reflect regulation-load mismatch despite intact knowledge', 'If insight is present, performance must follow', 'Emotion is unrelated to EF'],
            answer: 1,
            rationale: 'Knowledge and execution can diverge when regulation systems are overloaded.'
          }
        ]
      },
      'module-2.html': {
        items: [
          {
            type: 'Recall',
            question: 'Which intake interpretation best distinguishes skill deficit from performance variability?',
            options: ['One low homework grade proves a global skill deficit', 'High-interest success with low-interest collapse suggests context-dependent performance failure', 'High IQ eliminates EF concerns', 'Parent report alone should override all other data'],
            answer: 1,
            rationale: 'Performance swings by context indicate regulation/load mismatch, not necessarily absent underlying skill knowledge.'
          },
          {
            type: 'Apply',
            question: 'Which intake note stays within coaching scope?',
            options: ['Likely ADHD diagnosis confirmed', 'Observed initiation breakdown across low-interest contexts; recommend coaching plan and referral if risk escalates', 'No need for collateral report', 'Diagnosis deferred until module completion'],
            answer: 1,
            rationale: 'Scope-safe notes describe observable patterns and referral logic without diagnostic claims.'
          },
          {
            type: 'Discriminate',
            question: 'What best represents Goodness of Fit?',
            options: ['Use the same intervention sequence for all clients', 'Match intervention to profile, values, and context constraints', 'Prioritize coach preference to maintain consistency', 'Focus only on deficits'],
            answer: 1,
            rationale: 'Goodness of Fit requires individualized alignment, not generic protocol application.'
          }
        ]
      },
      'module-3.html': {
        items: [
          {
            type: 'Recall',
            question: 'Which session design best reflects EF coaching rather than tutoring?',
            options: ['Content reteach -> worksheet correction -> score review', 'Goal definition -> execution plan -> friction review -> transfer rep in a second context', 'Lecture on motivation -> homework reminder', 'Open discussion with no measurable next action'],
            answer: 1,
            rationale: 'Coaching architecture emphasizes execution systems, monitoring, and transfer, not only content accuracy.'
          },
          {
            type: 'Apply',
            question: 'Which follow-up assignment best supports transfer?',
            options: ['Read one article and summarize', 'Run the same execution protocol in a second context and report outcome', 'Wait for confidence before trying', 'Repeat discussion notes only'],
            answer: 1,
            rationale: 'Transfer requires applying the protocol outside the original context and comparing outcomes.'
          },
          {
            type: 'Discriminate',
            question: 'Which statement best separates role boundaries?',
            options: ['Coach owns client implementation outcomes', 'Coach structures process; client owns execution between sessions', 'Coach should override values if strategy is effective', 'Coaching should avoid measurable next actions'],
            answer: 1,
            rationale: 'Clear role ownership supports alliance quality and accountability without dependency.'
          }
        ]
      },
      'module-4.html': {
        items: [
          {
            type: 'Recall',
            question: 'In Ward\'s framework, which sequence produces stronger prospective planning accuracy?',
            options: ['Get Ready -> Do -> Done', 'Done -> Do -> Get Ready', 'Do -> Done -> Reflect', 'Do -> Get Ready -> Done'],
            answer: 1,
            rationale: 'Done-first planning forces future-state representation before task sequencing and material prep.'
          },
          {
            type: 'Apply',
            question: 'Which intervention most directly lowers initiation friction?',
            options: ['Ask for stronger effort language', 'Break task into first visible action plus external cue', 'Add more reading before action', 'Delay start until ideal mood'],
            answer: 1,
            rationale: 'Initiation improves when activation energy is reduced via micro-steps and external supports.'
          },
          {
            type: 'Discriminate',
            question: 'Which planning move best supports execution transfer?',
            options: ['Longer plan documents', 'Explicit done-state + checkpoints + review loop', 'More reminders without plan changes', 'One-time motivation talk'],
            answer: 1,
            rationale: 'Transfer depends on clear done criteria and repeatable monitoring, not plan length alone.'
          }
        ]
      },
      'module-5.html': {
        items: [
          {
            type: 'Recall',
            question: 'A client underestimates task duration by ~2.5x across four weeks. What is the strongest intervention next step?',
            options: ['Ask for more effort and confidence', 'Apply a personalized correction factor to planning and validate with timed reps', 'Remove all timers to reduce anxiety', 'Switch goals weekly to maintain novelty'],
            answer: 1,
            rationale: 'Prediction-vs-actual data should directly calibrate future planning via correction multipliers and repeated measurement.'
          },
          {
            type: 'Apply',
            question: 'Which immediate protocol best supports task start?',
            options: ['Wait for motivation to rise naturally', 'Name blocker, pick first step, run 10-minute start sprint', 'Add penalty for non-completion first', 'Rewrite goals weekly'],
            answer: 1,
            rationale: 'A concrete start protocol converts friction insight into immediate behavior.'
          },
          {
            type: 'Discriminate',
            question: 'What indicates calibration is improving?',
            options: ['Higher confidence scores only', 'Reduced estimate-vs-actual drift over repeated entries', 'Fewer planned tasks per week', 'Longer planning sessions'],
            answer: 1,
            rationale: 'Improvement is measured by drift reduction in repeated timing data.'
          }
        ]
      },
      'module-6.html': {
        items: [
          {
            type: 'Recall',
            question: 'Which practice is most defensible in an ethics audit?',
            options: ['Promise diagnostic conclusions after ESQ-R review', 'Guarantee specific symptom outcomes in writing', 'Document scope boundaries, refer when risk exceeds coaching remit, and preserve consent records', 'Share full session content with parents without client agreement'],
            answer: 2,
            rationale: 'Ethical reliability depends on scope clarity, referral discipline, and documented consent/confidentiality controls.'
          },
          {
            type: 'Apply',
            question: 'A client discloses active safety risk. What is the best coaching response?',
            options: ['Continue normal session flow only', 'Pause coaching protocol and follow referral/escalation policy immediately', 'Collect more informal details before deciding', 'Keep disclosure fully confidential regardless risk'],
            answer: 1,
            rationale: 'Safety risk requires escalation/referral process, not routine coaching continuation.'
          },
          {
            type: 'Discriminate',
            question: 'Which claim is scope-safe marketing language?',
            options: ['Guaranteed symptom elimination', 'Non-diagnostic executive function coaching with evidence-informed implementation support', 'Clinical diagnosis included', 'Therapy replacement for all clients'],
            answer: 1,
            rationale: 'Scope-safe language avoids diagnosis/treatment claims while describing coaching value clearly.'
          }
        ]
      },
      'curriculum.html': {
        items: [
          {
            type: 'Recall',
            question: 'What unlocks graded tests, assignment review, and credential workflows?',
            options: ['Reading a single free article', 'Paid enrollment in certification services', 'Visiting the home page twice', 'Creating a community comment'],
            answer: 1,
            rationale: 'Core information is open, while graded assessments and credential review are part of paid certification services.'
          },
          {
            type: 'Apply',
            question: 'What is the best next step after finishing free curriculum content?',
            options: ['Assume competency is fully verified', 'Choose whether to continue self-study or enroll for graded implementation feedback', 'Skip module sequencing and jump to capstone claim', 'Ignore assignment rubrics'],
            answer: 1,
            rationale: 'The graded path adds verification and evaluator feedback beyond open study.'
          },
          {
            type: 'Discriminate',
            question: 'Which statement best describes EFI\'s model?',
            options: ['All value is behind paywall', 'Core learning is open; paid layer funds grading/credential workflows', 'No free resources exist', 'Credentialing is automatic after browsing'],
            answer: 1,
            rationale: 'EFI keeps core content open while charging for reviewed assessment and credential operations.'
          }
        ]
      }
    };

    var check = checks[currentPage];
    if (!check || !check.items || !check.items.length || document.getElementById('module-knowledge-check')) return;

    var anchor = document.getElementById('module-knowledge-check-anchor') || document.getElementById('module-assessment-preview');
    if (!anchor) {
      var sections = Array.prototype.slice.call(document.querySelectorAll('main section'));
      anchor = sections.find(function (section) {
        return /module navigation/i.test(section.textContent || '') || !!section.querySelector('a[href^="module-"]');
      }) || document.querySelector('main .cta-section') || document.querySelector('main section:last-of-type');
    }
    if (!anchor || !anchor.parentNode) return;

    var wrap = document.createElement('div');
    wrap.id = 'module-knowledge-check';
    wrap.className = 'card module-quiz';
    wrap.appendChild(buildHighlightTitle('Quick Knowledge Drill', '3 Questions'));
    appendInfoParagraph(wrap, 'Mixed recall, apply, and discriminate prompts. Answer all three to see your score and rationale.');

    check.items.forEach(function(item, idx) {
      var group = document.createElement('div');
      group.className = 'module-quiz__question-group';
      group.style.marginTop = 'var(--space-md)';

      var question = document.createElement('p');
      question.className = 'module-quiz__question';
      var strong = document.createElement('strong');
      strong.textContent = (idx + 1) + '. ' + item.type + ':';
      question.appendChild(strong);
      question.appendChild(document.createTextNode(' ' + item.question));
      group.appendChild(question);

      var options = document.createElement('div');
      options.className = 'module-quiz__options';
      item.options.forEach(function(option, optionIndex) {
        var label = document.createElement('label');
        label.className = 'module-quiz__option';
        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'knowledge-check-' + idx;
        input.value = String(optionIndex);
        var span = document.createElement('span');
        span.textContent = option;
        label.appendChild(input);
        label.appendChild(span);
        options.appendChild(label);
      });
      group.appendChild(options);
      wrap.appendChild(group);
    });

    var actions = document.createElement('div');
    actions.className = 'button-group';
    actions.style.marginTop = 'var(--space-md)';
    var submitButton = document.createElement('button');
    submitButton.type = 'button';
    submitButton.className = 'btn btn--secondary btn--sm';
    submitButton.id = 'knowledge-check-submit';
    submitButton.textContent = 'Check Answers';
    actions.appendChild(submitButton);
    appendTextLink(actions, { href: 'store.html', label: 'View Graded Path' }, 'btn btn--primary btn--sm');
    wrap.appendChild(actions);

    var resultBox = document.createElement('div');
    resultBox.id = 'knowledge-check-result';
    resultBox.setAttribute('aria-live', 'polite');
    wrap.appendChild(resultBox);
    anchor.parentNode.insertBefore(wrap, anchor);

    var submit = document.getElementById('knowledge-check-submit');
    var result = document.getElementById('knowledge-check-result');
    if (!submit || !result) return;

    submit.addEventListener('click', function () {
      var unanswered = [];
      var correctCount = 0;
      var feedbackEntries = [];

      check.items.forEach(function(item, idx) {
        var selected = wrap.querySelector('input[name="knowledge-check-' + idx + '"]:checked');
        if (!selected) {
          unanswered.push(idx + 1);
          return;
        }
        var chosen = Number(selected.value);
        var correct = chosen === item.answer;
        if (correct) correctCount += 1;
        feedbackEntries.push({
          label: 'Q' + (idx + 1) + ':',
          message: (correct ? '✅ Correct. ' : '❌ Not quite. ') + item.rationale
        });
      });

      if (unanswered.length) {
        result.className = 'module-quiz__result module-quiz__result--no';
        result.textContent = 'Answer all three questions before submitting. Missing: ' + unanswered.join(', ') + '.';
        return;
      }

      var scorePct = Math.round((correctCount / check.items.length) * 100);
      var passed = correctCount >= 2;
      result.className = 'module-quiz__result ' + (passed ? 'module-quiz__result--ok' : 'module-quiz__result--no');
      clearNode(result);
      var scoreLine = document.createElement('p');
      scoreLine.style.margin = '0 0 var(--space-xs) 0';
      var scoreStrong = document.createElement('strong');
      scoreStrong.textContent = 'Score:';
      scoreLine.appendChild(scoreStrong);
      scoreLine.appendChild(document.createTextNode(' ' + correctCount + ' / ' + check.items.length + ' (' + scorePct + '%)'));
      result.appendChild(scoreLine);
      var summaryLine = document.createElement('p');
      summaryLine.style.margin = '0 0 var(--space-sm) 0';
      summaryLine.textContent = passed ? 'Strong understanding. Continue to applied assignments.' : 'Review module highlights, then retake this drill.';
      result.appendChild(summaryLine);
      var feedbackWrap = document.createElement('div');
      feedbackWrap.style.marginTop = 'var(--space-sm)';
      feedbackEntries.forEach(function (entry) {
        var p = document.createElement('p');
        p.style.margin = '0 0 var(--space-xs) 0';
        var label = document.createElement('strong');
        label.textContent = entry.label;
        p.appendChild(label);
        p.appendChild(document.createTextNode(' ' + entry.message));
        feedbackWrap.appendChild(p);
      });
      result.appendChild(feedbackWrap);

      try {
        localStorage.setItem('efi_quiz_' + currentPage, JSON.stringify({
          correct: correctCount,
          total: check.items.length,
          score: scorePct,
          passed: passed,
          at: new Date().toISOString()
        }));
      } catch (e) {}
    });
  })();

  (function injectLearnMorePanels() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (!/^module-|^curriculum\.html$/.test(currentPage)) return;
    var deepDives = {
      'module-b-pedagogy.html': [
        { match: ['planning'], text: 'Planning-first protocols reduce cognitive switching cost and make error sources visible before execution starts.', links: [{ href: 'module-4.html', label: 'Applied Methods' }, { href: 'https://www.smartbutscatteredkids.com/resources/esq-r-self-report-assessment-tool/', label: 'ESQ-R Framework' }] },
        { match: ['reflection'], text: 'Prompted reflection is a metacognitive training loop: identify breakdown point, isolate friction variable, and define the next behavior test.', links: [{ href: 'module-3.html', label: 'Coaching Framework' }, { href: 'https://coachingfederation.org/credentials-and-standards/core-competencies', label: 'ICF Core Competencies' }] },
        { match: ['transfer'], text: 'Transfer fails when success is context-bound. Second-context reps with reduced prompting are required to build independent execution.', links: [{ href: 'module-4.html', label: 'Applied Methodologies' }, { href: 'open-ef-resources-directory.html#citations', label: 'Citations' }] },
        { match: ['template'], text: 'Session templates are decision scaffolds: fixed block timing reduces drift and preserves coaching focus on execution rather than topic drift.', links: [{ href: 'resources.html#forms', label: 'Template Library' }, { href: 'module-6.html', label: 'Professional Practice' }] },
        { match: ['implementation'], text: 'Wrapping content tutoring inside pre-plan and post-adaptation loops converts one-time compliance into repeatable self-management.', links: [{ href: 'scope-of-practice.html', label: 'Scope Guidance' }, { href: 'certification.html', label: 'Certification Standards' }] }
      ],
      'module-c-interventions.html': [
        { match: ['backward'], text: 'Backward planning improves reliability by externalizing dependency chains and exposing hidden prep work before deadline pressure spikes.', links: [{ href: 'module-4.html', label: 'Time Systems' }, { href: 'resources.html#forms', label: 'Planning Templates' }] },
        { match: ['time blindness'], text: 'Time blindness interventions work best when elapsed time is made visible and correction factors are rehearsed against real task data.', links: [{ href: 'module-5.html', label: 'Prediction Calibration' }, { href: 'open-ef-resources-directory.html#citations', label: 'Cited Sources' }] },
        { match: ['metacognitive'], text: 'Metacognitive prompts should target plan quality, derail detection, and recovery procedure rather than general encouragement.', links: [{ href: 'module-3.html', label: 'Coaching Prompts' }, { href: 'resources.html#reading', label: 'Prompt References' }] }
      ],
      'module-1.html': [
        { match: ['inhibition'], text: 'Inhibition enables temporal self-control by delaying immediate response so working memory and self-directed speech can engage.', links: [{ href: 'https://pubmed.ncbi.nlm.nih.gov/9000892/', label: 'Barkley 1997' }, { href: 'barkley-model-guide.html', label: 'Model Guide' }] },
        { match: ['time blindness'], text: 'Temporal discounting compresses future consequence salience, which is why near-term cues dominate behavior under EF strain.', links: [{ href: 'https://www.youtube.com/watch?v=wmV8HQUuPEk', label: 'Barkley Time Blindness Segment' }, { href: 'module-5.html', label: 'Applied Interventions' }] },
        { match: ['prefrontal'], text: 'PFC development is prolonged, so environmental supports are compensatory design features, not shortcuts.', links: [{ href: 'module-1.html', label: 'Module 1' }, { href: 'open-ef-resources-directory.html#citations', label: 'Citations' }] }
      ],
      'module-2.html': [
        { match: ['intake'], text: 'A strong intake triangulates self-report, collateral patterns, and context variance to avoid over- or under-identification.', links: [{ href: 'resources.html#assessment', label: 'Assessment Tools' }, { href: 'brown-clusters-tool.html', label: 'Brown Clusters Tool' }] },
        { match: ['esq-r'], text: 'ESQ-R profiles are most actionable when translated into two-week behavior targets with observable completion criteria.', links: [{ href: 'Conv17-305-dawson-executive-skills-questionnaire.pdf', label: 'ESQ-R PDF' }, { href: 'dashboard.html', label: 'Dashboard Tracking' }] },
        { match: ['brief'], text: 'Rating-scale interpretation should prioritize cross-setting discrepancies and function-level bottlenecks, not single-score labels.', links: [{ href: 'resources.html#reading', label: 'Reading Packets' }, { href: 'module-3.html', label: 'Coaching Architecture' }] }
      ],
      'module-3.html': [
        { match: ['alliance'], text: 'Alliance quality predicts adherence: collaboratively framed goals outperform directive compliance-based planning.', links: [{ href: 'scope-of-practice.html', label: 'Scope + Alliance Boundaries' }, { href: 'https://coachingfederation.org/credentials-and-standards/core-competencies', label: 'ICF Core Competencies' }] },
        { match: ['goals'], text: 'Goal quality improves when targets are behavior-specific, time-bounded, and tied to environmental trigger design.', links: [{ href: 'teacher-to-coach.html', label: 'Educator Path' }, { href: 'resources.html#forms', label: 'Template Forms' }] },
        { match: ['ethics'], text: 'Scope-safe coaching requires explicit referral thresholds and documentation discipline in every high-risk context.', links: [{ href: 'module-6.html', label: 'Professional Practice' }, { href: 'terms.html', label: 'Terms + Delivery Model' }] }
      ],
      'module-4.html': [
        { match: ['get ready'], text: 'GDD is a prospective sequencing scaffold: define final-state fidelity first, then derive execution operations and setup constraints.', links: [{ href: 'https://www.efpractice.com/getreadydodone', label: 'Get Ready Do Done' }, { href: 'ward-360-thinking.html', label: 'Ward 360 Thinking' }] },
        { match: ['clock'], text: 'Analog visual time cues convert abstract duration into spatial volume, reducing temporal estimation error.', links: [{ href: 'module-5.html', label: 'Time Correction Practice' }, { href: 'resources.html#forms', label: 'Visual Clock Tools' }] },
        { match: ['offload'], text: 'Cognitive offloading should be placed at point-of-performance to reduce working-memory leakage during transitions.', links: [{ href: 'module-4.html', label: 'Applied Methods' }, { href: 'resources.html#forms', label: 'Offloading Templates' }] }
      ],
      'module-5.html': [
        { match: ['task initiation'], text: 'Initiation breakdown is often affective friction, so treatment should lower activation energy before demanding persistence.', links: [{ href: 'module-3.html', label: 'Coaching Framework' }, { href: 'resources.html#reading', label: 'Applied Readings' }] },
        { match: ['prediction'], text: 'Prediction-error tracking yields individualized correction factors that materially improve planning realism.', links: [{ href: 'images/time-correction-chart.svg', label: 'Time Correction Chart' }, { href: 'module-4.html', label: 'Method Foundations' }] },
        { match: ['special populations'], text: 'Population adaptations should preserve EF principles while adjusting pacing, language, and sensory/context load.', links: [{ href: 'resources.html', label: 'Resource Hub' }, { href: 'scope-of-practice.html', label: 'Scope Boundaries' }] }
      ],
      'module-6.html': [
        { match: ['ethics'], text: 'Ethics implementation depends on process reliability: consent capture, documentation quality, and repeatable referral standards.', links: [{ href: 'certification.html', label: 'Certification QA' }, { href: 'terms.html', label: 'Terms' }] },
        { match: ['practice'], text: 'Practice systems should separate delivery quality metrics from commercial metrics to avoid scope drift and over-promising.', links: [{ href: 'teacher-to-coach.html', label: 'Business Path' }, { href: 'accreditation.html', label: 'Alignment Status' }] },
        { match: ['launch'], text: 'Launch readiness is demonstrated by operational consistency: intake-to-feedback workflow, retention plan, and policy hygiene.', links: [{ href: 'launch-plan.html', label: '90-Day Launch Plan' }, { href: 'dashboard.html', label: 'Dashboard Workflow' }] }
      ],
      'curriculum.html': [
        { match: ['module 1'], text: 'Module sequence is dependency-aware: theory precedes assessment, then coaching architecture, then interventions and professional operations.', links: [{ href: 'module-1.html', label: 'Module 1' }, { href: 'module-2.html', label: 'Module 2' }] },
        { match: ['assignment'], text: 'Assignments are designed as skill transfer tests, not content recitation: plan quality and execution consistency are weighted heavily.', links: [{ href: 'certification.html', label: 'Rubrics + Capstone' }, { href: 'store.html', label: 'Graded Services' }] },
        { match: ['free'], text: 'Open information reduces access barriers, while paid layers fund grading, credential verification, and reviewed performance feedback.', links: [{ href: 'resources.html', label: 'Free Resources' }, { href: 'index.html#start-paths', label: 'Homepage Start Paths' }] }
      ],
      'module-a-neuroscience.html': [
        { match: ['prefrontal'], text: 'PFC-dependent regulation is highly load-sensitive, which is why performance drops under stress despite intact conceptual understanding.', links: [{ href: 'https://pubmed.ncbi.nlm.nih.gov/9000892/', label: 'Barkley 1997' }, { href: 'open-ef-resources-directory.html#citations', label: 'Source Hub' }] },
        { match: ['inhibition'], text: 'Inhibition operates as a gating process that protects future-oriented goal models from interference by immediate cues.', links: [{ href: 'https://www.russellbarkley.org/factsheets/ADHD_EF_and_SR.pdf', label: 'Barkley EF/SR Fact Sheet' }, { href: 'barkley-model-guide.html', label: 'Barkley Guide' }] },
        { match: ['coaching'], text: 'Coaching translates neuroscience by externalizing planning and memory demands so execution does not depend on internal load alone.', links: [{ href: 'module-3.html', label: 'Coaching Architecture' }, { href: 'module-4.html', label: 'Applied Methods' }] }
      ]
    };

    var fallback = {
      text: 'Deeper technical note: map each tactic to mechanism (inhibition, working memory, emotional regulation, or prospective sequencing) before applying it in practice.',
      links: [{ href: 'open-ef-resources-directory.html#citations', label: 'Citations' }, { href: 'certification.html', label: 'Rubric Standards' }]
    };

    var sectionDeepDives = {
      'module-1.html': {
        'the theoretical foundation': {
          text: 'Action step: before reading further, write one sentence describing what you currently believe executive functioning IS. Revisit it after finishing this module to measure how your understanding shifted.',
          links: [{ href: 'about.html#models', label: 'Model Foundations' }, { href: 'resources.html#reading', label: 'Reading Packets' }]
        },
        'the neurobiology of the "air traffic control" system': {
          text: 'Action step: in your next intake, ask the client to identify one recurring "air traffic jam" moment each day, then map it to a specific control-tower support (visual cue, timer, checklist, or pre-commitment).',
          links: [{ href: 'module-1.html', label: 'Module 1' }, { href: 'resources.html#forms', label: 'Implementation Forms' }]
        },
        'the barkley model: inhibition as the keystone': {
          text: 'Action step: require every intervention to name the inhibition bottleneck first ("what impulse is winning?"), then pair one external brake with one follow-through cue.',
          links: [{ href: 'barkley-model-guide.html', label: 'Barkley Guide' }, { href: 'certification.html#transparency-rubric', label: 'Rubric Standards' }]
        },
        'from deficit model to cognitive accessibility': {
          text: 'Action step: audit one client environment (classroom, office, or home workspace) for unnecessary cognitive load, then propose two UDL-aligned modifications that reduce EF demand for everyone, not just the client.',
          links: [{ href: 'module-3.html', label: 'Environment Modifications' }, { href: 'open-ef-resources-directory.html', label: 'Open Resources' }]
        },
        'the brown model: six clusters of cognitive management': {
          text: 'Action step: use one cluster label per week in client language (Activation, Focus, Effort, Emotion, Memory, Action) and collect one real-world example to normalize variability.',
          links: [{ href: 'brown-clusters-tool.html', label: 'Brown Clusters Tool' }, { href: 'open-ef-resources-directory.html#citations', label: 'Primary Sources' }]
        },
        'the evolutionary perspective: public to private': {
          text: 'Action step: observe one child or adolescent client for signs of "public self-regulation" (talking through steps aloud, counting on fingers) and frame these as developmental strengths rather than immature behaviors.',
          links: [{ href: 'module-5.html', label: 'Special Populations' }, { href: 'about.html#models', label: 'Theoretical Models' }]
        },
        'unit summary': {
          text: 'Action step: write a one-paragraph "elevator pitch" that explains executive functioning to a skeptical parent using language from at least two of the four models covered in this module.',
          links: [{ href: 'module-2.html', label: 'Next: Assessment' }, { href: 'curriculum.html', label: 'Full Curriculum' }]
        },
        'module 1 assignment': {
          text: 'Action step: draft the three interventions first, then write the analysis around them. This prevents theory-only submissions and increases pass reliability.',
          links: [{ href: 'certification.html#transparency-rubric', label: 'Pass Criteria' }, { href: 'resources.html#forms', label: 'Templates' }]
        },
        'go deeper with free foundational sources': {
          text: 'Action step: read at least one primary source from Barkley and one from Brown before starting Module 2. Primary sources build assessment credibility that summaries alone cannot.',
          links: [{ href: 'further-sources.html', label: 'Full Source Directory' }, { href: 'open-ef-resources-directory.html', label: 'Open Resources' }]
        }
      },
      'module-2.html': {
        'module overview': {
          text: 'Action step: before learning intake tools, list three assumptions you currently make about new clients in the first 10 minutes. This module will challenge whether those assumptions are data-grounded.',
          links: [{ href: 'module-1.html', label: 'Prerequisites: Module 1' }, { href: 'curriculum.html', label: 'Full Curriculum' }]
        },
        'the intake architecture': {
          text: 'Action step: run intake in three passes: (1) presenting pain point, (2) context map by setting/time, (3) first 2-week behavior target with observable completion criteria.',
          links: [{ href: 'resources.html#assessment', label: 'Assessment Toolkit' }, { href: 'module-3.html', label: 'Coaching Architecture' }]
        },
        'the executive skills questionnaire (esq-r)': {
          text: 'Action step: convert top-2 weak ESQ domains into one "start behavior" each (under 3 minutes) and one weekly review metric in dashboard.',
          links: [{ href: 'esqr.html', label: 'Interactive ESQ-R' }, { href: 'dashboard.html', label: 'Progress Dashboard' }]
        },
        'the "point of performance" audit': {
          text: 'Action step: photograph or sketch the real execution environment and mark friction points in order of failure frequency before assigning new skills.',
          links: [{ href: 'module-4.html', label: 'Applied Methods' }, { href: 'resources.html#forms', label: 'Audit Templates' }]
        },
        'assessment across real support environments': {
          text: 'Action step: compare your client\u2019s performance data across at least two environments (home vs. work, or classroom vs. after-school) to identify context-dependent strengths that pure self-report misses.',
          links: [{ href: 'brown-clusters-tool.html', label: 'Cluster Analysis' }, { href: 'free-executive-functioning-tests.html', label: 'Assessment Hub' }]
        },
        'module 2 assignment': {
          text: 'Action step: include one discrepancy paragraph (self-report vs observer report) and the exact follow-up question you would use to resolve it.',
          links: [{ href: 'certification.html#transparency-rubric', label: 'Rubric Expectations' }, { href: 'scope-of-practice.html', label: 'Scope Guardrails' }]
        },
        'required readings & viewings': {
          text: 'Action step: while reading, highlight one passage per source that you could quote verbatim to a parent or teacher to explain an assessment finding. Building a citation habit strengthens professional credibility.',
          links: [{ href: 'further-sources.html', label: 'Source Directory' }, { href: 'open-ef-resources-directory.html', label: 'Open Resources' }]
        }
      },
      'module-3.html': {
        'module overview': {
          text: 'Action step: before reading, write down how you currently structure a coaching session. After finishing this module, compare your process to the Dawson & Guare architecture and note what you would change.',
          links: [{ href: 'module-2.html', label: 'Prerequisites: Assessment' }, { href: 'curriculum.html', label: 'Full Curriculum' }]
        },
        'the two-tiered intervention logic': {
          text: 'Action step: always deploy one environment change before any motivation coaching. If behavior improves, you found a design issue not a character issue.',
          links: [{ href: 'module-4.html', label: 'Applied Methods' }, { href: 'resources.html#forms', label: 'Environment Tools' }]
        },
        'the coach as "external frontal lobe"': {
          text: 'Action step: use a fade plan from day one: full prompts -> partial prompts -> self-prompt script -> independent check-in.',
          links: [{ href: 'module-6.html', label: 'Practice Ops' }, { href: 'certification.html', label: 'Certification Workflow' }]
        },
        'icf core competencies in the ef context': {
          text: 'Action step: record one session (with consent) and score yourself against three ICF competencies. Identify the one where EF-specific demands differ most from general life coaching.',
          links: [{ href: 'accreditation.html', label: 'Standards Alignment' }, { href: 'scope-of-practice.html', label: 'Scope Policy' }]
        },
        'how the coaching architecture shows up in real systems': {
          text: 'Action step: interview one professional who uses structured coaching (school counselor, behavior specialist, or occupational therapist) about their session flow and compare it to the EFI architecture.',
          links: [{ href: 'coach-directory.html', label: 'Coach Directory' }, { href: 'community.html', label: 'Community Hub' }]
        },
        'the coaching cycle & smart goals': {
          text: 'Action step: every SMART goal should include a trigger ("when X happens"), a start behavior, and a recovery behavior if derailed.',
          links: [{ href: 'resources.html#forms', label: 'Goal Templates' }, { href: 'teacher-to-coach.html', label: 'Educator Path' }]
        },
        'module 3 assignment': {
          text: 'Action step: include one explicit referral threshold sentence in your submission to show scope discipline under risk.',
          links: [{ href: 'scope-of-practice.html', label: 'Referral Boundaries' }, { href: 'terms.html', label: 'Service Terms' }]
        },
        'implementation models and coaching systems': {
          text: 'Action step: pick one real implementation model from this section and draft a one-page adaptation plan for your specific coaching context (school, private practice, or organizational).',
          links: [{ href: 'teacher-to-coach.html', label: 'Educator Path' }, { href: 'module-6.html', label: 'Practice Management' }]
        }
      },
      'module-4.html': {
        'module overview': {
          text: 'Action step: list three tasks your client failed at last week. For each, identify whether the breakdown was in planning (Get Ready), execution (Do), or completion verification (Done).',
          links: [{ href: 'module-3.html', label: 'Coaching Architecture' }, { href: 'curriculum.html', label: 'Full Curriculum' }]
        },
        '360 thinking: "get ready, do, done"': {
          text: 'Action step: require clients to show the "Done" artifact first (photo, checklist, sample output) before planning steps.',
          links: [{ href: 'ward-360-thinking.html', label: '360 Thinking Hub' }, { href: 'resources.html#forms', label: 'Planning Mats' }]
        },
        'temporal management: curing "time blindness"': {
          text: 'Action step: capture predicted time vs actual time for 5 similar tasks; set correction factor and apply it to next week\'s calendar blocks.',
          links: [{ href: 'images/time-correction-chart.svg', label: 'Correction Chart' }, { href: 'module-5.html', label: 'Applied Calibration' }]
        },
        'cognitive offloading': {
          text: 'Action step: place offload tools where failure happens (doorway, desk, phone lock screen), not where planning happens.',
          links: [{ href: 'module-4.html', label: 'Applied Methods' }, { href: 'resources.html#forms', label: 'Offload Tools' }]
        },
        'from technique to daily operating system': {
          text: 'Action step: take one technique from this module and embed it into your client\u2019s existing daily routine (morning alarm, lunch break, bedtime) rather than adding a new standalone habit.',
          links: [{ href: 'module-5.html', label: 'Population Adaptations' }, { href: 'resources.html#forms', label: 'Routine Templates' }]
        },
        'unit summary': {
          text: 'Action step: choose one tool from each bucket (planning, timing, offload) and run a 14-day implementation sprint with weekly review notes.',
          links: [{ href: 'dashboard.html', label: 'Track Outcomes' }, { href: 'certification.html', label: 'Submission Pipeline' }]
        },
        'practical tools for planning and offloading': {
          text: 'Action step: download or bookmark two tools from this section and test them on your own task management for one week before introducing them to a client.',
          links: [{ href: 'resources.html#forms', label: 'Tool Library' }, { href: 'ward-360-thinking.html', label: '360 Thinking Hub' }]
        }
      },
      'module-6.html': {
        'module overview': {
          text: 'Action step: write down your three biggest anxieties about starting a coaching practice. This module addresses each one with systems, not reassurance.',
          links: [{ href: 'module-5.html', label: 'Prerequisites: Interventions' }, { href: 'curriculum.html', label: 'Full Curriculum' }]
        },
        'professional ethics & scope of practice': {
          text: 'Action step: include a standing script for "this is outside coaching scope" and document referral pathways before client load grows.',
          links: [{ href: 'scope-of-practice.html', label: 'Scope Policy' }, { href: 'accreditation.html', label: 'Standards Status' }]
        },
        'building your coaching business': {
          text: 'Action step: separate service delivery SOPs from sales SOPs so quality controls are not compromised by revenue pressure.',
          links: [{ href: 'teacher-to-coach.html', label: 'Business Path' }, { href: 'store.html', label: 'Service Structure' }]
        },
        'open digital prosthetics and assistive tools': {
          text: 'Action step: test three free digital tools from this section on your own workflow for one week. Recommending tools you have not personally used undermines coaching credibility.',
          links: [{ href: 'resources.html', label: 'Resource Hub' }, { href: 'open-ef-resources-directory.html', label: 'Open Directory' }]
        },
        'legal & administrative infrastructure': {
          text: 'Action step: finalize refund language, consent capture, and documentation retention workflow before onboarding paid clients.',
          links: [{ href: 'terms.html', label: 'Terms' }, { href: 'privacy.html', label: 'Privacy' }]
        },
        'your professional toolkit': {
          text: 'Action step: customize the launch kit docs with your actual niche and session cadence, then run one pilot client from intake to review.',
          links: [{ href: 'curriculum.html', label: 'Launch Kit Preview' }, { href: 'store.html', label: 'Paid Path' }]
        },
        'modern tooling and open practice infrastructure': {
          text: 'Action step: set up one practice management tool (scheduling, invoicing, or session notes) this week. Infrastructure debt compounds once clients start booking.',
          links: [{ href: 'launch-plan.html', label: '90-Day Launch Plan' }, { href: 'store.html', label: 'Pricing Reference' }]
        },
        'module 6 assignment': {
          text: 'Action step: build your Launch Kit using real business details, not hypothetical ones. Graders score higher when niche language, pricing, and service terms reflect genuine market research.',
          links: [{ href: 'certification.html#transparency-rubric', label: 'Capstone Rubric' }, { href: 'gap-analyzer.html', label: 'Skills Gap Analyzer' }]
        }
      },
      'curriculum.html': {
        'complete curriculum overview': {
          text: 'Action step: treat modules as dependencies, not electives. Complete in order to prevent intervention planning before mechanism mastery.',
          links: [{ href: 'module-1.html', label: 'Module 1' }, { href: 'module-2.html', label: 'Module 2' }]
        },
        'what you actually receive in the launch kit': {
          text: 'Action step: use the file list as a build checklist; mark each asset as drafted, tested, and production-ready before certification submission.',
          links: [{ href: 'certification.html', label: 'Capstone + Rubric' }, { href: 'resources.html#forms', label: 'Forms Library' }]
        },
        'theoretical models at a glance': {
          text: 'Action step: choose Barkley for mechanism explanation, Brown for symptom variability explanation, Dawson/Guare for intervention targeting.',
          links: [{ href: 'barkley-vs-brown.html', label: 'Model Comparison' }, { href: 'about.html#models', label: 'Model Foundations' }]
        }
      },
      'module-5.html': {
        'module overview': {
          text: 'Action step: identify one client or case where a standard intervention failed. As you read this module, look for the population-specific adaptation that would have changed the outcome.',
          links: [{ href: 'module-4.html', label: 'Prerequisites: Methods' }, { href: 'curriculum.html', label: 'Full Curriculum' }]
        },
        'time management across populations': {
          text: 'Action step: match each population in this section to the time tool from Module 4 that fits best, then note one adaptation you would make to account for age, context, or shame sensitivity.',
          links: [{ href: 'images/time-correction-chart.svg', label: 'Time Correction Chart' }, { href: 'time-blindness-calibrator.html', label: 'Time Calibrator' }]
        },
        'task initiation: overcoming the "wall of awful"': {
          text: 'Action step: design a 90-second "launch sequence" for one specific client task that lowers activation energy through environmental priming rather than willpower appeals.',
          links: [{ href: 'task-start-friction.html', label: 'Friction Patterns' }, { href: 'module-4.html', label: 'Applied Methods' }]
        },
        'organization & working memory: offloading the brain': {
          text: 'Action step: audit your client\u2019s current offloading system (phone, paper, nothing?) and design one upgrade that places the tool at the exact point of failure, not at the planning desk.',
          links: [{ href: 'module-4.html', label: 'Cognitive Offloading' }, { href: 'resources.html#forms', label: 'Offload Templates' }]
        },
        'emotional regulation: the "hard times" protocol': {
          text: 'Action step: practice the Hard Times protocol on yourself during a low-stakes frustration this week. Coaches who have felt the protocol firsthand teach it with more credibility and nuance.',
          links: [{ href: 'module-1.html', label: 'Emotional Self-Regulation Theory' }, { href: 'scope-of-practice.html', label: 'Therapy vs. Coaching Boundary' }]
        },
        'special populations & transitions': {
          text: 'Action step: pick the population closest to your target niche and write three sentences explaining how standard EF coaching must be adapted for that group. Use this as the opening of your capstone rationale.',
          links: [{ href: 'scope-of-practice.html', label: 'Scope & Referral' }, { href: 'resources.html', label: 'Resource Hub' }]
        },
        'family, school, and workplace support guides': {
          text: 'Action step: share one resource from this section with a parent, teacher, or HR contact this week and note their reaction. Real-world feedback sharpens your ability to match resources to audiences.',
          links: [{ href: 'resources.html#toolkits', label: 'Role-Based Toolkits' }, { href: 'coaching-home.html', label: 'Coaching Practice' }]
        },
        'module 5 assignment': {
          text: 'Action step: start with the population profile before writing the intervention plan. Graders look for evidence that your tool choices were driven by population-specific reasoning, not generic best practices.',
          links: [{ href: 'certification.html#transparency-rubric', label: 'Rubric Criteria' }, { href: 'resources.html#forms', label: 'Assignment Templates' }]
        }
      }
    };

    function normalizeHeading(value) {
      return (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function pickSectionModel(el, currentPage) {
      var byPage = sectionDeepDives[currentPage];
      if (!byPage) return null;
      var section = el.closest ? el.closest('section') : null;
      if (!section) return null;
      var headingEl = section.querySelector('h2, h3');
      var key = normalizeHeading(headingEl ? headingEl.textContent : '');
      return byPage[key] || null;
    }

  function pickModel(el, pageModels, index) {
    if (!pageModels || !pageModels.length) return fallback;
    var text = (el.textContent || '').toLowerCase();
    var matched = pageModels.find(function (entry) {
      return (entry.match || []).some(function (token) { return text.indexOf(token) >= 0; });
    });
    return matched || pageModels[index % pageModels.length] || fallback;
  }

  function buildLearnMoreLabel(el, model) {
    var localHeading = el.querySelector('h3, h4');
    var headingText = localHeading ? String(localHeading.textContent || '').replace(/\s+/g, ' ').trim() : '';
    if (headingText) {
      if (headingText.length > 28) headingText = headingText.slice(0, 25).trim() + '...';
      return 'See ' + headingText + ' Note';
    }
    if (model && typeof model.text === 'string' && model.text.indexOf('Action step:') === 0) {
      return 'See Action Step';
    }
    if (model && model.links && model.links[0] && model.links[0].label) {
      return 'See ' + model.links[0].label;
    }
    return 'See Supporting Note';
  }

    var targets = document.querySelectorAll('.card, .callout, .hub-card');
    var limit = 16;
    var count = 0;
    var usedSections = {};
    targets.forEach(function (el) {
      if (count >= limit) return;
      if (el.querySelector('.learn-more-toggle')) return;
      if ((el.textContent || '').trim().length < 140) return;

      var section = el.closest ? el.closest('section') : null;
      var sectionKey = '';
      if (section) {
        var headingEl = section.querySelector('h2, h3');
        sectionKey = normalizeHeading(headingEl ? headingEl.textContent : '');
      }

      var sectionModel = pickSectionModel(el, currentPage);
      if (sectionModel && sectionKey && usedSections[sectionKey]) return;

      count += 1;
      var model = sectionModel || pickModel(el, deepDives[currentPage], count);

      if (sectionKey) usedSections[sectionKey] = true;

      var panelId = 'learn-more-' + Math.random().toString(36).slice(2, 8);

      var wrap = document.createElement('div');
      wrap.style.marginTop = 'var(--space-sm)';
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn--secondary btn--sm learn-more-toggle';
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', panelId);
      button.textContent = buildLearnMoreLabel(el, model);
      wrap.appendChild(button);

      var panel = document.createElement('div');
      panel.id = panelId;
      panel.className = 'notice';
      panel.style.display = 'none';
      panel.style.marginTop = 'var(--space-sm)';
      var textP = document.createElement('p');
      textP.style.marginBottom = 'var(--space-sm)';
      textP.textContent = model.text;
      panel.appendChild(textP);
      var sourcesP = document.createElement('p');
      sourcesP.style.marginBottom = '0';
      sourcesP.style.fontSize = '0.86rem';
      sourcesP.appendChild(document.createTextNode('Sources: '));
      model.links.forEach(function (item, idx) {
        appendTextLink(sourcesP, {
          href: item.href,
          label: item.label,
          external: /^https?:\/\//.test(item.href)
        });
        if (idx < model.links.length - 1) {
          sourcesP.appendChild(document.createTextNode(' • '));
        }
      });
      panel.appendChild(sourcesP);
      wrap.appendChild(panel);
      el.appendChild(wrap);

      var toggle = wrap.querySelector('.learn-more-toggle');
      if (!toggle || !panel) return;

      (function bindLearnMoreToggle(localToggle, localPanel) {
        localToggle.addEventListener('click', function () {
          var open = localPanel.style.display !== 'none';
          localPanel.style.display = open ? 'none' : 'block';
          localToggle.setAttribute('aria-expanded', open ? 'false' : 'true');
        });
      })(toggle, panel);
    });
  })();

  (function injectModuleToc() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (!/^module-(1|2|3|4|5|6|a-neuroscience|b-pedagogy|c-interventions)\.html$/.test(currentPage)) return;
    if (document.querySelector('.module-toc')) return;
    var main = document.querySelector('main');
    if (!main) return;

    var sections = Array.prototype.slice.call(main.querySelectorAll('section'));
    var targets = [];
    sections.forEach(function (section, idx) {
      var heading = section.querySelector('h2');
      if (!heading) return;
      var text = (heading.textContent || '').trim();
      if (!text) return;
      if (!section.id) section.id = 'section-' + (idx + 1);
      targets.push({ id: section.id, label: text });
    });
    if (targets.length < 3) return;

    var wrap = document.createElement('div');
    wrap.className = 'module-layout';
    var toc = document.createElement('aside');
    toc.className = 'module-toc';
    toc.setAttribute('aria-label', 'Table of contents');
    var tocHeading = document.createElement('h3');
    tocHeading.textContent = 'On This Page';
    toc.appendChild(tocHeading);
    var list = document.createElement('ul');
    targets.forEach(function (item) {
      var li = document.createElement('li');
      appendTextLink(li, { href: '#' + item.id, label: item.label });
      list.appendChild(li);
    });
    toc.appendChild(list);

    var content = document.createElement('div');
    content.className = 'module-main';
    while (main.firstChild) content.appendChild(main.firstChild);
    wrap.appendChild(content);
    wrap.appendChild(toc);
    main.appendChild(wrap);
  })();

  // ── #10  Intervention flags for chronically low adherence ──────────────────
  // After 3+ sessions with low adherence signals (low completion ratio),
  // display a persistent intervention prompt offering check-in, goal review,
  // or coach contact.  Only shown once per 72-hour window to avoid fatigue.
  (function initInterventionFlag() {
    var ADHERENCE_KEY = 'efi_adherence_v1';
    var INTERVENTION_KEY = 'efi_intervention_v1';
    var MIN_SESSIONS_FOR_INTERVENTION = 3;
    var INTERVENTION_COOLDOWN_MS = 72 * 60 * 60 * 1000; // 72 hours

    function readAdherence() {
      try { return JSON.parse(localStorage.getItem(ADHERENCE_KEY)) || { sessions: [] }; } catch (e) { return { sessions: [] }; }
    }

    function readInterventionMeta() {
      try { return JSON.parse(localStorage.getItem(INTERVENTION_KEY)) || {}; } catch (e) { return {}; }
    }

    function writeInterventionMeta(meta) {
      try { localStorage.setItem(INTERVENTION_KEY, JSON.stringify(meta)); } catch (e) {}
    }

    function shouldShowIntervention() {
      var data = readAdherence();
      var sessions = Array.isArray(data.sessions) ? data.sessions : [];
      if (sessions.length < MIN_SESSIONS_FOR_INTERVENTION) return false;

      // Must have computed level == 'low'
      var level = data.computed && data.computed.level ? data.computed.level : 'medium';
      if (level !== 'low') return false;

      // Confirm that the last N sessions are predominantly incomplete
      var recent = sessions.slice(-MIN_SESSIONS_FOR_INTERVENTION);
      var anyCompleted = recent.some(function(s) { return s.completed; });
      if (anyCompleted) return false; // at least one was done — not chronically low

      // Cooldown: don't show again within 72 h
      var meta = readInterventionMeta();
      if (meta.last_shown_at) {
        var lastShown = Date.parse(meta.last_shown_at);
        if (Number.isFinite(lastShown) && (Date.now() - lastShown) < INTERVENTION_COOLDOWN_MS) return false;
      }

      return true;
    }

    function trackEvent(eventName, props) {
      if (window.EFI && window.EFI.Analytics && typeof window.EFI.Analytics.track === 'function') {
        window.EFI.Analytics.track(eventName, props || {});
      }
    }

    function renderInterventionBanner() {
      var anchor = document.querySelector('main .container') || document.querySelector('main');
      if (!anchor || document.getElementById('efi-intervention-banner')) return;

      var meta = readInterventionMeta();
      meta.last_shown_at = new Date().toISOString();
      meta.show_count = (meta.show_count || 0) + 1;
      writeInterventionMeta(meta);

      trackEvent('low_adherence_intervention_shown', {
        show_count: meta.show_count,
        shown_at: meta.last_shown_at,
        page: window.location.pathname.split('/').pop() || 'index.html'
      });

      var banner = document.createElement('section');
      banner.id = 'efi-intervention-banner';
      banner.className = 'card';
      banner.style.borderLeft = '4px solid #FF9800';
      banner.style.marginBottom = 'var(--space-lg)';
      banner.style.background = 'rgba(255, 152, 0, 0.06)';
      var bannerTitle = document.createElement('h5');
      bannerTitle.style.marginTop = '0';
      bannerTitle.style.color = '#e65100';
      bannerTitle.textContent = 'Checking In With You';
      banner.appendChild(bannerTitle);
      var bannerIntro = document.createElement('p');
      bannerIntro.style.color = 'var(--color-text-light)';
      bannerIntro.textContent = 'It looks like recent sessions haven\'t been completed. That\'s okay — everyone hits friction. Here are three things that often help:';
      banner.appendChild(bannerIntro);
      banner.appendChild(buildChecklist([
        {
          href: 'coaching-services.html',
          label: 'Schedule a check-in with a coach',
          suffix: ' — 20 minutes can reset momentum.'
        },
        {
          href: 'dashboard.html',
          label: 'Review your goals on the dashboard',
          suffix: ' — sometimes goals need updating, not more effort.'
        },
        {
          href: 'coaching-contact.html',
          label: 'Contact the ExEF team',
          suffix: ' — we can help you troubleshoot what\'s getting in the way.'
        }
      ], function (li, item) {
        appendTextLink(li, { href: item.href, label: item.label });
        li.appendChild(document.createTextNode(item.suffix));
      }));
      var dismissGroup = document.createElement('div');
      dismissGroup.className = 'button-group';
      dismissGroup.style.marginTop = 'var(--space-sm)';
      var dismissButton = document.createElement('button');
      dismissButton.type = 'button';
      dismissButton.className = 'btn btn--secondary btn--sm';
      dismissButton.id = 'efi-intervention-dismiss';
      dismissButton.textContent = 'I\'m back on track — dismiss';
      dismissGroup.appendChild(dismissButton);
      banner.appendChild(dismissGroup);
      var statusP = document.createElement('p');
      statusP.id = 'efi-intervention-status';
      statusP.style.marginTop = 'var(--space-xs)';
      statusP.style.fontSize = '0.85rem';
      statusP.style.color = 'var(--color-text-muted)';
      banner.appendChild(statusP);

      anchor.insertBefore(banner, anchor.firstChild);

      var dismissBtn = banner.querySelector('#efi-intervention-dismiss');
      var statusEl = banner.querySelector('#efi-intervention-status');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', function() {
          banner.style.display = 'none';
          var m = readInterventionMeta();
          m.dismissed_at = new Date().toISOString();
          m.last_shown_at = m.dismissed_at; // reset cooldown from dismissal time
          writeInterventionMeta(m);
          trackEvent('low_adherence_intervention_dismissed', {
            dismissed_at: m.dismissed_at,
            page: window.location.pathname.split('/').pop() || 'index.html'
          });
          if (statusEl) statusEl.textContent = 'Dismissed. Keep going — you\'ve got this.';
        });
      }
    }

    // Only run on module pages to avoid intruding on non-learning pages
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (/^module-/.test(currentPage) && shouldShowIntervention()) {
      renderInterventionBanner();
    }
  })();
})();

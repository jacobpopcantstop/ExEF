(function () {
  'use strict';

  var root = document.getElementById('brain-mode-tool');
  if (!root) return;

  var STORAGE_KEY = 'exef_brain_mode_quiz_v1';
  var form = document.getElementById('brain-mode-form');
  var questionEl = document.getElementById('brain-mode-question');
  var resultEl = document.getElementById('brain-mode-results');
  var nextBtn = document.getElementById('brain-mode-next');
  var backBtn = document.getElementById('brain-mode-back');
  var resetBtn = document.getElementById('brain-mode-reset');
  var errorEl = document.getElementById('brain-mode-error');
  var progressText = document.getElementById('brain-mode-progress-text');
  var progressFill = document.getElementById('brain-mode-progress-fill');
  var progressBar = root.querySelector('.brain-mode-progress__bar');

  var modes = {
    hear: {
      name: 'Hear It',
      icon: 'HE',
      summary: 'Spoken explanations and audio supports may help your brain hold onto information.',
      meaning: 'You may focus better when information is spoken aloud, explained verbally, or discussed in real time. Audio can reduce the load on working memory and make instructions easier to hold onto.',
      experiment: 'For one task this week, make a 60-second voice note with the key steps before you begin.',
      barriers: [
        'Dense written instructions with no verbal summary',
        'Long silent work blocks with unclear checkpoints',
        'Reading-heavy tasks when your working memory is already loaded'
      ],
      strategies: [
        'Ask for verbal summaries after written instructions.',
        'Record voice notes or explanations.',
        'Use text-to-speech for dense reading.',
        'Repeat key instructions out loud.',
        'Talk through multi-step tasks before starting.'
      ],
      tools: [
        'Text-to-speech',
        'Voice memos',
        'Audio notes',
        'Recorded instructions',
        'Verbal check-ins'
      ],
      questions: [
        'What information becomes easier when you hear it out loud?',
        'Where would a two-minute verbal recap reduce friction?',
        'Which written tasks could use an audio layer?'
      ]
    },
    see: {
      name: 'See It',
      icon: 'SE',
      summary: 'Visible structure, diagrams, and written cues may help your attention settle.',
      meaning: 'Your attention may settle more easily when ideas are visible. Diagrams, lists, objects, examples, and visual structure can make abstract or multi-step information easier to grasp.',
      experiment: 'For one task this week, turn the next three steps into a visible checklist before starting.',
      barriers: [
        'Instructions that live only in conversation',
        'Messy workspaces where the next step is hidden',
        'Abstract goals with no visible plan or endpoint'
      ],
      strategies: [
        'Use diagrams, mind maps, charts, or whiteboards.',
        'Keep written task lists visible.',
        'Use color-coding sparingly and intentionally.',
        'Turn vague ideas into visible steps.',
        'Use visual timers or progress bars.'
      ],
      tools: [
        'Whiteboards',
        'Visual timers',
        'Kanban boards',
        'Mind maps',
        'Checklists'
      ],
      questions: [
        'What needs to be visible before you can start?',
        'Which recurring task needs a one-page visual map?',
        'Where is color helpful, and where is it just clutter?'
      ]
    },
    move: {
      name: 'Move It',
      icon: 'MO',
      summary: 'Movement may support focus, regulation, and task persistence.',
      meaning: 'Your brain may think better when your body is allowed to move. Movement can help with focus, emotional regulation, and staying with a task long enough to make progress.',
      experiment: 'For one task this week, use a two-minute movement ramp before the first work sprint.',
      barriers: [
        'Being expected to sit still through the whole planning process',
        'Starting difficult work without an activation ramp',
        'Ignoring physical restlessness until it turns into avoidance'
      ],
      strategies: [
        'Walk while brainstorming.',
        'Use movement breaks before difficult tasks.',
        'Try standing, pacing, stretching, or fidgets.',
        'Pair review or memorization with light movement.',
        'Build transition rituals that include physical action.'
      ],
      tools: [
        'Standing desk',
        'Fidgets',
        'Walking meetings',
        'Movement timers',
        'Transition playlists'
      ],
      questions: [
        'What kind of movement helps without becoming a full distraction?',
        'Which task needs a physical start ritual?',
        'Where would a short movement break protect follow-through?'
      ]
    },
    map: {
      name: 'Map It',
      icon: 'MP',
      summary: 'Big-picture context may help the details become easier to organize.',
      meaning: 'You may focus best when you understand the overall structure first. Once the purpose, pattern, or reason is clear, the details become easier to sort and sequence.',
      experiment: 'For one task this week, write the goal, reason, and first three steps on one page.',
      barriers: [
        'Being handed isolated steps without context',
        'Starting before the goal is clear',
        'Getting flooded by details',
        'Losing motivation when the task feels pointless'
      ],
      strategies: [
        'Ask, "What is the point of this?"',
        'Start with outlines before details.',
        'Use concept maps or project roadmaps.',
        'Preview the whole assignment before beginning.',
        'Connect new tasks to larger goals.'
      ],
      tools: [
        'Outlines',
        'Project maps',
        'Roadmaps',
        'Briefs',
        'Concept maps'
      ],
      questions: [
        'What big-picture question has to be answered before you can start?',
        'Where do isolated instructions make you lose the thread?',
        'Which project needs a visible roadmap?'
      ]
    },
    talk: {
      name: 'Talk It',
      icon: 'TA',
      summary: 'Talking things out may help you organize thoughts, feelings, decisions, and next steps.',
      meaning: 'You may discover what you think by saying it out loud. Conversation, narration, coaching, or self-talk can help turn vague thoughts into clear action.',
      experiment: 'For one task this week, talk through the plan out loud before opening the work.',
      barriers: [
        'Being asked to produce a polished answer before thinking aloud',
        'Solo planning when the task is emotionally loaded',
        'Keeping all decisions internal until they become tangled'
      ],
      strategies: [
        'Use body doubling or verbal check-ins.',
        'Explain the task to someone else.',
        'Record a voice memo before writing.',
        'Use thinking out loud as a planning tool.',
        'Talk through emotions before problem-solving.'
      ],
      tools: [
        'Body doubling',
        'Coaching calls',
        'Voice notes',
        'Accountability texts',
        'Conversation prompts'
      ],
      questions: [
        'Who helps you think clearly without taking over?',
        'What decision needs a five-minute verbal sort?',
        'Where could self-talk replace silent spiraling?'
      ]
    },
    feel: {
      name: 'Feel It',
      icon: 'FE',
      summary: 'Interest, encouragement, meaning, or positive energy may help activate focus.',
      meaning: 'Your attention may turn on when something feels meaningful, exciting, encouraging, urgent, or personally connected. Emotion can be part of the ignition system.',
      experiment: 'For one task this week, add one reason it matters and one small reward for starting.',
      barriers: [
        'Tasks that feel pointless or disconnected',
        'Feedback that uses shame as fuel',
        'Routines with no novelty, reward, or personal relevance'
      ],
      strategies: [
        'Connect tasks to personal meaning.',
        'Add novelty, humor, challenge, or reward.',
        'Use encouraging feedback instead of shame.',
        'Start with the part that feels most engaging.',
        'Pair difficult tasks with a positive environment.'
      ],
      tools: [
        'Reward menus',
        'Interest hooks',
        'Encouraging scripts',
        'Novelty rotations',
        'Music or mood supports'
      ],
      questions: [
        'What makes this task matter enough to begin?',
        'Where would encouragement work better than pressure?',
        'How can you add interest without making the task too complicated?'
      ]
    },
    touch: {
      name: 'Touch It',
      icon: 'TO',
      summary: 'Hands-on contact and physical materials may help abstract ideas become concrete.',
      meaning: 'You may understand best when you can interact with something physically. Touch, tools, cards, paper, objects, or manipulatives can help make ideas feel real.',
      experiment: 'For one task this week, move the plan onto paper, cards, sticky notes, or physical objects.',
      barriers: [
        'All-digital planning when the task needs concrete anchors',
        'Abstract instructions with nothing to handle, sort, or mark',
        'Trying to organize ideas without moving anything around'
      ],
      strategies: [
        'Use index cards, sticky notes, or physical sorting.',
        'Build models or prototypes.',
        'Print drafts and mark them by hand.',
        'Use objects to represent steps or ideas.',
        'Turn digital tasks into physical checklists when helpful.'
      ],
      tools: [
        'Sticky notes',
        'Index cards',
        'Paper checklists',
        'Prototypes',
        'Physical sorting trays'
      ],
      questions: [
        'What would become clearer if you could move it around?',
        'Where would paper beat another app?',
        'Which digital task needs a physical checklist?'
      ]
    },
    spark: {
      name: 'Spark It',
      icon: 'SP',
      summary: 'Fast pattern recognition and sudden clarity may help you find a useful path in.',
      meaning: 'You may process information through quick pattern recognition or insight before you can fully explain how you got there. This can be a strength, especially when paired with reflection and follow-through systems.',
      experiment: 'For one task this week, capture the first useful insight, then translate it into one next action.',
      barriers: [
        'Losing ideas because they are not captured quickly',
        'Jumping from insight to insight without a next action',
        'Trusting a hunch without checking the evidence or constraints'
      ],
      strategies: [
        'Capture sudden ideas immediately.',
        'Use a notes app or idea inbox.',
        'Pause to translate insights into steps.',
        'Ask, "What evidence supports this instinct?"',
        'Pair intuition with a simple action plan.'
      ],
      tools: [
        'Idea inbox',
        'Quick-capture notes',
        'Decision checklists',
        'Voice capture',
        'Next-action templates'
      ],
      questions: [
        'Where do your best ideas currently disappear?',
        'What follow-through system should catch the spark?',
        'How will you test the hunch before acting on it?'
      ]
    }
  };

  var questions = [
    {
      prompt: 'You are given a multi-step task and feel yourself losing track. What would help most?',
      answers: [
        { text: 'Hearing someone explain the steps out loud.', scores: { hear: 3, talk: 1 } },
        { text: 'Seeing the steps written or diagrammed.', scores: { see: 3, map: 1 } },
        { text: 'Walking through the task physically.', scores: { move: 2, touch: 2 } },
        { text: 'Understanding the overall goal first.', scores: { map: 3, spark: 1 } },
        { text: 'Talking it through with someone.', scores: { talk: 3, hear: 1 } }
      ]
    },
    {
      prompt: 'You need to start something you have been avoiding. Which entry point sounds most useful?',
      answers: [
        { text: 'A quick pep talk or verbal countdown.', scores: { hear: 2, feel: 2 } },
        { text: 'A visible first-step checklist.', scores: { see: 3, touch: 1 } },
        { text: 'Standing up, stretching, then beginning.', scores: { move: 3, feel: 1 } },
        { text: 'A one-sentence reason the task matters.', scores: { feel: 2, map: 2 } },
        { text: 'A five-minute planning conversation.', scores: { talk: 3, map: 1 } }
      ]
    },
    {
      prompt: 'You are reading dense instructions and your attention keeps sliding off the page.',
      answers: [
        { text: 'Use text-to-speech and listen while following along.', scores: { hear: 3, see: 1 } },
        { text: 'Highlight the key steps and turn them into a list.', scores: { see: 3, touch: 1 } },
        { text: 'Read one section, move, then come back.', scores: { move: 3, feel: 1 } },
        { text: 'Skim the whole thing first to understand the structure.', scores: { map: 3, spark: 1 } },
        { text: 'Summarize each section out loud.', scores: { talk: 2, hear: 2 } }
      ]
    },
    {
      prompt: 'A plan changes at the last minute. What helps you recover fastest?',
      answers: [
        { text: 'Someone calmly explains the new plan.', scores: { hear: 2, talk: 1, feel: 1 } },
        { text: 'Seeing the updated plan side by side with the old one.', scores: { see: 3, map: 1 } },
        { text: 'Resetting your body before deciding what to do.', scores: { move: 3, feel: 1 } },
        { text: 'Understanding what changed and what stayed the same.', scores: { map: 3, spark: 1 } },
        { text: 'Talking through what the change means for your next step.', scores: { talk: 3, map: 1 } }
      ]
    },
    {
      prompt: 'You need to remember something later today. What makes it most likely to stick?',
      answers: [
        { text: 'Recording a quick voice reminder.', scores: { hear: 3, spark: 1 } },
        { text: 'Putting the reminder where you will see it.', scores: { see: 3, touch: 1 } },
        { text: 'Linking it to a physical routine you already do.', scores: { move: 2, touch: 2 } },
        { text: 'Connecting it to the bigger goal it supports.', scores: { map: 2, feel: 2 } },
        { text: 'Telling someone your plan out loud.', scores: { talk: 3, hear: 1 } }
      ]
    },
    {
      prompt: 'You are brainstorming ideas for a project. What gets the best ideas moving?',
      answers: [
        { text: 'Talking into a recorder before writing anything.', scores: { talk: 2, hear: 2 } },
        { text: 'Sketching a messy diagram or board.', scores: { see: 2, map: 2 } },
        { text: 'Walking while ideas come together.', scores: { move: 3, spark: 1 } },
        { text: 'Starting with the purpose and audience.', scores: { map: 3, feel: 1 } },
        { text: 'Capturing flashes of insight before they vanish.', scores: { spark: 3, touch: 1 } }
      ]
    },
    {
      prompt: 'You are overwhelmed by chores. What support would make the next action clearer?',
      answers: [
        { text: 'A spoken list of the first three steps.', scores: { hear: 3, talk: 1 } },
        { text: 'A visible reset checklist on paper.', scores: { see: 2, touch: 2 } },
        { text: 'Starting with one physical action, like clearing a surface.', scores: { move: 2, touch: 2 } },
        { text: 'Sorting chores by room or purpose first.', scores: { map: 3, see: 1 } },
        { text: 'Making it feel lighter with music, a timer, or reward.', scores: { feel: 3, move: 1 } }
      ]
    },
    {
      prompt: 'You are in a conversation and need to understand a complex idea.',
      answers: [
        { text: 'Ask the person to explain it one more time in plain language.', scores: { hear: 3, talk: 1 } },
        { text: 'Ask them to draw it or show an example.', scores: { see: 3, touch: 1 } },
        { text: 'Use your hands or objects to represent the parts.', scores: { touch: 3, map: 1 } },
        { text: 'Ask how the pieces fit together.', scores: { map: 3, spark: 1 } },
        { text: 'Restate it out loud and check your understanding.', scores: { talk: 3, hear: 1 } }
      ]
    },
    {
      prompt: 'A task feels boring but important. What would help you stay with it?',
      answers: [
        { text: 'Listening to a short verbal prompt before starting.', scores: { hear: 2, feel: 1, move: 1 } },
        { text: 'Watching progress fill in as you work.', scores: { see: 3, feel: 1 } },
        { text: 'Using short work sprints with movement between them.', scores: { move: 3, feel: 1 } },
        { text: 'Connecting the task to a bigger outcome you care about.', scores: { map: 2, feel: 2 } },
        { text: 'Adding novelty, challenge, or a small reward.', scores: { feel: 3, spark: 1 } }
      ]
    },
    {
      prompt: 'You need to write something, but your thoughts are tangled.',
      answers: [
        { text: 'Say the first version out loud.', scores: { talk: 3, hear: 1 } },
        { text: 'Create an outline or visual structure first.', scores: { map: 2, see: 2 } },
        { text: 'Use sticky notes and move ideas around.', scores: { touch: 3, see: 1 } },
        { text: 'Start with the main point before details.', scores: { map: 3, spark: 1 } },
        { text: 'Capture the sudden good line before polishing.', scores: { spark: 3, talk: 1 } }
      ]
    },
    {
      prompt: 'You are studying or reviewing information. What helps it feel usable?',
      answers: [
        { text: 'Hearing the material explained or reading it aloud.', scores: { hear: 3, talk: 1 } },
        { text: 'Turning it into charts, flashcards, or diagrams.', scores: { see: 2, touch: 2 } },
        { text: 'Pacing or using light movement while reviewing.', scores: { move: 3, hear: 1 } },
        { text: 'Organizing it into themes and relationships.', scores: { map: 3, see: 1 } },
        { text: 'Finding the part that feels interesting first.', scores: { feel: 2, spark: 2 } }
      ]
    },
    {
      prompt: 'You are trying to decide what to do first.',
      answers: [
        { text: 'Hear the options summarized quickly.', scores: { hear: 2, talk: 1, map: 1 } },
        { text: 'See all options written in one place.', scores: { see: 3, map: 1 } },
        { text: 'Sort options with cards, notes, or objects.', scores: { touch: 3, see: 1 } },
        { text: 'Choose based on the goal that matters most.', scores: { map: 2, feel: 2 } },
        { text: 'Trust the first useful pattern, then make a simple plan.', scores: { spark: 3, map: 1 } }
      ]
    },
    {
      prompt: 'You are emotionally activated and need to get back online.',
      answers: [
        { text: 'Hear a calm voice or grounding phrase.', scores: { hear: 2, feel: 2 } },
        { text: 'Look at a simple written reset plan.', scores: { see: 2, map: 1, feel: 1 } },
        { text: 'Move your body to discharge the stress.', scores: { move: 3, feel: 1 } },
        { text: 'Name what happened and what matters now.', scores: { talk: 2, map: 2 } },
        { text: 'Use something tactile to settle your attention.', scores: { touch: 3, feel: 1 } }
      ]
    },
    {
      prompt: 'You have a good idea but might forget it before you can use it.',
      answers: [
        { text: 'Record it as a voice memo.', scores: { hear: 2, spark: 2 } },
        { text: 'Write it where you will see it later.', scores: { see: 2, touch: 1, spark: 1 } },
        { text: 'Act out the first step so it becomes concrete.', scores: { move: 2, touch: 2 } },
        { text: 'Connect it to the project map immediately.', scores: { map: 2, spark: 2 } },
        { text: 'Tell someone the idea so it becomes clearer.', scores: { talk: 2, spark: 2 } }
      ]
    },
    {
      prompt: 'You are learning a new tool, app, or process.',
      answers: [
        { text: 'Listen to someone narrate the steps.', scores: { hear: 3, talk: 1 } },
        { text: 'Watch the screen or use a visual walkthrough.', scores: { see: 3, map: 1 } },
        { text: 'Click through it yourself while learning.', scores: { touch: 2, move: 2 } },
        { text: 'Understand what the tool is for before the details.', scores: { map: 3, spark: 1 } },
        { text: 'Ask questions in real time as you try it.', scores: { talk: 3, touch: 1 } }
      ]
    },
    {
      prompt: 'You need to communicate a hard thought or feeling.',
      answers: [
        { text: 'Say it aloud once before sending it.', scores: { talk: 3, hear: 1 } },
        { text: 'Write the main points where you can see them.', scores: { see: 2, map: 1, feel: 1 } },
        { text: 'Walk or move before the conversation.', scores: { move: 3, feel: 1 } },
        { text: 'Start with what matters and what you want next.', scores: { map: 2, feel: 2 } },
        { text: 'Use a physical note card so you do not lose the thread.', scores: { touch: 3, see: 1 } }
      ]
    },
    {
      prompt: 'You are about to begin a long project. What support makes it feel possible?',
      answers: [
        { text: 'A verbal overview of what will happen first.', scores: { hear: 2, map: 2 } },
        { text: 'A timeline, roadmap, or visible milestone list.', scores: { see: 2, map: 2 } },
        { text: 'A physical setup ritual that marks the start.', scores: { move: 2, touch: 2 } },
        { text: 'A clear reason the project matters.', scores: { feel: 2, map: 2 } },
        { text: 'An idea-capture system for sudden connections.', scores: { spark: 3, see: 1 } }
      ]
    },
    {
      prompt: 'You finish a work block and need to follow through on the next step.',
      answers: [
        { text: 'Leave yourself a voice note with the next action.', scores: { hear: 2, talk: 1, spark: 1 } },
        { text: 'Put the next step in a visible place.', scores: { see: 3, touch: 1 } },
        { text: 'Set up the physical materials for next time.', scores: { touch: 3, move: 1 } },
        { text: 'Connect the next step to the overall plan.', scores: { map: 3, see: 1 } },
        { text: 'End with one encouraging marker of progress.', scores: { feel: 3, talk: 1 } }
      ]
    }
  ];

  var state = {
    index: 0,
    answers: {}
  };

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function loadState() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved.index === 'number' && saved.answers) {
        state.index = Math.min(Math.max(saved.index, 0), questions.length - 1);
        state.answers = saved.answers || {};
      }
    } catch (e) {}
  }

  function clearNode(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function appendList(parent, items) {
    var list = document.createElement('ul');
    (items || []).forEach(function (text) {
      var item = document.createElement('li');
      item.textContent = text;
      list.appendChild(item);
    });
    parent.appendChild(list);
  }

  function buildSummaryText(primary, secondary) {
    var lines = [
      'Brain Mode Quiz Summary',
      '',
      'Primary support pattern: ' + primary.data.name,
      primary.data.summary,
      '',
      'First experiment this week:',
      primary.data.experiment,
      '',
      'Secondary modes: ' + secondary.map(function (item) { return item.data.name; }).join(', '),
      '',
      'Strategies to try:',
      primary.data.strategies.map(function (item) { return '- ' + item; }).join('\n'),
      '',
      'Coaching questions:',
      primary.data.questions.map(function (item) { return '- ' + item; }).join('\n')
    ];
    return lines.join('\n');
  }

  function currentAnswer() {
    return state.answers[String(state.index)];
  }

  function answeredCount() {
    return Object.keys(state.answers).length;
  }

  function updateProgress() {
    var count = answeredCount();
    var pct = Math.round((count / questions.length) * 100);
    if (progressText) progressText.textContent = 'Question ' + (state.index + 1) + ' of ' + questions.length + ' - ' + count + ' answered';
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressBar) progressBar.setAttribute('aria-valuenow', String(count));
    if (backBtn) backBtn.disabled = state.index === 0;
    if (nextBtn) nextBtn.textContent = state.index === questions.length - 1 ? 'See Results' : 'Next';
  }

  function renderQuestion() {
    var q = questions[state.index];
    clearNode(questionEl);
    if (errorEl) errorEl.hidden = true;
    if (resultEl) resultEl.hidden = true;
    if (form) form.hidden = false;

    var card = document.createElement('article');
    card.className = 'brain-mode-question__card';

    var eyebrow = document.createElement('p');
    eyebrow.className = 'brain-mode-question__eyebrow';
    eyebrow.textContent = 'Scenario ' + (state.index + 1);
    card.appendChild(eyebrow);

    var heading = document.createElement('h3');
    heading.textContent = q.prompt;
    card.appendChild(heading);

    var options = document.createElement('div');
    options.className = 'brain-mode-options';
    options.setAttribute('role', 'radiogroup');
    options.setAttribute('aria-label', 'Brain Mode answer choices');

    q.answers.forEach(function (answer, idx) {
      var id = 'brain-mode-q' + state.index + '-' + idx;
      var label = document.createElement('label');
      label.className = 'brain-mode-option';
      label.setAttribute('for', id);

      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'brain-mode-answer';
      input.id = id;
      input.value = String(idx);
      input.checked = currentAnswer() === idx;
      input.addEventListener('change', function () {
        state.answers[String(state.index)] = idx;
        saveState();
        updateProgress();
        if (errorEl) errorEl.hidden = true;
      });

      var marker = document.createElement('span');
      marker.className = 'brain-mode-option__marker';
      marker.textContent = String.fromCharCode(65 + idx);

      var text = document.createElement('span');
      text.textContent = answer.text;

      label.appendChild(input);
      label.appendChild(marker);
      label.appendChild(text);
      options.appendChild(label);
    });

    card.appendChild(options);
    questionEl.appendChild(card);
    updateProgress();
  }

  function computeScores() {
    var scores = {};
    Object.keys(modes).forEach(function (key) {
      scores[key] = 0;
    });
    Object.keys(state.answers).forEach(function (qIndex) {
      var q = questions[Number(qIndex)];
      var answer = q && q.answers[state.answers[qIndex]];
      if (!answer) return;
      Object.keys(answer.scores).forEach(function (key) {
        scores[key] += answer.scores[key];
      });
    });
    return Object.keys(scores).map(function (key) {
      return { key: key, score: scores[key], data: modes[key] };
    }).sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.data.name.localeCompare(b.data.name);
    });
  }

  function buildModeBlock(mode, label) {
    var block = document.createElement('article');
    block.className = 'brain-mode-result-card';

    var head = document.createElement('div');
    head.className = 'brain-mode-result-card__head';
    var icon = document.createElement('span');
    icon.className = 'brain-mode-card__icon';
    icon.textContent = mode.icon;
    var titleWrap = document.createElement('div');
    var tag = document.createElement('p');
    tag.className = 'brain-mode-question__eyebrow';
    tag.textContent = label;
    var heading = document.createElement('h3');
    heading.textContent = mode.name;
    titleWrap.appendChild(tag);
    titleWrap.appendChild(heading);
    head.appendChild(icon);
    head.appendChild(titleWrap);
    block.appendChild(head);

    var summary = document.createElement('p');
    summary.className = 'brain-mode-result-card__summary';
    summary.textContent = mode.summary;
    block.appendChild(summary);

    var meaning = document.createElement('div');
    meaning.className = 'brain-mode-result-card__section';
    var meaningTitle = document.createElement('h4');
    meaningTitle.textContent = 'What this means';
    var meaningText = document.createElement('p');
    meaningText.textContent = mode.meaning;
    meaning.appendChild(meaningTitle);
    meaning.appendChild(meaningText);
    block.appendChild(meaning);

    [
      ['What may get in the way', mode.barriers],
      ['Strategies to try', mode.strategies],
      ['Tools that may help', mode.tools],
      ['Coaching questions to explore', mode.questions]
    ].forEach(function (section) {
      var wrap = document.createElement('div');
      wrap.className = 'brain-mode-result-card__section';
      var title = document.createElement('h4');
      title.textContent = section[0];
      wrap.appendChild(title);
      appendList(wrap, section[1]);
      block.appendChild(wrap);
    });

    return block;
  }

  function renderResults() {
    var missing = questions.length - answeredCount();
    if (missing > 0) {
      if (errorEl) {
        errorEl.textContent = 'Please answer all questions before viewing results.';
        errorEl.hidden = false;
      }
      return;
    }
    var ranked = computeScores();
    var primary = ranked[0];
    var secondary = ranked.slice(1, 3);
    clearNode(resultEl);

    var shell = document.createElement('div');
    shell.className = 'brain-mode-results__inner';

    var intro = document.createElement('div');
    intro.className = 'brain-mode-results__intro';
    var title = document.createElement('h3');
    title.textContent = 'Your Primary Brain Mode: ' + primary.data.name;
    var text = document.createElement('p');
    text.textContent = 'Your strongest current support pattern appears to be ' + primary.data.name + '. This is a practical clue, not a fixed identity. Your support needs may shift by task, environment, stress level, energy, and context.';
    intro.appendChild(title);
    intro.appendChild(text);

    var secondaryText = document.createElement('p');
    secondaryText.className = 'brain-mode-results__secondary';
    secondaryText.textContent = 'Secondary modes to keep nearby: ' + secondary.map(function (item) { return item.data.name; }).join(' and ') + '.';
    intro.appendChild(secondaryText);

    var experiment = document.createElement('div');
    experiment.className = 'brain-mode-results__experiment';
    var experimentTitle = document.createElement('h4');
    experimentTitle.textContent = 'First experiment this week';
    var experimentText = document.createElement('p');
    experimentText.textContent = primary.data.experiment;
    experiment.appendChild(experimentTitle);
    experiment.appendChild(experimentText);
    intro.appendChild(experiment);
    shell.appendChild(intro);

    var scoreGrid = document.createElement('div');
    scoreGrid.className = 'brain-mode-score-grid';
    ranked.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'brain-mode-score';
      var label = document.createElement('span');
      label.textContent = item.data.name;
      var bar = document.createElement('span');
      bar.className = 'brain-mode-score__bar';
      var fill = document.createElement('span');
      fill.style.width = Math.max(8, Math.round((item.score / primary.score) * 100)) + '%';
      bar.appendChild(fill);
      row.appendChild(label);
      row.appendChild(bar);
      scoreGrid.appendChild(row);
    });
    shell.appendChild(scoreGrid);

    shell.appendChild(buildModeBlock(primary.data, 'Primary access point'));
    secondary.forEach(function (item, idx) {
      shell.appendChild(buildModeBlock(item.data, idx === 0 ? 'Secondary support pattern' : 'Another useful pattern'));
    });

    var actions = document.createElement('div');
    actions.className = 'brain-mode-actions brain-mode-actions--results';
    var retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'btn btn--secondary btn--sm';
    retry.textContent = 'Retake Quiz';
    retry.addEventListener('click', resetQuiz);
    var copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'btn btn--secondary btn--sm';
    copy.textContent = 'Copy Summary';
    copy.addEventListener('click', function () {
      var summary = buildSummaryText(primary, secondary);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(summary).then(function () {
          copy.textContent = 'Copied';
        }).catch(function () {
          copy.textContent = 'Copy Failed';
        });
      } else {
        copy.textContent = 'Copy Unavailable';
      }
    });
    var fullProfile = document.createElement('a');
    fullProfile.className = 'btn btn--primary btn--sm';
    fullProfile.href = 'full-ef-profile.html';
    fullProfile.textContent = 'Open Cross-Signal Profile';
    actions.appendChild(retry);
    actions.appendChild(copy);
    actions.appendChild(fullProfile);
    shell.appendChild(actions);

    resultEl.appendChild(shell);
    resultEl.hidden = false;
    form.hidden = true;
    resultEl.focus();
  }

  function resetQuiz() {
    state = { index: 0, answers: {} };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    renderQuestion();
    if (questionEl) questionEl.focus();
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      if (typeof currentAnswer() !== 'number') {
        if (errorEl) {
          errorEl.textContent = 'Please choose an answer before continuing.';
          errorEl.hidden = false;
        }
        return;
      }
      if (state.index === questions.length - 1) {
        renderResults();
        return;
      }
      state.index += 1;
      saveState();
      renderQuestion();
      if (questionEl) questionEl.focus();
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', function () {
      if (state.index === 0) return;
      state.index -= 1;
      saveState();
      renderQuestion();
      if (questionEl) questionEl.focus();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetQuiz);
  }

  loadState();
  renderQuestion();
})();

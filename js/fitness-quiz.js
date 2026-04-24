(function () {
  'use strict';

  var form = document.getElementById('fitness-quiz-form');
  if (!form) return;

  var RESULT_KEY = 'efi_fitness_quiz_result_v1';
  var DRAFT_KEY = 'efi_fitness_quiz_draft_v1';

  var dimensions = ['solo','outdoor','intensity','structure','variety','equipment','social','mindbody'];

  var questions = [
    { id:'q1', label:'I enjoy exercising by myself.', dim:'solo' },
    { id:'q2', label:'I prefer being outside when I move my body.', dim:'outdoor' },
    { id:'q3', label:'I like workouts that leave me breathing hard.', dim:'intensity' },
    { id:'q4', label:'I do better when sessions have a clear plan.', dim:'structure' },
    { id:'q5', label:'I get bored if workouts feel repetitive.', dim:'variety' },
    { id:'q6', label:'I have reliable access to basic equipment.', dim:'equipment' },
    { id:'q7', label:'I stay consistent when other people are involved.', dim:'social' },
    { id:'q8', label:'I want exercise to help calm my nervous system.', dim:'mindbody' },
    { id:'q9', label:'I can usually protect a 30–60 minute workout block.', dim:'structure' },
    { id:'q10', label:'I would rather move than sit still for recovery.', dim:'intensity' },
    { id:'q11', label:'Commute time is a major barrier for me.', dim:'solo', invert:true },
    { id:'q12', label:'Weather does not stop me from moving outside.', dim:'outdoor' },
    { id:'q13', label:'I enjoy technique-heavy activities that take practice.', dim:'structure' },
    { id:'q14', label:'I can stick with progress that feels slow but steady.', dim:'structure' },
    { id:'q15', label:'I want low-cost options that need little setup.', dim:'equipment', invert:true },
    { id:'q16', label:'I feel better when movement includes rhythm or music.', dim:'variety' },
    { id:'q17', label:'Competition motivates me.', dim:'social' },
    { id:'q18', label:'I need movement that is joint-friendly.', dim:'mindbody' },
    { id:'q19', label:'I like measurable progress (times, reps, load, distance).', dim:'intensity' },
    { id:'q20', label:'I prefer routines I can do at home when needed.', dim:'solo' }
  ];

  var exercises = [
    ['Walking Program',{solo:4,outdoor:4,intensity:1,structure:2,variety:2,equipment:0,social:1,mindbody:3}],
    ['Jogging / Running',{solo:4,outdoor:4,intensity:4,structure:3,variety:2,equipment:0,social:1,mindbody:2}],
    ['Trail Running',{solo:3,outdoor:5,intensity:4,structure:3,variety:4,equipment:1,social:1,mindbody:2}],
    ['Cycling (Road/Path)',{solo:3,outdoor:5,intensity:4,structure:3,variety:3,equipment:2,social:2,mindbody:2}],
    ['Spin Class',{solo:1,outdoor:0,intensity:4,structure:4,variety:2,equipment:3,social:4,mindbody:1}],
    ['Swimming',{solo:3,outdoor:1,intensity:3,structure:3,variety:2,equipment:2,social:1,mindbody:4}],
    ['Water Aerobics',{solo:1,outdoor:1,intensity:2,structure:3,variety:2,equipment:2,social:4,mindbody:4}],
    ['Strength Training (Gym)',{solo:3,outdoor:0,intensity:4,structure:4,variety:3,equipment:4,social:2,mindbody:2}],
    ['Bodyweight Circuits',{solo:4,outdoor:2,intensity:3,structure:3,variety:3,equipment:0,social:1,mindbody:2}],
    ['Powerlifting',{solo:3,outdoor:0,intensity:5,structure:5,variety:1,equipment:5,social:2,mindbody:1}],
    ['Pilates',{solo:3,outdoor:0,intensity:2,structure:4,variety:2,equipment:1,social:2,mindbody:5}],
    ['Yoga',{solo:3,outdoor:1,intensity:2,structure:3,variety:2,equipment:0,social:2,mindbody:5}],
    ['Tai Chi',{solo:2,outdoor:2,intensity:1,structure:3,variety:2,equipment:0,social:3,mindbody:5}],
    ['Dance Fitness',{solo:1,outdoor:0,intensity:3,structure:2,variety:5,equipment:0,social:4,mindbody:3}],
    ['Barre',{solo:2,outdoor:0,intensity:2,structure:4,variety:2,equipment:1,social:3,mindbody:4}],
    ['HIIT Classes',{solo:1,outdoor:1,intensity:5,structure:4,variety:3,equipment:2,social:4,mindbody:1}],
    ['Boxing / Kickboxing',{solo:2,outdoor:0,intensity:5,structure:4,variety:3,equipment:2,social:4,mindbody:2}],
    ['Martial Arts',{solo:1,outdoor:0,intensity:4,structure:5,variety:3,equipment:1,social:5,mindbody:3}],
    ['Rock Climbing',{solo:1,outdoor:3,intensity:4,structure:4,variety:4,equipment:3,social:4,mindbody:3}],
    ['Rowing (Erg/Water)',{solo:3,outdoor:2,intensity:4,structure:4,variety:2,equipment:3,social:2,mindbody:2}],
    ['Hiking',{solo:3,outdoor:5,intensity:2,structure:2,variety:4,equipment:1,social:2,mindbody:4}],
    ['Rucking',{solo:4,outdoor:5,intensity:3,structure:3,variety:2,equipment:1,social:2,mindbody:2}],
    ['Pickleball',{solo:0,outdoor:2,intensity:3,structure:2,variety:4,equipment:2,social:5,mindbody:2}],
    ['Tennis',{solo:0,outdoor:3,intensity:4,structure:3,variety:4,equipment:2,social:5,mindbody:2}],
    ['Basketball',{solo:0,outdoor:2,intensity:4,structure:2,variety:4,equipment:1,social:5,mindbody:1}],
    ['Soccer / Futsal',{solo:0,outdoor:3,intensity:4,structure:2,variety:4,equipment:1,social:5,mindbody:1}],
    ['Mobility Flow',{solo:4,outdoor:1,intensity:1,structure:2,variety:3,equipment:0,social:1,mindbody:5}],
    ['Reformer Pilates',{solo:2,outdoor:0,intensity:2,structure:4,variety:2,equipment:4,social:2,mindbody:5}],
    ['Stair / Hill Intervals',{solo:4,outdoor:4,intensity:5,structure:3,variety:2,equipment:0,social:1,mindbody:1}],
    ['Dance Classes (Studio)',{solo:1,outdoor:0,intensity:3,structure:3,variety:5,equipment:0,social:5,mindbody:3}]
  ];

  var groups = document.getElementById('fitness-question-groups');
  var progressText = document.getElementById('fitness-progress-text');
  var progressFill = document.getElementById('fitness-progress-fill');
  var error = document.getElementById('fitness-quiz-error');
  var results = document.getElementById('fitness-results');
  var summary = document.getElementById('fitness-summary');
  var topList = document.getElementById('fitness-top-list');
  var fullList = document.getElementById('fitness-full-list');

  function renderQuestions() {
    var html = questions.map(function (q, idx) {
      var options = [0,1,2,3,4].map(function (value) {
        return '<label><input type="radio" name="' + q.id + '" value="' + value + '"> ' + value + '</label>';
      }).join('');
      return '<article class="card" style="margin-bottom:var(--space-md);"><p><strong>' + (idx + 1) + '.</strong> ' + q.label + '</p><div class="quiz-scale-row">' + options + '</div></article>';
    }).join('');
    groups.innerHTML = html;
  }

  function readAnswers() {
    var out = {};
    questions.forEach(function (q) {
      var input = form.querySelector('input[name="' + q.id + '"]:checked');
      if (input) out[q.id] = Number(input.value);
    });
    return out;
  }

  function answeredCount(answers) { return Object.keys(answers).length; }

  function updateProgress() {
    var answers = readAnswers();
    var count = answeredCount(answers);
    progressText.textContent = count + ' of 20 answered';
    progressFill.style.width = (count / 20 * 100) + '%';
    localStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
  }

  function scoreExercises(answers) {
    var target = { solo:0,outdoor:0,intensity:0,structure:0,variety:0,equipment:0,social:0,mindbody:0 };
    var counts = { solo:0,outdoor:0,intensity:0,structure:0,variety:0,equipment:0,social:0,mindbody:0 };
    questions.forEach(function (q) {
      var raw = answers[q.id];
      if (typeof raw !== 'number') return;
      var value = q.invert ? 4 - raw : raw;
      target[q.dim] += value;
      counts[q.dim] += 1;
    });
    Object.keys(target).forEach(function (k) {
      target[k] = counts[k] ? target[k] / counts[k] : 2;
    });

    return exercises.map(function (item) {
      var name = item[0];
      var profile = item[1];
      var dist = 0;
      dimensions.forEach(function (dim) {
        dist += Math.abs((target[dim] || 2) - (profile[dim] || 2));
      });
      var score = Math.max(0, Math.round(100 - (dist / (dimensions.length * 5)) * 100));
      return { name:name, score:score };
    }).sort(function (a,b) { return b.score - a.score; });
  }

  function renderResults(ranked) {
    summary.textContent = 'Best fits based on your preferences, energy pattern, and access constraints. Start with one top option for two weeks, not five options for two days.';
    topList.innerHTML = ranked.slice(0,10).map(function (item, i) {
      return '<li><strong>#' + (i + 1) + ' ' + item.name + '</strong> <span>' + item.score + '% fit</span></li>';
    }).join('');
    fullList.innerHTML = ranked.map(function (item, i) {
      return '<li><span>' + (i + 1) + '. ' + item.name + '</span><strong>' + item.score + '%</strong></li>';
    }).join('');
    results.hidden = false;
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('change', updateProgress);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var answers = readAnswers();
    if (answeredCount(answers) !== 20) {
      error.hidden = false;
      return;
    }
    error.hidden = true;
    var ranked = scoreExercises(answers);
    localStorage.setItem(RESULT_KEY, JSON.stringify(ranked));
    renderResults(ranked);
  });

  document.getElementById('fitness-reset-btn').addEventListener('click', function () {
    form.reset();
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(RESULT_KEY);
    results.hidden = true;
    error.hidden = true;
    updateProgress();
  });

  renderQuestions();
  try {
    var saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    Object.keys(saved).forEach(function (key) {
      var input = form.querySelector('input[name="' + key + '"][value="' + saved[key] + '"]');
      if (input) input.checked = true;
    });
    var prior = JSON.parse(localStorage.getItem(RESULT_KEY) || 'null');
    if (prior && prior.length) renderResults(prior);
  } catch (e) {}
  updateProgress();
})();

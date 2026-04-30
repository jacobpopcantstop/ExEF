(function () {
  'use strict';

  var form = document.getElementById('fitness-quiz-form');
  if (!form) return;

  var RESULT_KEY = 'efi_fitness_quiz_result_v2';
  var DRAFT_KEY = 'efi_fitness_quiz_draft_v2';

  var dimensions = [
    'solo', 'outdoor', 'intensity', 'structure', 'variety',
    'equipment', 'social', 'mindbody', 'joint', 'cost'
  ];

  var dimensionLabels = {
    solo: 'Independent / solo-friendly',
    outdoor: 'Outdoor-leaning',
    intensity: 'High intensity',
    structure: 'Structured & technique-driven',
    variety: 'Varied / novelty-rich',
    equipment: 'Equipment-tolerant',
    social: 'Social / accountable',
    mindbody: 'Calming / mind-body',
    joint: 'Joint-friendly',
    cost: 'Low-cost / minimal setup'
  };

  var scaleAnchors = ['Not true', 'A little', 'Somewhat', 'Mostly', 'Very true'];

  var questions = [
    { id: 'q1',  label: 'I enjoy exercising by myself.',                                              dim: 'solo' },
    { id: 'q2',  label: 'I prefer being outside when I move my body.',                                dim: 'outdoor' },
    { id: 'q3',  label: 'I like workouts that leave me breathing hard.',                              dim: 'intensity' },
    { id: 'q4',  label: 'I do better when sessions have a clear plan.',                               dim: 'structure' },
    { id: 'q5',  label: 'I get bored if workouts feel repetitive.',                                   dim: 'variety' },
    { id: 'q6',  label: 'I have reliable access to basic equipment.',                                 dim: 'equipment' },
    { id: 'q7',  label: 'I stay consistent when other people are involved.',                          dim: 'social' },
    { id: 'q8',  label: 'I want exercise to help calm my nervous system.',                            dim: 'mindbody' },
    { id: 'q9',  label: 'I can usually protect a 30–60 minute workout block.',                        dim: 'structure' },
    { id: 'q10', label: 'I would rather move than sit still for recovery.',                           dim: 'intensity' },
    { id: 'q11', label: 'Commute time to a gym or studio is a major barrier for me.',                 dim: 'solo' },
    { id: 'q12', label: 'Weather does not stop me from moving outside.',                              dim: 'outdoor' },
    { id: 'q13', label: 'I enjoy technique-heavy activities that take practice.',                     dim: 'structure' },
    { id: 'q14', label: 'I can stick with progress that feels slow but steady.',                      dim: 'structure' },
    { id: 'q15', label: 'I want low-cost options that need little setup.',                            dim: 'cost' },
    { id: 'q16', label: 'I feel better when movement includes rhythm or music.',                      dim: 'variety' },
    { id: 'q17', label: 'Friendly competition motivates me.',                                         dim: 'social' },
    { id: 'q18', label: 'I have joint pain, injury history, or physical limits to work around.',      dim: 'joint' },
    { id: 'q19', label: 'I like measurable progress (times, reps, load, distance).',                  dim: 'intensity' },
    { id: 'q20', label: 'I prefer routines I can do at home when needed.',                            dim: 'solo' },
    // Additions for v2
    { id: 'q21', label: 'I get pulled in by trying new and unusual formats.',                         dim: 'variety' },
    { id: 'q22', label: 'Loud, high-stimulation environments drain me, even when the workout is good.', dim: 'mindbody' },
    { id: 'q23', label: 'A monthly cost above $20–30 would be hard to sustain.',                      dim: 'cost' },
    { id: 'q24', label: 'I want exercise that builds community, not just fitness.',                   dim: 'social' },
    { id: 'q25', label: 'I prefer landing softly — low-impact movement over high-impact.',            dim: 'joint' },
    { id: 'q26', label: 'I have access to gym, studio, or class memberships if I want them.',         dim: 'equipment' }
  ];

  // Each option is [name, profile, blurb, sessionTip]
  var exercises = [
    ['Walking Program',          {solo:4,outdoor:4,intensity:1,structure:2,variety:2,equipment:0,social:1,mindbody:4,joint:5,cost:5}, 'The lowest-friction movement option on the list — pure on-ramp.', '20 minutes after lunch, no headphones, just a route.'],
    ['Walking Club / Buddy Walks',{solo:0,outdoor:4,intensity:1,structure:2,variety:2,equipment:0,social:5,mindbody:4,joint:5,cost:5}, 'Walking with the social glue that makes it stick.', 'Recruit one person, schedule two walks this week.'],
    ['Jogging / Running',        {solo:4,outdoor:4,intensity:4,structure:3,variety:2,equipment:0,social:1,mindbody:2,joint:1,cost:5}, 'High aerobic return for very little setup, but joint-demanding.', '20-minute run/walk with 1-minute jog / 2-minute walk intervals.'],
    ['Trail Running',            {solo:3,outdoor:5,intensity:4,structure:3,variety:4,equipment:1,social:1,mindbody:3,joint:1,cost:4}, 'Outdoor variety + intensity for those who already run safely.', 'Pick a beginner trail; allow yourself to walk the climbs.'],
    ['Cycling (Road/Path)',      {solo:3,outdoor:5,intensity:4,structure:3,variety:3,equipment:2,social:2,mindbody:3,joint:5,cost:3}, 'Joint-friendly cardio with strong intensity ceiling.', '45-minute easy ride on a known route this weekend.'],
    ['Group Cycling Club',       {solo:1,outdoor:4,intensity:4,structure:3,variety:3,equipment:2,social:5,mindbody:2,joint:5,cost:3}, 'Cycling with the accountability of a group ride.', 'Find a no-drop ride and show up once.'],
    ['Spin Class',               {solo:1,outdoor:0,intensity:5,structure:4,variety:2,equipment:3,social:4,mindbody:1,joint:5,cost:2}, 'Indoor, structured, joint-friendly intensity in a social setting.', 'Book a beginner-friendly class; sit further from the speakers.'],
    ['Online Live Workouts',     {solo:3,outdoor:0,intensity:3,structure:4,variety:4,equipment:3,social:2,mindbody:2,joint:3,cost:2}, 'Studio-style structure without the commute.', 'Two 30-minute live sessions; same time both days.'],
    ['Swimming',                 {solo:3,outdoor:1,intensity:3,structure:3,variety:2,equipment:2,social:1,mindbody:5,joint:5,cost:3}, 'The most joint-friendly cardio. Calming and rhythmic.', 'Two 25-minute pool sessions; alternate easy laps and rest.'],
    ['Water Aerobics',           {solo:1,outdoor:1,intensity:2,structure:3,variety:2,equipment:2,social:4,mindbody:5,joint:5,cost:3}, 'Social, accessible, and the easiest reentry after injury.', 'Drop in to one community-pool class.'],
    ['Strength Training (Gym)',  {solo:3,outdoor:0,intensity:4,structure:4,variety:3,equipment:4,social:2,mindbody:2,joint:3,cost:2}, 'The single highest-leverage habit for long-term EF and metabolic health.', 'A simple 3-lift template, 2x/week, 30 minutes per session.'],
    ['Bodyweight Circuits',      {solo:4,outdoor:2,intensity:3,structure:3,variety:3,equipment:0,social:1,mindbody:2,joint:3,cost:5}, 'Strength stimulus with zero setup — perfect for travel weeks.', '15 minutes: squats, push-ups, rows, planks. Three rounds.'],
    ['Calisthenics',             {solo:3,outdoor:2,intensity:4,structure:4,variety:4,equipment:1,social:2,mindbody:2,joint:3,cost:5}, 'Skill-based bodyweight training with long progress runways.', 'Pick one skill (e.g., a clean push-up) and train it 3x/week.'],
    ['Kettlebell Training',      {solo:4,outdoor:2,intensity:4,structure:4,variety:3,equipment:3,social:1,mindbody:2,joint:3,cost:3}, 'Compact, brutally efficient strength + conditioning in 20 minutes.', 'Two 20-minute swing-and-goblet-squat workouts.'],
    ['Powerlifting',             {solo:3,outdoor:0,intensity:5,structure:5,variety:1,equipment:5,social:2,mindbody:1,joint:2,cost:2}, 'Maximal structure and measurable progress, demanding on joints.', 'Find a coach for the first month — technique pays compounding interest.'],
    ['CrossFit',                 {solo:1,outdoor:1,intensity:5,structure:5,variety:5,equipment:4,social:5,mindbody:1,joint:2,cost:1}, 'High-variety, high-intensity, high-community — also high-cost.', 'Try a "fundamentals" intro week before committing to membership.'],
    ['Pilates',                  {solo:3,outdoor:0,intensity:2,structure:4,variety:2,equipment:1,social:2,mindbody:5,joint:5,cost:3}, 'Quiet, technical, deeply joint-friendly core and stability work.', 'Two mat-pilates sessions; phone away, slow tempo.'],
    ['Reformer Pilates',         {solo:2,outdoor:0,intensity:2,structure:5,variety:3,equipment:5,social:2,mindbody:5,joint:5,cost:1}, 'Pilates with a serious tool, serious instruction, and serious price tag.', 'A small-group reformer class beats solo YouTube for early form.'],
    ['Yoga',                     {solo:3,outdoor:1,intensity:2,structure:3,variety:2,equipment:0,social:2,mindbody:5,joint:4,cost:5}, 'The most studied movement intervention for stress and emotional regulation.', '20 minutes, three mornings this week, before checking your phone.'],
    ['Aerial / Acro Yoga',       {solo:1,outdoor:0,intensity:3,structure:5,variety:5,equipment:5,social:5,mindbody:4,joint:3,cost:1}, 'Novel, social, and skill-based — a serious cure for boredom.', 'Most studios run beginner intro nights; book one.'],
    ['Tai Chi',                  {solo:2,outdoor:3,intensity:1,structure:3,variety:2,equipment:0,social:3,mindbody:5,joint:5,cost:5}, 'Lowest-impact movement on the list with measurable balance and stress benefits.', 'Find an outdoor class — the park context matters.'],
    ['Mobility Flow',            {solo:4,outdoor:1,intensity:1,structure:2,variety:3,equipment:0,social:1,mindbody:5,joint:5,cost:5}, 'A quiet daily reset — your nervous system will thank you.', '10 minutes after waking; same routine for two weeks.'],
    ['Stretching & Recovery Class',{solo:2,outdoor:0,intensity:1,structure:4,variety:2,equipment:1,social:3,mindbody:5,joint:5,cost:3}, 'Guided recovery with social accountability and zero soreness.', 'Use it as a "third workout" alongside two harder sessions.'],
    ['Dance Fitness',            {solo:1,outdoor:0,intensity:3,structure:2,variety:5,equipment:0,social:4,mindbody:3,joint:3,cost:3}, 'Rhythm + variety + dopamine. Boredom-proof.', 'Two studio classes or one Zumba livestream this week.'],
    ['Dance Classes (Studio)',   {solo:1,outdoor:0,intensity:3,structure:4,variety:5,equipment:0,social:5,mindbody:3,joint:3,cost:2}, 'Skill, music, community — a social dopamine engine.', 'Pick one style (salsa, hip-hop, ballroom). Beginner only.'],
    ['Barre',                    {solo:2,outdoor:0,intensity:2,structure:5,variety:2,equipment:1,social:3,mindbody:4,joint:5,cost:2}, 'Low-impact, high-structure muscular endurance.', 'Two 45-minute beginner classes back-to-back-week.'],
    ['HIIT Classes',             {solo:1,outdoor:1,intensity:5,structure:4,variety:3,equipment:2,social:4,mindbody:1,joint:2,cost:2}, 'Maximum cardiovascular return per minute. Joint-demanding.', 'Cap to 2x per week; pair with mobility days.'],
    ['Boxing / Kickboxing',      {solo:2,outdoor:0,intensity:5,structure:4,variety:3,equipment:2,social:4,mindbody:3,joint:2,cost:2}, 'Stress release + skill + intensity. Strong emotional regulation tool.', 'A bag class beats a sparring class for your first month.'],
    ['Martial Arts',             {solo:1,outdoor:0,intensity:4,structure:5,variety:3,equipment:1,social:5,mindbody:4,joint:3,cost:2}, 'Long apprenticeship structure, deep social belonging.', 'Visit two schools before signing anything.'],
    ['Rock Climbing',            {solo:1,outdoor:3,intensity:4,structure:4,variety:5,equipment:3,social:5,mindbody:4,joint:3,cost:2}, 'Problem-solving in a body. Outsized engagement and community.', 'Drop into an indoor gym; ask a regular for one beta tip.'],
    ['Rowing (Erg / Water)',     {solo:3,outdoor:2,intensity:5,structure:4,variety:2,equipment:3,social:2,mindbody:3,joint:5,cost:3}, 'Joint-friendly maximal cardio — a hidden gem.', '20-minute steady-state at 22 strokes/minute, twice this week.'],
    ['Stair / Hill Intervals',   {solo:4,outdoor:4,intensity:5,structure:3,variety:2,equipment:0,social:1,mindbody:1,joint:2,cost:5}, 'Free, ferocious, and effective. Just rough on knees.', '6 hill repeats with a slow walk down between.'],
    ['Hiking',                   {solo:3,outdoor:5,intensity:2,structure:2,variety:5,equipment:1,social:3,mindbody:5,joint:4,cost:5}, 'The single best outdoor reset for stressed brains.', 'Pick a 90-minute trail and a podcast you actually like.'],
    ['Rucking',                  {solo:4,outdoor:5,intensity:3,structure:3,variety:2,equipment:1,social:2,mindbody:3,joint:3,cost:5}, 'Walking with weight — outsized aerobic and postural return.', 'Start with a 10-lb pack and a 30-minute neighborhood loop.'],
    ['Pickleball',               {solo:0,outdoor:3,intensity:3,structure:2,variety:4,equipment:2,social:5,mindbody:2,joint:3,cost:4}, 'The fastest social on-ramp in the country right now.', 'Show up to an open-play night; the beginners always pair up.'],
    ['Tennis',                   {solo:0,outdoor:3,intensity:4,structure:4,variety:4,equipment:2,social:4,mindbody:2,joint:2,cost:3}, 'Skill-based, social, and surprisingly aerobic.', 'A 30-minute beginner clinic ahead of any "regular play."'],
    ['Basketball',               {solo:0,outdoor:2,intensity:5,structure:2,variety:4,equipment:1,social:5,mindbody:1,joint:2,cost:5}, 'Old-school joy. Pickup games and shooting practice both count.', 'Start with shooting alone for two weeks before joining a pickup game.'],
    ['Soccer / Futsal',          {solo:0,outdoor:3,intensity:5,structure:3,variety:4,equipment:1,social:5,mindbody:1,joint:2,cost:4}, 'Maximum cardio in a maximum-fun wrapper.', 'Find a casual co-ed adult league; futsal is gentler on joints.'],
    ['Frisbee / Disc Sports',    {solo:1,outdoor:5,intensity:3,structure:2,variety:3,equipment:0,social:5,mindbody:3,joint:3,cost:5}, 'A cardio-meets-community option that flies under the radar.', 'Find a local pickup ultimate game or disc-golf course.'],
    ['Skating / Rollerblading',  {solo:3,outdoor:4,intensity:3,structure:2,variety:4,equipment:3,social:3,mindbody:3,joint:3,cost:3}, 'Genuinely fun cardio if balance is decent — meditative on long routes.', 'Two evening loops on a flat path. Wear the wrist guards.'],
    ['Stand-Up Paddleboard',     {solo:3,outdoor:5,intensity:2,structure:3,variety:3,equipment:3,social:2,mindbody:5,joint:5,cost:2}, 'Quiet outdoor balance work that feels like time off, not a workout.', 'Rent first; lake or calm bay before any current.'],
    ['Kayaking / Canoeing',      {solo:3,outdoor:5,intensity:3,structure:3,variety:3,equipment:3,social:3,mindbody:5,joint:5,cost:2}, 'Gentle on knees, generous to your nervous system.', 'A 60-minute paddle on a flat-water route this weekend.'],
    ['Skiing / Snowboarding',    {solo:2,outdoor:5,intensity:4,structure:4,variety:5,equipment:5,social:4,mindbody:4,joint:2,cost:1}, 'Seasonal, skill-rich, and gloriously absorbing — also expensive.', 'A lesson + day pass beats a weekend trip if you are restarting.']
  ];

  var groups = document.getElementById('fitness-question-groups');
  var progressText = document.getElementById('fitness-progress-text');
  var progressFill = document.getElementById('fitness-progress-fill');
  var progressBar = document.querySelector('#fitness-questionnaire .esqr-progress[role="progressbar"]');
  var error = document.getElementById('fitness-quiz-error');
  var results = document.getElementById('fitness-results');
  var summary = document.getElementById('fitness-summary');
  var topList = document.getElementById('fitness-top-list');
  var fullList = document.getElementById('fitness-full-list');
  var profileBlock = document.getElementById('fitness-profile-block');
  var totalQ = questions.length;

  if (progressBar) progressBar.setAttribute('aria-valuemax', String(totalQ));

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch];
    });
  }

  function renderQuestions() {
    var html = questions.map(function (q, idx) {
      var options = [0,1,2,3,4].map(function (value) {
        var inputId = q.id + '-' + value;
        return (
          '<label class="fitness-pill" for="' + inputId + '">' +
            '<input type="radio" id="' + inputId + '" name="' + q.id + '" value="' + value + '">' +
            '<span class="fitness-pill__num">' + value + '</span>' +
            '<span class="fitness-pill__anchor">' + scaleAnchors[value] + '</span>' +
          '</label>'
        );
      }).join('');
      return (
        '<article class="card fitness-q-card">' +
          '<div class="fitness-q-card__head"><span class="fitness-q-card__num">' + (idx + 1) + '</span>' +
          '<p class="fitness-q-card__prompt">' + escapeHtml(q.label) + '</p></div>' +
          '<div class="fitness-scale" role="radiogroup" aria-label="Scale 0 to 4">' + options + '</div>' +
        '</article>'
      );
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
    progressText.textContent = count + ' of ' + totalQ + ' answered';
    progressFill.style.width = (count / totalQ * 100) + '%';
    if (progressBar) progressBar.setAttribute('aria-valuenow', String(count));
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(answers)); } catch (e) {}
  }

  function buildTarget(answers) {
    var target = {}, counts = {};
    dimensions.forEach(function (d) { target[d] = 0; counts[d] = 0; });
    questions.forEach(function (q) {
      var raw = answers[q.id];
      if (typeof raw !== 'number') return;
      target[q.dim] += raw;
      counts[q.dim] += 1;
    });
    dimensions.forEach(function (d) {
      target[d] = counts[d] ? target[d] / counts[d] : 2;
    });
    return target;
  }

  function scoreExercises(target) {
    return exercises.map(function (item) {
      var name = item[0], profile = item[1], blurb = item[2], tip = item[3];
      var dist = 0;
      var matches = [];
      dimensions.forEach(function (dim) {
        var t = target[dim] || 2;
        var p = profile[dim] || 2;
        var diff = Math.abs(t - p);
        dist += diff;
        // Strong shared signal: user rates high (>=3) AND exercise rates high (>=4)
        if (t >= 3 && p >= 4) matches.push({ dim: dim, strength: t * p });
      });
      // 5 dims of 5-point scale -> max distance per dim is 5; use 5 dims worth of avg.
      var maxDist = dimensions.length * 5;
      var score = Math.max(0, Math.round(100 - (dist / maxDist) * 100));
      matches.sort(function (a, b) { return b.strength - a.strength; });
      return {
        name: name, score: score, blurb: blurb, tip: tip,
        matchDims: matches.slice(0, 3).map(function (m) { return m.dim; })
      };
    }).sort(function (a, b) { return b.score - a.score; });
  }

  function topUserDims(target, n) {
    return dimensions.slice().sort(function (a, b) {
      return (target[b] || 0) - (target[a] || 0);
    }).slice(0, n);
  }

  function buildMatchSentence(matches) {
    if (!matches || !matches.length) return 'Balanced match across your profile.';
    var parts = matches.map(function (d) { return dimensionLabels[d].toLowerCase(); });
    if (parts.length === 1) return 'Strong match for your ' + parts[0] + ' lean.';
    if (parts.length === 2) return 'Strong match for your ' + parts[0] + ' and ' + parts[1] + ' profile.';
    return 'Strong match for your ' + parts[0] + ', ' + parts[1] + ', and ' + parts[2] + ' profile.';
  }

  function renderProfile(target) {
    if (!profileBlock) return;
    var top = topUserDims(target, 3);
    var bars = dimensions.map(function (d) {
      var v = target[d] || 0;
      var pct = Math.round((v / 4) * 100);
      var emphasized = top.indexOf(d) !== -1 ? ' fitness-profile__row--top' : '';
      return (
        '<div class="fitness-profile__row' + emphasized + '">' +
          '<span class="fitness-profile__label">' + dimensionLabels[d] + '</span>' +
          '<div class="fitness-profile__bar"><div class="fitness-profile__fill" style="width:' + pct + '%;"></div></div>' +
          '<span class="fitness-profile__value">' + v.toFixed(1) + '</span>' +
        '</div>'
      );
    }).join('');
    profileBlock.innerHTML =
      '<h3 style="margin-top:0;">Your fit profile</h3>' +
      '<p style="color:var(--color-text-light);">Your three strongest preferences shape the top of the list:</p>' +
      '<div class="fitness-profile">' + bars + '</div>';
    profileBlock.hidden = false;
  }

  function renderResults(ranked, target) {
    if (target) renderProfile(target);

    summary.textContent = 'Best fits based on your preferences, energy pattern, and access constraints. Start with one top option for two weeks, not five options for two days.';

    topList.innerHTML = ranked.slice(0, 3).map(function (item, i) {
      return (
        '<li class="fitness-top-card">' +
          '<div class="fitness-top-card__head">' +
            '<span class="fitness-top-card__rank">#' + (i + 1) + '</span>' +
            '<h4 class="fitness-top-card__name">' + escapeHtml(item.name) + '</h4>' +
            '<span class="fitness-top-card__score">' + item.score + '%</span>' +
          '</div>' +
          '<p class="fitness-top-card__why">' + buildMatchSentence(item.matchDims) + '</p>' +
          '<p class="fitness-top-card__blurb">' + escapeHtml(item.blurb) + '</p>' +
          '<p class="fitness-top-card__tip"><strong>Try this first:</strong> ' + escapeHtml(item.tip) + '</p>' +
        '</li>'
      );
    }).join('');

    fullList.innerHTML = ranked.map(function (item, i) {
      return (
        '<li class="fitness-row">' +
          '<span class="fitness-row__rank">' + (i + 1) + '</span>' +
          '<span class="fitness-row__name">' + escapeHtml(item.name) + '</span>' +
          '<span class="fitness-row__bar"><span style="width:' + item.score + '%;"></span></span>' +
          '<span class="fitness-row__score">' + item.score + '%</span>' +
        '</li>'
      );
    }).join('');

    results.hidden = false;
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('change', updateProgress);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var answers = readAnswers();
    if (answeredCount(answers) !== totalQ) {
      error.hidden = false;
      error.textContent = 'Please answer all ' + totalQ + ' questions before scoring your fit list.';
      var firstUnanswered = questions.find(function (q) { return typeof answers[q.id] !== 'number'; });
      if (firstUnanswered) {
        var card = form.querySelector('input[name="' + firstUnanswered.id + '"]').closest('.fitness-q-card');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    error.hidden = true;
    var target = buildTarget(answers);
    var ranked = scoreExercises(target);
    try { localStorage.setItem(RESULT_KEY, JSON.stringify({ ranked: ranked, target: target })); } catch (e) {}
    renderResults(ranked, target);
  });

  document.getElementById('fitness-reset-btn').addEventListener('click', function () {
    form.reset();
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(RESULT_KEY);
    } catch (e) {}
    results.hidden = true;
    if (profileBlock) profileBlock.hidden = true;
    error.hidden = true;
    updateProgress();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  renderQuestions();
  try {
    var saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    Object.keys(saved).forEach(function (key) {
      var input = form.querySelector('input[name="' + key + '"][value="' + saved[key] + '"]');
      if (input) input.checked = true;
    });
    var prior = JSON.parse(localStorage.getItem(RESULT_KEY) || 'null');
    if (prior && prior.ranked && prior.ranked.length) renderResults(prior.ranked, prior.target);
  } catch (e) {}
  updateProgress();
})();

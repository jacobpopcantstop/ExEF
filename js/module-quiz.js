/**
 * Module Quiz System
 * Saves module mastery test results into the learner account progress state.
 */

(function() {
  'use strict';

  var PASSING_SCORE = 80;
  var currentQuiz = null;
  var userAnswers = {};
  var quizData = null;
  var lastSavedResult = null;
  var statusMessage = '';

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

  function initializeQuiz(moduleId) {
    if (!quizData || !quizData.quizzes[moduleId]) return;

    currentQuiz = {
      id: moduleId,
      data: quizData.quizzes[moduleId],
      currentQuestion: 0
    };

    hydrateSavedAssessment(moduleId);
    renderQuizInterface();
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

  function renderQuizInterface() {
    var container = document.getElementById('module-quiz');
    if (!container) return;

    container.innerHTML = '';

    var header = document.createElement('div');
    header.className = 'module-quiz__header';
    header.innerHTML = '<h3 style="margin-bottom:var(--space-sm);">Module Mastery Test</h3>' +
      '<p style="margin:0;color:var(--color-text-light);font-size:0.9rem;">' +
      'Finish this assessment to check for module mastery. Scores of ' + PASSING_SCORE + '% or higher ' +
      'save as passed progress when you are logged in.' +
      '</p>';
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
    resultsSection.style.marginTop = 'var(--space-xl)';
    resultsSection.style.padding = 'var(--space-lg)';
    resultsSection.style.background = 'var(--color-bg-alt)';
    resultsSection.style.borderRadius = 'var(--border-radius)';
    container.appendChild(resultsSection);
  }

  function renderQuestion(index) {
    if (!currentQuiz || !currentQuiz.data.questions[index]) return;

    var question = currentQuiz.data.questions[index];
    var container = document.getElementById('quiz-questions');
    if (!container) return;

    container.innerHTML = '';

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
      var explanationDiv = document.createElement('div');
      explanationDiv.className = 'module-quiz__explanation';
      explanationDiv.style.marginTop = 'var(--space-lg)';
      explanationDiv.style.padding = 'var(--space-md)';
      explanationDiv.style.background = userAnswers[question.id] === question.correct ?
        'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)';
      explanationDiv.style.borderLeft = '4px solid ' +
        (userAnswers[question.id] === question.correct ? '#4CAF50' : '#2196F3');
      explanationDiv.style.borderRadius = 'var(--border-radius)';

      var isCorrect = userAnswers[question.id] === question.correct;
      var label = document.createElement('strong');
      label.style.display = 'block';
      label.style.marginBottom = 'var(--space-xs)';
      label.textContent = isCorrect ? '✓ Correct!' : 'Learn More:';
      label.style.color = isCorrect ? '#4CAF50' : '#2196F3';
      explanationDiv.appendChild(label);

      var text = document.createElement('p');
      text.style.margin = '0';
      text.style.fontSize = '0.95rem';
      text.style.lineHeight = '1.5';
      text.textContent = question.explanation;
      explanationDiv.appendChild(text);

      questionDiv.appendChild(explanationDiv);
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
    resultsDiv.innerHTML = '';

    var title = document.createElement('h4');
    title.style.marginBottom = 'var(--space-md)';
    title.textContent = 'Test Results';
    resultsDiv.appendChild(title);

    var scoreDiv = document.createElement('div');
    scoreDiv.style.fontSize = '1.1rem';
    scoreDiv.style.marginBottom = 'var(--space-md)';
    scoreDiv.style.lineHeight = '1.8';
    scoreDiv.innerHTML = '<strong>Score:</strong> ' + correct + ' of ' + total + ' (' + percentage + '%)<br>' +
      '<strong>Status:</strong> ' + (passed ? 'Passed' : 'Needs Retake') + '<br>' +
      '<strong>Feedback:</strong> ' + getResultsMessage(percentage);
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

    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn btn--secondary btn--sm';
    resetBtn.textContent = 'Retake Test';
    resetBtn.addEventListener('click', function() { resetQuiz(); });
    resultsDiv.appendChild(resetBtn);

    var controls = document.querySelector('.module-quiz__controls');
    if (controls) controls.style.display = 'none';

    document.getElementById('quiz-questions').style.display = 'none';
  }

  function getResultsMessage(percentage) {
    if (percentage === 100) return 'Perfect! You have mastered this module.';
    if (percentage >= PASSING_SCORE) return 'Great work! You understand the key concepts and have passed this module test.';
    if (percentage >= 60) return 'Good effort. Review the explanations above to solidify your understanding.';
    return 'Keep studying. Read through the module again and retake the test.';
  }

  function resetQuiz() {
    userAnswers = {};
    currentQuiz.currentQuestion = 0;
    document.getElementById('quiz-results').style.display = 'none';
    document.getElementById('quiz-questions').style.display = 'block';
    document.querySelector('.module-quiz__controls').style.display = 'flex';
    renderQuestion(0);
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
    }
  };
})();

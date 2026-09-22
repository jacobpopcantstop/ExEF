// Extracted from coaching-contact.html so it runs under the site CSP (script-src 'self').
(function () {
  var form = document.getElementById('main-contact-form');
  if (!form) return;
  var coachingFor = form.querySelector('#coaching-for');
  var gradeWrap = form.querySelector('#student-grade-wrap');
  var grade = form.querySelector('#student-grade');
  var gradeNote = form.querySelector('#grade-note');
  var serviceType = form.querySelector('#service-type');
  var note = form.querySelector('#service-type-note');
  var noteBody = form.querySelector('#service-type-note-body');

  var SERVICE_NOTES = {
    tutoring: 'That is subject tutoring, not EF coaching. ExEF does not teach coursework, so instead of a call you will get an email with referrals to tutors who do. Send the form anyway - it is the fastest way to get that list.',
    both: 'Coaching and tutoring are two different jobs, and ExEF only does one of them. Expect an email that separates the two: what coaching would cover, and a referral for the tutoring half. We can book a call after that if coaching still fits.',
    'not-sure': 'That is a fine answer. Describe what actually goes wrong below - missed deadlines and blank-page paralysis point to coaching; not understanding the material points to tutoring - and you will get a straight read before anyone books anything.'
  };

  function syncGrade() {
    var forStudent = coachingFor && (coachingFor.value === 'my-child' || coachingFor.value === 'someone-else');
    if (gradeWrap) gradeWrap.hidden = !forStudent;
    if (!forStudent && grade) grade.value = '';
    syncGradeNote();
  }

  function syncGradeNote() {
    if (!gradeNote || !grade) return;
    var early = grade.value === 'k-4' || grade.value === '5-8';
    gradeNote.hidden = !early;
    if (early) {
      gradeNote.textContent = 'Heads up: coaching primarily serves adults and students from about 9th grade up. For younger students the educational specialist lane is usually the better fit, and the reply will say so.';
    }
  }

  function syncServiceNote() {
    if (!note || !serviceType) return;
    var message = SERVICE_NOTES[serviceType.value];
    note.hidden = !message;
    if (message && noteBody) noteBody.textContent = message;
  }

  if (coachingFor) coachingFor.addEventListener('change', syncGrade);
  if (grade) grade.addEventListener('change', syncGradeNote);
  if (serviceType) serviceType.addEventListener('change', syncServiceNote);
  syncGrade();
  syncServiceNote();
})();

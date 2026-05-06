#!/usr/bin/env python3
"""Update navigation across all HTML files in the project root."""

import os
import re
import glob

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_NAV_INNER = """
        <div class="nav__cluster">
          <a href="coaching-home.html" class="nav__link">Coaching</a>
          <a href="free-executive-functioning-tests.html" class="nav__link">Assessments</a>
          <a href="resources.html" class="nav__link">Resources</a>
          <a href="meet-the-team.html" class="nav__link">Team</a>
          <a href="store.html" class="nav__link">Store</a>
        </div>
        <div class="nav__cluster nav__cluster--support">
          <span class="nav__auth"></span>
          <a href="https://calendly.com/jacobansky/30min?month=2026-04" class="nav__link nav__link--cta">Book Consultation</a>
        </div>
      """

# Active link mappings: filename -> (selector_text, is_dropdown)
# For regular links, selector_text is the link text
# For dropdown trigger, selector_text is "Learn"
ACTIVE_MAP = {}

# Assessments
for f in ['free-executive-functioning-tests.html', 'esqr.html', 'ef-profile-story.html',
          'conative-action-profile.html', 'environment-quiz.html', 'full-ef-profile.html',
          'brown-clusters-tool.html', 'time-blindness-calibrator.html', 'task-start-friction.html']:
    ACTIVE_MAP[f] = ('Assessments', False)

# Coaching
for f in ['coaching-home.html', 'coaching-contact.html', 'coaching-creative.html',
          'coaching-about.html', 'coaching-methodology.html', 'coaching-services.html']:
    ACTIVE_MAP[f] = ('Coaching', False)

# Resources / public library
for f in ['resources.html', 'blog.html', 'open-ef-resources-directory.html', 'printables.html',
          'parent-toolkit.html', 'educator-toolkit.html', 'teacher-to-coach.html',
          'executive-functioning-iep-goal-bank.html', 'barkley-model-guide.html',
          'barkley-vs-brown.html', 'further-sources.html', 'scope-of-practice.html']:
    ACTIVE_MAP[f] = ('Resources', False)

# Team / about
for f in ['meet-the-team.html', 'about.html']:
    ACTIVE_MAP[f] = ('Team', False)

# Store / purchase
for f in ['store.html', 'checkout.html', 'checkout-return.html', 'enroll.html']:
    ACTIVE_MAP[f] = ('Store', False)


def apply_active_class(html, filename):
    """Add nav__link--active to the appropriate link for this page."""
    basename = os.path.basename(filename)

    # Check exact match first
    if basename in ACTIVE_MAP:
        target_text, is_dropdown = ACTIVE_MAP[basename]
    else:
        return html

    if is_dropdown:
        # Add active class to the dropdown trigger button
        html = html.replace(
            'class="nav__link nav__dropdown-trigger" aria-expanded="false" aria-haspopup="true"',
            'class="nav__link nav__link--active nav__dropdown-trigger" aria-expanded="false" aria-haspopup="true"',
            1
        )
    else:
        # Add active class to the matching <a> link
        # We need to find the link with the matching text
        escaped = re.escape(target_text)
        pattern = r'(<a href="[^"]*" class="nav__link)(">)(' + escaped + r')</a>'
        html = re.sub(pattern, r'\1 nav__link--active\2\3</a>', html, count=1)

    return html


def update_file(filepath):
    """Update the nav links in a single HTML file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match the nav__links div content - from opening tag to closing </div>
    # that's followed by whitespace and the nav__toggle button
    # Use \s* instead of \s*\n\s* to handle both formatted and minified HTML
    pattern = re.compile(
        r'(<div\s+class="nav__links"\s+id="nav-links">)'
        r'(.*?)'
        r'(</div>\s*<button\s+class="nav__toggle")',
        re.DOTALL
    )

    match = pattern.search(content)
    if not match:
        return False

    new_content = pattern.sub(r'\1' + NEW_NAV_INNER + r'\3', content)

    # Apply active class
    new_content = apply_active_class(new_content, filepath)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return True


def main():
    html_files = sorted(glob.glob(os.path.join(PROJECT_ROOT, '*.html')))
    updated = []
    skipped = []

    for filepath in html_files:
        filename = os.path.basename(filepath)
        if update_file(filepath):
            active_info = ''
            basename = os.path.basename(filepath)
            if basename in ACTIVE_MAP:
                target, is_drop = ACTIVE_MAP[basename]
                active_info = f' (active: {target}{"[dropdown]" if is_drop else ""})'
            updated.append(f'  ✓ {filename}{active_info}')
        else:
            skipped.append(f'  ✗ {filename} (no nav__links found)')

    print(f'Updated {len(updated)} files:')
    for line in updated:
        print(line)

    if skipped:
        print(f'\nSkipped {len(skipped)} files:')
        for line in skipped:
            print(line)


if __name__ == '__main__':
    main()

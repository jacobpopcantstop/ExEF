#!/usr/bin/env python3
"""Update navigation across all HTML files in the project root."""

import os
import re
import glob

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_NAV_INNER = """
        <a href="index.html" class="nav__link">Home</a>
        <a href="free-executive-functioning-tests.html" class="nav__link">Assessments</a>
        <a href="coaching-home.html" class="nav__link">Coaching</a>
        <a href="blog.html" class="nav__link">Blog</a>
        <a href="about.html" class="nav__link">About</a>
        <div class="nav__dropdown">
          <button class="nav__link nav__dropdown-trigger" aria-expanded="false" aria-haspopup="true">Learn <svg aria-hidden="true" viewBox="0 0 12 8" width="12" height="8" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 1 6 6 11 1"/></svg></button>
          <div class="nav__dropdown-menu">
            <a href="curriculum.html" class="nav__dropdown-item">Curriculum</a>
            <a href="certification.html" class="nav__dropdown-item">Certification</a>
          </div>
        </div>
        <span class="nav__auth"></span>
        <a href="#" class="nav__link nav__link--cta" onclick="Calendly.initPopupWidget({url: 'https://calendly.com/jacobansky/30min'});return false;">Book a Consultation</a>
      """

# Active link mappings: filename -> (selector_text, is_dropdown)
# For regular links, selector_text is the link text
# For dropdown trigger, selector_text is "Learn"
ACTIVE_MAP = {}

# Home
ACTIVE_MAP['index.html'] = ('Home', False)

# Assessments
for f in ['free-executive-functioning-tests.html', 'esqr.html', 'ef-profile-story.html',
          'conative-action-profile.html', 'environment-quiz.html', 'full-ef-profile.html',
          'brown-clusters-tool.html', 'time-blindness-calibrator.html', 'task-start-friction.html']:
    ACTIVE_MAP[f] = ('Assessments', False)

# Coaching
for f in ['coaching-home.html', 'coaching-contact.html', 'coaching-creative.html',
          'coaching-about.html', 'coaching-methodology.html', 'coaching-services.html']:
    ACTIVE_MAP[f] = ('Coaching', False)

# Blog
ACTIVE_MAP['blog.html'] = ('Blog', False)

# About
ACTIVE_MAP['about.html'] = ('About', False)

# Learn dropdown trigger - curriculum and modules
for f in ['curriculum.html', 'certification.html', 'accreditation.html']:
    ACTIVE_MAP[f] = ('Learn', True)

# Module files
for i in range(1, 20):
    ACTIVE_MAP[f'module-{i}.html'] = ('Learn', True)
# Also handle letter modules
for letter in 'abcdefghij':
    ACTIVE_MAP[f'module-{letter}-neuroscience.html'] = ('Learn', True)
    ACTIVE_MAP[f'module-{letter}-pedagogy.html'] = ('Learn', True)
    ACTIVE_MAP[f'module-{letter}-interventions.html'] = ('Learn', True)
    ACTIVE_MAP[f'module-{letter}.html'] = ('Learn', True)


def apply_active_class(html, filename):
    """Add nav__link--active to the appropriate link for this page."""
    basename = os.path.basename(filename)

    # Check exact match first
    if basename in ACTIVE_MAP:
        target_text, is_dropdown = ACTIVE_MAP[basename]
    elif basename.startswith('module-'):
        target_text, is_dropdown = ('Learn', True)
    else:
        return html

    if is_dropdown:
        # Add active class to the dropdown trigger button
        html = html.replace(
            'class="nav__link nav__dropdown-trigger"',
            'class="nav__link nav__link--active nav__dropdown-trigger"'
        )
    else:
        # Add active class to the matching <a> link
        # We need to find the link with the matching text
        escaped = re.escape(target_text)
        pattern = r'(<a href="[^"]*" class="nav__link)">(' + escaped + r')</a>'
        html = re.sub(pattern, r'\1 nav__link--active">\2</a>', html, count=1)

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
            elif basename.startswith('module-'):
                active_info = ' (active: Learn[dropdown])'
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

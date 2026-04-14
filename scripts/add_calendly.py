#!/usr/bin/env python3
"""
Add Calendly widget CSS and JS to all HTML files in the project root.
"""

import os
import re
from pathlib import Path

# Get the project root directory (parent of scripts directory)
PROJECT_ROOT = Path(__file__).parent.parent

# Calendly widget assets to add
CALENDLY_CSS = '  <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">'
CALENDLY_JS = '  <script src="https://assets.calendly.com/assets/external/widget.js" async></script>'

def add_calendly_to_html(file_path):
    """
    Add Calendly widget assets to an HTML file if not already present.
    Returns True if file was updated, False otherwise.
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if Calendly assets are already present
    if 'calendly.com/assets/external' in content:
        return False

    # Find the closing </head> tag
    head_close_match = re.search(r'</head>', content)
    if not head_close_match:
        print(f"Warning: No </head> tag found in {file_path.name}")
        return False

    # Insert Calendly assets right before </head>
    insert_position = head_close_match.start()
    new_content = (
        content[:insert_position] +
        CALENDLY_CSS + '\n' +
        CALENDLY_JS + '\n' +
        content[insert_position:]
    )

    # Write the modified content back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return True

def main():
    """Find all HTML files in project root and add Calendly widget."""
    html_files = sorted(PROJECT_ROOT.glob('*.html'))

    if not html_files:
        print("No HTML files found in project root")
        return

    updated_files = []
    skipped_files = []

    for html_file in html_files:
        if add_calendly_to_html(html_file):
            updated_files.append(html_file.name)
        else:
            skipped_files.append(html_file.name)

    # Report results
    print(f"\nCalendly Widget Addition Report")
    print(f"=" * 50)
    print(f"Total HTML files found: {len(html_files)}")
    print(f"Updated: {len(updated_files)}")
    print(f"Skipped (already have assets): {len(skipped_files)}")

    if updated_files:
        print(f"\nUpdated files:")
        for filename in updated_files:
            print(f"  ✓ {filename}")

    if skipped_files:
        print(f"\nSkipped files:")
        for filename in skipped_files:
            print(f"  - {filename}")

if __name__ == '__main__':
    main()

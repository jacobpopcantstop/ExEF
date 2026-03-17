#!/usr/bin/env python3
"""Build a JSON search index from all HTML pages."""
import json
import re
from pathlib import Path
from html.parser import HTMLParser

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.skip_tags = {'script', 'style', 'nav', 'footer'}
        self.skip_depth = 0
        self.title = ''
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        if tag in self.skip_tags:
            self.skip_depth += 1
        if tag == 'title':
            self.in_title = True

    def handle_endtag(self, tag):
        if tag in self.skip_tags:
            self.skip_depth = max(0, self.skip_depth - 1)
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        text = data.strip()
        if not text:
            return
        if self.in_title:
            self.title = text
        elif self.skip_depth == 0:
            self.text_parts.append(text)

    def get_text(self):
        return ' '.join(self.text_parts)[:2000]  # cap at 2000 chars

def build_index():
    root = Path(__file__).parent.parent
    pages = []

    for html_file in sorted(root.glob('*.html')):
        # Skip bridge/utility pages
        if html_file.name.startswith('module-') and html_file.stem[-1].isalpha() and len(html_file.stem) > 8:
            continue

        extractor = TextExtractor()
        try:
            extractor.feed(html_file.read_text(encoding='utf-8'))
        except Exception:
            continue

        title = extractor.title or html_file.stem.replace('-', ' ').title()
        body = extractor.get_text()
        url = '/' + html_file.name

        if body:
            pages.append({'id': html_file.stem, 'title': title, 'body': body, 'url': url})

    out = root / 'data' / 'search-index.json'
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(pages, ensure_ascii=False))
    print(f'Built search index: {len(pages)} pages → {out}')

if __name__ == '__main__':
    build_index()

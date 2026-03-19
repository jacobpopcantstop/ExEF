#!/usr/bin/env python3
"""Regenerate sitemap.xml with absolute URLs and lastmod dates."""

from __future__ import annotations

from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DOMAIN = "https://executivefunctioninginstitute.com/"
SITEMAP = ROOT / "sitemap.xml"
IGNORED = {"404.html"}

PRIORITIES = {
    "index.html": "1.0",
    "coaching-home.html": "0.9",
    "curriculum.html": "0.9",
    "esqr.html": "0.9",
    "teacher-to-coach.html": "0.9",
    "free-executive-functioning-tests.html": "0.9",
    "certification.html": "0.8",
    "coach-directory.html": "0.8",
    "coaching-about.html": "0.8",
    "coaching-contact.html": "0.8",
    "coaching-methodology.html": "0.8",
    "coaching-services.html": "0.8",
    "ef-profile-story.html": "0.8",
    "full-ef-profile.html": "0.8",
    "open-ef-resources-directory.html": "0.8",
    "resources.html": "0.8",
    "store.html": "0.8",
    "about.html": "0.7",
    "accreditation.html": "0.7",
    "barkley-model-guide.html": "0.7",
    "barkley-vs-brown.html": "0.7",
    "brown-clusters-tool.html": "0.7",
    "community.html": "0.7",
    "educator-launchpad.html": "0.7",
    "gap-analyzer.html": "0.7",
    "launch-plan.html": "0.7",
    "module-1.html": "0.7",
    "module-2.html": "0.7",
    "module-3.html": "0.7",
    "module-4.html": "0.7",
    "module-5.html": "0.7",
    "module-6.html": "0.7",
    "scope-of-practice.html": "0.7",
    "starter-kit.html": "0.7",
    "ward-360-thinking.html": "0.7",
    "certificate.html": "0.5",
    "dashboard.html": "0.5",
    "login.html": "0.5",
    "checkout.html": "0.4",
    "privacy.html": "0.4",
    "terms.html": "0.4",
    "admin.html": "0.3",
    "enroll.html": "0.3",
    "further-sources.html": "0.3",
    "getting-started.html": "0.3",
    "module-a-neuroscience.html": "0.3",
    "module-b-pedagogy.html": "0.3",
    "module-c-interventions.html": "0.3",
    "parent-toolkit.html": "0.3",
    "educator-toolkit.html": "0.3",
    "health.html": "0.2",
    "telemetry.html": "0.2",
}

ROUTE_MAP = {
    "coaching-home.html": "coaching/",
    "coaching-methodology.html": "coaching/methodology/",
    "coaching-services.html": "coaching/services/",
    "coaching-about.html": "coaching/about/",
    "coaching-contact.html": "coaching/contact/",
    "module-1.html": "modules/1/",
    "module-2.html": "modules/2/",
    "module-3.html": "modules/3/",
    "module-4.html": "modules/4/",
    "module-5.html": "modules/5/",
    "module-6.html": "modules/6/",
    "search.html": "search/",
    "verify.html": "verify/",
}


def lastmod_for(path: Path) -> str:
    return path.stat().st_mtime_ns and path.stat().st_mtime and __import__("datetime").datetime.fromtimestamp(path.stat().st_mtime).date().isoformat()


def build() -> None:
    ET.register_namespace("", "http://www.sitemaps.org/schemas/sitemap/0.9")
    urlset = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for html in sorted(ROOT.glob("*.html")):
      if html.name in IGNORED:
        continue
      url = ET.SubElement(urlset, "url")
      ET.SubElement(url, "loc").text = DOMAIN + ROUTE_MAP.get(html.name, html.name)
      ET.SubElement(url, "lastmod").text = lastmod_for(html)
      ET.SubElement(url, "priority").text = PRIORITIES.get(html.name, "0.5")
    tree = ET.ElementTree(urlset)
    ET.indent(tree, space="  ")
    tree.write(SITEMAP, encoding="utf-8", xml_declaration=True)
    print(f"Built {SITEMAP.relative_to(ROOT)}")


if __name__ == "__main__":
    build()

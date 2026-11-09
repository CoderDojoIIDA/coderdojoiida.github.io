#!/usr/bin/env python3
"""connpass のグループフィードから次回のイベントを取得し、data/next-event.json に書き出す。

標準ライブラリのみで動作する（GitHub Actions でもローカルでも実行可能）。
  python3 scripts/fetch_next_event.py
"""
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

FEED_URL = "https://coderdojoiida.connpass.com/ja.atom"
OUTPUT = Path(__file__).resolve().parent.parent / "data" / "next-event.json"
JST = timezone(timedelta(hours=9))
NS = {"a": "http://www.w3.org/2005/Atom"}

# 例: 開催日時: 2026/11/14 13:30 ～ 15:30
DATE_RE = re.compile(
    r"開催日時:\s*(\d{4})/(\d{1,2})/(\d{1,2})\s+(\d{1,2}):(\d{2})"
    r"(?:\s*[～~〜-]\s*(?:(\d{4})/(\d{1,2})/(\d{1,2})\s+)?(\d{1,2}):(\d{2}))?"
)
PLACE_RE = re.compile(r"開催場所:\s*([^<\n]*)")
NUMBER_RE = re.compile(r"#\s*(\d+)")


def fetch_feed(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "coderdojoiida-site-bot"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read()


def strip_query(url: str) -> str:
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))


def parse_entry(entry: ET.Element) -> dict | None:
    title = (entry.findtext("a:title", default="", namespaces=NS) or "").strip()
    summary = entry.findtext("a:summary", default="", namespaces=NS) or ""
    link_el = entry.find("a:link", NS)
    m = DATE_RE.search(summary)
    if not m or link_el is None:
        return None

    y, mo, d, hh, mm = (int(x) for x in m.groups()[:5])
    start = datetime(y, mo, d, hh, mm, tzinfo=JST)
    if m.group(9):
        ey, emo, ed = (int(m.group(i)) if m.group(i) else v for i, v in ((6, y), (7, mo), (8, d)))
        end = datetime(ey, emo, ed, int(m.group(9)), int(m.group(10)), tzinfo=JST)
    else:
        end = start

    place = PLACE_RE.search(summary)
    number = NUMBER_RE.search(title)
    return {
        "title": title,
        "number": int(number.group(1)) if number else None,
        "url": strip_query(link_el.get("href", "")),
        "start": start.isoformat(),
        "end": end.isoformat(),
        "place": place.group(1).strip() if place else None,
    }


def main() -> int:
    root = ET.fromstring(fetch_feed(FEED_URL))
    events = [e for e in (parse_entry(x) for x in root.findall("a:entry", NS)) if e]
    if not events:
        # フィードの形式が変わった可能性がある。既存のJSONは残したまま失敗させる
        print("イベントを1件も解析できませんでした", file=sys.stderr)
        return 1

    now = datetime.now(JST)
    upcoming = sorted(
        (e for e in events if datetime.fromisoformat(e["end"]) >= now),
        key=lambda e: e["start"],
    )
    data = {"source": FEED_URL, "next": upcoming[0] if upcoming else None}

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if OUTPUT.exists() and OUTPUT.read_text(encoding="utf-8") == text:
        print("変更なし")
        return 0
    OUTPUT.write_text(text, encoding="utf-8")
    print("更新しました:", data["next"]["title"] if data["next"] else "予定なし")
    return 0


if __name__ == "__main__":
    sys.exit(main())

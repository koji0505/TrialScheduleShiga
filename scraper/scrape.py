import requests
from bs4 import BeautifulSoup
import json
import re
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

COURTS = {
    "大津地方裁判所（滋賀）":     "https://www.courts.go.jp/otsu/saibanin/kaieikijitsu/index.html",
    "大阪地方裁判所（本庁）":     "https://www.courts.go.jp/osaka/saibanin/kaiteikijitsu/index.html",
    "大阪地方裁判所（堺支部）":   "https://www.courts.go.jp/osaka/saibanin/kaiteikijitsu-sakaisibu/index.html",
    "京都地方裁判所":             "https://www.courts.go.jp/kyoto/saibanin/kaiteikijitsu/index.html",
    "神戸地方裁判所（本庁）":     "https://www.courts.go.jp/kobe/saibanin/kaiteikijitsu-kobe/index.html",
    "神戸地方裁判所（姫路支部）": "https://www.courts.go.jp/kobe/saibanin/kaiteikijitsu-himeji/index.html",
    "奈良地方裁判所":             "https://www.courts.go.jp/nara/saibanin/kaiteikijitsu/index.html",
    "和歌山地方裁判所":           "https://www.courts.go.jp/wakayama/saibanin/kaiteikijitsu/index.html",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

DATE_RE      = re.compile(r"令和(\d+)年(\d+)月(\d+)日")
TIME_RE      = re.compile(r"(午前|午後)(\d+)時(\d+)分")
CASE_NAME_RE = re.compile(r"事件名[　：:]*(.+?)(?:（事件番号|事件番号|$)", re.DOTALL)
CASE_NUM_RE  = re.compile(r"事件番号[　：:]*(.+)")
HEADING_TAGS = frozenset(("h1", "h3", "h4"))


def parse_jp_date(text: str) -> str:
    """令和X年Y月Z日 → YYYY-MM-DD"""
    m = DATE_RE.search(text)
    if not m:
        return text.strip()
    year  = 2018 + int(m.group(1))
    month = int(m.group(2))
    day   = int(m.group(3))
    return f"{year}-{month:02d}-{day:02d}"


def normalize_time(text: str) -> str:
    """午前10時00分 / 午後2時30分 → HH:MM"""
    m = TIME_RE.search(text)
    if m:
        ampm, h, mn = m.group(1), int(m.group(2)), int(m.group(3))
        if ampm == "午後" and h != 12:
            h += 12
        elif ampm == "午前" and h == 12:
            h = 0
        return f"{h:02d}:{mn:02d}"
    return text.strip()


def parse_case_heading(text: str) -> tuple[str, str]:
    """
    各裁判所ページで使われる事件名の記述パターンに対応:
      事件名　○○（事件番号　△△）   ← 大津・大阪
      事件名　○○（事件番号：△△）   ← 神戸・姫路
      事件名：○○事件番号：△△       ← 京都
      ○○被告事件                    ← 和歌山（罪名のみ）
    """
    text = text.strip()

    name_m = CASE_NAME_RE.search(text)
    case_name = name_m.group(1).strip().rstrip("（") if name_m else text

    num_m = CASE_NUM_RE.search(text)
    case_number = num_m.group(1).rstrip("）)） ").strip() if num_m else ""

    return case_name, case_number


def _find_heading(element) -> str:
    """
    テーブル（または親要素）の前にある最も近い事件名候補テキストを返す。
    兄弟要素 → 親の兄弟要素 の順で探索する。
    """
    def is_case_heading(tag) -> bool:
        if not hasattr(tag, "get_text"):
            return False
        txt = tag.get_text(strip=True)
        return bool(txt) and (
            "事件名" in txt
            or tag.name in HEADING_TAGS
        )

    # 1) テーブル自身の前の兄弟を探す
    for sib in element.previous_siblings:
        if is_case_heading(sib):
            return sib.get_text(strip=True)

    # 2) 親要素の前の兄弟を探す（table が <p> 内に包まれているケース等）
    parent = element.parent
    if parent:
        for sib in parent.previous_siblings:
            if is_case_heading(sib):
                return sib.get_text(strip=True)

    return ""


def iter_cases(soup):
    """スケジュールテーブルを走査し (heading_text, table) を yield する。"""
    for table in soup.find_all("table"):
        first_row = table.find("tr")
        if not first_row:
            continue
        first_cells = [c.get_text(strip=True) for c in first_row.find_all(["th", "td"])]
        if not first_cells or "期日等" not in first_cells[0]:
            continue

        heading_text = _find_heading(table)
        yield heading_text, table


def scrape_court(court_name: str, url: str) -> list:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  Error: {e}")
        return []

    soup = BeautifulSoup(resp.content, "html.parser")
    cases = []

    for heading_text, table in iter_cases(soup):
        case_name, case_number = parse_case_heading(heading_text)

        sessions = []
        for row in table.find_all("tr"):
            cells = [td.get_text(strip=True) for td in row.find_all("td")]
            if len(cells) < 4:
                continue
            if cells[0] == "期日等":   # tdをヘッダとして使うページをスキップ
                continue
            date_str = parse_jp_date(cells[0])
            sessions.append({
                "date":     date_str,
                "time":     normalize_time(cells[1]),
                "session":  cells[2],
                "location": cells[3],
                "note":     cells[4] if len(cells) > 4 else "",
            })

        if sessions:
            cases.append({
                "case_name":   case_name,
                "case_number": case_number,
                "sessions":    sessions,
            })

    return cases


def main():
    now = datetime.now()
    result = {
        "updated_at": now.strftime("%Y-%m-%dT%H:%M:%S"),
        "courts": {},
    }

    def fetch(item):
        name, url = item
        print(f"Scraping {name} ...")
        cases = scrape_court(name, url)
        session_count = sum(len(c["sessions"]) for c in cases)
        print(f"  -> {len(cases)} 件 / {session_count} 期日")
        return name, cases

    with ThreadPoolExecutor(max_workers=8) as ex:
        for name, cases in ex.map(fetch, COURTS.items()):
            result["courts"][name] = cases

    out_path = os.path.join(
        os.path.dirname(__file__), "..", "docs", "data", "trials.json"
    )
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n保存完了: {out_path}")


if __name__ == "__main__":
    main()

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

// 'YYYY-MM-DD' → 'M/D(曜)'
export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}(${DAY_NAMES[d.getDay()]})`;
}

// 今日の日付を 'YYYY-MM-DD' で返す
export function todayStr() {
  return new Date().toLocaleDateString('sv-SE');
}

// データ内の全期日を昇順で返す（今日以降のみ・重複なし）
export function getAvailableDates(data) {
  const today = todayStr();
  const dates = new Set();
  for (const cases of Object.values(data.courts)) {
    for (const c of cases) {
      for (const s of c.sessions) {
        if (s.date >= today) dates.add(s.date);
      }
    }
  }
  return [...dates].sort();
}

// 日付・裁判所でフィルタした期日リストを返す（過去の期日は除外）
export function filterTrials(data, selectedDate, selectedCourt) {
  const today = todayStr();
  const result = [];
  for (const [courtName, cases] of Object.entries(data.courts)) {
    if (selectedCourt && selectedCourt !== courtName) continue;
    for (const c of cases) {
      const sessions = c.sessions.filter(s => {
        if (s.date < today) return false;
        if (selectedDate) return s.date === selectedDate;
        return true;
      });
      if (sessions.length > 0) {
        result.push({
          courtName,
          caseName:   c.case_name,
          caseNumber: c.case_number,
          sessions,
        });
      }
    }
  }
  return result;
}

# 近畿 裁判員裁判 開廷スケジュール — 仕様書

**バージョン**: 1.0.0
**最終更新**: 2026-03-04

---

## 1. プロジェクト概要

近畿地方（大阪高等裁判所管内）の裁判員裁判の開廷期日を一般市民向けに提供するアプリ。
傍聴を希望する市民が、日付・裁判所を絞り込んで開廷情報を確認できる。

### 対象裁判所（8庁）

| 裁判所名 | 所在地 |
|----------|--------|
| 大津地方裁判所（滋賀） | 〒520-0044 滋賀県大津市京町3-1-2 |
| 大阪地方裁判所（本庁） | 〒530-8522 大阪市北区西天満2-1-10 |
| 大阪地方裁判所（堺支部） | 〒590-8511 大阪府堺市堺区南瓦町2番28号 |
| 京都地方裁判所 | 〒604-8550 京都市中京区菊屋町 |
| 神戸地方裁判所（本庁） | 〒650-8575 兵庫県神戸市中央区橘通2-2-1 |
| 神戸地方裁判所（姫路支部） | 〒670-0947 兵庫県姫路市北条1-250 |
| 奈良地方裁判所 | 〒630-8213 奈良県奈良市登大路町35 |
| 和歌山地方裁判所 | 〒640-8143 和歌山県和歌山市二番丁1番地 |

### 注意事項

- 掲載するのは**裁判員裁判のみ**。一般の刑事・民事裁判の日程は含まない
- 情報は各地方裁判所の公式サイト（courts.go.jp）から取得
- データは変更される場合がある

---

## 2. システム構成

```
courts.go.jp (8庁)
    ↓ Python スクレイパー（週1回自動実行）
GitHub Actions
    ↓ JSON 生成・コミット
GitHub Pages
    ├── docs/index.html     … PWA（ブラウザ版）
    └── docs/data/trials.json … データソース
                ↑
        React Native アプリ（iOS / Android）
```

---

## 3. データフロー

### 3-1. JSONデータ形式（trials.json）

```json
{
  "updated_at": "2026-03-04T05:00:00",
  "courts": {
    "大津地方裁判所（滋賀）": [
      {
        "case_name": "○○被告事件",
        "case_number": "令和6年（わ）第123号",
        "sessions": [
          {
            "date":     "2026-03-10",
            "time":     "10:00",
            "session":  "第1回",
            "location": "第1号法廷",
            "note":     ""
          }
        ]
      }
    ]
  }
}
```

---

## 4. スクレイパー（Python）

| 項目 | 内容 |
|------|------|
| ファイル | `scraper/scrape.py` |
| 依存 | `requests`, `beautifulsoup4` |
| 実行 | `python scraper/scrape.py` |
| 出力 | `docs/data/trials.json` |

### 対応HTML構造パターン

各裁判所でページ構造が異なるため、以下を統一処理している。

| パターン | 該当裁判所 | 事件名タグ | 備考 |
|----------|-----------|-----------|------|
| A | 大津・大阪本庁・奈良 | `<h3>` | `<th>` をヘッダとして使用 |
| B | 堺・神戸 | `<h3>` | `<td>` をヘッダとして使用（"期日等"行をスキップ） |
| C | 京都 | `<p>` | `事件名：○○事件番号：△△` 形式 |
| D | 和歌山 | `<h1>` | 時刻が `午前10時00分` 形式 |
| E | 大阪・姫路 | `<div class="module-sub-page-parts-default-1">` | テーブルが `<p>` 内に包まれている |

### 主要関数

| 関数 | 説明 |
|------|------|
| `parse_jp_date(text)` | `令和X年Y月Z日` → `YYYY-MM-DD` |
| `normalize_time(text)` | `午前/午後X時Y分` → `HH:MM` |
| `parse_case_heading(text)` | 事件名・事件番号を抽出 |
| `_find_heading(table)` | テーブル前後の兄弟要素から事件名タグを探索 |
| `iter_cases(soup)` | スケジュールテーブルを走査して yield |
| `scrape_court(name, url)` | 1裁判所分のデータを取得・パース |
| `main()` | 8裁判所を並列取得（ThreadPoolExecutor） |

---

## 5. GitHub Actions（自動更新）

| 項目 | 内容 |
|------|------|
| ファイル | `.github/workflows/scrape.yml` |
| スケジュール | 毎週日曜日 JST 05:00（UTC 20:00） |
| 手動実行 | `workflow_dispatch` で可能 |
| 処理 | スクレイプ → JSON更新 → 自動コミット & プッシュ |
| ブランチ | `master` |

---

## 6. PWA（ブラウザ版）

| 項目 | 内容 |
|------|------|
| ファイル | `docs/index.html` |
| 公開URL | https://koji0505.github.io/TrialScheduleShiga/ |
| ビルド不要 | 単一HTMLファイル（外部依存なし） |

### 機能

- 日付ピッカーで日付を選択
- 「今日」ボタンで当日に即移動
- 「全て表示」ボタンで全期日表示
- 裁判所フィルターチップ（今日以降の期日がある裁判所のみ表示）
- 各裁判所カードに「🏛 アクセス」「🗺 地図」ボタン
- 過去の期日は表示しない

---

## 7. React Native アプリ

### 技術スタック

| 項目 | バージョン |
|------|-----------|
| Expo SDK | ~54.0.33 |
| React | 19.1.0 |
| React Native | 0.81.5 |
| react-native-safe-area-context | ~5.6.0 |
| ビルド | EAS Build |

### ファイル構成

```
app/
├── index.js                  # エントリーポイント（registerRootComponent）
├── App.js                    # SafeAreaProvider + TrialProvider
├── app.json                  # Expo設定・EASプロジェクトID
├── eas.json                  # ビルドプロファイル
├── constants.js              # DATA_URL・COLORS・COURTS_INFO
├── assets/
│   ├── icon.png              # アプリアイコン 1024×1024
│   ├── adaptive-icon.png     # Android用アダプティブアイコン
│   └── splash-icon.png       # スプラッシュ画像
├── context/
│   └── TrialContext.js       # useTrial をContext経由で提供
├── hooks/
│   └── useTrial.js           # データ取得・状態管理カスタムフック
├── screens/
│   └── MainScreen.js         # メイン画面（単一画面構成）
├── components/
│   ├── FilterChip.js         # 汎用フィルターチップ（共通UI）
│   ├── DateFilter.js         # 日付フィルター（FilterChipのラッパー）
│   ├── CourtFilter.js        # 裁判所フィルター（FilterChipのラッパー）
│   └── TrialCard.js          # 裁判カード
└── utils/
    └── trial.js              # 日付フォーマット・フィルタリング関数
```

### 画面構成

```
┌─────────────────────────────┐
│ ⚖️ 近畿 裁判員裁判 開廷スケジュール │ ← ヘッダー（最終更新日時）
├─────────────────────────────┤
│ ※ 裁判員裁判のみ掲載…        │ ← 注意書き（黄色帯）
├─────────────────────────────┤
│ [今日] [3/4(火)] [3/5(水)]… │ ← 日付フィルター
│ [すべての裁判所] [大津…] … │ ← 裁判所フィルター
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 大津地方裁判所（滋賀）  🏛 🗺│ │ ← カードヘッダー（青）
│ │ 📌 〒520-0044 …         │ │
│ │ ○○被告事件              │ │
│ │ 令和6年（わ）第123号     │ │
│ │ 3/10(火) 10:00 第1回    │ │
│ └─────────────────────────┘ │
│  （以下繰り返し）             │
└─────────────────────────────┘
```

### 主要コンポーネント仕様

#### FilterChip
| prop | 型 | 説明 |
|------|----|------|
| `items` | `string[]` | 選択肢の配列 |
| `selected` | `string` | 選択中の値（空文字 = 全て） |
| `onSelect` | `(item: string) => void` | 選択時コールバック |
| `formatItem` | `(item: string) => string` | 表示テキスト変換（省略可） |
| `allLabel` | `string` | 「全て」ボタンのラベル |

#### TrialCard
| prop | 型 | 説明 |
|------|----|------|
| `trial.courtName` | `string` | 裁判所名 |
| `trial.caseName` | `string` | 事件名 |
| `trial.caseNumber` | `string` | 事件番号 |
| `trial.sessions` | `Session[]` | 期日一覧 |

#### Session
| フィールド | 型 | 説明 |
|-----------|-----|------|
| `date` | `string` | `YYYY-MM-DD` |
| `time` | `string` | `HH:MM` |
| `session` | `string` | 第N回 / 判決 など |
| `location` | `string` | 法廷番号 |
| `note` | `string` | 備考（空の場合あり） |

### カラーパレット

| 定数名 | カラーコード | 用途 |
|--------|------------|------|
| `primary` | `#1565C0` | ヘッダー・カードヘッダー・アクティブチップ |
| `accent` | `#FF9800` | 「今日」ボタン・注意書き枠線 |
| `background` | `#f0f2f5` | 画面背景 |
| `white` | `#ffffff` | カード背景・チップ背景 |
| `border` | `#dddddd` | チップ枠・区切り線 |
| `warning` | `#FFF8E1` | 注意書き背景 |
| `warningText` | `#5D4037` | 注意書きテキスト |
| `error` | `#e74c3c` | エラーメッセージ |

### ビルドプロファイル（eas.json）

| プロファイル | 用途 | 配布方法 |
|------------|------|---------|
| `development` | 開発用（Expo Dev Client） | internal |
| `preview` | 動作確認用APK/IPA | internal |
| `production` | ストア申請用 | store |

---

## 8. EAS プロジェクト情報

| 項目 | 値 |
|------|-----|
| プロジェクトID | `1dbc8b10-4063-4690-ac2c-7ca81f8ea844` |
| slug | `trial-schedule-shiga` |
| Android パッケージ | `com.koji0505.trialscheduleshiga` |
| iOS Bundle ID | `com.koji0505.trialscheduleshiga` |

---

## 9. リポジトリ

| 項目 | URL |
|------|-----|
| GitHub | https://github.com/koji0505/TrialScheduleShiga |
| GitHub Pages | https://koji0505.github.io/TrialScheduleShiga/ |
| データJSON | https://koji0505.github.io/TrialScheduleShiga/data/trials.json |

---

## 10. iOSビルド手順（EAS）

```bash
cd C:\c_works\TrialScheduleShiga\app
npx eas build --platform ios --profile preview
```

初回は以下を求められる：
- **Apple Developer アカウント** でのログイン
- **Distribution Certificate** の生成（EASが自動生成可）
- **Provisioning Profile** の生成（EASが自動生成可）

ビルド完了後、TestFlightへのアップロードまたはAd Hoc配布でインストール可能。

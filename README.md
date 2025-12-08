# ValueScope

東京電力HD・中部電力・JERAの企業価値指標（EV、EV/EBITDA、PER、PBR）と電力業界特化KPI（ROIC、WACC、EBITDAマージン、FCFマージン）を可視化し、**信号機方式（緑/黄/赤）**で財務健全性を評価する企業価値分析ダッシュボードです。

## 🚀 クイックスタート

```powershell
# ワンコマンド起動（推奨）
.\start.ps1

# または手動起動
npm install
pip install -r scripts/requirements.txt
py -3.10 scripts/fetch_edinet.py --years 10
py -3.10 scripts/fetch_stock_prices.py --years 10
py -3.10 scripts/parse_edinet_xbrl.py
py -3.10 scripts/extract_xbrl_to_csv.py  # XBRL全解析 - PL/BS/CF CSV出力
py -3.10 scripts/build_timeseries.py
py -3.10 scripts/compute_scores.py
npm run dev
```

> ⚠️ **データ取得について**  
> - **EDINET APIデータ**: GitHub Actionsで毎年6月20日-7月1日のみ自動取得（GitHub Secrets登録のAPIキー使用）
> - **株価データ**: GitHub Actionsで毎回デプロイ時に自動取得（Stooq API経由、pandas_datareader使用）
> - ローカル開発時は `py -3.10 scripts/fetch_edinet.py` → `py -3.10 scripts/fetch_stock_prices.py` → `py -3.10 scripts/parse_edinet_xbrl.py` → `py -3.10 scripts/build_timeseries.py` → `py -3.10 scripts/compute_scores.py` を実行

## 📊 プロジェクト概要

- **バージョン**: 1.0.0
- **リリース日**: 2025-12-15
- **ステータス**: Phase 1-8 実装完了（MVP達成）
- **リポジトリ**: https://github.com/J1921604/ValueScope
- **デモサイト**: https://j1921604.github.io/ValueScope/

### 実装状況

- **Phase 1 Setup**: ✅ 完了（プロジェクト構造、依存関係、ビルド設定）
- **Phase 2 Foundational**: ✅ 完了（型定義、GitHub Actions、データディレクトリ）
- **Phase 3 US1 企業価値指標表示**: ✅ 完了（XBRL解析、ValuationTable、E2Eテスト）
- **Phase 4 US2 KPIスコアカード**: ✅ 完了（電力業界特化KPI計算、ScoreCard、信号機評価）
- **Phase 5 US3 推移グラフ**: ✅ 完了（TrendChart実装、10年分時系列データ、E2Eテスト10件）
- **Phase 6 US4 財務諸表比較**: ✅ 完了（PL/BS/CF 3社比較テーブル）
- **Phase 7 Polish**: ✅ 完了（UI改善、パフォーマンス最適化、ドキュメント整備）

### プロジェクトドキュメント

- **[機能仕様書](https://github.com/J1921604/ValueScope/blob/main/specs/001-ValueScope/spec.md)**: ユーザーストーリー、機能要件、成功基準
- **[実装計画書](https://github.com/J1921604/ValueScope/blob/main/specs/001-ValueScope/plan.md)**: 技術選定、アーキテクチャ設計
- **[タスクリスト](https://github.com/J1921604/ValueScope/blob/main/specs/001-ValueScope/tasks.md)**: 実装タスク一覧、ガントチャート
- **[完全仕様書](https://github.com/J1921604/ValueScope/blob/main/docs/完全仕様書.md)**: AI再現用実装詳細（計算式、データモデル、テスト仕様）
- **[デプロイガイド](https://github.com/J1921604/ValueScope/blob/main/docs/DEPLOY_GUIDE.md)**: GitHub Pagesデプロイ手順

## 📋 主要機能

### ✅ 企業価値指標の可視化（MVP）
- ✅ 企業価値（EV）とEV/EBITDA倍率の計算
- ✅ PER（株価収益率）、PBR（株価純資産倍率）の表示
- ✅ 時価総額と純有利子負債の可視化
- ✅ 3社選択UI（東京電力HD、中部電力、JERA）
- ✅ 期間フィルタボタン（Q1/Q2/Q3/Q4/Annual）（UI実装完了、データ統合待ち）

### ✅ KPIスコアカード（電力業界特化）
- ✅ **ROIC（投下資本利益率）**: 投下資本効率の信号機評価（緑≥5%, 黄≥3%, 赤<3%、max 15%）
  - 実績最大値: 13.84%（JERA 2022年）、業界標準: 7-10%
- ✅ **WACC（加重平均資本コスト）**: 資金調達コストの信号機評価（緑<4%, 黄<5%, 赤≥5%、max 6%）
  - 低いほど良い指標（逆転判定）、業界標準: 3-5%
- ✅ **EBITDAマージン**: 営業キャッシュ創出力の信号機評価（緑≥15%, 黄≥10%, 赤<10%、max 30%）
  - 業界平均: 15-25%（燃料費変動の影響大）
- ✅ **FCFマージン**: フリーキャッシュフロー効率の信号機評価（緑≥5%, 黄≥0%, 赤<0%、max 25%）
  - 実績最大値: 21.88%（中部電力 2017年）、業界標準: 10-15%
- ✅ 閾値はv1.0.0で電力業界特性を反映（実データに基づくmax値設定）
- ✅ 前期比変動表示（矢印+パーセンテージ）
- ✅ ツールチップ説明
- ✅ デバッグログとエラーハンドリング強化（データフロー追跡、Null安全対応）

**max値設定根拠**:
- **ROIC max 15%**: 電力業界は設備投資型産業（インフラ）のため、業界平均7-10%。実績最大値13.84%（JERA 2022年）を考慮し、余裕を持たせて15%に設定。規制産業のため高ROICは稀。
- **WACC max 6%**: 低金利環境・安定事業特性により3-5%が一般的。6%超は資金調達コスト高と判断。
- **EBITDAマージン max 30%**: 電力業界平均15-25%。燃料費変動影響が大きいため、30%超は例外的。
- **FCFマージン max 25%**: 大規模設備投資により営業CF比率10-15%が標準。実績最大値21.88%（中部電力 2017年）を考慮し、余裕を持たせて25%に設定。

### 🔄 データ可視化
- ✅ スコアカード表示（信号機方式：青/黄/赤）
- ✅ **タブ切り替えUI**（EV分析/KPI分析/損益計算書/貸借対照表/CF計算書）
- ✅ **財務諸表ページ - 3社比較テーブル**：PL（損益計算書）、BS（貸借対照表）、CF（キャッシュフロー計算書）
  - ✅ 3社（TEPCO/CHUBU/JERA）横並び比較テーブル
  - ✅ 年度フィルタボタン（FY2015～FY2024を左→右の昇順1列で固定表示）
  - ✅ 会計年度ラベルは決算日を1年繰り下げたFY表記（例: 2025/03/31 → FY2024）
  - ✅ 全項目を日本語テーブル表示
  - ✅ XBRL_outputからCSVデータを動的読み込み
- ✅ 財務諸表テーブルはFY-1照合の不具合を解消し、常に正しい年度データを描画
- ✅ 固定ヘッダー（タブと年度ボタンを常時表示し、その下だけスクロール）
- ✅ **KPI分析タブ**：各社個別のKPI推移グラフ（過去10年、ROIC/WACC/EBITDAマージン/FCFマージン）
- ✅ **3社比較タブ**：企業価値指標3社比較テーブル + 3社重ね合わせ推移グラフ（ROIC/WACC/EBITDAマージン/FCFマージン）
- ✅ 推移グラフ（時系列）（10年分KPI推移、年ラベル表示、凡例トグル）
- ✅ KPIゲージチャート（180度=100%の半円ゲージで閾値を可視化、WACC逆転判定対応）

### ⏳ 同業他社ベンチマーク（将来実装）
- ⏳ 業界平均との比較
- ⏳ ランキング表示
- ⏳ 相対評価

### ✅ EDINET API連携
- ✅ XBRL ZIPファイル解析（lxml + pandas）
- ✅ 貸借対照表・損益計算書・キャッシュフロー計算書の自動解析
- ✅ **XBRL全項目抽出とCSV出力**（extract_xbrl_to_csv.py）
  - ✅ **会計年度自動計算**：決算日からFYを計算（2025-03-31 → FY2024）
  - TEPCO: FY2015～FY2024（10ファイル） → BS.csv, PL.csv, CF.csv
  - CHUBU: FY2015～FY2024（10ファイル） → BS.csv, PL.csv, CF.csv
  - JERA: FY2020～FY2024（5ファイル） → BS.csv, PL.csv, CF.csv
- ✅ データ品質検証とスキーマ検証（validate_thresholds.py）
- ✅ **過去10年分の実データ取得**（TEPCO 10件、CHUBU 10件、JERA 5件）
- ✅ EDINET API v2からのデータ自動取得（fetch_edinet.py --years 10）
- ✅ 期間別データ対応（Q1/Q2/Q3/Q4/Annual）
- ✅ **毎年7月1日のみEDINETデータ自動更新**（GitHub Actions）
- ✅ データ生成はローカルPythonスクリプトで完了させ、`public/data/*.json` をコミットしてからデプロイ（CIでは再取得しない）

## 📋 7つのコア原則（憲法準拠）

このプロジェクトは `.specify/memory/constitution.md` で定義された原則に従います：

1. **テスト駆動開発（TDD）**: カバレッジ目標 ユニット80%以上、E2E主要フロー100%
2. **セキュリティ最優先**: APIキーの環境変数管理、外部入力検証、依存関係脆弱性スキャン
3. **パフォーマンスの定量化**: LCP<2.5秒、TTI<2.0秒、初期バンドル<200KB（gzip後）
4. **データ品質の保証**: スキーマ検証、異常値検出、データ更新失敗時のIssue自動起票
5. **API/ライブラリ仕様の遵守**: EDINET API v2準拠、週次実行のみ、レート制限遵守
6. **バージョン固定とメンテナンス性**: 依存関係メジャー・マイナー固定、CHANGELOG.md追跡
7. **仕様と実装の分離**: 仕様ブランチ（001-ValueScope）と実装ブランチ（feature/impl-001-ValueScope）の分離

詳細は [constitution.md](https://github.com/J1921604/ValueScope/blob/main/.specify/memory/constitution.md) を参照してください。

## 🛠️ 技術スタック

### フロントエンド
- **React 18.2** + **TypeScript 5.3** (UIライブラリ、型安全性)
- **Vite 5.0** (高速ビルドツール)
- **Recharts 2.10** (チャート描画ライブラリ)
- **Tailwind CSS 3.4** (Cyberpunk Neumorphism デザイン)

### バックエンド（データ処理）
- **Python 3.11**
- **pandas 2.1** (データ処理)
- **lxml 5.2** (XBRL解析)
- **beautifulsoup4 4.12** (HTML/XMLパース)
- **requests 2.31** (HTTP クライアント)

### デプロイ・CI/CD
- **GitHub Pages** (静的サイトホスティング)
- **GitHub Actions** (自動ビルド・デプロイ、週次データ更新)

### デザインシステム
- **テーマ**: Cyberpunk Neumorphism
- **カラー**: ダーク基調（#0A0F0F）+ ネオングリーン（#00FF84）+ サイバーブルー（#00D4FF）

## 📁 プロジェクト構造

```
ValueScope/
├── .github/
│   ├── workflows/
│   │   ├── deploy-pages.yml          # GitHub Pagesデプロイ（データはローカル生成前提）
│   │   └── update-valuation.yml      # 週次データ更新ワークフロー
│   └── copilot-commit-message-instructions.md
├── .specify/
│   └── memory/                       # プロジェクト憲法ほかナレッジ
├── AI_input/                         # 市場調査メモ・参考資料
├── docs/
│   ├── DEPLOY_GUIDE.md               # デプロイ手順
│   └── 完全仕様書.md
├── public/
│   └── data/                         # コミット済みの公開用JSON
│       ├── kpi_targets.json
│       ├── scorecards.json
│       ├── timeseries.json
│       └── valuation.json
├── scripts/                          # EDINETデータ処理スクリプト
│   ├── fetch_edinet.py
│   ├── parse_edinet_xbrl.py
│   ├── extract_xbrl_to_csv.py        # XBRL全解析 - PL/BS/CF CSV出力
│   ├── build_timeseries.py
│   ├── build_valuation.py
│   ├── compute_scores.py
│   └── requirements.txt
├── src/                              # React + TypeScript フロントエンド
│   ├── components/
│   │   ├── BalanceSheet.tsx          # 貸借対照表ページ
│   │   ├── CashFlowStatement.tsx     # キャッシュフロー計算書ページ
│   │   ├── ComparisonTable.tsx
│   │   ├── KPIGauge.tsx
│   │   ├── MultiCompanyEVChart.tsx
│   │   ├── MultiCompanyTrendChart.tsx
│   │   ├── ProfitLossStatement.tsx   # 損益計算書ページ
│   │   ├── ScoreCard.tsx
│   │   ├── ThresholdEditor.tsx     # 旧閾値UI（v1.0.0では未使用）
│   │   ├── TrendChart.tsx
│   │   └── ValuationTable.tsx
│   ├── hooks/
│   │   ├── useAllScores.ts
│   │   ├── useAllValuations.ts
│   │   ├── useFinancialCSV.ts        # CSV読み込みカスタムフック
│   │   ├── useScores.ts
│   │   ├── useScores.test.ts
│   │   ├── useTimeseries.ts
│   │   └── useValuation.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── formatDate.ts
│   │   └── formatNumber.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── data/                             # 生データ（git管理対象外も含む）
│   └── edinet_parsed/
├── XBRL/                             # EDINET XBRLファイル（ZIPアーカイブ）
│   ├── E04498/                       # 東京電力HD
│   ├── E04502/                       # 中部電力
│   └── E34837/                       # JERA
├── XBRL_output/                      # XBRL解析結果（CSV形式）
│   ├── TEPCO/
│   │   ├── BS.csv                    # 貸借対照表
│   │   ├── PL.csv                    # 損益計算書
│   │   └── CF.csv                    # キャッシュフロー計算書
│   ├── CHUBU/
│   └── JERA/
├── tests/
│   └── e2e/
├── README.md
├── package.json
└── vite.config.ts
```

## ⚙️ セットアップ

### 前提条件
- **Node.js 20.x** 以上
- **Python 3.11** 以上
- **PowerShell 5.1** 以上（Windowsの場合）

### クイックスタート（推奨）

```powershell
# 依存関係インストール
npm install
pip install -r scripts/requirements.txt

# EDINET API から10年分の実データ取得（約5-10分）
py scripts/fetch_edinet.py --years 10

# XBRLデータ解析
py scripts/parse_edinet_xbrl.py

# 企業価値計算とスコアリング
py scripts/build_valuation.py
py scripts/compute_scores.py

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:5173 を開いて動作確認してください。

### 手動セットアップ

#### 1. リポジトリのクローン

```powershell
git clone https://github.com/J1921604/ValueScope.git
cd ValueScope
```

#### 2. 依存関係のインストール

```powershell
# フロントエンド
npm install

# バックエンド（Python）
pip install -r scripts/requirements.txt
```

#### 3. データ処理の実行

```powershell
# EDINET APIから10年分の実データ取得（約5-10分）
py -3.10 scripts/fetch_edinet.py --years 10

# 株価データ取得（Stooq API経由、pandas_datareader使用）
py -3.10 scripts/fetch_stock_prices.py

# XBRL解析
py -3.10 scripts/parse_edinet_xbrl.py

# 企業価値計算・時系列データ生成
py -3.10 scripts/build_timeseries.py

# KPIスコアリング
py -3.10 scripts/compute_scores.py
```

データは `data/` フォルダに保存され、`public/data/` にコピーされます。

#### 4. 開発サーバーの起動

```powershell
npm run dev
```

ブラウザで http://localhost:5173 にアクセスしてください。

### 本番ビルド

```powershell
# ビルド（dist/フォルダに出力）
npm run build

# プレビュー
npm run preview
```

## 開発ガイドライン

### ブランチ戦略

このプロジェクトは、憲法で定義されたブランチ戦略に従います。

#### 仕様ブランチ（mainブランチから派生）

```powershell
git checkout main
git checkout -b <番号>-<短い名前>
# 例: git checkout -b 001-valuescope-kpi-scorecard
```

仕様ブランチには、仕様書、計画書、タスクリストのみを含みます。

#### 実装ブランチ（仕様ブランチから派生）

```powershell
git checkout 001-<topic>
git checkout -b feature/impl-<番号>-<短い名前>
# 例: git checkout -b feature/impl-001-scorecard-ui
```

実装ブランチには、ソースコード、テスト、設定ファイルを含みます。

### コミットメッセージ

[.github/copilot-commit-message-instructions.md](https://github.com/J1921604/ValueScope/blob/main/.github/copilot-commit-message-instructions.md) に従ってConventional Commits規約でコミットメッセージを記述してください。

#### フォーマット

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Type

- **feat**: 新機能の追加
- **fix**: バグ修正
- **docs**: ドキュメントのみの変更
- **style**: コードの意味に影響しない変更
- **refactor**: バグ修正も機能追加もしないコード変更
- **perf**: パフォーマンスを向上させるコード変更
- **test**: 不足しているテストの追加や既存のテストの修正
- **build**: ビルドシステムや外部依存関係に影響する変更
- **ci**: CI設定ファイルやスクリプトの変更
- **chore**: その他の変更

#### 例

```
feat(scorecard): KPIゲージコンポーネントを追加

Rechartsを使用してROE、自己資本比率、DSCRのゲージを実装。
信号機方式（青/黄/赤）で閾値判定を表示。
```

### 作業順序

1. 憲法の確認（[constitution.md](https://github.com/J1921604/ValueScope/blob/main/.specify/memory/constitution.md)）
2. 仕様書の作成（[spec.md](https://github.com/J1921604/ValueScope/blob/main/specs/001-ValueScope/spec.md)）
3. 実装計画の策定（[plan.md](https://github.com/J1921604/ValueScope/blob/main/specs/001-ValueScope/plan.md)）
4. タスクリストの作成（[tasks.md](https://github.com/J1921604/ValueScope/blob/main/specs/001-ValueScope/tasks.md)）
5. 検証とテストの実施（テストファースト）
6. 実装とコード作成
7. レビューとマージ

## 🧪 テスト

### ユニットテスト（Vitest）

```powershell
# 全テスト実行
npm run test

# カバレッジ付き
npm run test:coverage
```

目標カバレッジ: **80%以上**（憲法準拠）

**テスト対象**:
- 企業価値計算ロジック（EV、EV/EBITDA、PER、PBR）
- KPIスコアリングロジック（ROIC、WACC、EBITDAマージン、FCFマージン、電力業界特化）
- 閾値判定ロジック
- 異常値検出

### E2Eテスト（Playwright）

```powershell
# E2Eテスト実行
npm run test:e2e

# ヘッドレスモード
npm run test:e2e:headless
```

主要フローは **100%カバー**（憲法準拠）

**テストシナリオ**:
- スコアカード表示
- KPIゲージ表示
- 推移グラフ表示
- 期間フィルタ切り替え

## 🌐 デプロイ

### GitHub Pagesへの自動デプロイ

`main`ブランチにpushすると、GitHub Actionsが自動的にビルド・デプロイします。

> 🚧 **データファイルの扱いについて**  
> CIは `public/data/*.json` を検証するだけで再生成しません。ローカルでEDINETデータを更新し終えてから `public/data` をコミット → `git push` する運用に必ず統一してください。

```powershell
# 実装ブランチで作業
git add .
git commit -m "feat(scorecard): スコアカードコンポーネント実装"
git push origin feature/impl-001-valuescope-kpi-scorecard

# プルリクエスト作成後、mainにマージするとデプロイ
```

デプロイ後、https://j1921604.github.io/ValueScope/ でアクセスできます。

### 手動ビルド

```powershell
npm run build
```

`dist/`フォルダに静的ファイルが生成されます。

## パフォーマンス基準

憲法で定義されたパフォーマンス基準を遵守します。

### フロントエンド

- **LCP（Largest Contentful Paint）**: < 2.5秒
- **TTI（Time to Interactive）**: < 2.0秒
- **初期バンドルサイズ**: gzip後 < 200KB
- **チャート再描画**: < 200ms
- **Lighthouseスコア**: ≥ 90

### バックエンド（データ処理）

- **XBRL/CSV解析（2社分）**: < 60秒
- **企業価値計算（全指標）**: < 10秒
- **データ検証**: < 5秒

## セキュリティ基準

憲法で定義されたセキュリティ基準を遵守します。

### API キー管理

- EDINET APIキーは **GitHub Secrets** で管理
- 環境変数経由でのみアクセス
- `.env`ファイルは`.gitignore`に必ず含める

### 外部入力検証

- XBRL/CSVデータは必ずバリデーション
- 異常値検出を自動化
- スキーマ違反時はデプロイを中止

### 依存関係管理

- GitHub Dependabotで脆弱性スキャン自動実行
- 週次でセキュリティアップデート確認

## データモデル

### 企業価値データ（valuation.json）

```typescript
interface ValuationData {
  asOf: string;                    // データ基準日（ISO 8601形式）
  companies: {
    [key: string]: {
      marketCap: number;           // 時価総額
      totalDebt: number;           // 有利子負債合計
      cash: number;                // 現金及び現金同等物
      enterpriseValue: number;     // 企業価値（EV）
      ebitda: number;              // EBITDA
      evEbitda: number;            // EV/EBITDA倍率
      eps: number;                 // EPS（1株当たり利益）
      per: number;                 // PER（株価収益率）
      bps: number;                 // BPS（1株当たり純資産）
      pbr: number;                 // PBR（株価純資産倍率）
      dividendYield: number;       // 配当利回り（%）
    };
  };
}
```

### KPIスコアカード（scorecards.json）

```typescript
interface Score {
  value: number;                   // 実績値
  score: 'green' | 'yellow' | 'red'; // 信号機評価
  change: number;                  // 前期比変動
}

interface Scorecard {
  asOf: string;                    // データ基準日
  [company: string]: {
    ROE: Score;                    // 自己資本利益率
    equityRatio: Score;            // 自己資本比率
    DSCR: Score;                   // 債務返済能力指標
    evEbitda: Score;               // EV/EBITDA倍率
  };
}
```

## 今後の拡張予定

- [ ] 同業他社ベンチマーク機能
- [ ] シナリオ分析（What-If）
- [ ] PDF財務諸表の自動OCR
- [ ] アラート機能（閾値違反時）
- [ ] Slack/Discord通知連携

## ライセンス

MIT License

---

**Last Updated**: 2025-12-15  
**Version**: 1.0.0

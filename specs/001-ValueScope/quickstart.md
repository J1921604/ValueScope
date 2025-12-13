# クイックスタートガイド: ValueScope

**バージョン**: 1.0.0  
**作成日**: 2025-12-15  
**対象**: 開発者・コントリビューター  
**リポジトリ**: https://github.com/J1921604/ValueScope

---

## 📋 目次

1. [5分でローカル起動](#5分でローカル起動)
2. [開発環境セットアップ](#開発環境セットアップ)
3. [データ生成](#データ生成)
4. [テスト実行](#テスト実行)
5. [ビルドとプレビュー](#ビルドとプレビュー)
6. [GitHub Pagesデプロイ](#github-pagesデプロイ)
7. [トラブルシューティング](#トラブルシューティング)

---

## 🚀 5分でローカル起動

### 前提条件

以下がインストール済みであることを確認してください:

- ✅ **Node.js 20.x以上**
- ✅ **npm 10.x以上**
- ✅ **Python 3.10.11**
- ✅ **Git**

### ステップ1: リポジトリクローン

```powershell
git clone https://github.com/J1921604/ValueScope.git
cd ValueScope
```

### ステップ2: 依存関係インストール

**Node.js依存関係**:

```powershell
npm install
```

**Python依存関係**:

```powershell
pip install -r scripts/requirements.txt
```

### ステップ3: ワンコマンド起動

```powershell
.\start.ps1
```

自動的にブラウザで http://localhost:5173/ValueScope/ が開きます。

---

## 🛠️ 開発環境セットアップ

### エディタ設定

**推奨エディタ**: Visual Studio Code

**推奨拡張機能**:

- ESLint
- Prettier - Code formatter
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- Python

### 環境変数設定（オプション）

EDINET APIキーが必要な場合（データ更新時）:

```powershell
# .env ファイルを作成
echo "EDINET_API_KEY=your_api_key_here" > .env
```

> ⚠️ **注意**: `.env` ファイルは `.gitignore` に含まれています。GitHub Secretsでも管理可能。

---

## 📊 データ生成

### 初回データ生成（EDINET XBRL + 株価）

```powershell
# 1. EDINET APIからXBRL取得（過去10年分）
py -3.10 scripts/fetch_edinet.py --years 10

# 2. XBRL解析
py -3.10 scripts/parse_edinet_xbrl.py

# 3. XBRL→CSV変換（PL 256項目、BS 233項目、CF 70項目）
py -3.10 scripts/extract_xbrl_to_csv.py

# 4. 株価取得（Stooq API）
py -3.10 scripts/fetch_stock_prices.py --years 10

# 5. 時系列データ生成
py -3.10 scripts/build_timeseries.py

# 6. 企業価値計算
py -3.10 scripts/build_valuation.py

# 7. KPIスコア計算
py -3.10 scripts/compute_scores.py
```

**所要時間**: 約5-10分（EDINET API取得含む）

### データ更新（株価のみ）

```powershell
# 株価データ更新
py -3.10 scripts/fetch_stock_prices.py --years 10

# データ再計算
py -3.10 scripts/build_valuation.py
py -3.10 scripts/compute_scores.py
```

**所要時間**: 約1-2分

### 生成されるファイル

```
public/data/
├── timeseries.json      # 時系列データ（KPI推移）
├── valuation.json       # 企業価値データ
├── scorecards.json      # KPIスコアカード
├── kpi_targets.json     # KPI閾値定義（固定）
└── employees.json       # 従業員情報

XBRL_output/
├── TEPCO/
│   ├── PL.csv           # 損益計算書（256項目）
│   ├── BS.csv           # 貸借対照表（233項目）
│   └── CF.csv           # キャッシュフロー計算書（70項目）
├── CHUBU/
└── JERA/

data/prices/
├── 9501.T.csv           # 東京電力HD株価
└── 9502.T.csv           # 中部電力株価
```

---

## 🧪 テスト実行

### ユニットテスト

```powershell
# テスト実行
npm run test

# カバレッジ付きテスト
npm run test:coverage
```

**目標**: カバレッジ80%以上

### E2Eテスト（Playwright）

```powershell
# ヘッドレスモード
npm run test:e2e

# UIモード（ブラウザ表示）
npm run test:e2e:ui
```

**対象フロー**:

- 企業価値指標表示
- KPIスコアカード表示
- 推移グラフ表示
- 財務諸表表示
- 従業員情報表示

### E2Eテスト（Selenium + pytest）

```powershell
# 全テスト実行
py -3.10 -m pytest tests/e2e_selenium/ -v

# 特定テスト実行
py -3.10 -m pytest tests/e2e_selenium/test_employee_info.py -v
```

---

## 📦 ビルドとプレビュー

### 開発サーバー起動

```powershell
npm run dev
```

→ http://localhost:5173/ValueScope/

### 本番ビルド

```powershell
npm run build
```

**出力先**: `dist/`

### ビルドプレビュー

```powershell
npm run preview
```

→ http://localhost:4173/ValueScope/

### ビルド検証

```powershell
# dist/内のファイル確認
ls dist/data/

# JSONファイル存在確認
Test-Path dist/data/timeseries.json
Test-Path dist/data/valuation.json
Test-Path dist/data/scorecards.json
Test-Path dist/data/kpi_targets.json
Test-Path dist/data/employees.json
```

---

## 🚢 GitHub Pagesデプロイ

### 自動デプロイ（推奨）

1. **mainブランチにプッシュ**:

```powershell
git add .
git commit -m "feat: add new feature"
git push origin main
```

2. **GitHub Actions確認**:

https://github.com/J1921604/ValueScope/actions

3. **デプロイ完了確認**:

https://j1921604.github.io/ValueScope/

### 手動デプロイ

GitHub Actionsの「Run workflow」ボタンをクリック:

https://github.com/J1921604/ValueScope/actions/workflows/deploy-pages.yml

### デプロイ前チェックリスト

- ✅ ローカルで `npm run build` が成功
- ✅ `npm run preview` でビルド成果物が正常動作
- ✅ `npm run test` がすべてパス
- ✅ `npm run test:e2e` がすべてパス
- ✅ `public/data/*.json` が最新データで更新済み

---

## 🐛 トラブルシューティング

### よくある問題

#### 1. `npm install` が失敗する

**原因**: Node.jsバージョン不一致

**解決策**:

```powershell
# Node.jsバージョン確認
node -v

# Node.js 20.x以上が必要
# 必要に応じてNode.jsを更新
```

#### 2. Pythonスクリプトが実行できない

**原因**: Python 3.10.11が見つからない

**解決策**:

```powershell
# Pythonバージョン確認
py -3.10 --version

# Python 3.10.11をインストール
# https://www.python.org/downloads/
```

#### 3. EDINET APIエラー（403 Forbidden）

**原因**: APIキーが未設定または無効

**解決策**:

```powershell
# .envファイルにAPIキーを設定
echo "EDINET_API_KEY=your_valid_api_key" > .env

# スクリプト再実行
py -3.10 scripts/fetch_edinet.py --years 10
```

#### 4. 株価データ取得エラー

**原因**: Stooq APIの一時的な障害

**解決策**:

```powershell
# リトライ実行
py -3.10 scripts/fetch_stock_prices.py --years 10

# 既存データで継続（エラー時）
npm run build
```

#### 5. ビルドエラー（型エラー）

**原因**: TypeScript型定義の不整合

**解決策**:

```powershell
# 型チェック
npm run type-check

# エラー箇所を修正後、再ビルド
npm run build
```

#### 6. E2Eテスト失敗

**原因**: Playwrightブラウザ未インストール

**解決策**:

```powershell
# Playwrightブラウザインストール
npx playwright install

# テスト再実行
npm run test:e2e
```

#### 7. GitHub Pages 404エラー

**原因**: `vite.config.ts` の `base` 設定ミス

**確認**:

```typescript
// vite.config.ts
export default defineConfig({
  base: '/ValueScope/', // リポジトリ名と一致
});
```

**解決策**:

```powershell
# 修正後、再ビルド・デプロイ
npm run build
git add .
git commit -m "fix: update base path"
git push origin main
```

---

## 📚 次のステップ

### 開発を始める

1. ✅ [機能仕様書](https://github.com/J1921604/ValueScope/blob/main/specs/001-ValueScope/spec.md) を読む
2. ✅ [データモデル仕様書](https://github.com/J1921604/ValueScope/blob/main/specs/001-ValueScope/data-model.md) を理解する
3. ✅ [タスクリスト](https://github.com/J1921604/ValueScope/blob/main/specs/001-ValueScope/tasks.md) で実装状況を確認
4. 🔄 新機能を実装し、テストを追加
5. 🚀 プルリクエストを作成

### ドキュメント

- [README.md](https://github.com/J1921604/ValueScope/blob/main/README.md): プロジェクト概要
- [完全仕様書](https://github.com/J1921604/ValueScope/blob/main/docs/完全仕様書.md): AI再現用完全実装仕様
- [デプロイガイド](https://github.com/J1921604/ValueScope/blob/main/docs/DEPLOY_GUIDE.md): GitHub Pagesデプロイ詳細

### コミュニティ

- **Issues**: https://github.com/J1921604/ValueScope/issues
- **Pull Requests**: https://github.com/J1921604/ValueScope/pulls
- **Discussions**: https://github.com/J1921604/ValueScope/discussions

---

## 📝 チートシート

### よく使うコマンド

```powershell
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# テスト
npm run test

# E2Eテスト
npm run test:e2e

# Lint
npm run lint

# 型チェック
npm run type-check

# データ更新（株価のみ）
py -3.10 scripts/fetch_stock_prices.py --years 10
py -3.10 scripts/build_valuation.py
py -3.10 scripts/compute_scores.py

# データ更新（EDINET含む）
py -3.10 scripts/fetch_edinet.py --years 10
py -3.10 scripts/parse_edinet_xbrl.py
py -3.10 scripts/extract_xbrl_to_csv.py
py -3.10 scripts/build_timeseries.py
py -3.10 scripts/build_valuation.py
py -3.10 scripts/compute_scores.py
```

### ディレクトリ構成

```
ValueScope/
├── src/              # Reactアプリケーション
├── scripts/          # Pythonデータ処理
├── public/data/      # 公開JSONデータ
├── XBRL_output/      # XBRL解析CSVファイル
├── tests/            # テストコード
├── docs/             # ドキュメント
└── specs/            # 仕様書
```

---

**おめでとうございます！🎉** ValueScopeの開発環境がセットアップ完了しました。

質問やフィードバックは [GitHub Issues](https://github.com/J1921604/ValueScope/issues) でお気軽にどうぞ！

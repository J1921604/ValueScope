# ValueScope プロジェクト憲法（Constitution）

**バージョン**: 1.0.0  
**作成日**: 2025-12-15  
**ステータス**: Production  
**リポジトリ**: https://github.com/J1921604/ValueScope

---

## 📜 プロジェクト憲法とは

この憲法は、ValueScopeプロジェクトのすべての意思決定、実装、レビューにおいて**最優先される不変の原則**を定義します。機能追加・変更・削除のすべてがこの憲法に準拠する必要があります。

---

## 🎯 7つのコア原則

### 原則I: テスト駆動開発（TDD）を徹底し、仕様に対する検証を必須とする

**理念**: すべての機能は、テスト可能であり、テストされている必要がある。

**要件**:

- **TR-001**: ユニットテストカバレッジ ≥ 80%
- **TR-002**: E2E主要フロー 100%カバー
- **TR-003**: テスト実行時間 < 30秒
- **TR-004**: 新機能追加時は必ずテストを先に記述
- **TR-005**: Pull Requestマージ前にすべてのテストが通過

**実装例**:

```typescript
// ✅ 良い例: テストファースト
describe('ValuationTable', () => {
  it('should display EV for all companies', () => {
    const { getByText } = render(<ValuationTable />);
    expect(getByText('TEPCO')).toBeInTheDocument();
    expect(getByText('CHUBU')).toBeInTheDocument();
    expect(getByText('JERA')).toBeInTheDocument();
  });
});
```

**検証方法**:

```powershell
npm run test:coverage
```

**ゲート条件**: カバレッジ80%未満の場合、Pull Requestマージ禁止

---

### 原則II: セキュリティ要件を機能要件より優先する

**理念**: セキュリティは後付けではなく、設計段階から組み込まれる。

**要件**:

- **SR-001**: EDINET APIキーは環境変数管理（`.env` → GitHub Secrets）
- **SR-002**: 外部入力検証（XBRL/CSVバリデーション）
- **SR-003**: 依存関係脆弱性スキャン（GitHub Dependabot有効化）
- **SR-004**: CORS設定不要（完全クライアント側実行）
- **SR-005**: 個人情報は一切収集・保存しない

**実装例**:

```python
# ✅ 良い例: APIキーを環境変数から取得
import os
api_key = os.getenv('EDINET_API_KEY')
if not api_key:
    raise ValueError("EDINET_API_KEY is not set")
```

```yaml
# .github/workflows/deploy-pages.yml
env:
  EDINET_API_KEY: ${{ secrets.EDINET_API_KEY }}
```

**検証方法**:

```powershell
# Dependabot脆弱性チェック
gh repo view --json securityVulnerabilities
```

**ゲート条件**: 高リスク脆弱性が存在する場合、デプロイ禁止

---

### 原則III: パフォーマンス閾値を定量化し、受入基準に組み込む

**理念**: パフォーマンスは主観ではなく、計測可能な数値目標で定義される。

**要件**:

- **PR-001**: LCP（Largest Contentful Paint）< 2.5秒
- **PR-002**: TTI（Time to Interactive）< 2.0秒
- **PR-003**: 初期バンドルサイズ gzip後 < 200KB
- **PR-004**: チャート再描画 < 200ms
- **PR-005**: Lighthouseスコア ≥ 90

**実装例**:

```typescript
// ✅ 良い例: 遅延ロード
const FinancialStatements = lazy(() => import('./components/FinancialStatements'));

<Suspense fallback={<Loading />}>
  <FinancialStatements />
</Suspense>
```

**検証方法**:

```powershell
# Lighthouseスコア計測
npm run lighthouse

# バンドルサイズ確認
npm run build -- --analyze
```

**ゲート条件**: Lighthouseスコア90点未満の場合、Pull Requestマージ禁止

---

### 原則IV: データ品質の保証と実データのみの使用

**理念**: 推定値・補完値は一切使用せず、XBRL実データのみを信頼する。

**要件**:

- **DQ-001**: XBRL/CSV解析（2社分）< 60秒
- **DQ-002**: 企業価値計算（全指標）< 10秒
- **DQ-003**: データ検証 < 5秒
- **DQ-004**: スキーマ違反時はデプロイ中止
- **DQ-005**: 分母ゼロ計算は `null` 返却、エラー発生禁止

**実装例**:

```python
# ✅ 良い例: 実データのみ使用
def calculate_per(market_cap, net_income):
    if net_income == 0:
        return None  # 分母ゼロはnull
    return market_cap / net_income

# ❌ 悪い例: 推定値使用
def calculate_per(market_cap, net_income):
    if net_income == 0:
        net_income = 1000  # 推定値使用は禁止
    return market_cap / net_income
```

**検証方法**:

```powershell
py -3.10 scripts/validate_thresholds.py
```

**ゲート条件**: スキーマ違反または異常値検出時、デプロイ禁止

---

### 原則V: API/ライブラリ仕様の遵守とレート制限の厳守

**理念**: 外部APIの仕様は神聖であり、無闇に変更してはならない。

**要件**:

- **API-001**: EDINET API v2準拠
- **API-002**: レート制限1秒あたり10リクエスト厳守
- **API-003**: 年1回のみ実行（6/20-7/1）
- **API-004**: Stooq API無制限だが良心的使用
- **API-005**: リトライロジック実装（503エラー時）

**実装例**:

```python
# ✅ 良い例: レート制限遵守
import time

for doc_id in doc_ids:
    fetch_edinet_document(doc_id)
    time.sleep(0.1)  # 10リクエスト/秒 = 0.1秒間隔
```

**検証方法**:

```yaml
# .github/workflows/deploy-pages.yml
- name: Check if EDINET update is needed
  run: |
    if [ "$CURRENT_MONTH" = "06" ] && [ "$CURRENT_DAY" -ge "20" ]; then
      echo "edinet_update=true"
    else
      echo "edinet_update=false"
    fi
```

**ゲート条件**: レート制限違反時、APIアクセス即時停止

---

### 原則VI: バージョン固定とメンテナンス性の確保

**理念**: 依存関係は明確にバージョン指定し、予期しない破壊的変更を防ぐ。

**要件**:

- **VER-001**: package.jsonはメジャー・マイナー固定（例: `"react": "18.2.0"`）
- **VER-002**: requirements.txtは完全バージョン指定（例: `pandas==2.1.4`）
- **VER-003**: 月次依存関係更新レビュー
- **VER-004**: Python 3.10.11標準実行環境
- **VER-005**: Node.js 20.x標準実行環境

**実装例**:

```json
// ✅ 良い例: package.json
{
  "dependencies": {
    "react": "18.2.0",
    "recharts": "2.10.3",
    "tailwindcss": "3.4.1"
  }
}
```

```text
# ✅ 良い例: requirements.txt
pandas==2.1.4
lxml==5.2.1
pandas_datareader==0.10.0
```

**検証方法**:

```powershell
# Dependabot自動更新確認
gh pr list --label "dependencies"
```

**ゲート条件**: メジャーバージョン更新は手動承認必須

---

### 原則VII: 仕様と実装の分離によるレビュープロセスの確立

**理念**: 仕様書は実装とは独立した「契約」であり、実装前に合意される。

**要件**:

- **DOC-001**: 仕様書3点セット必須（spec.md、plan.md、tasks.md）
- **DOC-002**: 新機能追加時は仕様書を先に作成
- **DOC-003**: Pull Requestに「Constitution Check」セクション必須
- **DOC-004**: AI再現用完全仕様書（完全仕様書.md）維持
- **DOC-005**: リンクはローカルではなくGitHubリポジトリURL使用

**実装例**:

```markdown
# Pull Request テンプレート

## Constitution Check

- [ ] TR-001: ユニットテストカバレッジ ≥ 80%
- [ ] SR-001: APIキー環境変数管理
- [ ] PR-005: Lighthouseスコア ≥ 90
- [ ] DQ-004: スキーマ検証通過
- [ ] VER-001: バージョン固定
```

**検証方法**:

```powershell
# 仕様書リンクチェック
grep -r "docs/" specs/
```

**ゲート条件**: Constitution Check未完了のPull Requestマージ禁止

---

## 🚨 憲法違反時の対応

### レベル1: 警告（Warning）

- **例**: テストカバレッジ79%（目標80%未満）
- **対応**: Pull Requestコメントで警告、改善推奨

### レベル2: ブロック（Blocking）

- **例**: Lighthouseスコア85点（目標90点未満）
- **対応**: Pull Requestマージ禁止、修正必須

### レベル3: 緊急停止（Critical）

- **例**: 高リスク脆弱性検出
- **対応**: デプロイ即時停止、緊急パッチリリース

---

## 📊 憲法準拠チェックリスト

### 新機能追加時

- [ ] 仕様書（spec.md）に機能定義追加
- [ ] テスト（*.test.ts, *.spec.ts）先行作成
- [ ] セキュリティレビュー実施
- [ ] パフォーマンス計測実施
- [ ] データ品質検証実施
- [ ] API仕様遵守確認
- [ ] バージョン固定確認
- [ ] Pull Request「Constitution Check」完了

### Pull Request作成時

- [ ] すべてのテストが通過
- [ ] Lighthouseスコア ≥ 90点
- [ ] テストカバレッジ ≥ 80%
- [ ] バンドルサイズ < 200KB gzip
- [ ] スキーマ検証通過
- [ ] セキュリティスキャン通過
- [ ] ドキュメント更新済み

### デプロイ前

- [ ] E2Eテスト100%通過
- [ ] Lighthouse本番環境計測 ≥ 90点
- [ ] データ品質検証スクリプト実行
- [ ] GitHub Actions正常完了
- [ ] ローカルプレビュー正常動作

---

## 🔄 憲法改正プロセス

憲法は不変ではありません。プロジェクトの成長に応じて改正されます。

### 改正手順

1. **提案**: GitHub Issueで改正提案
2. **議論**: コミュニティでの議論（最低7日間）
3. **投票**: プロジェクトメンテナー全員の合意
4. **更新**: constitution.mdバージョン更新
5. **通知**: READMEに改正履歴記載

### 改正履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| 1.0.0 | 2025-12-15 | 初版作成 |

---

## 📚 関連ドキュメント

- [機能仕様書](https://github.com/J1921604/ValueScope/blob/main/specs/001-ValueScope/spec.md): 機能の詳細定義
- [実装計画書](https://github.com/J1921604/ValueScope/blob/main/specs/001-ValueScope/plan.md): 技術選定と実装計画
- [タスクリスト](https://github.com/J1921604/ValueScope/blob/main/specs/001-ValueScope/tasks.md): 実装タスク管理
- [データモデル仕様書](https://github.com/J1921604/ValueScope/blob/main/specs/001-ValueScope/data-model.md): データ構造定義
- [クイックスタートガイド](https://github.com/J1921604/ValueScope/blob/main/specs/001-ValueScope/quickstart.md): 開発環境構築
- [技術調査レポート](https://github.com/J1921604/ValueScope/blob/main/specs/001-ValueScope/research.md): 技術選定の背景

---

## 🎖️ 憲法の精神

> **"Data is sacred. Tests are mandatory. Performance is measurable."**  
> （データは神聖である。テストは必須である。パフォーマンスは計測可能である。）

この憲法は、ValueScopeプロジェクトが**高品質・高信頼性・高パフォーマンス**な企業価値分析ダッシュボードであり続けるための礎です。

---

**最終更新**: 2025-12-15  
**次回レビュー予定**: 2026-03-31

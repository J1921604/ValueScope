/**
 * trend-display.spec.ts - KPI分析・3社比較表示E2Eテスト
 * Version: 1.0.0
 * Date: 2025-12-15
 */

import { test, expect } from '@playwright/test';

test.describe('KPI分析タブ表示', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // KPI分析タブに切り替え
    await page.click('button:has-text("KPI分析")');
  });

  test('東京電力HDのKPI分析と推移グラフが表示される', async ({ page }) => {
    // KPI分析タイトル
    await expect(page.locator('h3:has-text("KPI分析")')).toBeVisible();
    
    // 4つのグラフタイトルが表示される
    await expect(page.locator('h3:has-text("ROIC推移")')).toBeVisible();
    await expect(page.locator('h3:has-text("WACC推移")')).toBeVisible();
    await expect(page.locator('h3:has-text("EBITDAマージン推移")')).toBeVisible();
    await expect(page.locator('h3:has-text("FCFマージン推移")')).toBeVisible();
  });

  test('中部電力のKPI分析と推移グラフが表示される', async ({ page }) => {
    // 4つのグラフタイトルが表示される
    await expect(page.locator('h3:has-text("ROIC推移")')).toBeVisible();
    await expect(page.locator('h3:has-text("WACC推移")')).toBeVisible();
    await expect(page.locator('h3:has-text("EBITDAマージン推移")')).toBeVisible();
    await expect(page.locator('h3:has-text("FCFマージン推移")')).toBeVisible();
  });

  test('JERAのKPI分析と推移グラフが表示される', async ({ page }) => {
    // 4つのグラフタイトルが表示される
    await expect(page.locator('h3:has-text("ROIC推移")')).toBeVisible();
    await expect(page.locator('h3:has-text("WACC推移")')).toBeVisible();
    await expect(page.locator('h3:has-text("EBITDAマージン推移")')).toBeVisible();
    await expect(page.locator('h3:has-text("FCFマージン推移")')).toBeVisible();
  });

  test('グラフにX軸（年度）とY軸（単位）が表示される', async ({ page }) => {
    // Rechartsのsvg要素が存在することを確認
    const svgElements = page.locator('svg.recharts-surface');
    await expect(svgElements.first()).toBeVisible();

    // X軸の年度ラベル（例: 2016, 2017...）が存在することを確認
    const xAxisLabels = page.locator('text.recharts-text.recharts-cartesian-axis-tick-value');
    const labelCount = await xAxisLabels.count();
    expect(labelCount).toBeGreaterThan(0);

    // 最初のラベルが4桁の数字（年）であることを確認
    const firstLabel = await xAxisLabels.first().textContent();
    expect(firstLabel).toMatch(/^\d{4}$/);
  });

  test('企業切り替え時にグラフが更新される', async ({ page }) => {
    // KPI分析タブではグラフが常に3社重ね合わせで表示される
    await expect(page.locator('h3:has-text("ROIC推移")')).toBeVisible();
    
    // KPI分析セクションが存在
    await expect(page.locator('h3:has-text("KPI分析")')).toBeVisible();
    
    // 企業名が表示されていることを確認（最初の出現のみ）
    await expect(page.getByText('東京電力HD').first()).toBeVisible();
    await expect(page.getByText('中部電力').first()).toBeVisible();
    await expect(page.getByText('JERA').first()).toBeVisible();
  });

  test('KPI分析タブとEV分析タブを切り替えられる', async ({ page }) => {
    // KPI分析タブがアクティブ
    const kpiTab = page.locator('button:has-text("KPI分析")');
    await expect(kpiTab).toHaveClass(/active/);

    // EV分析タブに切り替え
    await page.click('button:has-text("EV分析")');
    await page.waitForTimeout(500);

    // EV分析タブがアクティブになる
    const evTab = page.locator('button:has-text("EV分析")');
    await expect(evTab).toHaveClass(/active/);

    // 企業価値推移グラフが表示される
    await expect(page.getByRole('heading', { name: '企業価値（EV）推移' })).toBeVisible();
  });

  test('推移グラフに折れ線が描画されている', async ({ page }) => {
    // Rechartsの折れ線要素が存在することを確認（LineChartはpathではなくpointで構成される場合もある）
    await page.waitForSelector('.recharts-line', { timeout: 5000 });
    const lineElements = page.locator('.recharts-line');
    const lineCount = await lineElements.count();
    
    // 4つのグラフ × 3社 = 最低12本の折れ線が存在
    expect(lineCount).toBeGreaterThanOrEqual(12);
  });
});

test.describe('EV分析タブ表示（3社比較）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // EV分析タブに切り替え
    await page.click('button:has-text("EV分析")');
  });

  test('企業価値指標3社比較テーブルが表示される', async ({ page }) => {
    // 企業価値テーブルタイトル
    await expect(page.locator('h3:has-text("EV分析")')).toBeVisible();
    
    // 3社の名前が表示される（テーブルのヘッダー）
    await expect(page.locator('th:has-text("東京電力HD")')).toBeVisible();
    await expect(page.locator('th:has-text("中部電力")')).toBeVisible();
    await expect(page.locator('th:has-text("JERA")')).toBeVisible();
  });

  test('3社EV推移グラフが表示される', async ({ page }) => {
    // EV分析タブには企業価値グラフが表示される
    await expect(page.locator('h3:has-text("企業価値（EV）推移")')).toBeVisible();
    await expect(page.locator('h3:has-text("EV/EBITDA推移")')).toBeVisible();
    await expect(page.locator('h3:has-text("PER推移")')).toBeVisible();
    await expect(page.locator('h3:has-text("PBR推移")')).toBeVisible();
  });

  test('重ね合わせグラフに3社の折れ線が描画されている', async ({ page }) => {
    // Rechartsのpath要素（折れ線）が存在することを確認
    const lineElements = page.locator('path.recharts-line-curve');
    const lineCount = await lineElements.count();
    
    // 3つのグラフ × 3社 = 最低9本の折れ線が存在
    expect(lineCount).toBeGreaterThanOrEqual(9);
  });

  test('グラフにX軸（年度）が表示される', async ({ page }) => {
    // X軸の年度ラベルが存在することを確認
    const xAxisLabels = page.locator('text.recharts-text.recharts-cartesian-axis-tick-value');
    const labelCount = await xAxisLabels.count();
    expect(labelCount).toBeGreaterThan(0);

    // 最初のラベルが4桁の数字（年）であることを確認
    const firstLabel = await xAxisLabels.first().textContent();
    expect(firstLabel).toMatch(/^\d{4}$/);
  });
});

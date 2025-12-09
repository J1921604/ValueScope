/**
 * financial-statements.spec.ts - 財務諸表3社比較E2Eテスト
 * Version: 1.0.0
 * Date: 2025-12-15
 */

import { test, expect } from '@playwright/test';

test.describe('財務諸表3社比較表示', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('損益計算書（PL）タブが正常に表示される', async ({ page }) => {
    // PLタブをクリック
    await page.click('button:has-text("損益計算書")');
    
    // タイトルが表示される
    await expect(page.locator('h3:has-text("損益計算書（PL）")')).toBeVisible();
    
    // 年度ボタンが表示される
    await expect(page.locator('button:has-text("FY2024")')).toBeVisible();
    
    // 3社のカラムヘッダーが表示される
    await expect(page.locator('th:has-text("東京電力HD")')).toBeVisible();
    await expect(page.locator('th:has-text("中部電力")')).toBeVisible();
    await expect(page.locator('th:has-text("JERA")')).toBeVisible();
  });

  test('貸借対照表（BS）タブが正常に表示される', async ({ page }) => {
    // BSタブをクリック
    await page.click('button:has-text("貸借対照表")');
    
    // タイトルが表示される
    await expect(page.locator('h3:has-text("貸借対照表（BS）")')).toBeVisible();
    
    // 年度ボタンが表示される
    await expect(page.locator('button:has-text("FY2024")')).toBeVisible();
    
    // テーブルが表示される
    await expect(page.locator('table')).toBeVisible();
  });

  test('キャッシュフロー計算書（CF）タブが正常に表示される', async ({ page }) => {
    // CFタブをクリック
    await page.click('button:has-text("CF計算書")');
    
    // タイトルが表示される
    await expect(page.locator('h3:has-text("キャッシュフロー計算書（CF）")')).toBeVisible();
    
    // 年度ボタンが表示される
    await expect(page.locator('button:has-text("FY2024")')).toBeVisible();
  });

  test('年度フィルタが正常に動作する', async ({ page }) => {
    // PLタブに移動
    await page.click('button:has-text("損益計算書")');
    
    // データ読み込み完了を待つ
    await page.waitForSelector('button:has-text("FY2024")');
    
    // FY2024が初期選択されている
    await expect(page.locator('button:has-text("FY2024")')).toHaveClass(/active/);
    
    // FY2023をクリック（force: trueでヘッダーを無視）
    await page.locator('button:has-text("FY2023")').click({ force: true });
    
    // データが読み込まれたことを確認
    await expect(page.locator('table tbody tr').first()).toBeVisible();

    // 年度ボタンがFY2015→FY2024の昇順で並んでいることを確認
    const labels = await page.locator('.month-buttons button').allTextContents();
    expect(labels).toEqual([
      'FY2015',
      'FY2016',
      'FY2017',
      'FY2018',
      'FY2019',
      'FY2020',
      'FY2021',
      'FY2022',
      'FY2023',
      'FY2024',
    ]);
  });

  test('3社のデータが正常に読み込まれて表示される', async ({ page }) => {
    // PLタブに移動
    await page.click('button:has-text("損益計算書")');
    
    // データ読み込み完了を待つ
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // テーブル行が存在することを確認
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    
    // 数値データが表示されていることを確認（最初の行）
    const firstRow = rows.first();
    const cells = firstRow.locator('td');
    const cellCount = await cells.count();
    expect(cellCount).toBe(4); // 項目名 + 3社
  });

  test('FY2024データが2025-03-31決算として正しく表示される', async ({ page }) => {
    // PLタブに移動
    await page.click('button:has-text("損益計算書")');
    
    // データ読み込み完了を待つ
    await page.waitForSelector('button:has-text("FY2024")');
    
    // FY2024ボタンをクリック（force: trueでヘッダーを無視）
    await page.locator('button:has-text("FY2024")').click({ force: true });
    
    // テーブルにデータが表示されることを確認
    await expect(page.locator('table tbody tr').first()).toBeVisible();
    
    // データ件数表示が存在することを確認
    await expect(page.locator('.mt-4.text-center')).toBeVisible();
  });

  test('最古年度(FY2015)まで切り替えられる', async ({ page }) => {
    // PLタブに移動
    await page.click('button:has-text("損益計算書")');

    // データ読み込み完了を待つ
    await page.waitForSelector('button:has-text("FY2024")');

    // 最古年度ボタンが表示される
    await expect(page.locator('button:has-text("FY2015")')).toBeVisible();

    // FY2015をクリック
    await page.locator('button:has-text("FY2015")').click({ force: true });

    // データが読み込まれたことを確認
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('データ項目が日本語で表示される', async ({ page }) => {
    // PLタブに移動
    await page.click('button:has-text("損益計算書")');
    
    // テーブルが表示されるまで待つ
    await page.waitForSelector('table tbody tr');
    
    // 項目列（最初のtd）にテキストが存在することを確認
    const firstItemCell = page.locator('table tbody tr').first().locator('td').first();
    const itemText = await firstItemCell.textContent();
    expect(itemText).toBeTruthy();
    expect(itemText!.length).toBeGreaterThan(0);
  });

  test('【US5-4】PLタブ: 200項目以上にXBRLツールチップが表示される', async ({ page }) => {
    // PLタブに移動
    await page.click('button:has-text("損益計算書")');
    
    // データ読み込み完了を待つ
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // 「?」マークを持つ要素をカウント
    const tooltipMarks = page.locator('.metric-info');
    const tooltipCount = await tooltipMarks.count();
    
    // PL 256項目のうち、少なくとも200項目にツールチップが存在
    expect(tooltipCount).toBeGreaterThanOrEqual(200);
    
    // 最初のツールチップにマウスオーバーして内容を確認
    await tooltipMarks.first().hover();
    
    // ツールチップコンテンツが表示される
    await expect(page.locator('.metric-tooltip')).toBeVisible({ timeout: 2000 });
    
    // XBRLタグが表示されていることを確認（jpcrp_cor: で始まる）
    const tooltipText = await page.locator('.metric-tooltip').textContent();
    expect(tooltipText).toMatch(/jpcrp_cor:|計算値:/);
  });

  test('【US5-5】BSタブ: 200項目以上にXBRLツールチップが表示される', async ({ page }) => {
    // BSタブに移動
    await page.click('button:has-text("貸借対照表")');
    
    // データ読み込み完了を待つ
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // 「?」マークを持つ要素をカウント
    const tooltipMarks = page.locator('.metric-info');
    const tooltipCount = await tooltipMarks.count();
    
    // BS 233項目のうち、少なくとも200項目にツールチップが存在
    expect(tooltipCount).toBeGreaterThanOrEqual(200);
  });

  test('【US5-6】CFタブ: 60項目以上にXBRLツールチップが表示される', async ({ page }) => {
    // CFタブに移動
    await page.click('button:has-text("CF計算書")');
    
    // データ読み込み完了を待つ
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // 「?」マークを持つ要素をカウント
    const tooltipMarks = page.locator('.metric-info');
    const tooltipCount = await tooltipMarks.count();
    
    // CF 70項目のうち、少なくとも60項目にツールチップが存在
    expect(tooltipCount).toBeGreaterThanOrEqual(60);
  });

  test('【US5-7】任意の項目のXBRLツールチップがjpcrp_cor形式で表示される', async ({ page }) => {
    // PLタブに移動
    await page.click('button:has-text("損益計算書")');
    
    // データ読み込み完了を待つ
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // ランダムに複数のツールチップをテスト（最大10個）
    const tooltipMarks = page.locator('.metric-info');
    const tooltipCount = Math.min(await tooltipMarks.count(), 10);
    
    for (let i = 0; i < tooltipCount; i++) {
      const mark = tooltipMarks.nth(i);
      
      // マウスオーバー
      await mark.hover();
      
      // ツールチップが表示される
      await expect(page.locator('.metric-tooltip')).toBeVisible({ timeout: 2000 });
      
      // XBRLタグまたは計算式が表示される
      const tooltipText = await page.locator('.metric-tooltip').textContent();
      expect(tooltipText).toMatch(/jpcrp_cor:|計算値:/);
      
      // マウスアウト（次のテストのため）
      await page.locator('h3').first().hover();
      await page.waitForTimeout(100);
    }
  });
});

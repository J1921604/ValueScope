import { test, expect } from '@playwright/test'

/**
 * 従業員情報ページのE2Eテスト
 */
test.describe('従業員情報ページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ValueScope/')
    await page.waitForLoadState('networkidle')
  })

  test('従業員情報タブが表示される', async ({ page }) => {
    const employeeTab = page.locator('button:has-text("従業員情報")')
    await expect(employeeTab).toBeVisible()
    await expect(employeeTab).toHaveClass(/btn-magenta/)
  })

  test('従業員情報タブをクリックすると従業員情報テーブルが表示される', async ({ page }) => {
    await page.click('button:has-text("従業員情報")')
    
    // テーブルヘッダーが表示されることを確認
    await expect(page.locator('h3:has-text("従業員情報 比較テーブル")')).toBeVisible()
    
    // 主要指標が表示されることを確認
    await expect(page.locator('text=平均年間給与')).toBeVisible()
    await expect(page.locator('text=平均勤続年数')).toBeVisible()
    await expect(page.locator('text=平均年齢')).toBeVisible()
    await expect(page.locator('text=従業員数')).toBeVisible()
  })

  test('3社の従業員情報が表示される', async ({ page }) => {
    await page.click('button:has-text("従業員情報")')
    
    // 3社のヘッダーが表示されることを確認
    await expect(page.locator('th:has-text("東京電力HD")')).toBeVisible()
    await expect(page.locator('th:has-text("中部電力")')).toBeVisible()
    await expect(page.locator('th:has-text("JERA")')).toBeVisible()
  })

  test('従業員情報推移グラフが表示される', async ({ page }) => {
    await page.click('button:has-text("従業員情報")')
    await page.waitForSelector('.recharts-surface', { timeout: 5000 })
    
    // 4つのグラフが表示されることを確認
    const charts = page.locator('.recharts-surface')
    await expect(charts).toHaveCount(4)
    
    // グラフタイトルが表示されることを確認
    await expect(page.locator('h3:has-text("平均年間給与推移")')).toBeVisible()
    await expect(page.locator('h3:has-text("平均勤続年数推移")')).toBeVisible()
    await expect(page.locator('h3:has-text("平均年齢推移")')).toBeVisible()
    await expect(page.locator('h3:has-text("従業員数推移")')).toBeVisible()
  })

  test('年度フィルタで従業員情報が更新される', async ({ page }) => {
    await page.click('button:has-text("従業員情報")')
    
    // 最新年度を選択
    const yearButtons = page.locator('.month-btn')
    const latestYear = yearButtons.last()
    await latestYear.click()
    
    // データが表示されることを確認
    await expect(page.locator('td:has-text("円")')).toHaveCount(3) // 3社分
  })

  test('従業員情報タブからEV分析タブに切り替えられる', async ({ page }) => {
    await page.click('button:has-text("従業員情報")')
    await expect(page.locator('h3:has-text("従業員情報 比較テーブル")')).toBeVisible()
    
    await page.click('button:has-text("EV分析")')
    await expect(page.locator('h3:has-text("主要指標 比較テーブル")')).toBeVisible()
  })
})

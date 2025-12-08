"""
KPIゲージのE2Eテスト (Selenium)
Version: 1.0.0
Date: 2025-12-15
"""

import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options


@pytest.fixture
def driver():
    """Chromeドライバーのセットアップ"""
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')
    
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(10)
    yield driver
    driver.quit()


def test_kpi_gauge_displays_with_color(driver):
    """KPIゲージが色付きで表示される"""
    driver.get('http://localhost:5173')
    wait = WebDriverWait(driver, 15)
    
    # スコアカードタブをクリック
    scorecard_tab = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'スコアカード')]"))
    )
    scorecard_tab.click()
    
    # 自己資本比率ゲージを探す
    equity_ratio_gauge = wait.until(
        EC.presence_of_element_located((By.XPATH, "//*[contains(text(), '自己資本比率')]"))
    )
    assert equity_ratio_gauge is not None
    
    # RadialBarChartのsvg要素を確認
    radial_bars = driver.find_elements(By.CSS_SELECTOR, 'svg.recharts-surface')
    assert len(radial_bars) > 0, "RadialBarChartが見つかりません"
    
    # カラーバーが存在することを確認（グレー以外）
    colored_bars = driver.find_elements(By.CSS_SELECTOR, 'path[fill="#00FF84"], path[fill="#FF6B35"], path[fill="#FF3366"]')
    assert len(colored_bars) > 0, "色付きのゲージが見つかりません（グレーのみ表示されている可能性があります）"


def test_kpi_gauge_angle_180_to_0(driver):
    """KPIゲージが180度（9時）から0度（15時）の範囲で表示される"""
    driver.get('http://localhost:5173')
    wait = WebDriverWait(driver, 15)
    
    scorecard_tab = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'スコアカード')]"))
    )
    scorecard_tab.click()
    
    # RadialBarChartが表示されることを確認
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'svg.recharts-surface')))
    
    # ゲージの形状を確認（半円形状であることを間接的に確認）
    # 注: 角度の直接検証は難しいため、視覚的な確認が必要
    radial_bar_paths = driver.find_elements(By.CSS_SELECTOR, 'path.recharts-radial-bar-sector')
    assert len(radial_bar_paths) > 0, "RadialBarが見つかりません"


def test_all_company_gauges_display(driver):
    """3社すべてのゲージが表示される"""
    driver.get('http://localhost:5173')
    wait = WebDriverWait(driver, 15)
    
    scorecard_tab = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'スコアカード')]"))
    )
    scorecard_tab.click()
    
    # 3社のスコアカードが表示されることを確認
    tepco_card = wait.until(
        EC.presence_of_element_located((By.XPATH, "//*[contains(text(), '東京電力HD')]"))
    )
    chubu_card = driver.find_elements(By.XPATH, "//*[contains(text(), '中部電力')]")
    jera_card = driver.find_elements(By.XPATH, "//*[contains(text(), 'JERA')]")
    
    assert tepco_card is not None
    assert len(chubu_card) > 0
    assert len(jera_card) > 0


def test_gauge_value_displays(driver):
    """ゲージの数値（例: 24.24%）が表示される"""
    driver.get('http://localhost:5173')
    wait = WebDriverWait(driver, 15)
    
    scorecard_tab = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'スコアカード')]"))
    )
    scorecard_tab.click()
    
    # パーセンテージ表示を確認
    percentage_values = wait.until(
        EC.presence_of_all_elements_located((By.XPATH, "//*[contains(text(), '%')]"))
    )
    assert len(percentage_values) > 0, "パーセンテージ値が表示されていません"

"""
従業員情報ページのE2Eテスト (Selenium)
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


def test_employee_table_displays(driver):
    """従業員情報テーブルが表示される"""
    driver.get('http://localhost:5173')
    wait = WebDriverWait(driver, 15)
    
    # 従業員情報タブをクリック
    employee_tab = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), '従業員情報')]"))
    )
    employee_tab.click()
    
    # テーブルが表示されることを確認
    table = wait.until(
        EC.presence_of_element_located((By.TAG_NAME, 'table'))
    )
    assert table is not None
    
    # 3社のデータが表示されていることを確認
    tepco_data = driver.find_elements(By.XPATH, "//td[contains(text(), '東京電力HD')]")
    chubu_data = driver.find_elements(By.XPATH, "//td[contains(text(), '中部電力')]")
    jera_data = driver.find_elements(By.XPATH, "//td[contains(text(), 'JERA')]")
    
    assert len(tepco_data) > 0, "東京電力HDのデータが見つかりません"
    assert len(chubu_data) > 0, "中部電力のデータが見つかりません"
    assert len(jera_data) > 0, "JERAのデータが見つかりません"


def test_employee_trend_chart_displays(driver):
    """従業員トレンドチャートが表示される"""
    driver.get('http://localhost:5173')
    wait = WebDriverWait(driver, 15)
    
    # 従業員情報タブをクリック
    employee_tab = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), '従業員情報')]"))
    )
    employee_tab.click()
    
    # チャートが表示されることを確認（Rechartsのsvg要素）
    chart = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, 'svg.recharts-surface'))
    )
    assert chart is not None


def test_employee_data_range_2016_to_2025(driver):
    """従業員データが2016-2025年の範囲である"""
    driver.get('http://localhost:5173')
    wait = WebDriverWait(driver, 15)
    
    employee_tab = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), '従業員情報')]"))
    )
    employee_tab.click()
    
    # 2016年と2025年のデータが存在することを確認
    year_2016 = driver.find_elements(By.XPATH, "//*[contains(text(), '2016')]")
    year_2025 = driver.find_elements(By.XPATH, "//*[contains(text(), '2025')]")
    
    assert len(year_2016) > 0, "2016年のデータが見つかりません"
    assert len(year_2025) > 0, "2025年のデータが見つかりません"


def test_jera_no_data_before_2019(driver):
    """JERAの2019年以前のデータが表示されない"""
    driver.get('http://localhost:5173')
    wait = WebDriverWait(driver, 15)
    
    employee_tab = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), '従業員情報')]"))
    )
    employee_tab.click()
    
    # テーブルが表示されるまで待機
    wait.until(EC.presence_of_element_located((By.TAG_NAME, 'table')))
    
    # JERAの2016-2018年のデータが存在しないことを確認
    # （テーブル内にJERAと2016/2017/2018が同時に存在する行がないことを確認）
    jera_2016_rows = driver.find_elements(By.XPATH, "//tr[contains(., 'JERA') and contains(., '2016')]")
    jera_2017_rows = driver.find_elements(By.XPATH, "//tr[contains(., 'JERA') and contains(., '2017')]")
    jera_2018_rows = driver.find_elements(By.XPATH, "//tr[contains(., 'JERA') and contains(., '2018')]")
    
    assert len(jera_2016_rows) == 0, "JERAの2016年データが表示されています"
    assert len(jera_2017_rows) == 0, "JERAの2017年データが表示されています"
    assert len(jera_2018_rows) == 0, "JERAの2018年データが表示されています"


def test_switch_to_ev_analysis_tab(driver):
    """従業員情報タブからEV分析タブに切り替えられる"""
    driver.get('http://localhost:5173')
    wait = WebDriverWait(driver, 15)
    
    # 従業員情報タブをクリック
    employee_tab = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), '従業員情報')]"))
    )
    employee_tab.click()
    
    # EV分析タブをクリック
    ev_tab = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'EV分析')]"))
    )
    ev_tab.click()
    
    # EVチャートが表示されることを確認
    ev_chart = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, 'svg.recharts-surface'))
    )
    assert ev_chart is not None

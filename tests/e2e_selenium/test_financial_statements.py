"""
財務3表ページのE2Eテスト (Selenium)
Version: 1.0.0
Date: 2025-12-15
"""

import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import time


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


def test_balance_sheet_loads_tepco(driver):
    """貸借対照表ページが正しく読み込まれる（TEPCO）"""
    driver.get('http://localhost:5173/ValueScope/')
    wait = WebDriverWait(driver, 15)
    
    # 貸借対照表タブをクリック（トップレベル）
    bs_tab = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), '貸借対照表')]"))
    )
    bs_tab.click()
    
    # TEPCOを選択
    tepco_button = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), '東京電力HD')]"))
    )
    tepco_button.click()
    
    # データテーブルが表示されることを確認
    table = wait.until(
        EC.presence_of_element_located((By.TAG_NAME, 'table'))
    )
    assert table is not None
    
    # エラーメッセージが表示されないことを確認
    error_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'エラー') or contains(text(), 'Failed to fetch')]")
    assert len(error_elements) == 0, "エラーメッセージが表示されています"


def test_balance_sheet_loads_chubu(driver):
    """貸借対照表ページが正しく読み込まれる（CHUBU）"""
    driver.get('http://localhost:5173/ValueScope/')
    wait = WebDriverWait(driver, 15)
    
    bs_tab = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), '貸借対照表')]"))
    )
    bs_tab.click()
    
    chubu_button = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), '中部電力')]"))
    )
    chubu_button.click()
    
    table = wait.until(
        EC.presence_of_element_located((By.TAG_NAME, 'table'))
    )
    assert table is not None
    
    error_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'エラー') or contains(text(), 'Failed to fetch')]")
    assert len(error_elements) == 0, "エラーメッセージが表示されています"


def test_balance_sheet_loads_jera(driver):
    """貸借対照表ページが正しく読み込まれる（JERA）"""
    driver.get('http://localhost:5173/ValueScope/')
    wait = WebDriverWait(driver, 15)
    
    bs_tab = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), '貸借対照表')]"))
    )
    bs_tab.click()
    
    jera_button = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'JERA')]"))
    )
    jera_button.click()
    
    table = wait.until(
        EC.presence_of_element_located((By.TAG_NAME, 'table'))
    )
    assert table is not None
    
    error_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'エラー') or contains(text(), 'Failed to fetch')]")
    assert len(error_elements) == 0, "エラーメッセージが表示されています"


def test_profit_loss_statement_loads(driver):
    """損益計算書ページが正しく読み込まれる"""
    driver.get('http://localhost:5173/ValueScope/')
    wait = WebDriverWait(driver, 15)
    
    pl_tab = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), '損益計算書')]"))
    )
    pl_tab.click()
    
    table = wait.until(
        EC.presence_of_element_located((By.TAG_NAME, 'table'))
    )
    assert table is not None


def test_cash_flow_statement_loads(driver):
    """キャッシュフロー計算書ページが正しく読み込まれる"""
    driver.get('http://localhost:5173/ValueScope/')
    wait = WebDriverWait(driver, 15)
    
    cf_tab = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'CF計算書')]"))
    )
    cf_tab.click()
    
    table = wait.until(
        EC.presence_of_element_located((By.TAG_NAME, 'table'))
    )
    assert table is not None

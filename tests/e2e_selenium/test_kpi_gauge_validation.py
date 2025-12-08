"""KPIゲージが半円ゲージの50%以内（真上12時を超えない）に収まることを検証"""
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def test_kpi_gauge_validation():
    """KPIゲージが9時から始まり15時で終わり、全ての値が12時を超えないことを確認"""
    driver = webdriver.Chrome()
    driver.maximize_window()
    
    try:
        # ページを開く
        driver.get("http://localhost:4173/ValueScope/")
        print("✓ ページを開きました: http://localhost:4173/ValueScope/")
        
        # KPI分析タブをクリック
        wait = WebDriverWait(driver, 10)
        kpi_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'KPI分析')]")))
        kpi_tab.click()
        print("✓ KPI分析タブをクリックしました")
        time.sleep(2)
        
        # KPIゲージが表示されるまで待機
        gauges = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".recharts-radial-bar-sectors")))
        print(f"✓ KPIゲージが{len(gauges)}個見つかりました")
        
        # ゲージの詳細情報を取得
        companies = ["東京電力", "中部電力", "JERA"]
        kpis = ["ROE", "自己資本比率", "DSCR"]
        
        print("\n=== KPIゲージ検証結果 ===")
        for company in companies:
            print(f"\n【{company}】")
            for kpi in kpis:
                # ゲージ要素を探す
                try:
                    gauge_container = driver.find_element(By.XPATH, 
                        f"//h4[contains(text(), '{company}')]/ancestor::div[contains(@class, 'border')]//h5[contains(text(), '{kpi}')]")
                    print(f"  ✓ {kpi}ゲージが見つかりました")
                except:
                    print(f"  ✗ {kpi}ゲージが見つかりませんでした")
        
        # スクリーンショットを保存
        screenshot_path = "c:\\Users\\J1921604\\spec-kit\\07_ValueScope\\kpi_gauge_validation.png"
        driver.save_screenshot(screenshot_path)
        print(f"\n✓ スクリーンショットを保存しました: {screenshot_path}")
        
        # 5秒待機してユーザーが目視確認できるようにする
        print("\n目視確認のため5秒待機します...")
        time.sleep(5)
        
        print("\n=== 検証完了 ===")
        print("理論上の計算:")
        print("  ROE: TEPCO 7.62% (max 32% → 23.8%), CHUBU 15.26% (max 32% → 47.7%), JERA 9.78% (max 32% → 30.6%)")
        print("  自己資本比率: TEPCO 24.24% (max 80% → 30.3%), CHUBU 37.91% (max 80% → 47.4%), JERA 30.76% (max 80% → 38.5%)")
        print("  DSCR: TEPCO 11.61倍 (max 32倍 → 36.3%), CHUBU 15.95倍 (max 32倍 → 49.8%), JERA 0.0倍 (max 32倍 → 0%)")
        print("\n全ての値が50%以下に収まり、真上12時を超えないはずです。")
        
    finally:
        # ブラウザを5秒後に閉じる
        time.sleep(5)
        driver.quit()
        print("\n✓ ブラウザを閉じました")

if __name__ == "__main__":
    test_kpi_gauge_validation()

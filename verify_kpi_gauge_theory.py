"""KPIゲージの理論計算検証 - 全ての値が50%以下（真上12時を超えない）に収まることを確認"""

# 実際のKPI値（public/data/scorecards.json より）
kpi_values = {
    "東京電力": {"ROE": 7.62, "自己資本比率": 24.24, "DSCR": 11.61},
    "中部電力": {"ROE": 15.26, "自己資本比率": 37.91, "DSCR": 15.95},
    "JERA": {"ROE": 9.78, "自己資本比率": 30.76, "DSCR": 0.0},
}

# 新しいmax値設定（public/data/kpi_targets.json より）
kpi_max = {
    "ROE": 32.0,
    "自己資本比率": 80.0,
    "DSCR": 32.0,
}

print("=== KPIゲージ理論計算検証 ===\n")
print("半円ゲージ: 180度（9時=0度, 12時=90度, 15時=180度）")
print("目標: 全ての値が50%以下の位置（90度未満）に収まること\n")

all_valid = True

for company, kpis in kpi_values.items():
    print(f"【{company}】")
    for kpi_name, value in kpis.items():
        max_val = kpi_max[kpi_name]
        percentage = (value / max_val) * 100
        angle = (percentage / 100) * 180
        
        # 時計の位置を計算（9時=0度スタート）
        # 0度 = 9時, 45度 = 10:30, 90度 = 12時, 135度 = 1:30, 180度 = 3時
        hours = 9 + (angle / 180) * 6  # 180度で6時間進む（9時→15時）
        minutes = int((hours % 1) * 60)
        hour_display = int(hours)
        
        is_valid = percentage <= 50.0
        status = "✓" if is_valid else "✗"
        
        if not is_valid:
            all_valid = False
        
        print(f"  {status} {kpi_name}: {value:.2f} / max {max_val:.0f} = {percentage:.1f}% → {angle:.1f}度 ({hour_display}:{minutes:02d})")

print("\n=== 検証結果 ===")
if all_valid:
    print("✓ 全てのKPIゲージが50%以下（90度未満、12時を超えない）に収まっています")
    print("✓ ゲージは9時から始まり15時で終わり、全ての値が12時を超えません")
else:
    print("✗ 一部のKPIゲージが50%を超えています（12時を超える可能性あり）")
    print("✗ max値をさらに増やす必要があります")

print("\n=== 詳細分析 ===")
print(f"ROE最大値: 中部電力 15.26% → max 32%設定で {(15.26/32)*100:.1f}% の位置")
print(f"自己資本比率最大値: 中部電力 37.91% → max 80%設定で {(37.91/80)*100:.1f}% の位置")
print(f"DSCR最大値: 中部電力 15.95倍 → max 32倍設定で {(15.95/32)*100:.1f}% の位置")
print("\n全て50%以下なので、理論上は正常に表示されるはずです。")

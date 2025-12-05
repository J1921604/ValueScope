#!/usr/bin/env python3
"""
企業価値データとKPIスコアカードのスキーマ検証・異常値検出

憲法遵守:
- 厳格な型チェック（ValuationData, ScoreCardData）
- 異常値検出（負の値、範囲外の値）
- 詳細なエラーレポート
- ゼロ除算防止
"""

import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional


# スキーマ定義
VALUATION_SCHEMA = {
    "marketCap": {"type": float, "min": 0, "unit": "百万円"},
    "enterpriseValue": {"type": float, "min": 0, "unit": "百万円"},
    "ebitda": {"type": float, "min": 0, "unit": "百万円"},
    "evEbitdaRatio": {"type": float, "min": 0, "max": 100, "unit": "倍"},
    "per": {"type": float, "min": 0, "max": 1000, "unit": "倍"},
    "pbr": {"type": float, "min": 0, "max": 100, "unit": "倍"},
}

SCORECARD_SCHEMA = {
    "roe": {"type": float, "min": -100, "max": 100, "unit": "%"},
    "equityRatio": {"type": float, "min": 0, "max": 100, "unit": "%"},
    "dscr": {"type": float, "min": 0, "max": 1000, "unit": "倍"},
    "score": {"type": str, "values": ["green", "yellow", "red"]},
}

THRESHOLD_SCHEMA = {
    "green": {"type": float},
    "yellow": {"type": float},
}


class ValidationError:
    """検証エラー情報"""
    
    def __init__(self, company: str, field: str, value: Any, reason: str):
        self.company = company
        self.field = field
        self.value = value
        self.reason = reason
    
    def __str__(self) -> str:
        return f"[{self.company}] {self.field}={self.value} → {self.reason}"


class DataValidator:
    """データ検証クラス"""
    
    def __init__(self):
        self.errors: List[ValidationError] = []
        self.warnings: List[ValidationError] = []
    
    def validate_field(
        self,
        company: str,
        field: str,
        value: Any,
        schema: Dict[str, Any]
    ) -> bool:
        """
        フィールド値の検証
        
        Args:
            company: 企業名
            field: フィールド名
            value: 値
            schema: スキーマ定義
        
        Returns:
            検証成功ならTrue
        """
        # 型チェック
        expected_type = schema.get("type")
        if expected_type and not isinstance(value, expected_type):
            self.errors.append(
                ValidationError(
                    company, field, value,
                    f"型エラー: {type(value).__name__} (期待: {expected_type.__name__})"
                )
            )
            return False
        
        # 値の範囲チェック（文字列の場合）
        if expected_type == str and "values" in schema:
            allowed = schema["values"]
            if value not in allowed:
                self.errors.append(
                    ValidationError(
                        company, field, value,
                        f"値エラー: 許可値={allowed}"
                    )
                )
                return False
        
        # 数値の範囲チェック
        if isinstance(value, (int, float)):
            min_val = schema.get("min")
            max_val = schema.get("max")
            
            if min_val is not None and value < min_val:
                self.errors.append(
                    ValidationError(
                        company, field, value,
                        f"範囲エラー: 最小値={min_val}"
                    )
                )
                return False
            
            if max_val is not None and value > max_val:
                self.warnings.append(
                    ValidationError(
                        company, field, value,
                        f"警告: 最大値={max_val}を超過"
                    )
                )
        
        return True
    
    def validate_valuation(self, data: Dict[str, Any]) -> bool:
        """
        企業価値データの検証
        
        Args:
            data: valuation.json の companies オブジェクト
        
        Returns:
            検証成功ならTrue
        """
        success = True
        
        for company, values in data.items():
            if not isinstance(values, dict):
                self.errors.append(
                    ValidationError(
                        company, "root", values,
                        "企業データが辞書型ではない"
                    )
                )
                success = False
                continue
            
            for field, schema in VALUATION_SCHEMA.items():
                if field not in values:
                    self.errors.append(
                        ValidationError(
                            company, field, None,
                            "必須フィールドが欠落"
                        )
                    )
                    success = False
                    continue
                
                value = values[field]
                if not self.validate_field(company, field, value, schema):
                    success = False
            
            # ビジネスロジック検証
            if "enterpriseValue" in values and "marketCap" in values:
                ev = values["enterpriseValue"]
                mc = values["marketCap"]
                
                # EV < 0はあり得ない（純有利子負債が巨額でない限り）
                if ev < 0:
                    self.errors.append(
                        ValidationError(
                            company, "enterpriseValue", ev,
                            "負の企業価値（純有利子負債が異常）"
                        )
                    )
                    success = False
                
                # EV/時価総額が極端に乖離
                if mc > 0 and abs(ev / mc - 1.0) > 5.0:
                    self.warnings.append(
                        ValidationError(
                            company, "enterpriseValue", ev,
                            f"警告: EV/時価総額比率={ev/mc:.2f}（極端な負債）"
                        )
                    )
        
        return success
    
    def validate_scorecard(self, data: Dict[str, Any]) -> bool:
        """
        KPIスコアカードの検証
        
        Args:
            data: scorecards.json の companies オブジェクト
        
        Returns:
            検証成功ならTrue
        """
        success = True
        
        for company, company_data in data.items():
            if not isinstance(company_data, dict):
                self.errors.append(
                    ValidationError(
                        company, "root", company_data,
                        "企業データが辞書型ではない"
                    )
                )
                success = False
                continue
            
            # date, companyCodeフィールドをスキップ（メタデータ）
            for kpi_name in ["roe", "equityRatio", "dscr"]:
                if kpi_name not in company_data:
                    continue
                
                kpi_data = company_data[kpi_name]
                
                if not isinstance(kpi_data, dict):
                    self.errors.append(
                        ValidationError(
                            company, kpi_name, kpi_data,
                            "KPI詳細が辞書型ではない"
                        )
                    )
                    success = False
                    continue
                
                # valueフィールドの検証
                if "value" not in kpi_data:
                    self.errors.append(
                        ValidationError(
                            company, f"{kpi_name}.value", None,
                            "必須フィールドが欠落"
                        )
                    )
                    success = False
                    continue
                
                value = kpi_data["value"]
                
                # KPI種別に応じた範囲チェック
                if kpi_name == "roe":
                    schema = {"type": float, "min": -100, "max": 100, "unit": "%"}
                elif kpi_name == "equityRatio":
                    schema = {"type": float, "min": 0, "max": 100, "unit": "%"}
                elif kpi_name == "dscr":
                    schema = {"type": float, "min": 0, "max": 1000, "unit": "倍"}
                else:
                    schema = {"type": float}
                
                if not self.validate_field(company, f"{kpi_name}.value", value, schema):
                    success = False
                
                # scoreフィールドの検証
                if "score" not in kpi_data:
                    self.errors.append(
                        ValidationError(
                            company, f"{kpi_name}.score", None,
                            "必須フィールドが欠落"
                        )
                    )
                    success = False
                    continue
                
                score = kpi_data["score"]
                score_schema = {"type": str, "values": ["green", "yellow", "red"]}
                
                if not self.validate_field(company, f"{kpi_name}.score", score, score_schema):
                    success = False
        
        return success
    
    def validate_thresholds(self, data: Dict[str, Any]) -> bool:
        """
        閾値定義の検証
        
        Args:
            data: kpi_targets.json
        
        Returns:
            検証成功ならTrue
        """
        success = True
        
        # バージョン情報の検証
        if "version" not in data:
            self.errors.append(
                ValidationError(
                    "threshold", "version", None,
                    "バージョン情報が欠落"
                )
            )
            success = False
        
        # thresholdsが配列形式
        if "thresholds" not in data:
            self.errors.append(
                ValidationError(
                    "threshold", "thresholds", None,
                    "閾値配列が欠落"
                )
            )
            return False
        
        thresholds = data["thresholds"]
        if not isinstance(thresholds, list):
            self.errors.append(
                ValidationError(
                    "threshold", "thresholds", thresholds,
                    "閾値がリスト型ではない"
                )
            )
            return False
        
        for threshold in thresholds:
            if not isinstance(threshold, dict):
                self.errors.append(
                    ValidationError(
                        "threshold", "item", threshold,
                        "閾値項目が辞書型ではない"
                    )
                )
                success = False
                continue
            
            kpi_name = threshold.get("kpiName", "unknown")
            
            # greenThreshold検証
            if "greenThreshold" not in threshold:
                self.errors.append(
                    ValidationError(
                        "threshold", f"{kpi_name}.greenThreshold", None,
                        "緑閾値が欠落"
                    )
                )
                success = False
            else:
                green = threshold["greenThreshold"]
                schema = {"type": (int, float)}
                if not isinstance(green, (int, float)):
                    self.errors.append(
                        ValidationError(
                            "threshold", f"{kpi_name}.greenThreshold", green,
                            f"型エラー: {type(green).__name__}"
                        )
                    )
                    success = False
            
            # yellowThreshold検証
            if "yellowThreshold" not in threshold:
                self.errors.append(
                    ValidationError(
                        "threshold", f"{kpi_name}.yellowThreshold", None,
                        "黄色閾値が欠落"
                    )
                )
                success = False
            else:
                yellow = threshold["yellowThreshold"]
                if not isinstance(yellow, (int, float)):
                    self.errors.append(
                        ValidationError(
                            "threshold", f"{kpi_name}.yellowThreshold", yellow,
                            f"型エラー: {type(yellow).__name__}"
                        )
                    )
                    success = False
            
            # 閾値の論理チェック（green > yellow）
            if "greenThreshold" in threshold and "yellowThreshold" in threshold:
                green = threshold["greenThreshold"]
                yellow = threshold["yellowThreshold"]
                
                if isinstance(green, (int, float)) and isinstance(yellow, (int, float)):
                    if green <= yellow:
                        self.errors.append(
                            ValidationError(
                                "threshold", kpi_name, {"green": green, "yellow": yellow},
                                f"閾値エラー: green({green}) <= yellow({yellow})"
                            )
                        )
                        success = False
        
        return success
    
    def print_report(self) -> int:
        """
        検証レポートを出力
        
        Returns:
            エラー数
        """
        print("=== Validation Report ===")
        print()
        
        if self.errors:
            print(f"❌ Errors: {len(self.errors)}")
            for error in self.errors:
                print(f"  {error}")
            print()
        
        if self.warnings:
            print(f"⚠️  Warnings: {len(self.warnings)}")
            for warning in self.warnings:
                print(f"  {warning}")
            print()
        
        if not self.errors and not self.warnings:
            print("✅ All validations passed!")
        
        return len(self.errors)


def main():
    parser = argparse.ArgumentParser(
        description="企業価値データとKPIスコアカードの検証"
    )
    parser.add_argument(
        "--valuation",
        type=Path,
        default=Path(__file__).parent.parent / "data" / "valuation.json",
        help="企業価値データファイル"
    )
    parser.add_argument(
        "--scorecards",
        type=Path,
        default=Path(__file__).parent.parent / "data" / "scorecards.json",
        help="KPIスコアカードファイル"
    )
    parser.add_argument(
        "--thresholds",
        type=Path,
        default=Path(__file__).parent.parent / "data" / "kpi_targets.json",
        help="閾値定義ファイル"
    )
    
    args = parser.parse_args()
    
    validator = DataValidator()
    exit_code = 0
    
    # 企業価値データ検証
    if args.valuation.exists():
        print(f"Validating {args.valuation}...")
        with open(args.valuation, "r", encoding="utf-8") as f:
            valuation_data = json.load(f)
        
        if not validator.validate_valuation(valuation_data.get("companies", {})):
            exit_code = 1
    else:
        print(f"Warning: {args.valuation} not found")
    
    # KPIスコアカード検証
    if args.scorecards.exists():
        print(f"Validating {args.scorecards}...")
        with open(args.scorecards, "r", encoding="utf-8") as f:
            scorecard_data = json.load(f)
        
        if not validator.validate_scorecard(scorecard_data.get("companies", {})):
            exit_code = 1
    else:
        print(f"Warning: {args.scorecards} not found")
    
    # 閾値定義検証
    if args.thresholds.exists():
        print(f"Validating {args.thresholds}...")
        with open(args.thresholds, "r", encoding="utf-8") as f:
            threshold_data = json.load(f)
        
        if not validator.validate_thresholds(threshold_data):
            exit_code = 1
    else:
        print(f"Warning: {args.thresholds} not found")
    
    print()
    validator.print_report()
    
    return exit_code


if __name__ == "__main__":
    exit(main())

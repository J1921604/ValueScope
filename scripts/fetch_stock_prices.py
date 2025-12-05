#!/usr/bin/env python3
"""
ValueScope - Stock Price Data Fetcher
Stooq経由でpandas_datareaderを使用して株価データを取得
"""

import argparse
import sys
import os
from datetime import datetime, timedelta
from pathlib import Path

try:
    import pandas as pd
    from pandas_datareader import data as pdr
except ImportError:
    print("エラー: 必要なライブラリがインストールされていません")
    print("実行: pip install -r scripts/requirements.txt")
    sys.exit(1)

# プロジェクトルート
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
PRICES_DIR = DATA_DIR / "prices"

def fetch_stock_data(symbol: str, start_date: str, end_date: str, output_dir: Path) -> bool:
    """
    指定された銘柄の株価データを取得してCSVに保存
    """
    try:
        print(f"[INFO] {symbol} のデータを取得中...")
        print(f"       期間: {start_date} ～ {end_date}")
        print(f"       データソース: Stooq")
        
        # Stooqからデータ取得（pandas_datareader）
        stooq_symbol = symbol.replace('.T', '.JP')
        print(f"       Stooq銘柄コード: {stooq_symbol}")
        
        df = pdr.DataReader(stooq_symbol, 'stooq', start_date, end_date)
        
        if df.empty:
            print(f"[WARNING] {symbol} のデータが取得できませんでした")
            return False
        
        # インデックス（Date）をリセット
        df.reset_index(inplace=True)
        
        # カラム名を確認
        print(f"       取得したカラム: {list(df.columns)}")
        
        # 必要なカラムのみ選択（存在するカラムのみ）
        required_columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        available_columns = [col for col in required_columns if col in df.columns]
        df = df[available_columns]
        
        # 銘柄コード列を追加
        df['symbol'] = symbol
        
        # 日付でソート（昇順）
        df.sort_values('Date', inplace=True)
        
        # ファイル名を生成
        filename = f"{symbol}.csv"
        output_path = output_dir / filename
        
        # 出力ディレクトリを作成
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # CSV保存
        with open(output_path, 'w', encoding='utf-8', newline='') as f:
            f.write('# schema_version: 1.0\n')
            df.to_csv(f, index=False)
        
        print(f"[SUCCESS] {len(df)} 行のデータを保存: {output_path}")
        return True
        
    except Exception as e:
        print(f"[ERROR] {symbol} のデータ取得中にエラー: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    parser = argparse.ArgumentParser(description='ValueScope株価データ取得スクリプト')
    parser.add_argument(
        '--symbols',
        type=str,
        default='9501.T,9502.T',
        help='取得する銘柄コード（カンマ区切り）'
    )
    parser.add_argument(
        '--years',
        type=int,
        default=10,
        help='過去何年分のデータを取得するか'
    )
    
    args = parser.parse_args()
    
    # 日付範囲を計算
    end_date = datetime.now()
    start_date = end_date - timedelta(days=args.years * 365)
    
    symbols = args.symbols.split(',')
    
    print("=" * 60)
    print("ValueScope - Stock Price Data Fetcher")
    print("=" * 60)
    print(f"銘柄数: {len(symbols)}")
    print(f"期間: {start_date.strftime('%Y-%m-%d')} ～ {end_date.strftime('%Y-%m-%d')}")
    print(f"出力先: {PRICES_DIR}")
    print("=" * 60)
    print()
    
    success_count = 0
    for symbol in symbols:
        symbol = symbol.strip()
        if fetch_stock_data(
            symbol,
            start_date.strftime('%Y-%m-%d'),
            end_date.strftime('%Y-%m-%d'),
            PRICES_DIR
        ):
            success_count += 1
        print()
    
    print("=" * 60)
    print(f"完了: {success_count}/{len(symbols)} 銘柄のデータ取得に成功")
    print("=" * 60)
    
    return 0 if success_count == len(symbols) else 1


if __name__ == '__main__':
    exit(main())

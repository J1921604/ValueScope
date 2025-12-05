# XBRL名前空間調査スクリプト
# 複数年度のXBRLファイルから名前空間パターンを抽出

import zipfile
import re
from pathlib import Path
from lxml import etree

def extract_namespaces(zip_path: str) -> dict:
    """ZIPファイルからXBRLの名前空間を抽出"""
    with zipfile.ZipFile(zip_path, 'r') as z:
        xbrl_files = [f for f in z.namelist() if 'PublicDoc' in f and f.endswith('.xbrl')]
        if not xbrl_files:
            return {}
        
        xbrl_content = z.read(xbrl_files[0])
        root = etree.fromstring(xbrl_content)
        
        # 名前空間を抽出
        namespaces = root.nsmap
        
        # jpcrp, jppfsの名前空間を特定
        result = {}
        for prefix, uri in namespaces.items():
            if prefix and ('jpcrp' in prefix.lower() or 'jppfs' in prefix.lower()):
                result[prefix] = uri
        
        return result

def main():
    xbrl_dir = Path('XBRL/E04498')
    
    if not xbrl_dir.exists():
        print(f"❌ ディレクトリが見つかりません: {xbrl_dir}")
        return
    
    zip_files = sorted(xbrl_dir.glob('*.zip'))[:10]  # 最初の10ファイル
    
    print("=== XBRL名前空間調査 ===\n")
    
    for zip_path in zip_files:
        try:
            namespaces = extract_namespaces(str(zip_path))
            print(f"📁 {zip_path.name}")
            for prefix, uri in namespaces.items():
                # 日付パターンを抽出（YYYY-MM-DD形式）
                date_match = re.search(r'(\d{4}-\d{2}-\d{2})', uri)
                if date_match:
                    print(f"   {prefix}: {date_match.group(1)}")
            print()
        except Exception as e:
            print(f"❌ {zip_path.name}: {e}\n")

if __name__ == '__main__':
    main()

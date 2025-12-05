# 減価償却費タグ検索スクリプト
import zipfile
from lxml import etree

zip_path = 'XBRL/E04498/2023-06-29_S100R8P3.zip'

with zipfile.ZipFile(zip_path, 'r') as z:
    files = [f for f in z.namelist() if 'PublicDoc' in f and f.endswith('.xbrl')]
    content = z.read(files[0])
    root = etree.fromstring(content)
    
    # jppfs名前空間を取得
    jppfs_ns = [uri for prefix, uri in root.nsmap.items() if 'jppfs' in str(uri) and 'jppfs_cor' in str(uri)]
    
    if jppfs_ns:
        ns = {'jppfs': jppfs_ns[0]}
        
        # DepreciationAndAmortizationCFS を検索
        elements = root.findall('.//jppfs:DepreciationAndAmortizationCFS', ns)
        print(f'DepreciationAndAmortizationCFS: {len(elements)} elements')
        for elem in elements[:3]:
            print(f'  {elem.get("contextRef")}: {elem.text}')
        
        # Depreciation で始まる全タグを検索
        print('\nAll Depreciation tags:')
        tags = set()
        for elem in root.iter():
            if '}' in elem.tag:
                tag_name = elem.tag.split('}')[1]
                if 'Depreciation' in tag_name and elem.text and elem.text.strip():
                    tags.add(tag_name)
        
        for tag in sorted(tags)[:10]:
            print(f'  {tag}')

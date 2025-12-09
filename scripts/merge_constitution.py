#!/usr/bin/env python3
"""
docs/constitution.md と .specify/memory/constitution.md を統合
"""

from pathlib import Path

def merge_constitutions():
    docs_path = Path('docs/constitution.md')
    specify_path = Path('.specify/memory/constitution.md')
    
    # 両ファイルを読み込み
    docs_content = docs_path.read_text(encoding='utf-8')
    specify_content = specify_path.read_text(encoding='utf-8')
    
    print(f"docs/constitution.md: {len(docs_content.splitlines())} lines")
    print(f".specify/memory/constitution.md: {len(specify_content.splitlines())} lines")
    print()
    
    # docs版の方が詳細な技術憲法（395行）
    # specify版は原則ベース（318行）
    # → docs版をベースに、specify版のコア原則セクションを統合
    
    # 統合方針:
    # 1. docs版の技術スタック詳細をベースにする
    # 2. specify版の「原則I-VI」をセクションとして追加
    
    # specify版から「原則」セクションを抽出
    principles_start = specify_content.find('## コア原則')
    if principles_start != -1:
        principles_section = specify_content[principles_start:]
    else:
        principles_section = ""
    
    # docs版に追加
    merged_content = f"""{docs_content}

---

{principles_section}
"""
    
    # .specify/memory/constitution.md を上書き
    specify_path.write_text(merged_content, encoding='utf-8')
    
    print(f"✅ Merged constitution saved to: {specify_path}")
    print(f"   New file: {len(merged_content.splitlines())} lines")
    
    return True

if __name__ == '__main__':
    merge_constitutions()

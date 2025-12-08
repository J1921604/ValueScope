"""
Selenium E2Eテストの共通設定
Version: 1.0.0
Date: 2025-12-15
"""

import pytest


def pytest_configure(config):
    """pytest設定"""
    config.addinivalue_line(
        "markers", "e2e: E2Eテスト（Selenium使用）"
    )

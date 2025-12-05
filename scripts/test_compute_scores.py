import math
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent))

from compute_scores import (  # noqa: E402
    calculate_roe,
    calculate_equity_ratio,
    calculate_dscr,
    evaluate_score,
)


def test_calculate_roe_returns_percentage():
    bs_data = {'equity': 2000}
    pl_data = {'netIncome': 160}

    assert math.isclose(calculate_roe(bs_data, pl_data), 8.0)


def test_calculate_roe_handles_zero_equity():
    assert calculate_roe({'equity': 0}, {'netIncome': 100}) == 0.0


def test_calculate_equity_ratio():
    bs_data = {'equity': 1500, 'totalAssets': 5000}
    assert math.isclose(calculate_equity_ratio(bs_data), 30.0)


def test_calculate_equity_ratio_handles_zero_assets():
    assert calculate_equity_ratio({'equity': 1000, 'totalAssets': 0}) == 0.0


def test_calculate_dscr_uses_debt_service_proxy():
    bs_data = {'interestBearingDebt': 5000}
    pl_data = {'ebitda': 1000}

    # debt service proxy = 5000 * 0.1 = 500
    assert math.isclose(calculate_dscr(pl_data, bs_data), 2.0)


def test_calculate_dscr_handles_zero_debt():
    assert calculate_dscr({'ebitda': 1000}, {'interestBearingDebt': 0}) == 0.0


def test_evaluate_score_thresholds():
    thresholds = {'green': 10, 'yellow': 5}

    assert evaluate_score(12, thresholds) == 'green'
    assert evaluate_score(7, thresholds) == 'yellow'
    assert evaluate_score(3, thresholds) == 'red'

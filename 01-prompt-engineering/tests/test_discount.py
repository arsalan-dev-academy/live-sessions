import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from discount import calculate_total


def test_below_first_tier_gets_no_discount():
    assert calculate_total(25.0) == 25.0


def test_first_tier_boundary():
    assert calculate_total(50.0) == 50.0 * 0.95


def test_first_tier_discount():
    assert calculate_total(75.0) == 75.0 * 0.95


def test_second_tier_boundary():
    assert calculate_total(100.0) == 100.0 * 0.90


def test_second_tier_discount():
    assert calculate_total(150.0) == 150.0 * 0.90


def test_third_tier_boundary():
    assert calculate_total(200.0) == 200.0 * 0.85


def test_third_tier_discount():
    assert calculate_total(250.0) == 250.0 * 0.85


def test_member_discount_stacks_with_tier():
    assert calculate_total(75.0, is_member=True) == 75.0 * (1 - 0.15)


def test_member_discount_is_capped():
    assert calculate_total(250.0, is_member=True) == 250.0 * (1 - 0.20)


def test_negative_subtotal_raises_for_non_member():
    with pytest.raises(ValueError):
        calculate_total(-10.0)


def test_negative_subtotal_raises_for_member():
    with pytest.raises(ValueError):
        calculate_total(-10.0, is_member=True)

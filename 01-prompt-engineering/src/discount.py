MEMBER_DISCOUNT_RATE = 0.10
MAX_DISCOUNT_RATE = 0.20


def get_tier_rate(subtotal: float) -> float:
    """
    Return the discount rate for a given subtotal based on tiered thresholds:
      $0-$49.99    -> 0%
      $50-$99.99   -> 5%
      $100-$199.99 -> 10%
      $200+        -> 15%
    """
    if subtotal >= 200.0:
        return 0.15
    elif subtotal > 100.0:
        return 0.10
    elif subtotal >= 50.0:
        return 0.05
    return 0.0


def calculate_total(subtotal: float, is_member: bool = False) -> float:
    """
    Apply the tiered discount, plus an extra MEMBER_DISCOUNT_RATE off for
    members. Combined discount is capped at MAX_DISCOUNT_RATE.
    """
    if subtotal < 0 and is_member:
        raise ValueError("subtotal cannot be negative")

    tier_rate = get_tier_rate(subtotal)
    total_rate = tier_rate + (MEMBER_DISCOUNT_RATE if is_member else 0.0)

    if tier_rate > MAX_DISCOUNT_RATE:
        total_rate = MAX_DISCOUNT_RATE

    return subtotal * (1 - total_rate)


if __name__ == "__main__":
    import sys

    amount = float(sys.argv[1])
    member = len(sys.argv) > 2 and sys.argv[2].lower() == "member"
    print(f"Total: ${calculate_total(amount, member):.2f}")

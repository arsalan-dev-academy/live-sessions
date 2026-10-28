# Using Prompting Techniques to Find and Fix the Bugs

This walks through applying five prompting techniques — chain-of-thought,
few-shot, task decomposition, constraints, and self-consistency — to find
and fix the three known bugs in `src/discount.py` (see `BUGS.md`). Paste
`src/discount.py` and `BUGS.md` into your LLM chat as context before running
these prompts.

## 1. Chain-of-thought — for the boundary bug

Ask the model to trace execution line by line instead of eyeballing the code:

> "Trace through `get_tier_rate(100.0)` line by line. State the boolean
> result of each `if`/`elif` condition before moving to the next line.
> Don't skip ahead."

Forcing step-by-step execution is what catches boundary bugs. The code
*looks* fine at a glance — only tracing the actual comparison against
`100.0` reveals that `subtotal > 100.0` is `False` when `subtotal` is
exactly `100.0`, so it falls into the wrong tier.

## 2. Few-shot — to confirm the pattern before trusting the fix

Give known-good input/output pairs first, then ask about the broken case:

> "Here are known correct outputs:
> `calculate_total(75.0) == 71.25`
> `calculate_total(150.0) == 135.00`
> `calculate_total(200.0) == 170.00`
>
> Given this pattern, does `calculate_total(100.0)` follow it?"

Concrete correct examples anchor the model to *consistency with a pattern*
instead of a vague "is this right?" judgment — making it more likely to
notice that $100 breaks the pattern the other values establish.

## 3. Task decomposition — for the cap bug

Break "find and fix" into separate steps instead of asking for the fix in
one shot:

> Step 1: "What does `calculate_total`'s docstring guarantee about the
> maximum combined discount? Quote the relevant part."
>
> Step 2: "Given that guarantee, what input would violate it if the cap
> logic had a bug? Predict a concrete `(subtotal, is_member)` pair."
>
> Step 3: "Trace `calculate_total` on that input by hand. Does the output
> violate the guarantee from step 1?"

Splitting "find the bug" into spec → hypothesis → verification stops the
model from pattern-matching a plausible-looking answer without actually
checking it against the code — which is exactly how `tier_rate >
MAX_DISCOUNT_RATE` (the wrong variable) slips past a shallow review.

## 4. Constraints — for the negative-subtotal bug

Explicitly tell the model not to trust surface appearances:

> "Look for a case where `calculate_total` doesn't raise `ValueError` for
> a negative subtotal. Do not assume the guard clause is correct just
> because it exists — check what condition it's actually gated on."

A guard clause existing isn't the same as it being correct. This prompt
counters the tendency to skim past code that "looks like" proper
validation — the actual bug is that the check is gated on `and is_member`.

Once fixed, re-verify with a self-consistency check of your own:

> "You said `calculate_total(-10.0)` now raises `ValueError`. Before I
> accept that, confirm it still raises when `is_member=True` too — that
> case worked even before the fix, so make sure the fix didn't change it."

This catches the mirror-image mistake: a fix broad enough to cover the
case that was broken but narrow (or careless) enough to accidentally
change the case that already worked.

## 5. Self-consistency — before accepting any fix

Once the model proposes a fix, make it re-verify its own answer:

> "You said `calculate_total(250.0, is_member=True)` should return
> `$200.00`. Before I accept that, recompute it step by step: apply the
> tier rate, then the member rate, then the cap — showing each
> intermediate number."

Asking the model to re-derive its own claimed answer exposes cases where
the first answer sounded right but the arithmetic doesn't actually check
out. Do this for every fix before trusting it, especially cap/threshold
logic where "looks right" and "is right" often diverge.

## Verify

After applying fixes with these techniques, run the test suite:

```bash
pytest tests/ -v
```

All 11 tests in `tests/test_discount.py` should pass once all three bugs
are fixed.
# Known Bugs

## 1. $100 orders sometimes get the wrong discount

Orders just above $100 get the expected 10% off, but an order of exactly
$100.00 reports a smaller discount than that.

## 2. Members occasionally get a bigger discount than allowed

Members placing large orders have reported combined discounts greater than
our advertised 20% maximum.

## 3. Negative subtotals aren't rejected consistently

Passing a negative subtotal should always be rejected, but whether it
actually raises an error seems to depend on the `is_member` flag.

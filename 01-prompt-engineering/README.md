# discount-calculator-demo

A tiny discount calculator used as a demo repo. Orders get a tiered discount
based on subtotal, and members get an extra discount on top, capped at a
maximum combined rate.

## Installing dependencies

### uv

```
uv sync
```

### pip

```
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Quick start

```
python src/discount.py 150
python src/discount.py 150 member
```

## Running tests

```
pytest
```

## Known issues

See [BUGS.md](BUGS.md).

---

This is a demo repo built for a Claude + GitHub prompt engineering training session.

# building-apis

A minimal FastAPI app that wraps the Gemini API behind a single `/generate` endpoint. Built for a live coding demo.

## What it does

Send a text prompt to `POST /generate`, the app forwards it to Gemini (`gemini-2.0-flash`), and returns the model's text response as JSON. It also includes a small in-memory `items` resource (no DB) demoing `GET`/`PUT`/`DELETE`, so the demo has an example of each common HTTP method.

## Components

- **`main.py`** — the entire app:
  - `GenerateRequest` / `GenerateResponse` — Pydantic models for the `/generate` request/response bodies
  - `client` — a shared `google-genai` client, built once at startup from `GEMINI_API_KEY`
  - `POST /generate` — async route that calls Gemini via the async client (`client.aio`) so it doesn't block the event loop, wrapped in try/except so failures return a clean 500 JSON error instead of a stack trace
  - `items` — a plain in-memory dict (resets on restart) backing a classic CRUD example:
    - `GET /items` — list all items
    - `GET /items/{item_id}` — get one item (404 if missing)
    - `PUT /items/{item_id}` — create or replace an item at that id
    - `DELETE /items/{item_id}` — remove an item (404 if missing)
- **`.env`** (not committed) — holds `GEMINI_API_KEY`; copy from `.env.example`
- **`pyproject.toml` / `uv.lock`** — project deps managed by `uv` (fastapi, uvicorn, google-genai, python-dotenv)

## Run

```bash
cp .env.example .env       # then paste in a real Gemini API key
uv run uvicorn main:app --reload
```

## Verify

- Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) — interactive Swagger UI, try `/generate` there directly.
- Or with curl:

```bash
curl -X POST http://127.0.0.1:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Roast this Python function: def add(a,b): return a+b"}'
```

Expected response:

```json
{"response": "..."}
```

If `GEMINI_API_KEY` is missing or invalid, you'll get a `500` with a readable `{"error": "..."}` message instead of a crash.

You can also exercise the CRUD example the same way, e.g.:

```bash
curl -X PUT http://127.0.0.1:8000/items/1 -H "Content-Type: application/json" -d '{"name": "Rubber duck"}'
curl http://127.0.0.1:8000/items
curl -X DELETE http://127.0.0.1:8000/items/1
```

# Docker Troubleshooting

## Session Overview

In this session you debug a small **Notes API** (FastAPI + Postgres, run with Docker Compose) that has been broken in four different ways. Each scenario has one bug. Your job is to find it with Docker tooling and fix it.

By the end of the session, you should be able to:
- Read container state, exit codes, and logs to narrow down a failure
- Inspect networks, port bindings, mounts, and healthchecks
- Explain why each failure happened, not just how to make it go away

## Prerequisites

- [Docker Engine](https://docs.docker.com/engine/install/) with the [Compose plugin](https://docs.docker.com/compose/install/) (or [Docker Desktop](https://www.docker.com/products/docker-desktop/))
- `curl`
- Basic terminal familiarity

## The App

| Endpoint | What it does |
|---|---|
| `GET /health` | Returns `{"status": "ok"}` when the API can reach the database |
| `POST /notes` | Creates a note from `{"text": "..."}` |
| `GET /notes` | Lists all notes |

When everything works:

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/notes -H 'Content-Type: application/json' -d '{"text": "hello"}'
curl http://localhost:8000/notes
```

## Scenarios

| # | Folder |
|---|---|
| 1 | [01-network](01-network/) |
| 2 | [02-ports](02-ports/) |
| 3 | [03-volumes](03-volumes/) |
| 4 | [04-startup-order](04-startup-order/) |

Each scenario folder has a `README.md` with the symptom and your task. Run every command from inside that scenario folder.

## Ground Rules

- Start the stack with `--build` so your changes to the `Dockerfile` or `main.py` are always picked up:

  ```bash
  docker compose up -d --build
  ```

- When you finish a scenario, remove everything before moving on:

  ```bash
  docker compose down -v
  ```

- Only one scenario can run at a time, because they all publish port 8000.

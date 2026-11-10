# Scenario 4

## Symptom

On a fresh start, the API doesn't come up:

```bash
docker compose up -d --build
docker compose ps -a
```

The `api` container shows `Exited (3)`, and `curl http://localhost:8000/health` fails.

Starting it again by hand works:

```bash
docker compose up -d
curl http://localhost:8000/health      # {"status":"ok"}
```

After `docker compose down -v`, the problem comes back on the next `up`.

## Task

1. Find out why the API fails on the first start but works on the second.
2. Fix it so that `docker compose up -d --build` on a fresh start (after `docker compose down -v`) brings the API up on the first try.

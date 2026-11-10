# Scenario 3

## Symptom

The API works, but notes don't survive a restart of the stack:

```bash
docker compose up -d --build
curl -X POST http://localhost:8000/notes -H 'Content-Type: application/json' -d '{"text": "remember me"}'
curl http://localhost:8000/notes        # the note is there

docker compose down
docker compose up -d
curl http://localhost:8000/notes        # []
```

## Task

1. Find out why the data is lost.
2. Fix it so that a note created before `docker compose down` is still there after `docker compose up -d`.

Use `docker compose down` (without `-v`) to test persistence. `-v` deletes volumes on purpose.

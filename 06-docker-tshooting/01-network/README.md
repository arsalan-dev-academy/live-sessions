# Scenario 1

## Symptom

The stack starts and both containers are running, but the API can't do anything useful:

```bash
docker compose up -d --build
curl -i http://localhost:8000/health
```

```
HTTP/1.1 503 Service Unavailable
...
{"detail":"database unavailable"}
```

`POST /notes` and `GET /notes` fail too.

## Task

1. Find out why the API can't reach the database.
2. Fix it so that `/health` returns `200` and you can create and list notes.

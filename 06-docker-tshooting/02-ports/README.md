# Scenario 2

## Symptom

The stack starts, both containers are running, and the logs show no errors. But nothing answers from your machine:

```bash
docker compose up -d --build
curl http://localhost:8000/health
```

```
curl: (52) Empty reply from server
```

(On some systems you see `Connection reset by peer` instead.)

## Task

1. Find out why the API can't be reached from the host.
2. Fix it so that `curl http://localhost:8000/health` returns `{"status":"ok"}`.

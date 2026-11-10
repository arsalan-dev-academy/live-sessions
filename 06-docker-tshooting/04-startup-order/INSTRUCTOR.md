# Scenario 4 — Debug Commands

```bash
docker compose ps -a
docker compose logs api

docker compose logs -t db api
docker inspect -f 'exit={{.State.ExitCode}} started={{.State.StartedAt}} finished={{.State.FinishedAt}}' $(docker compose ps -aq api)
docker inspect -f 'started={{.State.StartedAt}}' $(docker compose ps -q db)

docker inspect -f '{{json .State.Health}}' $(docker compose ps -q db)
docker compose config | grep -A4 depends_on

docker compose down -v
docker compose up -d --build && docker compose ps -a
```

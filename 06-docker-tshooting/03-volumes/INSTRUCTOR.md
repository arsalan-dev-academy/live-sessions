# Scenario 3 — Debug Commands

```bash
docker compose logs db | grep -i init

docker compose exec db sh -c 'echo $PGDATA'
docker compose exec db psql -U notes -c 'SHOW data_directory'

docker inspect -f '{{range .Mounts}}{{.Type}} {{.Name}} -> {{.Destination}}{{"\n"}}{{end}}' $(docker compose ps -q db)
docker diff $(docker compose ps -q db) | head

docker compose exec db ls /var/lib/postgresql/data
docker volume ls
```

## Related: Project Name Changes the Volume

```bash
docker compose down
docker volume ls --filter name=pgdata

docker compose -p notes-renamed up -d
curl http://localhost:8000/notes
docker volume ls --filter name=pgdata
docker compose -p notes-renamed down -v

docker compose up -d
curl http://localhost:8000/notes
```

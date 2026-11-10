# Scenario 1 — Debug Commands

```bash
docker compose ps
curl -i http://localhost:8000/health
docker compose logs api

docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' $(docker compose ps -q api)
docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' $(docker compose ps -q db)

docker network ls
docker network inspect 01-network_backend -f '{{range .Containers}}{{.Name}} {{end}}'

docker compose exec api python -c "import socket; print(socket.gethostbyname('db'))"
```

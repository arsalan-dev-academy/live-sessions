# Scenario 2 — Debug Commands

```bash
docker compose ps
docker port $(docker compose ps -q api)
curl -v http://localhost:8000/health

docker compose exec api python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').read())"

docker compose logs api
docker inspect -f '{{json .Config.Cmd}}' $(docker compose ps -q api)
```

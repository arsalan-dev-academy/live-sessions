# Useful Docker Commands

Run the `docker compose` commands from inside the `example-voting-app` folder.

## Containers

```bash
docker ps                          # running containers
docker ps -a                       # all containers, including stopped ones
docker compose ps                  # containers for this app only
docker stats                       # live CPU / memory per container
```

## Logs

```bash
docker compose logs                # logs from all services
docker compose logs -f worker      # follow logs for one service
docker logs <container-name>       # logs for any container
```

## Images

```bash
docker images                      # images on your machine
docker compose images              # images used by this app
```

## Networks

```bash
docker network ls                                         # all networks
docker network inspect example-voting-app_back-tier       # which containers are attached
```

## Volumes

```bash
docker volume ls                                          # all volumes
docker volume inspect example-voting-app_db-data          # where the data lives
```

## Look inside a container

```bash
docker compose exec redis redis-cli LLEN votes            # votes waiting in the queue (usually 0, the worker drains it fast)
docker compose exec db psql -U postgres -c "SELECT vote, COUNT(*) FROM votes GROUP BY vote;"
docker compose exec vote sh                               # open a shell in a container
docker inspect <container-name>                           # full config as JSON
```

## Start, stop, scale

```bash
docker compose up -d               # start in the background
docker compose stop                # stop without removing
docker compose restart worker      # restart one service
docker compose up -d --scale worker=3   # run 3 worker containers
docker compose --profile seed up seed   # run the seed container to add sample votes
docker compose down                # stop and remove containers + networks
docker compose down -v             # also remove volumes
```

## Clean up

```bash
docker system df                   # disk space used by Docker
docker system prune                # remove unused containers, networks, images
```

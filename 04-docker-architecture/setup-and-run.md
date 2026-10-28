# Fetch and Run the Voting App

## 1. Check Docker is running

```bash
docker --version
docker compose version
```

If either command fails, make sure the Docker daemon is running (or start Docker Desktop, if you use it) and try again.

## 2. Fetch the app

```bash
git clone https://github.com/dockersamples/example-voting-app.git
cd example-voting-app
```

This gives you the source code for every service plus the `docker-compose.yml` file that describes how they run together. The repo also includes `docker-compose.images.yml`, which runs the prebuilt images instead of building from source.

## 3. Run the app

From inside the `example-voting-app` folder:

```bash
docker compose up
```

The first run builds the images for `vote`, `result`, and `worker`, then starts all five containers. Add `-d` to run in the background:

```bash
docker compose up -d
```

## 4. Open the app

| App | URL | What you see |
|---|---|---|
| Vote | http://localhost:8080 | Pick Cats or Dogs |
| Result | http://localhost:8081 | Live vote results |

Vote in one tab and watch the result update in the other.

## 5. Seed sample votes

The repo includes a `seed` service that fires a batch of votes at the `vote` app, so the result page has data to show. It sits behind a Compose **profile**, so a plain `docker compose up` does not start it.

With the app already running:

```bash
docker compose --profile seed up seed
```

The seed container sends 3000 votes and then exits. The `worker` processes votes from Redis asynchronously and takes a while to drain that queue into Postgres — it can still be catching up well after the seed container has exited, so wait for the `worker` logs to settle down before refreshing http://localhost:8081, or the totals will look short.

To see the votes arrive, keep this running in a second terminal while you seed:

```bash
docker compose logs -f worker
```

## 6. Stop the app

```bash
docker compose down        # stop and remove containers + networks
docker compose down -v     # also remove the database volume (resets votes)
```

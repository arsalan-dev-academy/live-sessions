# Voting App Architecture

The app is split into five containers. Each one does a single job and talks to the others over Docker networks.

```
   Browser                                        Browser
      |                                              ^
      v                                              |
 +---------+      +-------+      +--------+      +--------+      +--------+
 |  vote   | ---> | redis | ---> | worker | ---> |   db   | ---> | result |
 | Python  |      | queue |      |  .NET  |      |Postgres|      | Node.js|
 +---------+      +-------+      +--------+      +--------+      +--------+
   :8080                                                            :8081
```

## The five services

| Service | Tech | Job |
|---|---|---|
| `vote` | Python (Flask) | Web page where users cast a vote. Pushes each vote into Redis. |
| `redis` | Redis | In-memory queue that holds new votes. |
| `worker` | .NET | Reads votes from Redis and writes them into Postgres. |
| `db` | Postgres | Stores the votes permanently (in a Docker volume). |
| `result` | Node.js | Web page that reads totals from Postgres and shows them live. |

There is also an optional **`seed`** service (behind the `seed` profile). It is a short-lived container that sends many HTTP votes to `vote`, then exits. It follows the same path as a real user.

## How a vote flows

1. You click a choice on the **vote** page.
2. `vote` pushes the vote onto a list in **redis**.
3. **worker** pops the vote from Redis and saves it in **db**.
4. **result** queries `db` and pushes updated totals to your browser.

## Networks

Compose creates two networks to separate traffic:

- **front-tier**: `vote` and `result`, the services that face the user (plus `seed`, which sends votes to `vote`)
- **back-tier**: all five core services, for internal communication

Services find each other by **service name** (e.g. `vote` connects to the host `redis`). Docker's built-in DNS resolves those names on the network.

## Volumes

- **db-data**: holds the Postgres data so votes survive container restarts. `docker compose down -v` deletes it.

## Why split it up?

- Each service can use the language that suits it best.
- Services can be rebuilt, restarted, or scaled on their own.
- The queue (Redis) decouples voting from storage, so a slow database does not block voters.

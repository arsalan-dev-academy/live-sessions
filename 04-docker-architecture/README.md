# Docker Architecture with the Example Voting App

## Session Overview

This live session uses Docker's official [Example Voting App](https://github.com/dockersamples/example-voting-app) to show how a small multi-container application is built, wired together, and run with Docker Compose.

You will learn how to:
- Fetch the example app and its container images
- Run the full stack with a single `docker compose` command
- Populate the app with sample votes using the seed container
- Understand how the five services talk to each other

By the end of the session, you should be able to:
- Start and stop a multi-container app with Docker Compose
- Explain the role of each service in the voting app
- Use the Docker CLI to see what is running and how it is connected

## Prerequisites

- [Docker Engine](https://docs.docker.com/engine/install/) with the [Compose plugin](https://docs.docker.com/compose/install/)
  - Optional: [Docker Desktop](https://www.docker.com/products/docker-desktop/) bundles both plus a GUI
- Git
- Basic terminal familiarity

## Session Files

- Fetch and run the app: [setup-and-run.md](setup-and-run.md)
- Architecture overview: [architecture.md](architecture.md)
- Useful Docker commands: [docker-commands.md](docker-commands.md)

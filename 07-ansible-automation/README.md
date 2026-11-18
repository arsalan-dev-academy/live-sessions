# Infrastructure Automation with Ansible

## Session Overview

This live session uses 50 disposable Docker containers as a fleet of "servers" to show how Ansible manages infrastructure at scale — without SSH. Ansible reaches every container through the `community.docker` dynamic inventory and connection plugins, which talk straight to the Docker daemon.

## The Fleet

| Group | Containers | Role |
|---|---|---|
| `web` | `fleet-web-1` .. `fleet-web-20` | 20 web servers |
| `db` | `fleet-db-1` .. `fleet-db-15` | 15 database servers |
| `cache` | `fleet-cache-1` .. `fleet-cache-15` | 15 cache servers |

The playbook targets all three groups at once with the host pattern `web:db:cache`.

## Setup

Run every command from this directory — Ansible only picks up `ansible.cfg` from the current directory. Docker must be running.

> **macOS:** run `export no_proxy='*'` in your terminal first. Without it, Ansible's worker processes crash with `A worker was found in a dead state` (macOS's system proxy lookup isn't safe after `fork()`).

1. Install Ansible and the Docker SDK for Python into one virtualenv (the `ansible` package already includes the `community.docker` collection):

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install ansible docker
   ```

2. Start the 50-container fleet:

   ```bash
   docker compose up -d
   ```

3. Confirm Ansible can see all 50 hosts across the three groups:

   ```bash
   ansible-inventory --graph
   ```

4. Run the playbook:

   ```bash
   ansible-playbook site.yml
   ```

   Every host should report `ok=2 changed=2`.

5. Run it again — it should report `changed=0` for every host, since everything it manages (user, config file) is already in the desired state:

   ```bash
   ansible-playbook site.yml
   ```

6. Check one host's rendered config and the `ops` user:

   ```bash
   docker exec fleet-web-1 cat /etc/app.conf
   docker exec fleet-web-1 id ops
   ```

   Or check the user on every host at once with an ad-hoc Ansible command:

   ```bash
   ansible web:db:cache -a "id ops"
   ```

   Each host should report `uid=1000(ops) gid=1000(ops) groups=1000(ops)`.

## Teardown

```bash
docker compose down
```

## Layout

```
ansible.cfg            # inventory path, forks=50, silence interpreter warnings
docker-compose.yml     # the 50 containers (3 services with replicas)
docker.yml             # dynamic inventory: discovers containers, groups by name prefix
group_vars/            # per-group variables (empty — see its README)
host_vars/             # per-host variables (empty — see its README)
templates/app.conf.j2  # rendered to /etc/app.conf
site.yml               # the playbook
```

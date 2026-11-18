# Infrastructure Automation with Ansible

## Session Overview

This live session uses 50 disposable Docker containers as a fleet of "servers" to show how Ansible manages infrastructure at scale — without SSH. Ansible reaches every container through the `community.docker` dynamic inventory and connection plugins, which talk straight to the Docker daemon.

## The Fleet

| Group | Containers | Role |
|---|---|---|
| `web` | `web-01` .. `web-20` | 20 web servers |
| `db` | `db-01` .. `db-15` | 15 database servers |
| `cache` | `cache-01` .. `cache-15` | 15 cache servers |

The playbook targets all three groups at once with the host pattern `web:db:cache`.

## Setup

1. Install the Docker SDK for Python and the `community.docker` collection:

   ```bash
   pip install docker
   ansible-galaxy collection install -r requirements.yml
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

5. Run it again — it should report `changed=0` for every host, since everything it manages (packages, user, config file) is already in the desired state:

   ```bash
   ansible-playbook site.yml
   ```

## Teardown

```bash
docker compose down
```

## Layout

```
ansible.cfg           # inventory path, forks=50, plugin allowlist
requirements.yml       # community.docker collection
docker-compose.yml      # the 50 containers
docker.yml             # dynamic inventory: discovers containers, groups by name prefix
group_vars/            # app_role + workers per group (all/web/db/cache)
host_vars/web-01.yml   # workers override for web-01
templates/app.conf.j2  # rendered to /etc/app.conf
site.yml               # the playbook
```

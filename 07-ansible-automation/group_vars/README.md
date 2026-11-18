# group_vars

Variables for every host in a group. Ansible loads a file here when its name
matches an inventory group (`web`, `db`, `cache`).

Example — `group_vars/web.yml`:

```yaml
workers: 4
```

Every web host can now use `{{ workers }}` in templates and tasks.

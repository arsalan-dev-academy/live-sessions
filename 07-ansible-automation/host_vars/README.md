# host_vars

Variables for a single host. Ansible loads a file here when its name matches
an inventory hostname, and its values override anything set in `group_vars/`.

Example — `host_vars/fleet-web-1.yml`:

```yaml
workers: 8
```

Now `fleet-web-1` gets 8 workers, while every other web host keeps the group's value.

# wm-infra-netlab-app-node

Phase 3 of wm-infra-netlab — Node.js version of the same app built in
`wm-infra-netlab-app-rust`, deployed to its own VM on `private-net`.
Same routes, same env var names, same shared Postgres database — built
this way deliberately so the Node and Rust apps are directly comparable.

Two deployment methods are supported: **VM-native** (systemd) and
**Docker**. Unlike the Rust app (which runs both simultaneously for
demonstration), this repo is built to run **one at a time** on a single
port (`8080`) — closer to how you'd actually clone and deploy just this
repo on its own.

## Routes

| Route | Behavior |
|---|---|
| `GET /` | `{version, served_by}` |
| `GET /health` | bare `200` |
| `GET /visits` | inserts a row, returns `{visits: count}` |

## Infrastructure

```bash
terraform init
cp terraform.tfvars.example terraform.tfvars   # fill in real values
terraform apply
```

Provisions a VM on `private-net` at `10.0.2.21`, attached by network
**name** (`wm-netlab-private`), not by another repo's Terraform state —
same decoupling pattern as every other repo here.

## Hardening (do this before deploying the app)

```bash
cd ansible
ansible-galaxy install -r requirements.yml
ansible-playbook playbook-app.yml
```

Applies `harden-baseline` (SSH lockdown, ufw, fail2ban,
unattended-upgrades) and `docker-host` (Docker Engine + the
`DOCKER-USER` firewall fix — see ADR 0009 in `wm-infra-netlab`). Both
roles are shared, unmodified from the Rust app's setup.

Wait for cloud-init to finish before running Ansible against a fresh VM:
```bash
ssh -J netlab-admin@10.0.1.10 netlab-admin@10.0.2.21 'cloud-init status --wait'
```

## Deploy — VM-native

```bash
ssh -J netlab-admin@10.0.1.10 netlab-admin@10.0.2.21
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
git clone https://github.com/WilliamFly/wm-infra-netlab-app-node.git
cd wm-infra-netlab-app-node
npm install --omit=dev
cp .env.example .env   # fill in the real DATABASE_URL
sudo cp deploy/netlab-app-node.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now netlab-app-node
```

## Deploy — Docker

```bash
ssh -J netlab-admin@10.0.1.10 netlab-admin@10.0.2.21
git clone https://github.com/WilliamFly/wm-infra-netlab-app-node.git
cd wm-infra-netlab-app-node
cp .env.example .env   # fill in the real DATABASE_URL
docker compose up -d --build
```

Only run one of the two methods at a time — both listen on `8080`.

## Verification

```bash
curl 10.0.2.21:8080/
curl 10.0.2.21:8080/health
curl 10.0.2.21:8080/visits
```
`served_by` in the response tells you which method is actually running
(`netlab-app-node` for VM-native, `netlab-app-node-docker` for Docker).

## Security / Hardening

- SSH hardened, `ufw` enabled, default-deny incoming
- Port `8080` scoped to `10.0.2.0/24` — both via ufw (VM-native) and via
  the `DOCKER-USER` chain (Docker path); ufw alone does **not** cover
  Docker-published ports, see ADR 0009 in `wm-infra-netlab`
- `fail2ban` active on sshd, `unattended-upgrades` enabled

# Docker Deployment Guide

Stack (all official images, code bind-mounted from the host):

| Service | Image | Ports (host) | External path |
|---|---|---|---|
| npm | `jc21/nginx-proxy-manager:latest` | 80, 443, 81 | `./docker/npm/` (config + certs) |
| db | `mysql:8.4` | — (3306 optional) | named volume `db_data` |
| api | `node:22-alpine` | 3000, 1883, 8083 | `./node/` (source code) |
| web | `nginx:1.27-alpine` | 8080 | `./vue/dist/` (build output) |
| phpmyadmin | `phpmyadmin:latest` | 8081 | — (ephemeral session storage) |

Why **1883** is exposed directly:

- Nginx Proxy Manager (free) only proxies HTTP/HTTPS and WebSockets. Raw TCP
  (MQTT on 1883) needs the paid "Streams" feature, so ESP32s must connect to
  `<server-ip>:1883` directly.

Ports 3000/8083 are commented out — they are only needed for direct/LAN mode
(see below) and everything can go through NPM instead.

---

## 1. Configure secrets

```bash
cp .env.example .env    # already done — edit .env and change every value
```

- `MYSQL_ROOT_PASSWORD` / `DB_PASSWORD` must match (the app connects as root
  and creates `carbon_footprint_db` + `sensor` itself on first start).
- `JWT_SECRET` — tokens never expire in this app, use a long random string.
- `MQTT_PASSWORD` — the password ESP32s and the dashboard must use.

## 2. Build the frontend

The API/MQTT addresses are baked in at build time by Vite. Pick ONE mode:

**Mode A — domain mode (recommended, everything through NPM):**

```bash
cd vue
cp .env.production.example .env.production
# edit .env.production:
#   VITE_SERVERURL = https://api.yourdomain.com
#   VITE_MQTTURL   = wss://mqtt.yourdomain.com
#   (VITE_HOSTURL is ignored in this mode)
npm install
npm run build
```

Required when the site is served over **HTTPS**: browsers block `ws://`
connections from an `https://` page (mixed content), so the MQTT WebSocket
must also go through NPM with `wss://`.

**Mode B — direct/LAN mode (IP addresses, no domains):**

```bash
cd vue
cp .env.production.example .env.production
# edit .env.production:
#   VITE_SERVERURL = http://<server-ip>:3000
#   VITE_HOSTURL   = <server-ip>
#   (leave VITE_MQTTURL unset)
npm install
npm run build
```

Also uncomment `3000:3000` and `8083:8083` in `docker-compose.yml` — the
frontend connects to those ports directly.

Re-run `npm run build` whenever the address of the server changes.

## 3. Start the stack

From the repo root:

```bash
docker compose up -d
docker compose logs -f api    # watch first boot (npm install + DB init)
```

The API container runs `npm install` on every start (fast when the
`api_node_modules` volume is warm) and then `node server.js`. Because
`./node` is bind-mounted, you can edit backend code on the host and just
`docker compose restart api`.

## 4. Set up Nginx Proxy Manager

1. Open `http://<server-ip>:81`
2. First login: `admin@example.com` / `changeme` — change it immediately.
3. Add **Proxy Hosts**:

| Domain names | Scheme | Forward Hostname | Forward Port | Options |
|---|---|---|---|---|
| `app.yourdomain.com` | http | `web` | 80 | SSL tab: request Let's Encrypt cert |
| `api.yourdomain.com` | http | `api` | 3000 | + SSL |
| `mqtt.yourdomain.com` | http | `api` | 8083 | + SSL, **Websockets Support ON** |

MQTT over WebSocket notes:

- The **Websockets Support** toggle is what makes the WS upgrade work;
  without it connections to `wss://mqtt.yourdomain.com` fail immediately.
- Alternative to a third domain: add a **custom location** `/mqtt` on the
  `api.yourdomain.com` host forwarding to `api:8083` (websockets ON) and set
  `VITE_MQTTURL=wss://api.yourdomain.com/mqtt`. The WS server accepts any
  path, so `/mqtt` is purely conventional.
- ESP32 devices still connect via plain TCP to `<server-ip>:1883` — this
  cannot be proxied by NPM (see top of this file).

NPM resolves `web` / `api` because all containers share the compose network.

Notes:

- The dashboard hardcodes MQTT credentials `username: 'web', password: 'pi'`
  (`DashboardView.vue`) — so `MQTT_PASSWORD` in `.env` must be `pi` unless
  you change that code. ESP32 firmware must use the same password.
- ESP32 firmware must point at `<server-ip>:1883`.
- phpMyAdmin runs at `http://<server-ip>:8081` (login: `root` +
  `MYSQL_ROOT_PASSWORD`). It has full control of both databases — on a public
  server, proxy it through NPM with an Access List and drop the direct port.

## 5. Verify

```bash
curl http://localhost:3000/api/health     # API + DB status
curl http://localhost:8080/               # frontend
# phpMyAdmin UI: http://<server-ip>:8081 (root + MYSQL_ROOT_PASSWORD)
docker compose exec db mysql -u root -p$MYSQL_ROOT_PASSWORD -e "SHOW DATABASES;"
```

Then register a user in the UI, register a device, and check the ESP32
connects (`docker compose logs -f api` shows MQTT auth events).

## Common operations

| Task | Command |
|---|---|
| Restart API after code change | `docker compose restart api` |
| Rebuild + restart frontend | `cd vue && npm run build` (nginx picks it up instantly) |
| Add a dependency | edit `node/package.json` → `docker compose restart api` |
| MySQL shell | `docker compose exec db mysql -u root -p` |
| Backup databases | `docker compose exec db sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" carbon_footprint_db sensor' > backup.sql` |
| Update images | `docker compose pull && docker compose up -d` |
| Full reset (⚠️ deletes data) | `docker compose down -v` |

## Linux server: bind-mount the MySQL datadir (optional)

On a Linux host you may prefer a real path over the named volume — replace
`db_data:/var/lib/mysql` with `./docker/mysql/data:/var/lib/mysql`. Do **not**
do this on Windows/NTFS bind mounts; MySQL datadir permissions break.

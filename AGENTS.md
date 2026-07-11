# AGENTS.md — Carbon Footprint IoT Project

## Repository structure

Three independent subprojects with **separate `package.json` / `node_modules`**:

| Directory | Purpose | Entrypoint | Dev command |
|-----------|---------|------------|-------------|
| `node/`   | Backend: Express 5 + Aedes MQTT broker | `node/server.js` | `npm run dev` (nodemon) |
| `vue/`    | Frontend: Vue 3 + PrimeVue 4 + Vite | `vue/index.html`, `vue/src/main.js` | `npm run dev` (Vite) |
| `esp32/`  | IoT firmware: Arduino for DTSU666 power meter | `esp32/dtsu666/dtsu666.ino` | Arduino IDE |

Run `npm install` inside each directory before first use. Root `package.json` is a dummy.

## Backend (`node/`)

### Key architecture

- Express 5 REST API on port 3000 (`PORT` env)
- Built-in MQTT broker (Aedes) on port 1883 (`MQTT_PORT`) + WebSocket bridge on 8083 (`WS_PORT`)
- MySQL with **two separate databases**: `carbon_footprint_db` (users, device registry) and `sensor` (time-series)
- JWT auth with **no expiration**; email+password only (bcryptjs, salt rounds 10)
- Graceful fallback if MySQL is unavailable — server starts with limited functionality, retries every 30s
- MQTT requires `MQTT_PASSWORD` env var for authentication

### Sensor data storage

One MySQL table per ESP device, named by the raw ESP ID string (e.g., `ESP32-3_A1B2C3D4`). Table has columns: `Va, Vb, Vc, Ia, Ib, Ic, Pa, Pb, Pc, PFa, PFb, PFc, Ei, Ee, Et, time`. The `f` (frequency) field from ESP32 publishes is received but **not stored**.

### MQTT topics

| Topic | Direction | Payload |
|-------|-----------|---------|
| `{espId}/update` | ESP → server | 3-phase meter data (JSON) |
| `{espId}/control` | server → ESP | `{"command":"ON"\|"OFF"}` |
| `{espId}/confirm` | ESP → server | `{"status":"ON"\|"OFF"}` |
| `device/{espId}/status` | server → MQTT clients | online/offline |

ESP32 auto-generates its ID as `{ChipModel}-{Revision}_{chipIdHex}`.

### API routes

Defined in `node/routes/`. All except auth (`/api/auth/*`, `/api/health`, `/api/sensor-data`) and health require JWT via `Authorization: Bearer <token>`. Device ownership enforced against JWT email. Documents in `api.md` are mostly accurate but the sensor DB name is `sensor` (not the main DB).

## Frontend (`vue/`)

### Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint (flat config in `eslint.config.js`) |

### Conventions

- Vue 3 Composition API + `<script setup>`
- PrimeVue 4 with Aura theme (dark mode disabled via `darkModeSelector: false`)
- `@` alias maps to `./src`
- Auth state in `localStorage` key `token`; Vue Router guards check `localStorage.getItem('token') !== null`
- MQTT client connects via WebSocket for real-time updates

## ESP32 firmware

- Arduino framework for ESP32 + DTSU666 3-phase meter via Modbus RTU (RS485, 9600 baud)
- Libraries: `WiFi.h`, `MQTT.h` (Joël Gähwiler), `ModbusMaster.h`, `Adafruit_SSD1306.h`
- Send data every 5 seconds (`UPDATETIME`)
- `#define TESTMODE` for sensorless development (random values)
- OTA updates via web server on port 80

## Testing

No test infrastructure. Both `node/` and `vue/` have placeholder `"test"` scripts that do nothing.

## Existing instruction files

- `.qoder/rules/projectcarbonfootprint.md` — generic project rules
- `.trae/rules/project_rules.md` — generic project rules

Both contain "DO NOT START SERVER" rules intended for their respective IDE agents. Not applicable to other contexts.

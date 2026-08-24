#!/usr/bin/env node

/**
 * ESP32 simulator — publishes DTSU666-style power meter data to the MQTT broker
 *
 * Simulates what the real ESP32 firmware does:
 *   1. Connect to the broker with the shared MQTT_PASSWORD
 *   2. Publish 3-phase data to `{espId}/update` every 5 seconds
 *   3. Listen on `{espId}/control` for ON/OFF commands from the web dashboard
 *   4. Acknowledge commands on `{espId}/confirm`
 *
 * Usage:
 *   node test-mqtt-esp.js                      # uses ESP32-3_SIM001
 *   node test-mqtt-esp.js ESP32-3_A1B2C3D4     # custom device ID
 *   node test-mqtt-esp.js ESP32-3_A1B2C3D4 1000  # custom publish interval (ms)
 *
 * Requires the backend server to be running (npm run dev in node/).
 */

require('dotenv').config();

const mqtt = require('mqtt');

const espId = process.argv[2] || 'ESP32-3_SIM001';
const intervalMs = parseInt(process.argv[3], 10) || 5000;

const brokerUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
const password = process.env.MQTT_PASSWORD || 'pi';

// Cumulative energy counters (kWh), Et grows with simulated load
let Ei = 1200.5;
let Ee = 0.0;
let Et = 1250.75;
let loadOn = true;

const random = (min, max) => min + Math.random() * (max - min);

const buildPayload = () => {
  const voltages = {
    Va: random(218, 232),
    Vb: random(218, 232),
    Vc: random(218, 232),
  };
  const powerFactors = {
    PFa: random(0.82, 0.99),
    PFb: random(0.82, 0.99),
    PFc: random(0.82, 0.99),
  };
  // Load current: ~0.3A when OFF, 2-15A when ON
  const currentRange = loadOn ? [2, 15] : [0.2, 0.5];
  const currents = {
    Ia: random(...currentRange),
    Ib: random(...currentRange),
    Ic: random(...currentRange),
  };
  const powers = {
    Pa: voltages.Va * currents.Ia * powerFactors.PFa,
    Pb: voltages.Vb * currents.Ib * powerFactors.PFb,
    Pc: voltages.Vc * currents.Ic * powerFactors.PFc,
  };

  // Advance energy counters by energy consumed during the interval
  const totalKw = (powers.Pa + powers.Pb + powers.Pc) / 1000;
  Et += (totalKw * intervalMs) / 3600000;
  Ei = Et; // all energy treated as import for the simulation

  return {
    ...voltages,
    ...currents,
    ...powers,
    ...powerFactors,
    Ei: +Ei.toFixed(4),
    Ee: +Ee.toFixed(4),
    Et: +Et.toFixed(4),
    f: random(49.9, 50.1), // frequency: sent by firmware, not stored server-side
    espid: espId,
    time: new Date().toISOString(),
  };
};

const client = mqtt.connect(brokerUrl, {
  clientId: espId,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 2000,
  username: 'esp',
  password,
});

client.on('connect', () => {
  console.log(`✅ Connected to ${brokerUrl} as ${espId}`);
  console.log(`📤 Publishing to ${espId}/update every ${intervalMs}ms (Ctrl+C to stop)\n`);

  client.subscribe(`${espId}/control`, (err) => {
    if (err) {
      console.error('❌ Failed to subscribe to control topic:', err.message);
    } else {
      console.log(`👂 Listening on ${espId}/control for ON/OFF commands`);
    }
  });

  const publish = () => {
    const payload = buildPayload();
    client.publish(`${espId}/update`, JSON.stringify(payload), { qos: 0 });
    const totalW = payload.Pa + payload.Pb + payload.Pc;
    console.log(
      `⚡ [${payload.time}] Total P: ${totalW.toFixed(1)} W | Et: ${payload.Et} kWh${loadOn ? '' : ' (load OFF)'}`
    );
  };

  publish();
  const timer = setInterval(publish, intervalMs);
  process.on('SIGINT', () => {
    clearInterval(timer);
    console.log('\n🛑 Disconnecting simulator...');
    client.end(false, () => process.exit(0));
  });
});

client.on('message', (topic, message) => {
  if (topic !== `${espId}/control`) return;

  let command;
  try {
    command = JSON.parse(message.toString()).command;
  } catch {
    console.log(`📩 Invalid control payload: ${message.toString()}`);
    return;
  }

  console.log(`📩 Received control command: ${command}`);

  if (command === 'ON' || command === 'OFF') {
    loadOn = command === 'ON';
    const confirmPayload = JSON.stringify({ status: command });
    client.publish(`${espId}/confirm`, confirmPayload, { qos: 0 });
    console.log(`↩️  Replied on ${espId}/confirm: ${confirmPayload} | simulated load is now ${loadOn ? 'ON' : 'OFF'}`);
  } else {
    console.log(`⚠️  Unknown command ignored: ${command}`);
  }
});

client.on('error', (err) => {
  console.error(`❌ MQTT error: ${err.message}`);
  if (err.message.includes('Authentication')) {
    console.error('   Check MQTT_PASSWORD in node/.env (server) vs this script.');
    process.exit(1);
  }
});

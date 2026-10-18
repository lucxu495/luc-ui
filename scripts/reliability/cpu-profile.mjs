/**
 * Sample a local Workers preview request and report self time by function.
 *
 * This is diagnostic only: local workerd CPU accounting does not enforce the
 * production Free Plan ceiling. It shows where request CPU is spent relative to
 * other functions, not the production CPU number.
 *
 * Usage:
 *   node scripts/reliability/cpu-profile.mjs http://127.0.0.1:8787/date-time/date-picker
 */

import { mkdir, readdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const target = process.argv[2] ?? "http://127.0.0.1:8787/date-time/date-picker";
const output = process.argv[3] ?? "artifacts/reliability/cpu-profile.json";
const inspector = process.env.WORKER_INSPECTOR ?? "http://127.0.0.1:9230";

const [targetInfo] = await fetch(`${inspector}/json/list`).then((response) => response.json());
if (!targetInfo?.webSocketDebuggerUrl) throw new Error("No Worker inspector target");

const pnpmDirs = await readdir("node_modules/.pnpm");
const wsDir = pnpmDirs.find((name) => name.startsWith("ws@"));
if (!wsDir) throw new Error("The local Wrangler dependency `ws` was not found");
const { default: WebSocket } = await import(
  pathToFileURL(`node_modules/.pnpm/${wsDir}/node_modules/ws/index.js`).href
);
const socket = new WebSocket(targetInfo.webSocketDebuggerUrl, {
  headers: { Origin: inspector },
});
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const handler = pending.get(message.id);
  if (!handler) return;
  pending.delete(message.id);
  if (message.error) handler.reject(new Error(JSON.stringify(message.error)));
  else handler.resolve(message.result);
});

function command(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

await command("Profiler.enable");
await command("Profiler.setSamplingInterval", { interval: 100 });
await command("Profiler.start");

const started = performance.now();
const response = await fetch(target, { redirect: "manual" });
const body = await response.text();
const wallMs = performance.now() - started;
const profile = await command("Profiler.stop");
socket.close();

const { nodes, samples, timeDeltas } = profile.profile;
const nodeById = new Map(nodes.map((node) => [node.id, node]));
const selfMicros = new Map();
for (let index = 0; index < samples.length; index += 1) {
  const id = samples[index];
  const delta = timeDeltas[index] ?? 0;
  selfMicros.set(id, (selfMicros.get(id) ?? 0) + Math.max(0, delta));
}

const byFunction = new Map();
for (const [id, micros] of selfMicros) {
  const node = nodeById.get(id);
  if (!node) continue;
  const frame = node.callFrame;
  const key = `${frame.functionName || "(anonymous)"}\t${frame.url || "(native)"}:${frame.lineNumber + 1}`;
  byFunction.set(key, (byFunction.get(key) ?? 0) + micros);
}

const rows = [...byFunction.entries()]
  .map(([key, micros]) => {
    const [fn, location] = key.split("\t");
    return { function: fn, location, selfMs: Number((micros / 1000).toFixed(2)) };
  })
  .sort((a, b) => b.selfMs - a.selfMs);

const selfMs = rows.reduce((sum, row) => sum + row.selfMs, 0);
const idleMs = rows
  .filter((row) => row.function === "(idle)")
  .reduce((sum, row) => sum + row.selfMs, 0);
const gcMs = rows
  .filter((row) => row.function === "(garbage collector)")
  .reduce((sum, row) => sum + row.selfMs, 0);

const result = {
  target,
  status: response.status,
  bytes: Buffer.byteLength(body),
  wallMs: Number(wallMs.toFixed(2)),
  sampledMs: Number((timeDeltas.reduce((sum, value) => sum + Math.max(0, value), 0) / 1000).toFixed(2)),
  sampledSelfMs: Number(selfMs.toFixed(2)),
  idleMs: Number(idleMs.toFixed(2)),
  nonIdleMs: Number((selfMs - idleMs).toFixed(2)),
  gcMs: Number(gcMs.toFixed(2)),
  topSelfTime: rows.slice(0, 35),
};
await mkdir("artifacts/reliability", { recursive: true });
await writeFile(output, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exit(0);

import { spawn } from "node:child_process";

const root = process.cwd();
const scripts = [
  "scripts/sanitize-villiers-communications.mjs",
  "scripts/encrypt-villiers-private.mjs",
  "scripts/verify-villiers-private.mjs",
  "scripts/verify-villiers-communications-privacy.mjs",
];

const run = (script) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [script], { cwd: root, stdio: "inherit", windowsHide: true });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${script} failed with exit code ${code}`)));
});

for (const script of scripts) await run(script);
console.log(JSON.stringify({ synchronized: true, encrypted: true, privacyVerified: true }));

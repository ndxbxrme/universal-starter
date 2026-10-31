import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { spawn, spawnSync } from "node:child_process";

export function validateAddress(address) {
  address = address.trim();
  if (
    !/^[a-zA-Z0-9.-]+:\d{1,5}$/.test(address) ||
    Number(address.split(":")[1]) < 1 ||
    Number(address.split(":")[1]) > 65535
  )
    throw new Error(
      "Enter host:port from the phone’s Wireless debugging settings.",
    );
  return address;
}

/** Release readline (including raw mode) before another process reads the terminal. */
export async function askAddress(question) {
  const prompt = createInterface({ input: stdin, output: stdout });
  const abort = new AbortController();
  const cancel = () => abort.abort();
  prompt.once("SIGINT", cancel);
  try {
    return validateAddress(
      await prompt.question(question, { signal: abort.signal }),
    );
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error("Pairing cancelled.", { cause: error });
    throw error;
  } finally {
    prompt.close();
    stdin.pause();
  }
}

/** Let adb own code entry; never put the pairing code in arguments or logs. */
export function runInteractive(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    let cancelled = false;
    let timer;
    const cancel = (signal) => {
      cancelled = true;
      child.kill(signal);
      timer ||= setTimeout(() => child.kill("SIGKILL"), 2000);
      timer.unref();
    };
    const interrupt = () => cancel("SIGINT");
    const terminate = () => cancel("SIGTERM");
    process.once("SIGINT", interrupt);
    process.once("SIGTERM", terminate);
    const cleanup = () => {
      clearTimeout(timer);
      process.removeListener("SIGINT", interrupt);
      process.removeListener("SIGTERM", terminate);
    };
    child.once("error", () => {
      cleanup();
      reject(
        new Error(
          `Cannot run ${command}. Check PATH; see docs/android-wireless.md.`,
        ),
      );
    });
    child.once("close", (code, signal) => {
      cleanup();
      if (cancelled || signal) reject(new Error("Pairing cancelled."));
      else if (code !== 0)
        reject(
          new Error(
            `${command} failed (exit ${code}). Check the current pairing code/ports and try again.`,
          ),
        );
      else resolve();
    });
  });
}

export async function pairAndroid() {
  if (!stdin.isTTY || !stdout.isTTY)
    throw new Error(
      "Pairing needs an interactive terminal. Run npm run android:pair in a terminal, or use adb pair HOST:PAIRING_PORT directly.",
    );
  const pairing = await askAddress(
    "Phone pairing address (host:PAIRING_PORT): ",
  );
  console.log(
    "ADB now owns the terminal. Enter the phone’s current pairing code, then Enter; Ctrl+C cancels.",
  );
  await runInteractive("adb", ["pair", pairing]);
  const connection = await askAddress(
    "Phone debugging address (host:DEBUG_PORT, from the main Wireless debugging page): ",
  );
  await runInteractive("adb", ["connect", connection]);
  await runInteractive("adb", ["devices", "-l"]);
  console.log(
    "Use the first column above as --device SERIAL, or omit --device when exactly one device is connected. This identifier may be an mDNS name.",
  );
}

function captureAdb(args) {
  const result = spawnSync("adb", args, { encoding: "utf8", timeout: 15000 });
  if (result.error || result.status !== 0)
    throw new Error(
      "ADB query failed. Check adb devices -l and the current wireless debugging port.",
    );
  return result.stdout;
}
export function parseDevices(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/))
    .filter(
      (fields) =>
        fields.length >= 2 &&
        ["device", "offline", "unauthorized"].includes(fields[1]),
    )
    .map(([serial, state]) => ({ serial, state }));
}

/** Resolve only an exact serial or matching mDNS endpoint; never guess among phones. */
export function resolveAdbDevice(requested, capture = captureAdb) {
  let devices = parseDevices(capture(["devices", "-l"]));
  const ready = (serial) =>
    devices.some((d) => d.serial === serial && d.state === "device");
  if (!requested) {
    const connected = devices.filter((d) => d.state === "device");
    if (connected.length === 1) return connected[0].serial;
    throw new Error(
      "No unique authorized Android device. Run npm run android:devices and pass --device SERIAL from its first column.",
    );
  }
  if (ready(requested)) return requested;
  if (/^[a-zA-Z0-9.-]+:\d+$/.test(requested)) {
    validateAddress(requested);
    capture(["connect", requested]);
    devices = parseDevices(capture(["devices", "-l"]));
    if (ready(requested)) return requested;
    const services = capture(["mdns", "services"]);
    const matches = services.split(/\r?\n/).flatMap((line) => {
      const [name, type, address] = line.trim().split(/\s+/);
      if (
        type?.replace(/\.$/, "") !== "_adb-tls-connect._tcp" ||
        address !== requested
      )
        return [];
      const instance = name.replace(/\.$/, "");
      return devices
        .filter(
          (d) =>
            d.state === "device" &&
            (d.serial.replace(/\.$/, "") === instance ||
              d.serial.replace(/\.$/, "") ===
                `${instance}._adb-tls-connect._tcp`),
        )
        .map((d) => d.serial);
    });
    if (new Set(matches).size === 1) return matches[0];
  }
  throw new Error(
    "Selected Android device is unavailable or unauthorized. Run npm run android:devices; use its exact first-column SERIAL (possibly an mDNS name). Check the phone’s current debug port and authorization.",
  );
}

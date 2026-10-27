import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { run, cli, requireMac } from "./lib.mjs";
cli(() => {
  requireMac();
  const result = spawnSync(
    "xcrun",
    ["simctl", "list", "devices", "available", "--json"],
    { encoding: "utf8" },
  );
  if (result.status !== 0)
    throw new Error("Cannot list simulators. Install an iOS runtime in Xcode.");
  const data = JSON.parse(result.stdout);
  const devices = Object.values(data.devices).flat();
  const device =
    devices.find((d) => d.udid === process.env.IOS_SIMULATOR_UDID) ||
    devices.find((d) => d.isAvailable && d.name.startsWith("iPhone"));
  if (!device)
    throw new Error(
      "No available iPhone simulator. Install a runtime in Xcode Settings → Platforms.",
    );
  if (device.state !== "Booted") run("xcrun", ["simctl", "boot", device.udid]);
  run("xcrun", ["simctl", "bootstatus", device.udid, "-b"]);
  if (process.env.GITHUB_ENV)
    appendFileSync(
      process.env.GITHUB_ENV,
      `IOS_SIMULATOR_UDID=${device.udid}\n`,
    );
  console.log("Simulator ready:", device.udid);
});

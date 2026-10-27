/** Privileged runtimes are detected through bridges, never user agent strings. */
export function selectAdapter(bridge, capacitor) {
  if (
    bridge?.version === 1 &&
    ["windows", "macos", "linux"].includes(bridge.platform) &&
    typeof bridge.invoke === "function"
  )
    return "electron";
  if (
    capacitor?.isNativePlatform() &&
    ["android", "ios"].includes(capacitor.getPlatform())
  )
    return "capacitor";
  return "web";
}

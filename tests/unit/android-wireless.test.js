import { describe, it, expect, vi } from "vitest";
import {
  parseDevices,
  resolveAdbDevice,
  validateAddress,
} from "../../scripts/android-wireless.mjs";
const serial = "adb-example-random._adb-tls-connect._tcp";
const listing = `List of devices attached\n${serial} device product:example model:Example device:example transport_id:3\n`;
describe("wireless device selection", () => {
  it("uses only the first column and accepts mDNS serials", () => {
    expect(parseDevices(listing)).toEqual([{ serial, state: "device" }]);
    expect(resolveAdbDevice(serial, () => listing)).toBe(serial);
    expect(() =>
      resolveAdbDevice(listing.split("\n")[1], () => listing),
    ).toThrow("first-column SERIAL");
  });
  it("selects a sole authorized device and refuses ambiguous or unavailable devices", () => {
    expect(resolveAdbDevice(undefined, () => listing)).toBe(serial);
    for (const output of [
      "",
      listing + "other device\n",
      `${serial} offline\n`,
      `${serial} unauthorized\n`,
    ])
      expect(() => resolveAdbDevice(undefined, () => output)).toThrow(
        "No unique authorized",
      );
    expect(() => resolveAdbDevice("missing", () => listing)).toThrow(
      "unavailable",
    );
  });
  it("connects an explicit address then uses its exact transport", () => {
    const capture = vi
      .fn()
      .mockReturnValueOnce("")
      .mockReturnValueOnce("connected")
      .mockReturnValueOnce("192.0.2.1:12345 device\n");
    expect(resolveAdbDevice("192.0.2.1:12345", capture)).toBe(
      "192.0.2.1:12345",
    );
    expect(capture.mock.calls).toEqual([
      [["devices", "-l"]],
      [["connect", "192.0.2.1:12345"]],
      [["devices", "-l"]],
    ]);
  });
  it("maps an IP endpoint to its connected mDNS serial without choosing another phone", () => {
    const capture = (args) =>
      args[0] === "mdns"
        ? "List of discovered mdns services\nadb-example-random _adb-tls-connect._tcp. 192.0.2.1:12345\n"
        : listing + "other device\n";
    expect(resolveAdbDevice("192.0.2.1:12345", capture)).toBe(serial);
    expect(() => resolveAdbDevice("192.0.2.2:12345", capture)).toThrow(
      "first-column SERIAL",
    );
  });
  it("fails safely when mDNS cannot resolve the requested endpoint", () => {
    expect(() => resolveAdbDevice("192.0.2.1:12345", () => listing)).toThrow(
      "first-column SERIAL",
    );
    expect(() =>
      resolveAdbDevice("192.0.2.1:12345", (args) => {
        if (args[0] === "connect") throw new Error("connection refused");
        return listing;
      }),
    ).toThrow("connection refused");
  });
  it("validates ports and trims pasted addresses", () => {
    expect(validateAddress(" 192.0.2.1:12345 ")).toBe("192.0.2.1:12345");
    for (const value of [
      "host:0",
      "host:65536",
      "host:12;echo",
      "host",
      "-host:23 extra",
    ])
      expect(() => validateAddress(value)).toThrow("host:port");
  });
});

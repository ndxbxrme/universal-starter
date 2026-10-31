import { it, expect } from "vitest";
import { locationResult, locationError } from "../../src/platform/location.js";
import { mapsUrl } from "../../src/platform/web-extras.js";
import { snapIndex } from "../../src/app/carousel.js";
it("limits location results to portable coordinates and accuracy", () => {
  const value = locationResult({
    timestamp: 123,
    coords: { latitude: 53, longitude: -1, accuracy: 40, privateId: "secret" },
  });
  expect(value).toEqual({
    latitude: 53,
    longitude: -1,
    accuracy: 40,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    timestamp: 123,
  });
  expect(() => locationResult({ coords: { latitude: NaN } })).toThrow();
});
it("maps web and native location denials/timeouts without exposing raw errors", () => {
  for (const code of [1, "OS-PLUG-GLOC-0003", "OS-PLUG-GLOC-0008"])
    expect(locationError({ code, message: "sensitive" }).code).toBe(
      "PERMISSION_DENIED",
    );
  expect(locationError({ code: 3 }).message).toContain("timed out");
  expect(locationError({ code: "OS-PLUG-GLOC-0007" }).message).toContain(
    "services",
  );
});
it("opens only bounded numeric coordinates in a fixed HTTPS maps URL", () => {
  expect(mapsUrl({ latitude: 53, longitude: -1 })).toBe(
    "https://www.google.com/maps/search/?api=1&query=53,-1",
  );
  for (const latitude of ["javascript:alert(1)", 91, NaN])
    expect(() => mapsUrl({ latitude, longitude: 0 })).toThrow();
});
it("snaps short drags back, respects release direction/velocity and clamps edges", () => {
  expect(snapIndex(1, -30, 0, 400, 3)).toBe(1);
  expect(snapIndex(1, -160, 0, 400, 3)).toBe(2);
  expect(snapIndex(1, 160, 0, 400, 3)).toBe(0);
  expect(snapIndex(1, -60, -0.7, 400, 3)).toBe(2);
  expect(snapIndex(1, -120, 0.8, 400, 3)).toBe(1);
  expect(snapIndex(0, 200, 1, 400, 3)).toBe(0);
  expect(snapIndex(2, -200, -1, 400, 3)).toBe(2);
});

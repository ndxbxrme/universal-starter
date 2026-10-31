import { PlatformError } from "./contract.js";
/** Return only portable location data; never stringify plugin objects or identifiers. */
export function locationResult(position) {
  const {
    latitude,
    longitude,
    accuracy,
    altitude,
    altitudeAccuracy,
    heading,
    speed,
  } = position.coords;
  if (
    ![latitude, longitude, accuracy, position.timestamp].every(
      Number.isFinite,
    ) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180 ||
    accuracy < 0
  )
    throw new PlatformError("FAILED", "Location was invalid.");
  return {
    latitude,
    longitude,
    accuracy,
    altitude: altitude ?? null,
    altitudeAccuracy: altitudeAccuracy ?? null,
    heading: heading ?? null,
    speed: speed ?? null,
    timestamp: position.timestamp,
  };
}
export function locationError(error) {
  if (
    error?.code === 1 ||
    ["OS-PLUG-GLOC-0003", "OS-PLUG-GLOC-0008", "OS-PLUG-GLOC-0009"].includes(
      error?.code,
    )
  )
    return new PlatformError(
      "PERMISSION_DENIED",
      "Location denied. Allow location in the app’s system settings; approximate access is accepted.",
    );
  if (error?.code === 3 || error?.code === "OS-PLUG-GLOC-0010")
    return new PlatformError(
      "FAILED",
      "Location timed out. Try outdoors or increase the wait; GPS accuracy is not guaranteed indoors.",
    );
  return new PlatformError(
    "FAILED",
    "Location unavailable. Check device location services and try again.",
  );
}
export const locationOptions = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0,
  minimumUpdateInterval: 3000,
};

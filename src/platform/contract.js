/** Stable promise-based platform API. Feature code consumes this surface only.
 * @typedef {'UNSUPPORTED'|'PERMISSION_DENIED'|'CANCELLED'|'FAILED'} ErrorCode
 * @typedef {{supported:boolean, permission:'granted'|'denied'|'prompt'|'unavailable'|'unknown', reason?:string}} Capability
 * getPlatform returns id (runtime OS) and channel (dev/ci/beta/production).
 * Files return metadata only: name, size, type. Never expose native paths.
 * Network.subscribe returns an unsubscribe function. No API prompts on startup.
 */
export class PlatformError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PlatformError";
    this.code = code;
  }
}
export function unsupported(reason) {
  throw new PlatformError("UNSUPPORTED", reason);
}
export function normalizeError(error) {
  if (error instanceof PlatformError) return error;
  if (
    error?.name === "NotSupportedError" ||
    error?.name === "NotFoundError" ||
    [
      "UNIMPLEMENTED",
      "UNAVAILABLE",
      "UNSUPPORTED",
      "OS-PLUG-CAMR-0007",
    ].includes(error?.code)
  )
    return new PlatformError(
      "UNSUPPORTED",
      "This feature is unavailable on this platform.",
    );
  if (
    error?.code === "CANCELLED" ||
    error?.code === "OS-PLUG-CAMR-0006" ||
    error?.name === "AbortError" ||
    error?.message === "Share canceled"
  )
    return new PlatformError("CANCELLED", "Cancelled");
  if (
    error?.name === "NotAllowedError" ||
    error?.code === "PERMISSION_DENIED" ||
    ["OS-PLUG-CAMR-0003", "OS-PLUG-CAMR-0005"].includes(error?.code)
  )
    return new PlatformError(
      "PERMISSION_DENIED",
      "Permission denied. Review system settings.",
    );
  return new PlatformError(
    "FAILED",
    "The operation failed. Check platform permissions and try again.",
  );
}

/** Wrap feature methods so consumers receive only the documented error codes. */
export function normalizePlatform(adapter) {
  const output = { id: adapter.id };
  for (const [group, methods] of Object.entries(adapter)) {
    if (group === "id") continue;
    output[group] = {};
    for (const [name, method] of Object.entries(methods)) {
      output[group][name] =
        name === "subscribe"
          ? method.bind(methods)
          : async (...args) => {
              try {
                return await method.apply(methods, args);
              } catch (error) {
                throw normalizeError(error);
              }
            };
    }
  }
  return output;
}

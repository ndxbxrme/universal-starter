export function capability(supported, permission = "unknown", reason) {
  return {
    supported: Boolean(supported),
    permission: supported ? permission : "unavailable",
    ...(reason ? { reason } : {}),
  };
}

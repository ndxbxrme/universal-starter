/** A permission dialog can make iOS inactive without backgrounding its view. */
export function shouldSuspend(
  { isActive, isBackground },
  backgroundOnly = false,
) {
  return backgroundOnly ? (isBackground ?? !isActive) : !isActive;
}

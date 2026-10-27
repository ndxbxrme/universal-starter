export const routes = [
  "home",
  "capabilities",
  "interactions",
  "diagnostics",
  "settings",
];
export function routeFromHash(hash) {
  const route = hash.replace(/^#\/?/, "");
  return routes.includes(route) ? route : "home";
}
export function loadTheme(storage) {
  const value = storage.getItem("theme");
  return ["light", "dark", "system"].includes(value) ? value : "system";
}
export function applyTheme(theme, storage = localStorage) {
  storage.setItem("theme", theme);
  document.documentElement.dataset.theme = theme;
}
export function nextCard(index, delta, length) {
  return (index + delta + length) % length;
}

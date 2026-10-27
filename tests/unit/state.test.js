import { describe, it, expect } from "vitest";
import { routeFromHash, loadTheme, nextCard } from "../../src/app/state.js";
describe("shared state", () => {
  it("handles valid and unknown routes", () => {
    expect(routeFromHash("#/settings")).toBe("settings");
    expect(routeFromHash("#/missing")).toBe("home");
  });
  it("rejects invalid persisted themes", () => {
    expect(loadTheme({ getItem: () => "invalid" })).toBe("system");
    expect(loadTheme({ getItem: () => "dark" })).toBe("dark");
  });
  it("wraps carousel in both directions", () => {
    expect(nextCard(0, -1, 3)).toBe(2);
    expect(nextCard(2, 1, 3)).toBe(0);
  });
});

import { test, expect } from "@playwright/test";
test("shared navigation, history and responsive layout", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Your app. Everywhere." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Capabilities", exact: true }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Your app. Everywhere." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("theme persists, carousel supports pointer and keyboard, offline shell remains", async ({
  page,
  context,
}) => {
  await page.goto("./#/settings");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Interactions", exact: true }).click();
  const slide = page.getByLabel("Carousel; use left and right arrow keys");
  await slide.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slide).toContainText("02 / 03");
  const bounds = await slide.boundingBox();
  await page.mouse.move(bounds.x + bounds.width - 20, bounds.y + 30);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 20, bounds.y + 30);
  await page.mouse.up();
  await expect(slide).toContainText("03 / 03");
  await context.setOffline(true);
  await expect(page.locator("#connection")).toContainText("Offline");
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your app. Everywhere." }),
  ).toBeVisible();
  await expect(page.locator("#home-network-status")).toHaveText("Offline");
  await context.setOffline(false);
  await expect(page.locator("#home-network-status")).toHaveText("Online");
});
test("subpath assets, keyboard focus and honest unsupported states", async ({
  page,
}) => {
  await page.goto("./#/interactions");
  await expect(page.locator(".brand img")).toHaveJSProperty("complete", true);
  await expect(page.getByRole("button", { name: "Try share" })).toBeDisabled();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => document.activeElement !== document.body),
  ).toBe(true);
  await page.getByRole("link", { name: "Diagnostics", exact: true }).click();
  await expect(page.locator("pre").first()).toContainText('"platform": "web"');
});

test("accessible views on light and dark themes", async ({ page }) => {
  test.setTimeout(90000);
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  for (const theme of ["light", "dark"]) {
    await page.goto("./#/settings");
    await page
      .getByRole("button", {
        name: theme === "light" ? "Light" : "Dark",
        exact: true,
      })
      .click();
    for (const route of [
      "home",
      "capabilities",
      "interactions",
      "diagnostics",
      "settings",
    ]) {
      await page.goto("./#/" + route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    }
  }
});

test("touch swipe changes cards on phone", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch gesture uses the phone profile.");
  await page.goto("./#/interactions");
  const slide = page.getByLabel("Carousel; use left and right arrow keys");
  await expect(slide).toContainText("01 / 03");
  const bounds = await slide.boundingBox();
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: bounds.x + bounds.width - 30, y: bounds.y + 40 }],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: bounds.x + 30, y: bounds.y + 40 }],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(slide).toContainText("02 / 03");
});

test("tablet layout, file metadata and subpath manifest", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("./#/interactions");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const selected = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Try files" }).click();
  await (
    await selected
  ).setFiles({
    name: "hello.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hello"),
  });
  await expect(page.getByRole("status")).toContainText("files: success");
  await expect(page.getByRole("status")).toContainText('"size":5');
  const manifestUrl = new URL("manifest.webmanifest", page.url()).href;
  const response = await page.request.get(manifestUrl);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.scope).toBe(".");
  expect(manifest.start_url).toBe(".");
  for (const icon of manifest.icons)
    expect(
      (await page.request.get(new URL(icon.src, manifestUrl).href)).ok(),
    ).toBe(true);
});

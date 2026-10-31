import { test, expect } from "@playwright/test";
const pageErrors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (e) => errors.push(e.message));
});
test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page)).toEqual([]);
});
test("GPS stays on its screen, clears explicitly and reports denied permission", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    latitude: 53.8008,
    longitude: -1.5491,
    accuracy: 25,
  });
  await page.goto("./#/interactions");
  const gps = page
    .getByRole("heading", { name: "Find your location" })
    .locator("..");
  await gps
    .getByRole("button", { name: "Get my location", exact: true })
    .click();
  await expect(gps).toContainText("53.800800");
  await expect(gps).toContainText("±25 m");
  await gps.getByRole("button", { name: "Clear location" }).click();
  await expect(gps).not.toContainText("53.800800");
  await gps
    .getByRole("button", { name: "Follow location", exact: true })
    .click();
  await expect(
    gps.getByRole("button", { name: "Stop following" }),
  ).toBeEnabled();
  await gps.getByRole("button", { name: "Stop following" }).click();
  await expect(gps).toContainText("updates stopped");
  await page.getByRole("link", { name: "Diagnostics", exact: true }).click();
  await expect(page.locator("main")).not.toContainText("53.800800");
  await context.clearPermissions();
  await context.grantPermissions([]);
  await page.goto("./#/interactions");
  await page
    .getByRole("button", { name: "Get my location", exact: true })
    .click();
  await expect(gps).toContainText("PERMISSION_DENIED");
});
test("drag follows pointer, short drags snap back, cancellation and reverse release are safe", async ({
  page,
}) => {
  await page.goto("./#/interactions");
  const viewport = page.getByLabel("Carousel; use left and right arrow keys");
  const track = viewport.locator(".carousel-track");
  const status = viewport.locator(".carousel-status");
  const b = await viewport.boundingBox();
  const x = b.x + b.width * 0.65,
    y = b.y + 45;
  await page.mouse.move(x, y);
  await page.mouse.down();
  const initial = await track.evaluate((n) => getComputedStyle(n).transform);
  await page.mouse.move(x - 45, y, { steps: 8 });
  expect(await track.evaluate((n) => getComputedStyle(n).transform)).not.toBe(
    initial,
  );
  await page.waitForTimeout(120);
  await page.mouse.up();
  await expect(status).toHaveText("01 / 03");
  await viewport.focus();
  await page.keyboard.press("ArrowRight");
  await expect(status).toHaveText("02 / 03");
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(b.x + 25, y, { steps: 10 });
  await page.mouse.up();
  await expect(status).toHaveText("03 / 03");
  await viewport.focus();
  await page.keyboard.press("Home");
  await expect(status).toHaveText("01 / 03");
  await page.mouse.move(x, y);
  await page.mouse.down();
  await viewport.dispatchEvent("pointercancel", {
    pointerId: 1,
    isPrimary: true,
  });
  await page.mouse.up();
  await expect(status).toHaveText("01 / 03");
});
test("audio records a generated test signal, plays locally, exports and discards", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["microphone"]);
  await page.goto("./#/interactions");
  const audio = page
    .getByRole("heading", { name: "Record an audio note" })
    .locator("..");
  await audio
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await expect(audio).toContainText("microphone active");
  await page.waitForTimeout(650); // The actual MediaRecorder must receive audio samples.
  await audio
    .getByRole("button", { name: "Stop recording", exact: true })
    .click();
  await expect(audio).toContainText("Recorded");
  await expect(audio.locator("audio")).toHaveAttribute("src", /^blob:/);
  await expect
    .poll(() => audio.locator("audio").evaluate((n) => n.readyState))
    .toBeGreaterThan(0);
  const download = page.waitForEvent("download");
  await audio.getByRole("button", { name: "Save / export recording" }).click();
  expect((await download).suggestedFilename()).toMatch(
    /^recording\.(webm|m4a|ogg)$/,
  );
  await audio.getByRole("button", { name: "Discard recording" }).click();
  await expect(audio.locator("audio")).toBeHidden();
  await expect(audio).toContainText("microphone released");
  await audio
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await expect(audio).toContainText("microphone active");
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await page.getByRole("link", { name: "Interactions", exact: true }).click();
  await expect(
    audio.getByRole("button", { name: "Start recording", exact: true }),
  ).toBeEnabled();
});
test("photo preview uses a temporary local image and preferences persist", async ({
  page,
}) => {
  await page.goto("./#/interactions");
  const chooser = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "Choose a photo", exact: true })
    .click();
  await (
    await chooser
  ).setFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ioAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.getByAltText("Selected photo preview")).toBeVisible();
  await page.getByRole("button", { name: "Clear photo", exact: true }).click();
  await expect(page.getByAltText("Selected photo preview")).toBeHidden();
  await page.goto("./#/settings");
  await page.getByLabel("Prefer high-accuracy location").uncheck();
  await page.getByLabel("Distance units", { exact: true }).selectOption("mi");
  await page.reload();
  await expect(
    page.getByLabel("Prefer high-accuracy location"),
  ).not.toBeChecked();
  await expect(page.getByLabel("Distance units", { exact: true })).toHaveValue(
    "mi",
  );
});

import { readFile } from "node:fs/promises";
import path from "node:path";
import { _electron as electron, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts/desktop-smoke", { recursive: true });
const app = await electron.launch({
  args: [
    ...(process.env.ELECTRON_SMOKE_EXECUTABLE ? [] : ["."]),
    "--use-fake-device-for-media-stream",
  ],
  executablePath: process.env.ELECTRON_SMOKE_EXECUTABLE,
  chromiumSandbox: true,
  timeout: 90000,
});
try {
  const page = await app.firstWindow();
  await page.waitForFunction(() => window.universalDesktop);
  expect(await page.evaluate(() => window.universalDesktop.sandboxed)).toBe(
    true,
  );
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await expect(
    page.getByRole("heading", { name: "Your app. Everywhere." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => ({
      node: typeof window.require,
      process: typeof window.process,
      bridge: Object.keys(window.universalDesktop),
    })),
  ).toEqual({
    node: "undefined",
    process: "undefined",
    bridge: ["version", "sandboxed", "platform", "invoke"],
  });
  expect(
    await page.evaluate(() => window.universalDesktop.invoke("unknown")),
  ).toMatchObject({ ok: false });
  expect(
    await page.evaluate(() =>
      window.universalDesktop.invoke("files", { path: "/etc/passwd" }),
    ),
  ).toMatchObject({ ok: false });
  const options = await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences(),
  );
  expect(options).toMatchObject({
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    webSecurity: true,
  });
  await page.evaluate(() =>
    window.universalDesktop.invoke("clipboard", {
      text: "Universal desktop smoke",
    }),
  );
  expect(await app.evaluate(({ clipboard }) => clipboard.readText())).toBe(
    "Universal desktop smoke",
  );
  await app.evaluate(({ dialog }) => {
    dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] });
  });
  expect(
    await page.evaluate(() => window.universalDesktop.invoke("files")),
  ).toMatchObject({ ok: false, code: "CANCELLED" });
  await app.evaluate(({ dialog, app }) => {
    dialog.showOpenDialog = async () => ({
      canceled: false,
      filePaths: [app.getAppPath() + "/package.json"],
    });
  });
  const file = await page.evaluate(() =>
    window.universalDesktop.invoke("files"),
  );
  expect(file.ok).toBe(true);
  expect(file.value.name).toBe("package.json");
  expect(file.value).not.toHaveProperty("path");
  const blocked = await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    let prevented = false;
    win.webContents.emit(
      "will-navigate",
      {
        preventDefault() {
          prevented = true;
        },
      },
      "https://untrusted.invalid/",
    );
    return prevented;
  });
  expect(blocked).toBe(true);
  await page.evaluate(() => window.open("https://untrusted.invalid/"));
  expect(
    await app.evaluate(
      ({ BrowserWindow }) => BrowserWindow.getAllWindows().length,
    ),
  ).toBe(1);
  await page.context().setOffline(true);
  await page.getByRole("link", { name: "Interactions", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Try haptics" }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "Diagnostics", exact: true }).click();
  await expect(page.locator("pre").first()).toContainText("electron");
  await page.reload();
  await expect(page.locator("pre").first()).toContainText("electron");
  await expect(
    page.getByRole("link", { name: "Diagnostics", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.setViewportSize({ width: 700, height: 700 });
  await page.screenshot({ path: "artifacts/desktop-smoke/window.png" });
  expect(errors).toEqual([]);
  await page.context().setOffline(false);
  await page.getByRole("link", { name: "Interactions", exact: true }).click();
  const audio = page
    .getByRole("heading", { name: "Record an audio note" })
    .locator("..");
  const outputPath = path.resolve("artifacts/desktop-smoke/audio.webm");
  await app.evaluate(({ dialog }, outputPath) => {
    globalThis.audioPermissionPrompts = 0;
    dialog.showMessageBox = async () => {
      globalThis.audioPermissionPrompts++;
      return { response: 1 };
    };
    dialog.showSaveDialog = async () => ({
      canceled: false,
      filePath: outputPath,
    });
  }, outputPath);
  await audio
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await expect(audio).toContainText("microphone active");
  expect(
    await app.evaluate(() => globalThis.audioPermissionPrompts),
  ).toBeGreaterThan(0);
  await page.waitForTimeout(650); // Receive generated audio samples through the real recorder.
  await audio
    .getByRole("button", { name: "Stop recording", exact: true })
    .click();
  await expect(audio).toContainText("Recorded");
  await expect
    .poll(() => audio.locator("audio").evaluate((n) => n.readyState))
    .toBeGreaterThan(0);
  await audio.getByRole("button", { name: "Save / export recording" }).click();
  await expect(audio).toContainText("Export requested");
  expect((await readFile(outputPath)).length).toBeGreaterThan(0);
  await audio.getByRole("button", { name: "Discard recording" }).click();
  await expect(audio.locator("audio")).toBeHidden();
  console.log(
    "PASS: Electron generated-input audio recording, local playback, bounded IPC save and discard (microphone hardware and OS dialogs unverified).",
  );
  console.log(
    "PASS: Electron preload isolation, IPC validation, native clipboard, dialog mocks, navigation/window policy, offline UI and clean exit. Dialog selection is mocked; no OS dialog automation claimed.",
  );
} finally {
  await app.close();
}

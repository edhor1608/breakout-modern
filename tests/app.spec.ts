import { expect, test } from "@playwright/test";

test("opens menu and starts gameplay", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Breakout" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator("#overlay")).not.toHaveClass(/is-visible/);
  await expect(page.locator("#hud-lives")).toHaveText("3");
});

test("can start with spin physics enabled", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Spin physics").check();
  await expect(page.getByRole("button", { name: "Spin on" })).toBeVisible();
  await page.getByRole("button", { name: "Start" }).click();

  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Spin on" })).toBeVisible();
});

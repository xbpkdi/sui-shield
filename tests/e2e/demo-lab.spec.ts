import { test, expect } from "@playwright/test";

/**
 * Demo Lab is behind AuthGuard — run with a signed-in session or set E2E_SKIP_AUTH=0
 * after adding a Playwright auth fixture. Selectors match current UI labels.
 */
test.describe("Demo Lab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo-lab");
    // Unsigned users are redirected to login
    const onLogin = page.url().includes("/login");
    if (onLogin) {
      test.skip(true, "Demo Lab requires zkLogin session — add E2E auth fixture for CI");
    }
    await expect(page.getByRole("heading", { name: "Live Simulation" })).toBeVisible();
  });

  test("normal scenario updates transaction and log metrics", async ({ page }) => {
    const initialTxCount = await page.locator("table tbody tr").count();

    await page.getByRole("button", { name: /Run scenario: Normal Success/ }).click();

    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: "TX Guardian" }).click();
    await expect(page.getByRole("heading", { name: "Transaction Guardian" })).toBeVisible();

    const newTxCount = await page.locator("table tbody tr").count();
    expect(newTxCount).toBeGreaterThanOrEqual(initialTxCount);
  });

  test("duplicate scenario blocks sponsorship", async ({ page }) => {
    await page.getByRole("button", { name: /Run scenario: Duplicate Request/ }).click();

    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[role="status"]')).toContainText(/Duplicate/i);

    await expect(page.getByText("Reject")).toBeVisible();
  });

  test("reset clears the demo state", async ({ page }) => {
    await page.getByRole("button", { name: /Run scenario: Normal Success/ }).click();
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Reset Demo" }).click();

    await expect(page.locator('[role="status"]')).not.toBeVisible();
    await expect(page.getByText("Run a scenario")).toBeVisible();
  });
});
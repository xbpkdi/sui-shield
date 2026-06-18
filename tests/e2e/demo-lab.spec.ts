import { test, expect } from "@playwright/test";

test.describe("Demo Lab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo-lab");
    await expect(page.getByRole("heading", { name: "Live Simulation" })).toBeVisible();
  });

  test("normal scenario updates transaction and log metrics", async ({ page }) => {
    // Get initial state
    const initialTxCount = await page.locator('[aria-label="Transaction list"] tbody tr').count();

    // Run normal scenario
    await page.getByRole("button", { name: /Run scenario: Normal Success/ }).click();

    // Wait for completion
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[role="status"]')).toContainText("Badge minted");

    // Navigate to transaction guardian
    await page.getByRole("link", { name: "Transaction Guardian" }).click();
    await expect(page.getByRole("heading", { name: "Transaction Guardian" })).toBeVisible();

    // Should have more transactions
    const newTxCount = await page.locator('[aria-label="Transaction list"] tbody tr').count();
    expect(newTxCount).toBeGreaterThan(initialTxCount);
  });

  test("duplicate scenario blocks sponsorship", async ({ page }) => {
    // Run duplicate scenario
    await page.getByRole("button", { name: /Run scenario: Duplicate Request/ }).click();

    // Wait for completion
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[role="status"]')).toContainText("Duplicate");

    // Check agent decision shows "Block"
    await expect(page.getByText("Block Sponsorship")).toBeVisible();
  });

  test("reset clears the demo state", async ({ page }) => {
    // Run a scenario first
    await page.getByRole("button", { name: /Run scenario: Normal Success/ }).click();
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 10_000 });

    // Reset
    await page.getByRole("button", { name: "Reset Demo" }).click();

    // Outcome should be gone
    await expect(page.locator('[role="status"]')).not.toBeVisible();
    await expect(page.getByText("Run a scenario")).toBeVisible();
  });
});

import { expect, test } from "@playwright/test";

test("homepage search navigates to matching products", async ({ page }) => {
  await page.route("**/api/products", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    }),
  );

  await page.goto("/");

  await expect(
    page.getByRole("img", { name: "Electronic Shop Ethiopia" }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Search products" }).fill("camera");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/\/products\?search=camera$/);
});

test("guest checkout redirects to login", async ({ page }) => {
  await page.goto("/checkout");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("form.auth-card")).toBeVisible();
  await expect(page.locator("#email")).toBeVisible();
  await expect(page.locator("#password")).toBeVisible();
});

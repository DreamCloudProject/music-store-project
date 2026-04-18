import { expect, test } from "@playwright/test";

test("updates the URL when submitting search", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Треки",
    }),
  ).toBeVisible();

  const searchField = page.getByRole("searchbox", {
    name: "Поиск по трекам",
  });

  await searchField.fill("zhu");
  await searchField.press("Enter");

  await expect(page).toHaveURL(/search=zhu/);
  await expect(searchField).toHaveValue("zhu");
});

test("keeps search input in sync when navigating back and forward", async ({
  page,
}) => {
  await page.goto("/");

  const searchField = page.getByRole("searchbox", {
    name: "Поиск по трекам",
  });
  const submitButton = page.getByRole("button", { name: "Искать" });

  await searchField.fill("  zhu  ");
  await submitButton.click();

  await expect(page).toHaveURL(/search=zhu/);
  await expect(searchField).toHaveValue("zhu");

  await searchField.fill(" ambient ");
  await submitButton.click();

  await expect(page).toHaveURL(/search=ambient/);
  await expect(searchField).toHaveValue("ambient");

  await page.goBack();

  await expect(page).toHaveURL(/search=zhu/);
  await expect(searchField).toHaveValue("zhu");

  await page.goForward();

  await expect(page).toHaveURL(/search=ambient/);
  await expect(searchField).toHaveValue("ambient");
});

test("updates filter trigger labels after changing selections", async ({
  page,
}) => {
  await page.goto("/");

  const artistTrigger = page.getByRole("button", {
    name: "Выбрать исполнителя, 2 в наборе",
  });

  await artistTrigger.click();

  const calvinHarrisItem = page.getByRole("menuitemcheckbox", {
    name: "Calvin Harris",
  });

  await calvinHarrisItem.click();
  await expect(calvinHarrisItem).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", {
      name: "Выбрать исполнителя, 3 в наборе",
    }),
  ).toBeVisible();

  const genreTrigger = page.getByRole("button", {
    name: "Выбрать жанр",
  });

  await genreTrigger.click();

  const rockItem = page.getByRole("menuitemcheckbox", {
    name: "Рок",
  });

  await rockItem.click();
  await expect(rockItem).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", {
      name: "Выбрать жанр, 1 в наборе",
    }),
  ).toBeVisible();
});

import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "mastermindcms-auth-session",
      JSON.stringify({
        token: "msw-token:demo@music.store",
        username: "demo@music.store",
      }),
    );
  });
});

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
    name: "Выбрать исполнителя",
  });

  await artistTrigger.click();

  const artistItem = page.getByRole("menuitemcheckbox").first();
  await expect(artistItem).toBeVisible();

  await artistItem.click();
  await expect(artistItem).toHaveAttribute("aria-checked", "true");
  await expect(
    page.getByRole("menu", {
      name: "Выбрать исполнителя, 1 в наборе",
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", {
      name: "Выбрать исполнителя, 1 в наборе",
    }),
  ).toBeVisible();

  const genreTrigger = page.getByRole("button", {
    name: "Выбрать жанр",
  });

  await genreTrigger.click();

  const genreItem = page.getByRole("menuitemcheckbox").first();
  await expect(genreItem).toBeVisible();

  await genreItem.click();
  await expect(genreItem).toHaveAttribute("aria-checked", "true");
  await expect(
    page.getByRole("menu", {
      name: "Выбрать жанр, 1 в наборе",
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", {
      name: "Выбрать жанр, 1 в наборе",
    }),
  ).toBeVisible();
});

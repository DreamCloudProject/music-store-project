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

  const artistItem = page.getByRole("menuitemcheckbox", {
    name: "FaderX",
  });

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

  const genreItem = page.getByRole("menuitemcheckbox", {
    name: "EDM",
  });

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

test("shows the player after clicking a track, not a favorite heart", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Треки",
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Воспроизвести" })).toHaveCount(
    0,
  );

  await page
    .getByRole("button", { name: "Добавить в избранное" })
    .first()
    .click();
  await expect(page.getByRole("button", { name: "Воспроизвести" })).toHaveCount(
    0,
  );

  await page
    .getByRole("button", {
      name: "Играть Not Alone — Sick Individuals",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Воспроизвести" }),
  ).toBeVisible();
});

test("opens my tracks from the sidebar and lists favorite SKUs", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Добавить в избранное" })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Добавить в избранное" })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Убрать из избранного" }),
  ).toHaveCount(2, { timeout: 10000 });
  await page
    .getByRole("button", {
      name: "Играть Not Alone — Sick Individuals",
      exact: true,
    })
    .click();

  await page.getByRole("button", { name: "Меню" }).click();
  await page.getByRole("link", { name: "Мои треки" }).click();

  await expect(page).toHaveURL(/\/my-tracks/);
  await expect(page.getByRole("heading", { name: "Мои треки" })).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Играть Not Alone — Sick Individuals",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Играть The Arrival — FaderX",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Плеер", { exact: true })).toBeVisible();
});

test("keeps header search on my-tracks", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Меню" }).click();
  await page.getByRole("link", { name: "Мои треки" }).click();

  const searchField = page.getByRole("searchbox", {
    name: "Поиск по трекам",
  });
  await searchField.fill("zhu");
  await searchField.press("Enter");

  await expect(page).toHaveURL(/\/my-tracks/);
  await expect(page).toHaveURL(/search=zhu/);
  await expect(searchField).toHaveValue("zhu");
});

test("marks the current page in the sidebar menu", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Меню" }).click();

  await expect(page.getByRole("link", { name: "Главное" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(
    page.getByRole("link", { name: "Мои треки" }),
  ).not.toHaveAttribute("aria-current");

  await page.getByRole("link", { name: "Мои треки" }).click();
  const myTracksLink = page.getByRole("link", { name: "Мои треки" });
  if (!(await myTracksLink.isVisible())) {
    await page.getByRole("button", { name: "Меню" }).click();
  }

  await expect(myTracksLink).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Главное" })).not.toHaveAttribute(
    "aria-current",
  );
});

test("plays a track from the artist and album cells with the keyboard", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Треки" })).toBeVisible();

  await page
    .getByRole("button", {
      name: "Играть Not Alone — Sick Individuals, исполнитель",
      exact: true,
    })
    .press("Enter");
  await expect(
    page.getByLabel("Плеер", { exact: true }).getByText("Not Alone"),
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: "Играть The Arrival — FaderX, альбом",
      exact: true,
    })
    .press(" ");
  await expect(
    page.getByLabel("Плеер", { exact: true }).getByText("The Arrival"),
  ).toBeVisible();
});

test("shows an empty playlist when there are no favorites", async ({
  page,
}) => {
  await page.goto("/my-tracks");
  await expect(page.getByRole("heading", { name: "Мои треки" })).toBeVisible();
  await expect(page.getByText("Пока нет избранных треков")).toBeVisible();
});

test("removes a track from my tracks when unfavorited", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Добавить в избранное" })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Убрать из избранного" }),
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Меню" }).click();
  await page.getByRole("link", { name: "Мои треки" }).click();
  await expect(
    page.getByRole("button", {
      name: "Играть Not Alone — Sick Individuals",
      exact: true,
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Убрать из избранного" }).click();
  await expect(page.getByText("Пока нет избранных треков")).toBeVisible();
});

test("can favorite two tracks without locking the rest", async ({ page }) => {
  await page.goto("/");
  const addButtons = page.getByRole("button", { name: "Добавить в избранное" });
  await expect(addButtons.nth(1)).toBeVisible();
  const addBefore = await addButtons.count();
  await Promise.all([addButtons.nth(0).click(), addButtons.nth(1).click()]);

  await expect(
    page.getByRole("button", { name: "Убрать из избранного" }),
  ).toHaveCount(2);
  if (addBefore > 2) {
    await expect(addButtons.first()).toBeEnabled();
  }
});

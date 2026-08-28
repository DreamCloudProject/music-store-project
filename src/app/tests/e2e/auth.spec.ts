import { expect, test, type Page } from "@playwright/test";

async function signInAsDemo(page: Page) {
  await page.goto("/sign-in");
  await page.getByPlaceholder("Логин").fill("demo@music.store");
  await page.getByPlaceholder("Пароль", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { name: "Треки" })).toBeVisible();
}

test("redirects guests from home to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();
});

test("logs in with demo credentials", async ({ page }) => {
  await signInAsDemo(page);
});

test("logs out back to the sign-in form", async ({ page }) => {
  await signInAsDemo(page);
  await page.getByRole("button", { name: "Выйти из аккаунта" }).click();
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();
});

test("registers, verifies email code, then signs in", async ({ page }) => {
  const email = `e2e-${Date.now()}@music.store`;

  await page.goto("/sign-up");
  await page.getByPlaceholder("Имя").fill("E2E");
  await page.getByPlaceholder("Фамилия").fill("User");
  await page.getByPlaceholder("Логин").fill(email);
  await page.getByPlaceholder("Пароль", { exact: true }).fill("password");
  await page.getByPlaceholder("Повторите пароль").fill("password");
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();

  await expect(
    page.getByText(new RegExp(`отправленного на ${email}`)),
  ).toBeVisible();

  await page.locator('input[autocomplete="one-time-code"]').fill("123456");
  await page.getByRole("button", { name: "Подтвердить" }).click();

  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();
  await page.getByPlaceholder("Логин").fill(email);
  await page.getByPlaceholder("Пароль", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Войти" }).click();

  await expect(page.getByRole("heading", { name: "Треки" })).toBeVisible();
});

test("sends an inactive user from login to verification", async ({ page }) => {
  const email = `e2e-inactive-${Date.now()}@music.store`;

  await page.goto("/sign-up");
  await page.getByPlaceholder("Имя").fill("Wait");
  await page.getByPlaceholder("Фамилия").fill("Code");
  await page.getByPlaceholder("Логин").fill(email);
  await page.getByPlaceholder("Пароль", { exact: true }).fill("password");
  await page.getByPlaceholder("Повторите пароль").fill("password");
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();
  await expect(
    page.getByText(new RegExp(`отправленного на ${email}`)),
  ).toBeVisible();

  await page.goto("/sign-in");
  await page.getByPlaceholder("Логин").fill(email);
  await page.getByPlaceholder("Пароль", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Войти" }).click();

  await expect(
    page.getByText(new RegExp(`отправленного на ${email}`)),
  ).toBeVisible();
});

test("does not share favorites after switching accounts", async ({ page }) => {
  await signInAsDemo(page);
  await page
    .getByRole("button", { name: "Добавить в избранное" })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Убрать из избранного" }),
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Выйти из аккаунта" }).click();
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();

  const email = `e2e-switch-${Date.now()}@music.store`;
  await page.goto("/sign-up");
  await page.getByPlaceholder("Имя").fill("E2E");
  await page.getByPlaceholder("Фамилия").fill("Switch");
  await page.getByPlaceholder("Логин").fill(email);
  await page.getByPlaceholder("Пароль", { exact: true }).fill("password");
  await page.getByPlaceholder("Повторите пароль").fill("password");
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();
  await expect(
    page.getByText(new RegExp(`отправленного на ${email}`)),
  ).toBeVisible();

  await page.locator('input[autocomplete="one-time-code"]').fill("123456");
  await page.getByRole("button", { name: "Подтвердить" }).click();
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();
  await page.getByPlaceholder("Логин").fill(email);
  await page.getByPlaceholder("Пароль", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { name: "Треки" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Убрать из избранного" }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Меню" }).click();
  await page.getByRole("link", { name: "Мои треки" }).click();
  await expect(page.getByText("Пока нет избранных треков")).toBeVisible();
});

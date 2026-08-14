import type {
  LoginPayload,
  RegisterPayload,
  SellerType,
  VerifyCodePayload,
} from "../model/types";

const {
  beanRequest: BEAN_ENDPOINT,
  token: TOKEN_ENDPOINT,
  logout: LOGOUT_ENDPOINT,
  validateToken: VALIDATE_TOKEN_ENDPOINT,
  verifyEmail: VERIFY_EMAIL_ENDPOINT,
} = ((apiRoot) => ({
  beanRequest: `${apiRoot}/bean/request`,
  token: `${apiRoot}/auth/token`,
  logout: `${apiRoot}/logout`,
  validateToken: `${apiRoot}/auth/validate-token`,
  verifyEmail: `${apiRoot}/auth/verify`,
}))(String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, ""));

const HEADERS = {
  "Content-Type": "application/json",
  "Site-Context": "site",
  "Lang-Context": "ru",
} as const;

function buildCompanyName(
  firstName: string,
  lastName: string,
  email: string,
): string {
  return `${firstName} ${lastName} (${email})`;
}

export async function checkEmail(email: string): Promise<boolean> {
  const response = await fetch(BEAN_ENDPOINT, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      beanId: "sellerRegistrationServiceImpl",
      scope: "PROTOTYPE",
      functionName: "isEmailTaken",
      args: [{ "0": email }],
    }),
  });

  if (!response.ok) throw new Error("Ошибка проверки email");
  const result = (await response.json()) as { result: boolean };
  return result.result;
}

export async function register(
  payload: RegisterPayload,
  sellerType: SellerType = "BUYER",
): Promise<unknown> {
  const { firstName, lastName, email, password } = payload;

  const response = await fetch(BEAN_ENDPOINT, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      beanId: "customerServiceImpl",
      scope: "PROTOTYPE",
      functionName: "registerCustomerFull",
      args: [
        {
          "0": {
            sellerType,
            companyName: buildCompanyName(firstName, lastName, email),
            profiles: [
              {
                firstName,
                lastName,
                emailAddress: email,
                user: {
                  username: email,
                  password,
                },
              },
            ],
          },
        },
      ],
    }),
  });

  if (!response.ok) throw new Error("Ошибка регистрации");
  return response.json();
}

export async function validateVerificationToken(
  token: string,
): Promise<boolean> {
  const response = await fetch(BEAN_ENDPOINT, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      beanId: "customerServiceImpl",
      scope: "PROTOTYPE",
      functionName: "validateVerificationToken",
      args: [{ "0": token }],
    }),
  });

  if (!response.ok) return false;
  const result = (await response.json()) as { result: boolean };
  return result.result;
}

export async function sendVerificationEmail(username: string): Promise<void> {
  const response = await fetch(BEAN_ENDPOINT, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      beanId: "customerServiceImpl",
      scope: "PROTOTYPE",
      functionName: "sendVerificationEmail",
      args: [{ "0": { id: "", username } }],
    }),
  });

  if (!response.ok) throw new Error("Не удалось отправить новый код");
}

export async function isUserActive(email: string): Promise<boolean> {
  const response = await fetch(BEAN_ENDPOINT, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      beanId: "sellerRegistrationServiceImpl",
      scope: "PROTOTYPE",
      functionName: "isUserActive",
      args: [{ "0": email }],
    }),
  });

  if (!response.ok) throw new Error("Ошибка проверки статуса аккаунта");
  const result = (await response.json()) as { result: boolean };
  return result.result;
}

export async function login(payload: LoginPayload): Promise<{ token: string }> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("Неверный логин или пароль");
  return response.json() as Promise<{ token: string }>;
}

export async function validateToken(
  payload: VerifyCodePayload,
): Promise<boolean> {
  const response = await fetch(VALIDATE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(payload),
  });

  return response.ok;
}

export async function verifyEmail(payload: VerifyCodePayload): Promise<void> {
  const response = await fetch(VERIFY_EMAIL_ENDPOINT, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      token: payload.token,
      username: payload.username,
    }),
  });

  if (!response.ok) throw new Error("Неверный код подтверждения");
}

export async function logout(): Promise<void> {
  const response = await fetch(LOGOUT_ENDPOINT, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ role: "user" }),
  });

  if (!response.ok) throw new Error("Ошибка выхода");
}

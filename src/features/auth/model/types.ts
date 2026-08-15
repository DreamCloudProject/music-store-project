export type SellerType = "BUYER" | "VENDOR" | "ADMIN";

export interface AuthSession {
  token: string;
  username: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export type VerifyCodePayload = AuthSession;

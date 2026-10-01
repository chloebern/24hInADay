import crypto from "node:crypto";

export const SESSION_COOKIE_NAME = "hours_session";

function getAppPassword() {
  return process.env.APP_PASSWORD || "changeme";
}

function getSessionSecret() {
  return process.env.APP_SESSION_SECRET || "dev-secret-change-me";
}

function expectedToken(): string {
  return crypto
    .createHash("sha256")
    .update(`${getAppPassword()}:${getSessionSecret()}`)
    .digest("hex");
}

export function checkPassword(candidate: string): boolean {
  const password = getAppPassword();
  const a = Buffer.from(candidate);
  const b = Buffer.from(password);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function getSessionCookieValue(): string {
  return expectedToken();
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expectedToken());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

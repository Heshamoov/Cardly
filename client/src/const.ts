export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Returns the URL for the custom login page.
 * Pass an optional returnPath so the user is redirected back after sign-in.
 * This replaces the old Manus OAuth portal redirect.
 */
export const getLoginUrl = (returnPath?: string) => {
  const path = returnPath ? `/login?returnPath=${encodeURIComponent(returnPath)}` : "/login";
  return path;
};

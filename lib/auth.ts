export const AUTH_COOKIE = "atifarm_auth";

/** Cookie value = SHA-256 of the shared password (so it can't be forged
 *  without knowing APP_PASSWORD). Web Crypto works in both edge & node. */
export async function authToken(): Promise<string> {
  const pw = process.env.APP_PASSWORD || "";
  const data = new TextEncoder().encode("atifarm:" + pw);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

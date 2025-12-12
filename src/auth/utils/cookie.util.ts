const DOMAIN = process.env.COOKIE_DOMAIN!;
const THIRTY_MINUTES = 30 * 60;

export function createCookie(
  name: string,
  value: string,
  maxAge = THIRTY_MINUTES,
) {
  return `${name}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}; Domain=${DOMAIN}`;
}

export function deleteCookie(name: string) {
  return `${name}=; HttpOnly; Path=/; Max-Age=0; Domain=${DOMAIN}`;
}

import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';
const DOMAIN = process.env.COOKIE_DOMAIN!;
const THIRTY_DAYS = 30 * 24 * 60 * 60;

export function createCookie(
  name: string,
  value: string,
  maxAge = THIRTY_DAYS,
) {
  const parts = [`${name}=${value}`, 'HttpOnly', 'Path=/', `Max-Age=${maxAge}`];

  if (isProduction) {
    parts.push('SameSite=None', 'Secure', `Domain=${DOMAIN}`);
  } else {
    parts.push('SameSite=Lax');
  }

  return parts.join('; ');
}

export function deleteCookie(name: string) {
  const parts = [`${name}=`, 'HttpOnly', 'Path=/', 'Max-Age=0'];

  if (isProduction) {
    parts.push('SameSite=None', 'Secure', `Domain=${DOMAIN}`);
  } else {
    parts.push('SameSite=Lax');
  }

  return parts.join('; ');
}

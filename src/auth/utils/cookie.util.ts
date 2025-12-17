// import 'dotenv/config';

// const isProduction = process.env.NODE_ENV === 'production';
// const DOMAIN = process.env.COOKIE_DOMAIN!;
// const THIRTY_DAYS = 30 * 24 * 60 * 60;

// export function createCookie(
//   name: string,
//   value: string,
//   maxAge = THIRTY_DAYS,
// ) {
//   const parts = [`${name}=${value}`, 'HttpOnly', 'Path=/', `Max-Age=${maxAge}`];

//   if (isProduction) {
//     parts.push('SameSite=None', 'Secure', `Domain=${DOMAIN}`);
//   } else {
//     parts.push('SameSite=Lax');
//   }

//   return parts.join('; ');
// }

// export function deleteCookie(name: string) {
//   const parts = [`${name}=`, 'HttpOnly', 'Path=/', 'Max-Age=0'];

//   if (isProduction) {
//     parts.push('SameSite=None', 'Secure', `Domain=${DOMAIN}`);
//   } else {
//     parts.push('SameSite=Lax');
//   }

//   return parts.join('; ');
// }

import type { IncomingMessage } from 'http';

const DOMAIN = process.env.COOKIE_DOMAIN!;
const THIRTY_DAYS = 30 * 24 * 60 * 60;

function isLocalhost(req?: IncomingMessage) {
  const origin = req?.headers.origin || '';
  return origin.includes('localhost') || origin.includes('127.0.0.1');
}

export function createCookie(
  req: IncomingMessage | undefined,
  name: string,
  value: string,
  maxAge = THIRTY_DAYS,
) {
  const parts = [`${name}=${value}`, 'HttpOnly', 'Path=/', `Max-Age=${maxAge}`];

  if (isLocalhost(req)) {
    // ✅ Browser accepts this on localhost
    parts.push('SameSite=Lax');
  } else {
    // ✅ Required for cross-site prod
    parts.push('SameSite=None', 'Secure', `Domain=${DOMAIN}`);
  }

  return parts.join('; ');
}

export function deleteCookie(req: IncomingMessage | undefined, name: string) {
  const parts = [`${name}=`, 'HttpOnly', 'Path=/', 'Max-Age=0'];

  if (isLocalhost(req)) {
    // must match createCookie localhost mode
    parts.push('SameSite=Lax');
  } else {
    // must match createCookie production mode
    parts.push('SameSite=None', 'Secure', `Domain=${DOMAIN}`);
  }

  return parts.join('; ');
}

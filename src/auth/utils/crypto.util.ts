// src/auth/crypto.util.ts
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.COOKIE_SECRET); // 32+ bytes

export async function encryptSession(payload: any, expiresIn = '7d') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function decryptSession(
  token: string | undefined,
  maxTokenAge?: string,
) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { maxTokenAge });
    return payload;
  } catch {
    return null;
  }
}

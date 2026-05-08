import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = "nc_token";
const EXPIRY = "7d";

export interface AuthPayload extends JWTPayload {
  userId: string;
  email: string;
}

export async function signToken(payload: Omit<AuthPayload, keyof JWTPayload>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<AuthPayload> {
  const { payload } = await jwtVerify(token, SECRET);
  return payload as AuthPayload;
}

/** Read + verify JWT from cookie. Returns null if missing/invalid. */
export async function getSessionUser(): Promise<AuthPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export { COOKIE_NAME };

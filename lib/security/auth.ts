import { SignJWT, jwtVerify } from "jose";
import { config } from "./config";

const secret = new TextEncoder().encode(config.jwtSecret);

export async function createSessionToken(subject: string, role: "analyst" | "admin" = "analyst") {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifySessionToken(token?: string) {
  if (!token) return null;
  try {
    const result = await jwtVerify(token, secret);
    return {
      subject: result.payload.sub,
      role: result.payload.role as "analyst" | "admin" | undefined
    };
  } catch {
    return null;
  }
}

export function bearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length);
}

import { SignJWT, jwtVerify } from "jose";

export type LocationTokenUser = {
  employeeId: string;
  businessId: string;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(value);
}

export async function signLocationToken(user: LocationTokenUser) {
  return new SignJWT({
    employeeId: user.employeeId,
    businessId: user.businessId,
    purpose: "location",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("16h")
    .sign(secret());
}

export async function verifyLocationToken(
  token: string,
): Promise<LocationTokenUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== "location") return null;
    if (
      typeof payload.employeeId !== "string" ||
      typeof payload.businessId !== "string"
    ) {
      return null;
    }
    return {
      employeeId: payload.employeeId,
      businessId: payload.businessId,
    };
  } catch {
    return null;
  }
}

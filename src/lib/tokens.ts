import crypto from "crypto";
import { prisma } from "./db";

export async function createToken(
  identifier: string,
  purpose: "verify" | "reset",
  ttlHours: number,
) {
  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.verificationToken.deleteMany({ where: { identifier, purpose } });
  await prisma.verificationToken.create({
    data: { identifier, token, purpose, expires: new Date(Date.now() + ttlHours * 3600_000) },
  });
  return token;
}

export async function consumeToken(token: string, purpose: "verify" | "reset") {
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  if (!row || row.purpose !== purpose) return null;
  await prisma.verificationToken.delete({ where: { token } });
  if (row.expires < new Date()) return null;
  return row.identifier;
}

import sharp from "sharp";
import { prisma } from "@/lib/db";
import { getObject } from "@/lib/storage";
import { requireUser, jsonError } from "@/lib/session";

type Ctx = { params: Promise<{ id: string; photoId: string }> };

/** Thumbnail of an uploaded photo (owner only). */
export async function GET(_req: Request, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id, photoId } = await params;
  const photo = await prisma.sessionPhoto.findFirst({
    where: { id: photoId, sessionId: id, session: { userId: user.id } },
  });
  if (!photo) return jsonError("NOT_FOUND", 404);
  const thumb = await sharp(await getObject(photo.storageKey))
    .resize(480, 480, { fit: "cover" })
    .jpeg({ quality: 80 })
    .toBuffer();
  return new Response(new Uint8Array(thumb), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" },
  });
}

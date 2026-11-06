import { prisma } from "@/lib/db";
import { getObject, objectExists, putObject } from "@/lib/storage";
import { renderDownload } from "@/lib/images";
import { entitlementFor } from "@/lib/entitlements";
import { requireUser, jsonError } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

/** In-app preview (1024px). Watermarked unless the user is paid or bought this image. */
export async function GET(_req: Request, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const gen = await prisma.generation.findFirst({ where: { id, session: { userId: user.id } } });
  if (!gen?.storageKeyClean) return jsonError("NOT_FOUND", 404);
  const ent = await entitlementFor(user.id, user.plan, id);
  const key = gen.storageKeyClean.replace(
    "clean.png",
    ent.clean ? "preview.jpg" : "preview_wm.jpg",
  );
  let body: Buffer;
  if (await objectExists(key)) body = await getObject(key);
  else {
    body = await renderDownload(await getObject(gen.storageKeyClean), {
      size: 1024,
      watermark: !ent.clean,
    });
    await putObject(key, body, "image/jpeg");
    if (!ent.clean)
      await prisma.generation.update({ where: { id }, data: { storageKeyWatermarked: key } });
  }
  return new Response(new Uint8Array(body), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-cache" },
  });
}

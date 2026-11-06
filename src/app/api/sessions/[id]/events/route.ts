import { prisma } from "@/lib/db";
import { requireUser, jsonError } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

/** Server-Sent Events: live progress stages for the session's latest generation. */
export async function GET(req: Request, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const generationId = new URL(req.url).searchParams.get("generation");
  const owns = await prisma.studioSession.count({ where: { id, userId: user.id } });
  if (!owns) return jsonError("NOT_FOUND", 404);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let last = "";
      const deadline = Date.now() + 3 * 60_000;
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      try {
        while (!req.signal.aborted && Date.now() < deadline) {
          const gen = generationId
            ? await prisma.generation.findFirst({ where: { id: generationId, sessionId: id } })
            : await prisma.generation.findFirst({
                where: { sessionId: id },
                orderBy: { createdAt: "desc" },
              });
          if (gen) {
            const payload = {
              id: gen.id,
              variant: gen.variant,
              status: gen.status,
              stage: gen.stage,
              errorCode: gen.errorCode,
              previewUrl: gen.status === "succeeded" ? `/api/generations/${gen.id}/preview` : null,
            };
            const key = JSON.stringify(payload);
            if (key !== last) {
              send("progress", payload);
              last = key;
            }
            if (gen.status === "succeeded" || gen.status === "failed") {
              send("done", payload);
              break;
            }
          }
          await new Promise((r) => setTimeout(r, 700));
        }
      } catch (err) {
        console.error("[sse]", err);
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

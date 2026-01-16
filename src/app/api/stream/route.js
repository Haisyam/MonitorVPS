import { apiGuard, handleOptions, withCorsHeaders } from "@/lib/api";
import { getSummary } from "@/lib/metrics/collector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toSsePayload(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export function OPTIONS(req) {
  return handleOptions(req);
}

export async function GET(req) {
  const guard = apiGuard(req);
  if (guard) return guard;

  const url = new URL(req.url);
  const interval = Math.min(
    Math.max(Number.parseInt(url.searchParams.get("interval") || "1000", 10), 500),
    5000
  );

  const encoder = new TextEncoder();
  let timer;

  const stream = new ReadableStream({
    start(controller) {
      const send = async () => {
        try {
          const summary = await getSummary();
          controller.enqueue(encoder.encode(toSsePayload(summary)));
        } catch (error) {
          controller.enqueue(encoder.encode(toSsePayload({ error: "stream_error", timestamp: Date.now() })));
        }
      };

      send();
      timer = setInterval(() => {
        send();
      }, interval);

      req.signal.addEventListener("abort", () => {
        clearInterval(timer);
        controller.close();
      });
    },
    cancel() {
      clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      ...withCorsHeaders(req, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      }),
    },
  });
}

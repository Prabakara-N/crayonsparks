import { RPCHandler } from "@orpc/server/fetch";
import { router } from "@/lib/orpc/router";
import { buildContext } from "@/lib/orpc/context";

export const runtime = "nodejs";
export const maxDuration = 30;

const handler = new RPCHandler(router);

async function handle(req: Request) {
  const context = await buildContext(req);
  const result = await handler.handle(req, {
    prefix: "/api/orpc",
    context,
  });
  return (
    result.response ??
    new Response("Not found", { status: 404 })
  );
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

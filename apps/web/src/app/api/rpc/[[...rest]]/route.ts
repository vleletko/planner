import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@planner/api/context";
import { appRouter } from "@planner/api/routers/index";
import { createLogger } from "@planner/logger";
import type { NextRequest } from "next/server";

const log = createLogger("orpc-handler");

// Error logging is now handled by middleware in @planner/api (procedure-level)
// with procedure path context - see packages/api/src/index.ts

const rpcHandler = new RPCHandler(appRouter);
const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
});

async function handleRequest(req: NextRequest) {
  log.debug({ method: req.method, url: req.url }, "RPC request received");

  const rpcResult = await rpcHandler.handle(req, {
    prefix: "/api/rpc",
    context: await createContext(req),
  });
  if (rpcResult.response) {
    return rpcResult.response;
  }

  const apiResult = await apiHandler.handle(req, {
    prefix: "/api/rpc/api-reference",
    context: await createContext(req),
  });
  if (apiResult.response) {
    return apiResult.response;
  }

  return new Response("Not found", { status: 404 });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;

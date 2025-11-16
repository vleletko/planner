import { auth } from "@planner/auth";

/**
 * Minimal request interface for context creation.
 * Compatible with NextRequest and other request types.
 */
export type RequestLike = {
  headers: Headers;
};

export async function createContext(req: RequestLike) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return {
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

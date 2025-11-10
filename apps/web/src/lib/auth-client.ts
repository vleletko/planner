import type { auth } from "@planner/auth";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
	plugins: [inferAdditionalFields<typeof auth>()],
});

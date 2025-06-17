import { getAuthAdapter } from "../lib/auth";

const authAdapter = getAuthAdapter();

export async function authenticate(
  req: any
): Promise<{ userId: string } | null> {
  return authAdapter.validateRequest(req);
}

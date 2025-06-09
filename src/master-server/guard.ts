import { env } from "./env";

export function guard(req: Request): boolean {
  const Authorization = req.headers.get("Authorization");
  if (!Authorization) {
    return false;
  }
  return Authorization === 'Bearer ' + env.SECRET;
}
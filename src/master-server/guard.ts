import { env } from "./env";

export function guard(req: Request): boolean {
  const Authorization = req.headers.get("Authorization");
  const AuthorizationRequest = (new URL(req.url)).searchParams.get('auth');
  if (!Authorization && !AuthorizationRequest) {
    return false;
  }
  const AuthorizationToken = Authorization || AuthorizationRequest;
  return AuthorizationToken === 'Bearer ' + env.SECRET;
}
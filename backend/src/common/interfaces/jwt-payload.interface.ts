export interface JwtPayload {
  sub: string;
  email: string;
  org_id: string;
  role: string;
  iat?: number;
  exp?: number;
}
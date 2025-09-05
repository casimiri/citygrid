import { jwtVerify, SignJWT } from 'jose'
import Cookies from 'js-cookie'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'your-secret-key'
)

export interface JWTPayload {
  sub: string
  email: string
  org_id: string
  role: string
  iat?: number
  exp?: number
}

export const signJWT = async (payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export const verifyJWT = async (token: string): Promise<JWTPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export const getTokenFromCookies = (): string | null => {
  return Cookies.get('access_token') || null
}

export const setTokenInCookies = (token: string, orgId: string) => {
  Cookies.set('access_token', token, { expires: 7, sameSite: 'lax' })
  Cookies.set('org_id', orgId, { expires: 7, sameSite: 'lax' })
}

export const removeTokenFromCookies = () => {
  Cookies.remove('access_token')
  Cookies.remove('org_id')
}

export const getCurrentUser = async (): Promise<JWTPayload | null> => {
  const token = getTokenFromCookies()
  if (!token) return null
  
  return verifyJWT(token)
}

export const getCurrentOrgId = (): string | null => {
  return Cookies.get('org_id') || null
}

export const switchOrganization = async (orgId: string, role: string) => {
  const currentToken = getTokenFromCookies()
  if (!currentToken) return false
  
  const currentUser = await verifyJWT(currentToken)
  if (!currentUser) return false
  
  const newToken = await signJWT({
    sub: currentUser.sub,
    email: currentUser.email,
    org_id: orgId,
    role,
  })
  
  setTokenInCookies(newToken, orgId)
  return true
}
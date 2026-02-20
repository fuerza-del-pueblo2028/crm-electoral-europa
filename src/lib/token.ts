import { SignJWT, jwtVerify } from 'jose';

// En producción, esto DEBE estar en .env.local como JWT_SECRET
if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL: JWT_SECRET environment variable is missing.');
    }
    console.warn('WARNING: JWT_SECRET is missing. Using an insecure fallback for DEVELOPMENT ONLY.');
}

const SECRET_KEY = process.env.JWT_SECRET || 'fallback_development_secret_only';
const key = new TextEncoder().encode(SECRET_KEY);

export async function signToken(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h') // El token dura 24 horas
        .sign(key);
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, key);
        return payload;
    } catch (error) {
        return null;
    }
}

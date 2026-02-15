import { SignJWT, jwtVerify } from 'jose';

// Generar una clave secreta fuerte o usar la del entorno
// En producción, esto DEBE estar en .env.local como JWT_SECRET
const SECRET_KEY = process.env.JWT_SECRET || 'clave_secreta_super_segura_crm_europa_2028';
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

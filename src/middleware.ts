import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/token';

// Rutas que requieren autenticación
const PROTECTED_ROUTES = [
    '/afiliados',
    '/dashboard',
    '/admin',
    '/api/db/write', // Doble check (ya verificado en su route handler)
    '/api/emails',   // Proteger envío de correos
    // Añadir otras rutas protegidas aquí
];

// Rutas públicas (login, estáticos, etc)
const PUBLIC_ROUTES = [
    '/login',
    '/api/auth/login',
    '/_next',
    '/favicon.ico',
    '/public'
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Permitir rutas públicas
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route)) || pathname === '/') {
        return NextResponse.next();
    }

    // Verificar si es una ruta protegida
    // NOTA: Por ahora, vamos a ser permisivos y solo bloquear lo que explícitamente sabemos que es sensible
    // o redirigir si intenta acceder a /afiliados sin token.
    const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

    if (isProtected) {
        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            // Si es API, devolver 401
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
            }
            // Si es página, redirigir a login
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const user = await verifyToken(token);

        if (!user) {
            // Si es API, devolver 401
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Token válido, continuar
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

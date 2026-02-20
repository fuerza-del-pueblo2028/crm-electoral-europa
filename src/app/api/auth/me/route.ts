import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/token';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const user = await verifyToken(token);

        if (!user) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        // Devolver solo los datos no sensibles necesarios para la UI
        return NextResponse.json({
            authenticated: true,
            user: {
                id: (user as any).id,
                role: (user as any).rol || 'afiliado',
                seccional: (user as any).seccional,
                nombre: (user as any).nombre,
                cedula: (user as any).cedula
            }
        });
    } catch (error) {
        console.error("Auth /me error:", error);
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}

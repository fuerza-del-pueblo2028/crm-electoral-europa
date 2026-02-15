
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/token';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const user = await verifyToken(token) as any;

        if (!user || user.rol !== 'administrador') {
            return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
        }

        const { data, error } = await supabaseAdmin
            .from('usuarios')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/token';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const user = token ? await verifyToken(token) : null;

        // If strict security is desired, uncomment this:
        // if (!user) {
        //    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        // }
        // For now, consistent with dashboard, let's allow fetching list but frontend handles access?
        // Actually, if 'documentos' table is locked, we MUST use admin.
        // If we use admin, we MUST gate it, otherwise we defeat the purpose of RLS for anon.
        // So YES, require auth.

        if (!user) {
            return NextResponse.json({ error: 'Debes iniciar sesión para ver el repositorio' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from('documentos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching documents:', error);
            return NextResponse.json({ error: 'Error al cargar documentos' }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("API Repositorio Error:", error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

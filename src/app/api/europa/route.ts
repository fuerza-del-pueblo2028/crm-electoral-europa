
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/token';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
    try {
        // 1. Verify Auth
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const user = token ? await verifyToken(token) : null;

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const seccional = searchParams.get('seccional');

        // 2. Fetch Recintos
        let recintosQuery = supabaseAdmin
            .from('europa_recintos_electorales')
            .select('*')
            .order('seccional', { ascending: true })
            .order('numero_recinto', { ascending: true });

        if (seccional && seccional !== 'Todos') {
            recintosQuery = recintosQuery.eq('seccional', seccional);
        }

        const { data: recintos, error: recintosError } = await recintosQuery;

        if (recintosError) {
            console.error('Error fetching recintos:', recintosError);
            return NextResponse.json({ error: 'Error al cargar recintos' }, { status: 500 });
        }

        // 3. Fetch Presidentes DM
        const { data: presidentes, error: presidentesError } = await supabaseAdmin
            .from('europa_presidentes_dm')
            .select('*')
            .order('total_afiliados', { ascending: false });

        if (presidentesError) {
            console.error('Error fetching presidentes:', presidentesError);
            return NextResponse.json({ error: 'Error al cargar presidentes' }, { status: 500 });
        }

        return NextResponse.json({
            recintos,
            presidentes
        });

    } catch (error: any) {
        console.error("API Europa Error:", error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

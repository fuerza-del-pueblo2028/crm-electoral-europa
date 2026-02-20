import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyToken } from '@/lib/token';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        // 1. Verify Auth
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const user = token ? await verifyToken(token) : null;

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // 2. Parse Query Params
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const seccional = searchParams.get('seccional');
        const role = searchParams.get('role');
        const status = searchParams.get('status');
        const sort = searchParams.get('sort') || 'newest';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        // 3. Build Query using Admin Client
        let query;

        if (search) {
            // Fuzzy search nativa de Postgre usando RPC
            query = supabaseAdmin.rpc('buscar_afiliados_unaccent', { busqueda: search.trim() }, { count: 'exact' });
        } else {
            query = supabaseAdmin.from('afiliados').select('*', { count: 'exact' });
        }

        if (seccional && seccional !== 'Todas') {
            query = query.eq('seccional', seccional);
        } else if (user.rol === 'operador' && user.seccional) {
            // Force operator to their seccional
            query = query.eq('seccional', user.seccional);
        }

        if (role && role !== 'Todos') {
            query = query.eq('role', role);
        }

        if (status && status !== 'Todos') {
            query = query.eq('validado', status === 'Validado');
        }

        // Sorting
        switch (sort) {
            case 'newest': query = query.order('created_at', { ascending: false }); break;
            case 'oldest': query = query.order('created_at', { ascending: true }); break;
            case 'a-z': query = query.order('nombre', { ascending: true }); break;
            case 'z-a': query = query.order('nombre', { ascending: false }); break;
            default: query = query.order('created_at', { ascending: false });
        }

        // Pagination
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            data,
            count,
            page,
            limit
        });

    } catch (error: any) {
        console.error("API Affiliates Error:", error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}


import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
    try {
        // Estatutos are public information, so we fetch with admin rights 
        // to bypass any restrictive RLS that might be in place for 'anon'.
        const { data, error } = await supabaseAdmin
            .from('estatutos')
            .select('*')
            .order('articulo', { ascending: true });

        if (error) {
            console.error('Error fetching statutes:', error);
            return NextResponse.json({ error: 'Error al cargar estatutos' }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("API Estatutos Error:", error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

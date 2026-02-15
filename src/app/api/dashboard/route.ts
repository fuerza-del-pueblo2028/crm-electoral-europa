
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/token';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
    try {
        // 1. Verify Auth (Optional? Dashboard might be public?)
        // The dashboard shows "Hola Guest" if not logged in.
        // If not logged in, we shouldn't show sensitive stats (Affiliates count).
        // The original code tried to fetch stats even if not authenticated?
        // Let's check original code:
        // useEffect calls fetchAffiliateStats() unconditionally.
        // It tries to fetch 'afiliados'. RLS would block it anyway if anon.
        // BUT, if we use supabaseAdmin here, we bypass RLS.
        // So we MUST check auth here if we want to protect stats.

        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const user = token ? await verifyToken(token) : null;

        // Fetch Statutes (Usually public)
        const { data: statutes } = await supabaseAdmin
            .from('estatutos')
            .select('*')
            .order('articulo', { ascending: true });

        let affiliateStats = {
            total: 0,
            lastMonth: 0,
            bySeccional: {} as Record<string, number>
        };
        let recentDocs: any[] = [];

        // Fetch Sensitive Data ONLY if Authenticated
        if (user) {
            // 1. Total Affiliates
            const { count: total } = await supabaseAdmin
                .from('afiliados')
                .select('*', { count: 'exact', head: true });

            // 2. Last Month Affiliates
            const lastMonthDate = new Date();
            lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
            const { count: lastMonth } = await supabaseAdmin
                .from('afiliados')
                .select('*', { count: 'exact', head: true })
                .lt('created_at', lastMonthDate.toISOString());

            // 3. By Seccional (We need to fetch all seccionals to count? Or use RPC?)
            // Fetching all 'seccional' fields is heavy if many users. 
            // Better to use a DB function if possible, but for now let's query just the column.
            const { data: affiliates } = await supabaseAdmin
                .from('afiliados')
                .select('seccional');

            const bySeccional = affiliates?.reduce((acc, curr) => {
                const sec = curr.seccional || 'Sin asignar';
                acc[sec] = (acc[sec] || 0) + 1;
                return acc;
            }, {} as Record<string, number>) || {};

            affiliateStats = {
                total: total || 0,
                lastMonth: lastMonth || 0,
                bySeccional
            };

            // 4. Recent Documents
            const { data: docs } = await supabaseAdmin
                .from('documentos')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            recentDocs = docs || [];
        }

        return NextResponse.json({
            statutes: statutes || [],
            stats: affiliateStats,
            recentDocs: recentDocs,
            isAuthenticated: !!user
        });

    } catch (error: any) {
        console.error("API Dashboard Error:", error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

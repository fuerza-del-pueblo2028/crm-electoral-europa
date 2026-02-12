import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Tablas permitidas para escritura vía proxy
const ALLOWED_TABLES = [
    'afiliados',
    'afiliados_historial',
    'documentos',
    'actas_electorales',
    'estatutos',
    'usuarios',
    'elecciones_cargos',
    'elecciones_candidatos',
    'elecciones_padron',
    'elecciones_votos_emitidos',
    'europa_presidentes_dm',
    'europa_recintos_electorales',
    'comunicaciones',
];

type Operation = 'insert' | 'update' | 'delete' | 'upsert';

interface WriteRequest {
    table: string;
    operation: Operation;
    data?: any;
    match?: Record<string, any>;
    options?: {
        onConflict?: string;
        returning?: boolean;
    };
}

export async function POST(request: Request) {
    try {
        const body: WriteRequest = await request.json();
        const { table, operation, data, match, options } = body;

        // Validate table name
        if (!ALLOWED_TABLES.includes(table)) {
            return NextResponse.json(
                { error: `Tabla no permitida: ${table}` },
                { status: 403 }
            );
        }

        // Validate operation
        if (!['insert', 'update', 'delete', 'upsert'].includes(operation)) {
            return NextResponse.json(
                { error: `Operación no válida: ${operation}` },
                { status: 400 }
            );
        }

        let query;
        let result;

        switch (operation) {
            case 'insert': {
                if (!data) {
                    return NextResponse.json({ error: 'Data requerida para insert' }, { status: 400 });
                }
                const insertQuery = supabaseAdmin.from(table).insert(Array.isArray(data) ? data : [data]);
                if (options?.returning !== false) {
                    result = await insertQuery.select();
                } else {
                    result = await insertQuery;
                }
                break;
            }

            case 'update': {
                if (!data || !match) {
                    return NextResponse.json({ error: 'Data y match requeridos para update' }, { status: 400 });
                }
                query = supabaseAdmin.from(table).update(data);
                // Apply all match conditions
                for (const [key, value] of Object.entries(match)) {
                    query = query.eq(key, value);
                }
                if (options?.returning !== false) {
                    result = await query.select();
                } else {
                    result = await query;
                }
                break;
            }

            case 'delete': {
                if (!match) {
                    return NextResponse.json({ error: 'Match requerido para delete (prevención de borrado total)' }, { status: 400 });
                }
                query = supabaseAdmin.from(table).delete();
                for (const [key, value] of Object.entries(match)) {
                    query = query.eq(key, value);
                }
                result = await query;
                break;
            }

            case 'upsert': {
                if (!data) {
                    return NextResponse.json({ error: 'Data requerida para upsert' }, { status: 400 });
                }
                const upsertQuery = supabaseAdmin
                    .from(table)
                    .upsert(Array.isArray(data) ? data : [data], {
                        onConflict: options?.onConflict || 'id',
                    });
                if (options?.returning !== false) {
                    result = await upsertQuery.select();
                } else {
                    result = await upsertQuery;
                }
                break;
            }
        }

        if (result?.error) {
            console.error(`[DB Write Proxy] Error en ${operation} → ${table}:`, result.error);
            return NextResponse.json(
                { error: result.error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result?.data || null,
        });

    } catch (error: any) {
        console.error('[DB Write Proxy] Error general:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

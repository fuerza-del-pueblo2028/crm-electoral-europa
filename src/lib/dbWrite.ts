// Helper function for client-side components to perform write operations
// through the secure server-side proxy instead of directly via Supabase client.

type Operation = 'insert' | 'update' | 'delete' | 'upsert';

interface DbWriteParams {
    table: string;
    operation: Operation;
    data?: any;
    match?: Record<string, any>;
    options?: {
        onConflict?: string;
        returning?: boolean;
    };
}

interface DbWriteResult {
    success: boolean;
    data?: any;
    error?: string;
}

export async function dbWrite(params: DbWriteParams): Promise<DbWriteResult> {
    try {
        const response = await fetch('/api/db/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });

        const result = await response.json();

        if (!response.ok) {
            return { success: false, error: result.error || 'Error desconocido' };
        }

        return { success: true, data: result.data };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error de red' };
    }
}

// Convenience shortcuts
export const dbInsert = (table: string, data: any, options?: DbWriteParams['options']) =>
    dbWrite({ table, operation: 'insert', data, options });

export const dbUpdate = (table: string, data: any, match: Record<string, any>, options?: DbWriteParams['options']) =>
    dbWrite({ table, operation: 'update', data, match, options });

export const dbDelete = (table: string, match: Record<string, any>) =>
    dbWrite({ table, operation: 'delete', match });

export const dbUpsert = (table: string, data: any, options?: DbWriteParams['options']) =>
    dbWrite({ table, operation: 'upsert', data, options });

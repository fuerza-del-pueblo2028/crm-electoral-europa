import { supabase } from './supabase';

export interface HistorialEntry {
    afiliado_id: string;
    accion: 'creado' | 'editado' | 'validado' | 'invalidado' | 'eliminado' | 'role_cambiado';
    campo_modificado?: string;
    valor_anterior?: string;
    valor_nuevo?: string;
    detalles?: Record<string, any>;
}

/**
 * Registra un cambio en el historial de afiliados
 */
export async function registrarCambio(entry: HistorialEntry): Promise<void> {
    try {
        // Obtener datos del usuario actual del localStorage
        const usuarioNombre = localStorage.getItem('user_name') || 'Sistema';
        const usuarioEmail = localStorage.getItem('user_email') || localStorage.getItem('auth_token') || 'sistema@fp.do';

        const { error } = await supabase
            .from('afiliados_historial')
            .insert([{
                afiliado_id: entry.afiliado_id,
                accion: entry.accion,
                campo_modificado: entry.campo_modificado || null,
                valor_anterior: entry.valor_anterior || null,
                valor_nuevo: entry.valor_nuevo || null,
                usuario_id: usuarioEmail,
                usuario_nombre: usuarioNombre,
                detalles: entry.detalles || null
            }]);

        if (error) {
            console.error('Error registrando historial:', error);
        }
    } catch (error) {
        console.error('Error al registrar cambio en historial:', error);
    }
}

/**
 * Obtiene el historial de un afiliado
 */
export async function obtenerHistorial(afiliadoId: string) {
    const { data, error } = await supabase
        .from('afiliados_historial')
        .select('*')
        .eq('afiliado_id', afiliadoId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error obteniendo historial:', error);
        return [];
    }

    return data || [];
}

/**
 * Formatea la acción para mostrar en la UI
 */
export function formatAccion(accion: string): { icon: string; text: string; color: string } {
    const acciones: Record<string, { icon: string; text: string; color: string }> = {
        'creado': { icon: '➕', text: 'Afiliado creado', color: 'text-green-600' },
        'editado': { icon: '✏️', text: 'Datos editados', color: 'text-blue-600' },
        'validado': { icon: '✅', text: 'Afiliado validado', color: 'text-green-600' },
        'invalidado': { icon: '⏸️', text: 'Validación retirada', color: 'text-orange-600' },
        'eliminado': { icon: '🗑️', text: 'Afiliado eliminado', color: 'text-red-600' },
        'role_cambiado': { icon: '🔐', text: 'Role del sistema cambiado', color: 'text-purple-600' }
    };

    return acciones[accion] || { icon: '📝', text: 'Acción desconocida', color: 'text-gray-600' };
}

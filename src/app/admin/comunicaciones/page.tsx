"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Users, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function ComunicacionesPage() {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0 });
    const [formData, setFormData] = useState({
        asunto: "",
        mensaje: ""
    });
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: "" });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const { count, error } = await supabase
            .from('comunicaciones_contactos')
            .select('*', { count: 'exact', head: true })
            .eq('activo', true);

        if (error) {
            console.error("Error loading stats:", error);
            setStatus({ type: 'error', msg: `Error cargando contactos: ${error.message}` });
        }

        console.log("Contactos encontrados:", count);
        setStats({ total: count || 0 });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm(`¿Estás seguro de enviar este mensaje a ${stats.total} personas?`)) return;

        setLoading(true);
        setStatus({ type: null, msg: "" });

        try {
            // 1. Obtener los contactos desde el cliente
            const { data: contactos, error: dbError } = await supabase
                .from('comunicaciones_contactos')
                .select('email, nombre')
                .eq('activo', true);

            if (dbError) throw dbError;
            if (!contactos || contactos.length === 0) throw new Error("No hay destinatarios.");

            // 2. Dividir en lotes de 50 (límite batch de Resend seguro = 100, usamos 50 por precaución)
            const batchSize = 50;
            const batches = [];
            for (let i = 0; i < contactos.length; i += batchSize) {
                batches.push(contactos.slice(i, i + batchSize));
            }

            let sentCount = 0;
            let errorCount = 0;

            // 3. Enviar cada lote al PHP
            for (const batch of batches) {
                try {
                    const res = await fetch('/api/emails/broadcast', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            asunto: formData.asunto,
                            mensaje: formData.mensaje,
                            destinatarios: batch
                        })
                    });

                    if (res.ok) {
                        sentCount += batch.length;
                    } else {
                        console.error("Error en batch", await res.text());
                        errorCount += batch.length;
                    }
                } catch (err) {
                    console.error("Error red batch", err);
                    errorCount += batch.length;
                }
            }

            setStatus({
                type: 'success',
                msg: `¡Enviado con éxito! Se procesaron ${sentCount} correos. (Fallidos: ${errorCount})`
            });
            setFormData({ asunto: "", mensaje: "" });

        } catch (error: any) {
            setStatus({ type: 'error', msg: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-[#005c2b]">Comunicaciones</h1>
                    <p className="text-gray-500">Envío de boletines y avisos oficiales</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase">Audiencia Actual</p>
                        <p className="text-2xl font-black text-[#005c2b]">{stats.total} <span className="text-sm font-normal text-gray-400">contactos</span></p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-[#005c2b] px-6 py-4 border-b border-green-800">
                    <h2 className="text-white font-bold flex items-center gap-2">
                        <Send size={20} />
                        Nueva Comunicación
                    </h2>
                </div>

                <form onSubmit={handleSend} className="p-8 space-y-6">
                    {status.msg && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <span className="font-medium">{status.msg}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Asunto del Correo</label>
                        <input
                            required
                            type="text"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005c2b] outline-none font-medium"
                            placeholder="Ej: Convocatoria a Asamblea General..."
                            value={formData.asunto}
                            onChange={e => setFormData({ ...formData, asunto: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Mensaje</label>
                        <textarea
                            required
                            rows={8}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005c2b] outline-none font-medium resize-none"
                            placeholder="Escribe aquí el contenido del comunicado..."
                            value={formData.mensaje}
                            onChange={e => setFormData({ ...formData, mensaje: e.target.value })}
                        />
                        <p className="text-xs text-gray-400 mt-2 text-right">Se enviará con el diseño oficial de FP Europa</p>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={loading || stats.total === 0}
                            className="w-full bg-[#005c2b] hover:bg-[#00421f] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Enviar Comunicación Masiva</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

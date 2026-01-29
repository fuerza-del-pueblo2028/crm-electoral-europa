"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Users, BarChart3, ArrowLeft, Loader2, Award, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ElectionResults() {
    const [loading, setLoading] = useState(true);
    const [cargos, setCargos] = useState<any[]>([]);

    useEffect(() => {
        const role = localStorage.getItem("user_role");
        if (role !== "administrador" && role !== "operador") {
            window.location.href = "/login";
            return;
        }
        fetchPublicResults();
    }, []);

    const fetchPublicResults = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('elecciones_cargos')
            .select('*, elecciones_candidatos(*)')
            .eq('resultados_visibles', true)
            .order('creado_at', { ascending: false });

        if (data) setCargos(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#00843D]" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <Link href="/elecciones-internas" className="text-[#00843D] font-bold flex items-center gap-2 mb-4 hover:underline">
                            <ArrowLeft size={16} /> Volver a Votación
                        </Link>
                        <h1 className="text-4xl font-black text-gray-900 italic tracking-tighter uppercase">
                            Resultados <span className="text-[#00843D]">Electorales</span>
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">Escrutinio oficial y transparencia democrática</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Elecciones Públicas</p>
                            <p className="text-2xl font-black text-gray-800">{cargos.length}</p>
                        </div>
                    </div>
                </header>

                {cargos.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-gray-100">
                        <BarChart3 size={64} className="mx-auto text-gray-200 mb-6" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Resultados no disponibles</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            Aún no se han hecho públicos los resultados de ninguna elección. Vuelve más tarde.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {cargos.map((cargo) => {
                            const totalVotes = cargo.elecciones_candidatos?.reduce((acc: number, curr: any) => acc + (curr.votos_count || 0), 0) || 0;
                            const sortedCandidates = [...(cargo.elecciones_candidatos || [])].sort((a, b) => (b.votos_count || 0) - (a.votos_count || 0));
                            const winner = sortedCandidates[0];

                            return (
                                <section key={cargo.id} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-[#137228] p-6 text-white flex justify-between items-center">
                                        <div>
                                            <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">Cómputo Oficial</span>
                                            <h2 className="text-2xl font-black uppercase italic tracking-tight">{cargo.titulo}</h2>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold opacity-80 uppercase">Total Votos</p>
                                            <p className="text-3xl font-black">{totalVotes}</p>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-8">
                                        {/* Winner Highlight */}
                                        {totalVotes > 0 && (
                                            <div className="bg-green-50 rounded-2xl p-6 border border-green-100 flex items-center gap-6 relative overflow-hidden">
                                                <Award className="absolute -right-4 -bottom-4 text-green-200" size={120} />
                                                <div className="w-20 h-20 bg-[#00843D] text-white rounded-full flex items-center justify-center font-bold text-3xl italic shadow-lg shrink-0">
                                                    {winner.nombre.charAt(0)}
                                                </div>
                                                <div className="relative z-10">
                                                    <p className="text-[10px] font-bold text-[#00843D] uppercase tracking-widest mb-1 flex items-center gap-1">
                                                        <CheckCircle2 size={12} /> Líder de Escrutinio
                                                    </p>
                                                    <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter italic">{winner.nombre}</h3>
                                                    <p className="text-sm font-bold text-gray-500">
                                                        {totalVotes > 0 ? ((winner.votos_count / totalVotes) * 100).toFixed(1) : 0}% de los votos emitidos
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Progress List */}
                                        <div className="space-y-6">
                                            {sortedCandidates.map((cand) => {
                                                const percentage = totalVotes > 0 ? (cand.votos_count / totalVotes) * 100 : 0;
                                                return (
                                                    <div key={cand.id}>
                                                        <div className="flex justify-between items-end mb-2">
                                                            <div>
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Candidato</span>
                                                                <span className="text-lg font-black text-gray-800 uppercase italic leading-none">{cand.nombre}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-lg font-black text-[#00843D]">{cand.votos_count || 0}</span>
                                                                <span className="text-xs font-bold text-gray-400 ml-1">votos</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner flex">
                                                            <div
                                                                className="bg-[#00843D] h-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 overflow-hidden"
                                                                style={{ width: `${percentage}%` }}
                                                            >
                                                                {percentage > 10 && (
                                                                    <span className="text-[8px] font-bold text-white uppercase">{percentage.toFixed(1)}%</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                            <Users size={12} /> Estos resultados son preliminares hasta el cierre oficial de la junta receptora
                                        </p>
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>

            <footer className="mt-20 text-center pb-8 border-t border-gray-200 pt-8 opacity-50">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#00843D]">Secretaría Nacional de Asuntos Electorales</p>
                <p className="text-[10px] text-gray-400">FP EUROPA © 2024 - Sistema de Transparencia Democrática</p>
            </footer>
        </div>
    );
}

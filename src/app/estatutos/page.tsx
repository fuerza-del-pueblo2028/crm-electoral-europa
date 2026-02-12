"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Book, Search, FileText, ArrowLeft, Loader2, ChevronRight, Hash, ExternalLink, Printer } from "lucide-react";
import Link from "next/link";

export default function StatutesPage() {
    const [statutes, setStatutes] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchStatutes();
        // Handle Hash in URL
        const hash = window.location.hash.replace('#', '');
        if (hash) setSelectedId(hash);
    }, []);

    const fetchStatutes = async () => {
        const { data } = await supabase
            .from('estatutos')
            .select('*')
            .order('articulo', { ascending: true });

        if (data) {
            setStatutes(data);
            if (!window.location.hash && data.length > 0) {
                setSelectedId(data[0].id);
            }
        }
        setLoading(false);
    };

    const filteredStatutes = useMemo(() => {
        return statutes.filter(s =>
            s.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.articulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.contenido.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [statutes, searchQuery]);

    const selectedStatute = useMemo(() => {
        return statutes.find(s => s.id === selectedId) || statutes[0];
    }, [statutes, selectedId]);

    const handleSelect = (id: string) => {
        setSelectedId(id);
        window.location.hash = id;
    };

    const handleNext = () => {
        const currentIndex = filteredStatutes.findIndex(s => s.id === selectedId);
        if (currentIndex < filteredStatutes.length - 1) {
            handleSelect(filteredStatutes[currentIndex + 1].id);
        } else if (filteredStatutes.length > 0) {
            handleSelect(filteredStatutes[0].id); // Volver al inicio
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-[#137228]" size={40} />
                    <p className="text-gray-400 font-medium animate-pulse">Cargando biblioteca legislativa...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
            {/* Estilos para Impresión */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.95; transform: scale(1.02); }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 3s ease-in-out infinite;
                }
                @media print {
                    /* Ocultar TODO lo que no sea el contenido principal */
                    header, aside, nav, footer, button, .no-print, .fixed, .absolute {
                        display: none !important;
                    }
                    /* Asegurar que el body y main no tengan scroll ni backgrounds raros */
                    body, html {
                        background: white !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    main {
                        display: block !important;
                        position: static !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print-content {
                        display: block !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print-only {
                        display: block !important;
                    }
                    /* Ajustes de Color y Tamaño para Impresión */
                    h2 {
                        color: #137228 !important;
                        font-size: 24pt !important;
                        margin-top: 20px !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .bg-[#137228] {
                        background-color: #137228 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .text-white {
                        color: white !important;
                    }
                }
                .print-only {
                    display: none;
                }
            ` }} />

            {/* Left Sidebar: Index */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 no-print">
                <div className="p-6 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-[#137228] p-3 rounded-[20px] text-white shadow-lg shadow-green-900/30 border-4 border-green-50 animate-pulse-subtle">
                            <img src="/logo-fp.png" alt="FP" className="w-6 h-6 object-contain bg-white rounded-md p-0.5" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">Estatutos</h1>
                            <span className="text-[10px] font-bold text-[#137228] tracking-widest uppercase mt-0.5">Secretaría Electoral</span>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#137228] transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar artículo..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#137228] focus:bg-white outline-none transition-all font-medium text-gray-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
                    <div className="space-y-1">
                        {filteredStatutes.length > 0 ? (
                            filteredStatutes.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => handleSelect(s.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left border-2 ${selectedId === s.id
                                        ? 'bg-green-50 border-[#137228] shadow-sm'
                                        : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'
                                        }`}
                                >
                                    <div className={`text-[10px] font-black w-14 shrink-0 px-2 py-0.5 rounded-full text-center ${selectedId === s.id ? 'bg-[#137228] text-white' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {s.articulo}
                                    </div>
                                    <span className={`text-sm font-bold truncate ${selectedId === s.id ? 'text-[#137228]' : 'text-gray-600'}`}>
                                        {s.titulo}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <Search size={24} className="mx-auto text-gray-300 mb-2 opacity-20" />
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sin resultados</p>
                            </div>
                        )}
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <Link href="/" className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all uppercase tracking-tighter">
                        <ArrowLeft size={14} /> Volver al Inicio
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-white custom-scrollbar relative">
                <div className="max-w-4xl mx-auto px-12 py-20 min-h-full flex flex-col print-content">
                    {/* Header para Impresión (Papel Timbrado) */}
                    <div className="print-only mb-16 border-b-[6px] border-[#137228] pb-8 relative">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 uppercase leading-none tracking-tighter">Fuerza del Pueblo Europa</h1>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em] mt-2">Secretaría de Asuntos Electorales</p>
                            </div>
                            <div className="bg-[#137228] p-5 rounded-[24px] text-white shadow-xl flex items-center justify-center border-4 border-green-50">
                                <Book size={40} />
                            </div>
                        </div>
                        <div className="mt-10">
                            <h2 className="text-5xl font-black text-[#137228] italic uppercase tracking-tighter leading-none">
                                Secretaría Electoral
                            </h2>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] mt-3">Documento Oficial • Estatutos del Partido</p>
                        </div>
                        {/* Marca de agua decorativa para el print */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-[0.03] pointer-events-none">
                            <Book size={200} />
                        </div>
                    </div>

                    {selectedStatute ? (
                        <article className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Article Header (Visible in web, hidden in print because we show the letterhead instead) */}
                            <div className="mb-12 border-b border-gray-100 pb-10 flex justify-between items-end no-print">
                                <div className="space-y-4">
                                    <span className="inline-flex items-center gap-2 bg-[#137228]/10 text-[#137228] text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                                        <Hash size={12} /> {selectedStatute.articulo}
                                    </span>
                                    <h2 className="text-5xl font-black text-[#137228] tracking-tighter leading-[0.9] uppercase italic">
                                        {selectedStatute.titulo}
                                    </h2>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => window.print()}
                                        className="p-3 bg-gray-50 text-gray-400 hover:text-[#137228] hover:bg-green-50 rounded-2xl transition-all shadow-sm border border-gray-100 group"
                                        title="Imprimir Artículo"
                                    >
                                        <Printer size={20} className="group-active:scale-95 transition-transform" />
                                    </button>
                                </div>
                            </div>

                            {/* Título específico para impresión (dentro del flujo del documento) */}
                            <div className="print-only mb-8">
                                <h1 className="text-3xl font-black text-[#137228] uppercase tracking-tighter">
                                    Art. {selectedStatute.articulo}: {selectedStatute.titulo}
                                </h1>
                            </div>

                            {/* Article Body */}
                            <div className="prose prose-xl prose-green max-w-none">
                                <p className="text-gray-700 leading-relaxed text-lg font-medium whitespace-pre-wrap selection:bg-[#137228] selection:text-white">
                                    {selectedStatute.contenido}
                                </p>
                            </div>

                            <footer className="mt-24 pt-12 border-t border-gray-100 flex justify-between items-center text-gray-400 no-print">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#137228]">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Documento Oficial</p>
                                        <p className="text-sm font-bold text-gray-600">Estatutos de la Fuerza del Pueblo</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleNext}
                                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-[#137228] transition-colors group"
                                >
                                    Siguiente Artículo <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </footer>
                        </article>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-200 mb-6 font-black text-4xl">?</div>
                            <h2 className="text-2xl font-black text-gray-400 tracking-tighter italic uppercase">Selecciona un artículo para leer</h2>
                            <p className="text-gray-300 font-medium max-w-xs mx-auto mt-2">Utiliza el menú lateral para navegar por el reglamento oficial.</p>
                        </div>
                    )}
                </div>

                {/* Vertical Decorative Bar */}
                <div className="fixed right-0 top-0 bottom-0 w-1 bg-[#137228]/5 no-print" />
            </main>
        </div>
    );
}

"use client";

import { Download, Search, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function RepositorioPage() {
    const [filter, setFilter] = useState("");
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/repositorio');

            if (response.status === 401) {
                // Optional: redirect or show message. 
                // Dashboard handles this by only showing if authenticated.
                // Here we might just return empty or alert.
                // Given the page structure, let's redirect to login if they try to access directly and fail auth.
                // But wait, useEffect runs on mount.
                // Let's just set empty and show "No documents" maybe?
                // Or redirect.
                return;
            }

            if (!response.ok) throw new Error('Error loading documents');

            const data = await response.json();
            if (Array.isArray(data)) setDocuments(data);
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDocs = documents.filter(doc =>
        doc.nombre.toLowerCase().includes(filter.toLowerCase()) ||
        (doc.categoria && doc.categoria.toLowerCase().includes(filter.toLowerCase()))
    );

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[#005c2b]">Repositorio Documental</h1>
                    <p className="text-gray-500">Recursos y archivos oficiales</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar documento..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fp-green w-64"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="text-center py-12 text-gray-400">
                        <div className="animate-spin w-8 h-8 border-4 border-[#00843D] border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p>Cargando documentos...</p>
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <FileText size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No hay documentos disponibles.</p>
                        <p className="text-sm mt-2">Sube el primero desde el panel de <a href="/admin" className="text-[#00843D] underline">Administración</a>.</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Nombre</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Categoría</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tamaño</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredDocs.map(doc => (
                                <tr key={doc.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 flex items-center space-x-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <FileText size={20} />
                                        </div>
                                        <span className="font-medium text-[#005c2b]">{doc.nombre}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                                            {doc.categoria || 'Sin categoría'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {new Date(doc.created_at).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-sm font-mono">
                                        {formatBytes(doc.tamanio || 0)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => {
                                                const token = localStorage.getItem("auth_token");
                                                if (!token) {
                                                    alert("Debes iniciar sesión para descargar documentos oficiales.");
                                                    window.location.href = "/login";
                                                    return;
                                                }
                                                if (doc.archivo_url) window.open(doc.archivo_url, '_blank', 'noopener,noreferrer');
                                            }}
                                            className="text-fp-green hover:bg-green-50 p-2 rounded-full transition-colors inline-flex items-center justify-center"
                                        >
                                            <Download size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}


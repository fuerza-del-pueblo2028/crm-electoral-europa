"use client";

import { Affiliate } from "@/lib/mockData";
import { QrCode, ShieldCheck, Upload, Download, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import html2canvas from "html2canvas";

export function CarnetGenerator({ affiliate }: { affiliate: Affiliate }) {
    const [idPhoto, setIdPhoto] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const carnetRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setIdPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDownload = async () => {
        if (!carnetRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(carnetRef.current, {
                scale: 2, // Higher quality
                useCORS: true,
                backgroundColor: null,
            });
            const link = document.createElement("a");
            link.download = `carnet_${affiliate.name}_${affiliate.cedula}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (error) {
            console.error("Error generating image:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-6">
            {/* Carnet Container */}
            <div
                ref={carnetRef}
                className="w-[400px] h-[250px] bg-white rounded-2xl shadow-2xl overflow-hidden relative border border-gray-100 flex flex-col"
            >
                {/* Header with FP Green */}
                <div className="bg-[#137228] h-16 flex items-center justify-between px-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white p-1.5 rounded-full shadow-sm">
                            <ShieldCheck className="text-[#137228]" size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-black text-sm uppercase tracking-tighter leading-none">Fuerza del Pueblo</span>
                            <span className="text-white/70 text-[8px] uppercase font-bold tracking-[0.1em]">Secretaría de Asuntos Electorales</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-white font-black text-lg opacity-20 italic uppercase tracking-tighter">EUROPA</span>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 p-6 flex items-start space-x-6">
                    {/* Photo Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-28 h-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#137228] transition-all cursor-pointer flex items-center justify-center overflow-hidden group relative flex-shrink-0"
                    >
                        {idPhoto ? (
                            <>
                                <img
                                    src={idPhoto}
                                    alt="Foto"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Upload className="text-white" size={20} />
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center text-gray-400 group-hover:text-[#137228]">
                                <Upload size={24} className="mb-1" />
                                <span className="text-[8px] font-bold uppercase tracking-widest text-center px-2">Subir Foto</span>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-3">
                        <div className="border-b border-gray-100 pb-2">
                            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Afiliado</p>
                            <h3 className="text-xl font-black text-gray-900 leading-none uppercase italic tracking-tighter">{affiliate.name} {affiliate.lastName}</h3>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div>
                                <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Cédula</p>
                                <p className="text-base font-mono font-black text-[#137228] tracking-tighter">{affiliate.cedula}</p>
                            </div>
                            <div>
                                <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Seccional</p>
                                <p className="text-sm font-black text-gray-800 uppercase italic truncate">{affiliate.seccional}</p>
                            </div>
                        </div>

                        <div className="pt-2 flex items-center space-x-2">
                            <div className="bg-green-100 px-2 py-1 rounded-md">
                                <span className="text-[8px] font-black text-[#137228] uppercase tracking-widest">Válido hasta 2028</span>
                            </div>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                        <QrCode size={40} className="text-gray-900" />
                        <span className="text-[6px] font-bold mt-1 text-gray-400">ID VERIFICADO</span>
                    </div>
                </div>

                {/* Footer stripe */}
                <div className="h-2 bg-[#137228] w-full absolute bottom-0"></div>

                {/* Visual texture */}
                <div className="absolute top-0 right-0 w-32 h-64 bg-[#137228]/5 -mr-16 rotate-12 pointer-events-none"></div>
            </div>

            {/* Actions Panel */}
            <div className="flex gap-4 w-full max-w-[400px]">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-100 hover:border-[#137228] text-gray-700 hover:text-[#137228] rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm"
                >
                    <Upload size={16} /> {idPhoto ? "Cambiar Foto" : "Subir Foto"}
                </button>
                <button
                    disabled={isGenerating}
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#137228] hover:bg-[#0c4a1a] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-green-900/20 active:scale-95 disabled:opacity-70"
                >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    Descargar
                </button>
            </div>

            <p className="text-[10px] text-gray-400 font-medium italic">* Recomendamos una foto de rostro con fondo claro para mayor legibilidad.</p>
        </div>
    );
}

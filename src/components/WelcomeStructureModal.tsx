"use client";

import { useState, useEffect } from "react";
import { X, ShieldCheck, Star, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeStructureModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
}

export function WelcomeStructureModal({ isOpen, onClose, userName }: WelcomeStructureModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl sm:rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-[#137228] opacity-5"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#137228] opacity-5 rounded-full blur-3xl"></div>

                {/* Sticky close button for mobile */}
                <button
                    onClick={onClose}
                    className="sticky top-2 right-2 ml-auto mr-2 mt-2 z-20 p-2 sm:p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors flex items-center justify-center shadow-lg"
                    aria-label="Cerrar"
                >
                    <X size={20} className="sm:w-6 sm:h-6" />
                </button>

                <div className="p-6 sm:p-10 pt-2 sm:pt-4 relative z-10">
                    <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-fp-green/10 rounded-full flex items-center justify-center text-fp-green animate-bounce-slow">
                            <ShieldCheck size={40} className="sm:w-14 sm:h-14" strokeWidth={1.5} />
                        </div>

                        <div className="space-y-2">
                            <p className="text-[#137228] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[9px] sm:text-[10px]">Estructura Confirmada</p>
                            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
                                ¡Bienvenido/a, {userName.split(' ')[0]}!
                            </h2>
                        </div>

                        <div className="w-12 sm:w-16 h-1 bg-gray-100 rounded-full"></div>

                        <p className="text-gray-500 text-sm sm:text-lg leading-relaxed max-w-md">
                            Es un honor contar con tu compromiso para fortalecer nuestra organización en la <span className="font-bold text-gray-800">Circunscripción 3 de Europa</span> bajo el liderazgo del <span className="font-bold text-fp-green">Dr. Leonel Fernández</span>.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full mt-4 sm:mt-8">
                            <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 text-left group hover:border-fp-green/30 transition-colors">
                                <div className="bg-white w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-fp-green shadow-sm mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                                    <Star size={16} className="sm:w-5 sm:h-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Centinela Electoral</h4>
                                <p className="text-[11px] sm:text-xs text-gray-500">Tu rol es fundamental para garantizar la transparencia y el éxito de cada proceso.</p>
                            </div>
                            <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 text-left group hover:border-fp-green/30 transition-colors">
                                <div className="bg-white w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-fp-green shadow-sm mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                                    <ShieldCheck size={16} className="sm:w-5 sm:h-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Cuidado del Voto</h4>
                                <p className="text-[11px] sm:text-xs text-gray-500">Ahora tienes acceso a las herramientas avanzadas de gestión en toda Europa.</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="mt-6 sm:mt-10 w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 bg-[#137228] hover:bg-[#0aa059] text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm shadow-xl shadow-green-900/20 transition-all flex items-center justify-center group"
                        >
                            Comenzar
                            <ArrowRight size={16} className="ml-2 sm:ml-3 group-hover:translate-x-1 transition-transform sm:w-[18px] sm:h-[18px]" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

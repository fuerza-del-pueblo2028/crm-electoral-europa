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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden relative">
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-[#137228] opacity-5"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#137228] opacity-5 rounded-full blur-3xl"></div>

                <div className="p-10 relative z-10">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-24 h-24 bg-fp-green/10 rounded-full flex items-center justify-center text-fp-green animate-bounce-slow">
                            <ShieldCheck size={56} strokeWidth={1.5} />
                        </div>

                        <div className="space-y-2">
                            <p className="text-[#137228] font-black uppercase tracking-[0.3em] text-[10px]">Estructura Confirmada</p>
                            <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
                                ¡Bienvenido/a a la Estructura, {userName.split(' ')[0]}!
                            </h2>
                        </div>

                        <div className="w-16 h-1 bg-gray-100 rounded-full"></div>

                        <p className="text-gray-500 text-lg leading-relaxed max-w-md">
                            Es un honor contar con tu compromiso para fortalecer nuestra organización en la <span className="font-bold text-gray-800">Circunscripción 3 de Europa</span> bajo el liderazgo del <span className="font-bold text-fp-green">Dr. Leonel Fernández</span>.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8">
                            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-left group hover:border-fp-green/30 transition-colors">
                                <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center text-fp-green shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                    <Star size={20} />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-1">Centinela Electoral</h4>
                                <p className="text-xs text-gray-500">Tu rol es fundamental para garantizar la transparencia y el éxito de cada proceso.</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-left group hover:border-fp-green/30 transition-colors">
                                <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center text-fp-green shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                    <ShieldCheck size={20} />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-1">Cuidado del Voto</h4>
                                <p className="text-xs text-gray-500">Ahora tienes acceso a las herramientas avanzadas de gestión en toda Europa.</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="mt-10 w-full md:w-auto px-12 py-4 bg-[#137228] hover:bg-[#0aa059] text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-green-900/20 transition-all flex items-center justify-center group"
                        >
                            Comenzar Gestión
                            <ArrowRight size={18} className="ml-3 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { dbInsert, dbUpdate } from "@/lib/dbWrite";
import { UserCheck, KeyRound, Vote, CheckCircle2, AlertCircle, ArrowRight, Loader2, ShieldCheck, Trophy, RefreshCw, BarChart3, LogOut } from "lucide-react";

export default function VotingBooth() {
    const [step, setStep] = useState<"verify" | "otp" | "waiting" | "select" | "confirm" | "success">("verify");
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auth State
    const [voterData, setVoterData] = useState<any>(null);
    const [currentCargo, setCurrentCargo] = useState<any>(null);
    const [selectedCandidato, setSelectedCandidato] = useState<any>(null);

    // Form Inputs
    const [cedula, setCedula] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState("");
    const [otp, setOtp] = useState("");
    const [generatedOtp, setGeneratedOtp] = useState("");

    // 1. Session Persistence Check
    useEffect(() => {
        const savedSession = localStorage.getItem("voter_session");
        if (savedSession) {
            const data = JSON.parse(savedSession);
            setVoterData(data);
            setVoterData(data);
            setStep("waiting");
            checkActiveRound(data.cedula, data.seccional);
        }
    }, []);

    // 2. Continuous check for active rounds
    const checkActiveRound = useCallback(async (voterCedula: string, voterSeccional: string = 'Todas') => {
        if (!voterCedula) return;
        setRefreshing(true);
        try {
            // 1. Fetch ALL active cargos
            const { data: activeCargos } = await supabase
                .from('elecciones_cargos')
                .select('*, elecciones_candidatos(*)')
                .eq('estado', 'active');

            if (!activeCargos || activeCargos.length === 0) {
                setCurrentCargo(null);
                setStep("waiting");
                return;
            }

            // FILTER: Only show cargos relevant to the voter (and global ones)
            const visibleCargos = activeCargos.filter(cargo => {
                // Si no tiene seccional definida o es 'Europa'/'Todas', es global.
                // Si tiene seccional específica, debe coincidir con la del votante.
                if (!cargo.seccional || cargo.seccional === 'Europa' || cargo.seccional === 'Todas') return true;
                return cargo.seccional === voterSeccional;
            });

            if (visibleCargos.length === 0) {
                setCurrentCargo(null);
                setStep("waiting");
                return;
            }

            // 2. Check which one the user hasn't voted for yet
            const { data: castVotes } = await supabase
                .from('elecciones_votos_emitidos')
                .select('cargo_id')
                .eq('cedula_voter', voterCedula);

            const castCargoIds = castVotes?.map(v => v.cargo_id) || [];
            const nextCargo = visibleCargos.find(c => !castCargoIds.includes(c.id));

            if (nextCargo) {
                setCurrentCargo(nextCargo);
                setStep("select");
            } else {
                setCurrentCargo(null);
                setStep("waiting");
            }
        } catch (err) {
            console.error("Error checking round:", err);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const handleVerifyVoter = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: dbError } = await supabase
                .from('elecciones_padron')
                .select('*')
                .eq('cedula', cedula)
                .eq('fecha_nacimiento', fechaNacimiento)
                .single();

            if (dbError || !data) {
                throw new Error("Credenciales inválidas o no autorizado en el padrón.");
            }

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(code);

            try {
                const res = await fetch('/api/auth/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: data.email,
                        otp: code,
                        nombre: data.nombre
                    }),
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || "Error contactando servicio de email");
                }
            } catch (sendError) {
                console.error("Error crítica enviando OTP:", sendError);
                throw new Error("No se pudo enviar el código a tu correo. Por favor contacta soporte.");
            }


            // FETCH SECCIONAL FROM AFILIADOS
            let userSeccional = 'Todas';
            const { data: afiliadosData } = await supabase
                .from('afiliados')
                .select('seccional')
                .eq('cedula', cedula)
                .single();

            if (afiliadosData && afiliadosData.seccional) {
                userSeccional = afiliadosData.seccional;
            }

            const voterSession = { ...data, seccional: userSeccional };
            setVoterData(voterSession);
            setStep("otp");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = (e: React.FormEvent) => {
        e.preventDefault();
        if (otp === generatedOtp) {
            // Persist Session
            localStorage.setItem("voter_session", JSON.stringify(voterData));
            checkActiveRound(voterData.cedula, voterData.seccional);
        } else {
            setError("Código OTP incorrecto.");
        }
    };

    const handleVoteSubmit = async () => {
        if (!selectedCandidato || !voterData || !currentCargo) return;
        setLoading(true);
        setError(null);

        try {
            // Register vote
            const voteResult = await dbInsert('elecciones_votos_emitidos', {
                cedula_voter: voterData.cedula,
                cargo_id: currentCargo.id
            });

            if (!voteResult.success) throw new Error(voteResult.error);

            // Increment count
            await dbUpdate('elecciones_candidatos',
                { votos_count: (selectedCandidato.votos_count || 0) + 1 },
                { id: selectedCandidato.id }
            );

            setSelectedCandidato(null);
            checkActiveRound(voterData.cedula, voterData.seccional);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("voter_session");
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            {/* Header / Logo */}
            <div className="mb-8 text-center animate-in fade-in duration-700">
                <div className="bg-[#137228] p-4 rounded-full inline-block shadow-lg mb-4">
                    <img src="/logo-fp.png" alt="FP" className="w-10 h-10 object-contain rounded-lg p-1" style={{ backgroundColor: '#e5e0e0' }} />
                </div>
                <h1 className="text-3xl font-bold text-[#137228]">Centro de Votación</h1>
                <p className="text-gray-500 font-medium">Elecciones Internas</p>
            </div>

            <main className="bg-white w-full max-w-xl rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col min-h-[500px]">
                {/* Step Header */}
                <div className="bg-gray-50 border-b border-gray-100 px-8 py-4 flex justify-between items-center">
                    <div className="flex gap-2">
                        <div className={`w-2 h-2 rounded-full ${['verify', 'otp'].includes(step) ? 'bg-[#00843D]' : 'bg-gray-200'}`} />
                        <div className={`w-2 h-2 rounded-full ${step === 'waiting' ? 'bg-[#00843D]' : 'bg-gray-200'}`} />
                        <div className={`w-2 h-2 rounded-full ${['select', 'confirm'].includes(step) ? 'bg-[#00843D]' : 'bg-gray-200'}`} />
                        <div className={`w-2 h-2 rounded-full ${step === 'success' ? 'bg-[#00843D]' : 'bg-gray-200'}`} />
                    </div>
                    {voterData && (
                        <button onClick={handleLogout} className="text-[10px] font-bold text-red-400 hover:text-red-500 flex items-center gap-1 uppercase">
                            <LogOut size={12} /> Salir
                        </button>
                    )}
                </div>

                <div className="p-8 flex-1 flex flex-col">
                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3 animate-shake">
                            <AlertCircle className="text-red-500" size={20} />
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    {step === "verify" && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Verificación de Identidad</h2>
                                <p className="text-sm text-gray-500">Ingresa tus datos para iniciar la sesión de votación.</p>
                            </div>
                            <form onSubmit={handleVerifyVoter} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Número de Cédula</label>
                                    <input
                                        type="text"
                                        required
                                        value={cedula}
                                        onChange={(e) => setCedula(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00843D] outline-none text-lg font-mono tracking-widest text-gray-900"
                                        placeholder="000-0000000-0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Fecha de Nacimiento</label>
                                    <input
                                        type="date"
                                        required
                                        value={fechaNacimiento}
                                        onChange={(e) => setFechaNacimiento(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00843D] outline-none text-gray-900"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#00843D] text-white py-4 rounded-2xl font-bold hover:bg-[#137228] transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <>INICIAR SESIÓN <ArrowRight size={20} /></>}
                                </button>
                            </form>
                        </div>
                    )}

                    {step === "otp" && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <ShieldCheck size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">Código de Seguridad</h2>
                            <p className="text-sm text-gray-500 mb-8">
                                Enviado a <span className="font-bold text-gray-700">{voterData?.email.replace(/(.{3})(.*)(?=@)/, "$1***")}</span>
                            </p>

                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <input
                                    type="text"
                                    maxLength={6}
                                    required
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full text-center text-4xl font-bold tracking-[0.5em] py-4 bg-gray-50 border-2 border-[#00843D] rounded-2xl outline-none text-gray-900"
                                    placeholder="------"
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-[#00843D] text-white py-4 rounded-2xl font-bold hover:bg-[#137228] transition-all shadow-lg active:scale-95"
                                >
                                    INGRESAR AL CENTRO
                                </button>
                            </form>
                        </div>
                    )}

                    {step === "waiting" && (
                        <div className="animate-in fade-in zoom-in-95 duration-500 text-center py-12 flex-1 flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-8 relative">
                                <RefreshCw size={48} className={refreshing ? "animate-spin text-[#00843D]" : ""} />
                                {!refreshing && <div className="absolute inset-0 rounded-full border-4 border-[#00843D]/10 animate-ping" />}
                            </div>
                            <h2 className="text-2xl font-black text-gray-800 mb-4 italic uppercase">SALA DE ESPERA</h2>
                            <p className="text-gray-500 mb-10 max-w-xs mx-auto text-sm font-medium">
                                Por favor aguarda. El administrador está preparando la siguiente ronda de votación. Las mesas se abrirán automáticamente.
                            </p>

                            <div className="flex gap-4 w-full">
                                <button
                                    onClick={() => checkActiveRound(voterData?.cedula, voterData?.seccional)}
                                    disabled={refreshing}
                                    className="flex-1 bg-white text-[#00843D] py-4 rounded-2xl font-bold border-2 border-[#00843D] hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {refreshing ? "Buscando..." : "REFRESCAR ESTADO"}
                                </button>
                                <Link
                                    href="/elecciones-internas/resultados"
                                    className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                                >
                                    <BarChart3 size={20} /> VER RESULTADOS
                                </Link>
                            </div>
                        </div>
                    )}

                    {step === "select" && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-6 flex justify-between items-start">
                                <div>
                                    <span className="bg-[#00843D]/10 text-[#00843D] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Ronda Actual</span>
                                    <h2 className="text-2xl font-black text-gray-800 mt-2 uppercase italic tracking-tighter">{currentCargo?.titulo}</h2>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Votando como</span>
                                    <span className="text-xs font-bold text-gray-600 italic">{voterData?.nombre}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {currentCargo?.elecciones_candidatos && currentCargo.elecciones_candidatos.length > 0 ? (
                                    currentCargo.elecciones_candidatos.map((cand: any) => (
                                        <button
                                            key={cand.id}
                                            onClick={() => setSelectedCandidato(cand)}
                                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selectedCandidato?.id === cand.id
                                                ? 'border-[#00843D] bg-green-50 shadow-md ring-1 ring-[#00843D]'
                                                : 'border-gray-100 bg-white hover:border-[#00843D]/30'
                                                }`}
                                        >
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl uppercase ${selectedCandidato?.id === cand.id ? 'bg-[#00843D] text-white' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                {cand.nombre.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-bold uppercase tracking-tight text-lg ${selectedCandidato?.id === cand.id ? 'text-[#00843D]' : 'text-gray-700'}`}>
                                                    {cand.nombre}
                                                </p>
                                            </div>
                                            {selectedCandidato?.id === cand.id && (
                                                <CheckCircle2 className="text-[#00843D]" />
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-gray-400 font-medium italic">No hay candidatos registrados para este cargo.</p>
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={!selectedCandidato}
                                onClick={() => setStep("confirm")}
                                className="w-full mt-8 bg-[#00843D] text-white py-4 rounded-2xl font-bold hover:bg-[#137228] transition-all disabled:opacity-50 shadow-lg active:scale-95"
                            >
                                CONTINUAR A CONFIRMACIÓN
                            </button>
                        </div>
                    )}

                    {step === "confirm" && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Confirma tu Voto</h2>
                                <p className="text-sm text-gray-500 italic font-medium">Estás votando para el cargo de <span className="text-[#00843D] font-black">{currentCargo?.titulo}</span></p>
                            </div>

                            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 mb-8">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Tu Selección</p>
                                <div className="w-24 h-24 bg-[#00843D] text-white rounded-full flex items-center justify-center font-bold text-4xl mx-auto mb-4 italic shadow-lg">
                                    {selectedCandidato?.nombre.charAt(0)}
                                </div>
                                <h3 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">{selectedCandidato?.nombre}</h3>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep("select")}
                                    className="flex-1 bg-white text-gray-500 py-4 rounded-2xl font-bold border-2 border-gray-100 hover:bg-gray-50 transition-all uppercase text-xs"
                                >
                                    CAMBIAR
                                </button>
                                <button
                                    onClick={handleVoteSubmit}
                                    disabled={loading}
                                    className="flex-[2] bg-[#00843D] text-white py-4 rounded-2xl font-bold hover:bg-[#137228] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : "EMITIR VOTO AHORA"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="px-8 py-4 bg-gray-50 text-[9px] text-gray-400 flex justify-between font-bold uppercase tracking-tighter">
                    <span className="flex items-center gap-1"><ShieldCheck size={10} /> Sesión Encriptada y Segura</span>
                    <span>FP Europa © 2024</span>
                </div>
            </main>

            <p className="mt-8 text-xs text-gray-400">
                ¿Problemas con tu sesión? <button onClick={handleLogout} className="text-[#00843D] font-bold hover:underline">Reiniciar acceso</button>
            </p>
        </div>
    );
}

// Sub-component Link (Next.js Link doesn't need much, but keeping it simple)
function Link({ href, children, className }: any) {
    return <a href={href} className={className}>{children}</a>;
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { Download, RefreshCw, FileText, ArrowRight, Eye, X, Clock, Calendar, User, Sparkles, ChevronRight, ShieldCheck, Lock, TrendingUp, TrendingDown, Users } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { WelcomeStructureModal } from "@/components/WelcomeStructureModal";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [allStatutes, setAllStatutes] = useState<any[]>([]);
  const [displayedStatutes, setDisplayedStatutes] = useState<any[]>([]);
  const [selectedStatute, setSelectedStatute] = useState<any | null>(null);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [affiliateStats, setAffiliateStats] = useState({
    total: 0,
    lastMonth: 0,
    bySeccional: {} as Record<string, number>
  });

  // Contexto de autenticacion seguro
  const { user, isAuthenticated, isLoading } = useAuth();

  // Efecto para redirigir ocultando modal si no hay auth
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    // Checar si ya vio modal
    const hasSeenWelcome = localStorage.getItem("welcome_seen") === "true";
    if (!hasSeenWelcome) {
      setIsWelcomeModalOpen(true);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    fetchDashboardData();
    setIsMounted(true);

    // Clock interval
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Auto-refresh stats every 30 seconds
    const statsInterval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(statsInterval);
    };
  }, []);

  // Separated rotation logic...
  useEffect(() => {
    if (allStatutes.length === 0) return;
    rotateStatutes();
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        rotateStatutes();
        setIsTransitioning(false);
      }, 500);
    }, 20000);
    return () => clearInterval(interval);
  }, [allStatutes]);

  const rotateStatutes = () => {
    if (allStatutes.length > 0) {
      const shuffled = [...allStatutes].sort(() => 0.5 - Math.random());
      setDisplayedStatutes(shuffled.slice(0, 3));
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Error loading dashboard data');

      const data = await response.json();

      if (data.statutes) setAllStatutes(data.statutes);
      if (data.stats) setAffiliateStats(data.stats);
      if (data.recentDocs) setRecentDocs(data.recentDocs);

      if (data.recentDocs) setRecentDocs(data.recentDocs);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  // Removed individual fetch functions as they are now consolidated


  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Buenos Días";
    if (hour < 18) return "Buenas Tardes";
    return "Buenas Noches";
  };


  if (!isMounted || isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <RefreshCw className="animate-spin text-[#137228]" size={40} />
    </div>;
  }

  const userName = user?.nombre || "Invitado";

  const userRole = user?.role?.toLowerCase() || null;
  const isStaff = userRole === "administrador" || userRole === "operador";

  return (
    <div className="flex flex-col h-full gap-8 animate-in fade-in duration-700 pb-12">

      {/* Integrated Greeting Header (Less Boxed) */}
      <section className="relative px-6 pt-6 pb-4 flex flex-col md:flex-row justify-between items-end border-b border-gray-200 mb-2">
        <div className="flex items-center gap-6">
          <div className="space-y-1">
            <p className="text-[#137228] font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
              <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-fp-green animate-pulse"></span> {getGreeting()}
            </p>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-none uppercase italic">
              ¡HOLA, {!isAuthenticated ? "Invitado" : userName.split(' ')[0]}!
            </h1>

            {isAuthenticated && (
              <div className="inline-flex items-center bg-fp-green/10 text-fp-green px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 border border-fp-green/20">
                <ShieldCheck size={12} className="mr-1.5" /> Estructura Confirmada
              </div>
            )}

            <p className="text-gray-400 font-medium text-sm flex items-center gap-2 mt-2">
              <Calendar size={14} /> {formatDate(currentTime)} • <Clock size={14} className="ml-2" /> {formatTime(currentTime)}
            </p>
          </div>
        </div>

        <div className="hidden md:block text-right pb-1">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-1">
            Status: {isAuthenticated ? "Confirmado" : "Visitante"}
          </p>
          <div className="h-1 w-32 bg-gray-100 rounded-full overflow-hidden">
            <div className={cn(
              "h-full animate-pulse-slow w-full",
              isAuthenticated ? "bg-[#137228]" : "bg-blue-400"
            )}></div>
          </div>
        </div>
      </section>

      {/* Top Section: Grid with Left Main (Statutes) and Right Sidebar (Docs) */}
      <div className="flex flex-col lg:flex-row gap-8 flex-1 px-6">

        {/* Columna Izquierda: Estatutos Dinámicos */}
        <div className={cn(
          "flex-1 bg-white rounded-[32px] p-10 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden",
          !isStaff && "lg:col-span-3"
        )}>
          {/* Abstract background highlight */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#137228]/5 rounded-full blur-3xl"></div>

          <div className="flex justify-between items-center mb-10 relative z-10">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[#137228] uppercase tracking-[0.3em]">Cápsulas de Conocimiento</p>
              <h2 className="text-3xl font-black text-gray-900 flex items-center tracking-tighter uppercase italic">
                Estatutos y Normativas
              </h2>
            </div>
            <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#137228] animate-ping"></div>
              Auto-Update: 20s
            </div>
          </div>

          <div className={`space-y-6 flex-1 transition-all duration-500 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            {displayedStatutes.map((stat, idx) => (
              <div key={stat.id} className="group relative bg-[#fafafa] border border-gray-100 hover:border-[#137228] hover:bg-white hover:shadow-2xl hover:shadow-[#137228]/10 transition-all duration-500 rounded-3xl p-6 cursor-pointer overflow-hidden"
                onClick={() => setSelectedStatute(stat)}>

                {/* Decorative article number background */}
                <div className="absolute right-4 top-4 text-8xl font-black text-gray-200/20 group-hover:text-[#137228]/5 transition-colors pointer-events-none">
                  {stat.articulo.replace(/\D/g, '')}
                </div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className="bg-[#137228] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-green-900/20 group-hover:scale-105 transition-transform">
                    {stat.articulo}
                  </span>
                  <div className="text-gray-300 group-hover:text-[#137228] transition-all transform group-hover:rotate-12">
                    <Eye size={22} strokeWidth={2.5} />
                  </div>
                </div>

                <h3 className="font-black text-gray-900 text-xl mb-3 group-hover:text-[#137228] transition-colors uppercase tracking-tight italic leading-tight relative z-10">
                  {stat.titulo}
                </h3>
                <p className="text-gray-500 font-medium leading-relaxed line-clamp-2 relative z-10 text-sm">
                  {stat.contenido}
                </p>

                <div className="mt-4 flex items-center gap-2 text-[#137228] text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 relative z-10">
                  Continuar leyendo <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 relative z-10">
            <Link href="/estatutos" className="group w-full py-4 bg-gray-50 hover:bg-[#137228] rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden relative">
              <span className="text-[#137228] group-hover:text-white font-black text-sm uppercase tracking-widest transition-colors relative z-10">Ver reglamento completo</span>
              <ArrowRight size={18} className="text-[#137228] group-hover:text-white transition-all transform group-hover:translate-x-2 relative z-10" />
            </Link>
          </div>
        </div>

        {/* Columna Derecha: Panel de Métricas - VISIBLE PARA USUARIOS AUTENTICADOS */}
        {isAuthenticated && (
          <div className="w-full lg:w-[300px] bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 h-fit space-y-6">
            {/* Header */}
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[#137228] uppercase tracking-[0.2em]">Panel de Control</p>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight italic flex items-center gap-2">
                <Users size={20} className="text-[#137228]" />
                Afiliados
              </h2>
            </div>

            {/* Total Card */}
            <div className="bg-gradient-to-br from-[#137228] to-[#0d5a1d] rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Total Afiliados</p>
              <p className="text-4xl font-black">{affiliateStats.total}</p>

              {/* Comparación con mes anterior */}
              {(() => {
                const newThisMonth = affiliateStats.total - affiliateStats.lastMonth;
                const percentChange = affiliateStats.lastMonth > 0
                  ? Math.round((newThisMonth / affiliateStats.lastMonth) * 100)
                  : 100;
                const isPositive = newThisMonth >= 0;

                return (
                  <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                    {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>+{newThisMonth} este mes</span>
                  </div>
                );
              })()}
            </div>

            {/* Chart: Por Seccional */}
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Por Seccional</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(affiliateStats.bySeccional)
                      .map(([name, value]) => ({ name: name.substring(0, 6), value, fullName: name }))
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 6)}
                    layout="vertical"
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#666' }}
                      width={50}
                    />
                    <Bar
                      dataKey="value"
                      radius={[0, 8, 8, 0]}
                      barSize={16}
                    >
                      {Object.entries(affiliateStats.bySeccional).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#137228' : index === 1 ? '#1a9434' : '#e5e7eb'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Lista detallada */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {Object.entries(affiliateStats.bySeccional)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4)
                .map(([name, count]) => (
                  <div key={name} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium truncate">{name}</span>
                    <span className="font-black text-gray-900">{count}</span>
                  </div>
                ))}
            </div>

            {/* Link to Afiliados */}
            <Link
              href="/afiliados"
              className="block w-full text-center bg-gray-100 hover:bg-[#137228] hover:text-white text-gray-700 font-black py-3 rounded-xl transition-all duration-300 uppercase tracking-widest text-[10px]"
            >
              Ver todos →
            </Link>
          </div>
        )}

        {/* Columna Derecha: Documentos Recientes - VISIBLE PARA TODOS */}
        <div className="w-full lg:w-[340px] bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center border-b border-gray-100 pb-4 uppercase tracking-tight italic">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-xl mr-3">
              <FileText size={18} strokeWidth={2.5} />
            </div>
            Documentos Recientes
          </h2>

          <div className="space-y-2">
            {recentDocs.length === 0 ? (
              <div className="text-center py-10 text-gray-300">
                <FileText size={40} className="mx-auto mb-3 opacity-10" />
                <p className="text-xs font-black uppercase tracking-widest">No hay documentos</p>
                <Link href="/admin" className="text-[#137228] text-xs font-bold underline mt-3 inline-block">Sube el primero</Link>
              </div>
            ) : (
              recentDocs.map((doc, idx) => (
                <DocumentItem
                  key={idx}
                  name={doc.nombre}
                  date={new Date(doc.created_at).toLocaleDateString('es-ES')}
                  size={formatBytes(doc.tamanio || 0)}
                  url={doc.archivo_url}
                />
              ))
            )}
          </div>

          <div className="mt-8">
            <Link href="/repositorio" className="w-full block text-center bg-gray-900 text-white font-black py-3 rounded-xl hover:bg-[#137228] transition-all duration-300 uppercase tracking-widest text-[10px] shadow-lg shadow-gray-900/10">
              Biblioteca Digital
            </Link>
          </div>
        </div>
      </div>

      <WelcomeStructureModal
        isOpen={isWelcomeModalOpen}
        onClose={() => {
          setIsWelcomeModalOpen(false);
          localStorage.setItem("welcome_seen", "true");
        }}
        userName={userName}
      />

      {/* Bottom Banner: Biblioteca Digital (Integrated look) */}
      <div className="px-6">
        <div className="bg-[#137228] rounded-[40px] p-12 shadow-2xl shadow-green-900/40 text-white flex flex-col lg:flex-row justify-between items-center relative overflow-hidden transform hover:translate-y-[-4px] transition-transform duration-500 group">
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-32 -mt-32 blur-[80px] group-hover:bg-white/15 transition-colors duration-1000"></div>
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-green-400/20 rounded-full blur-[100px] group-hover:bg-green-400/30 transition-colors duration-1000"></div>

          <div className="relative z-10 max-w-2xl text-center lg:text-left">
            <p className="text-green-300 font-black uppercase tracking-[0.4em] text-xs mb-4">Official Resources</p>
            <h2 className="text-6xl font-black mb-6 tracking-tighter leading-[0.85] uppercase italic">Biblioteca Digital Electoral</h2>
            <p className="text-white/80 text-lg font-medium leading-relaxed max-w-xl">
              Acceso centralizado a toda la documentación oficial, formularios y guías para el proceso electoral 2024.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-10 lg:mt-0 relative z-10">
            <Link href="/repositorio" className="bg-white text-gray-900 px-10 py-5 rounded-2xl font-black shadow-2xl hover:bg-gray-100 transition-all duration-300 uppercase tracking-widest text-sm flex items-center justify-center gap-2">
              Explorar Archivos <ArrowRight size={20} />
            </Link>
            <Link href="/admin" className="backdrop-blur-md bg-white/10 text-white px-10 py-5 rounded-2xl font-black border-2 border-white/20 hover:bg-white/30 transition-all duration-300 uppercase tracking-widest text-sm flex items-center justify-center">
              Subir Documento
            </Link>
          </div>
        </div>
      </div>

      {/* Modal for Statute Details */}
      {selectedStatute && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setSelectedStatute(null)}>
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col relative" onClick={e => e.stopPropagation()}>
            <div className="bg-[#137228] px-10 py-8 flex justify-between items-center flex-shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <span className="bg-white text-[#137228] font-black text-xs px-5 py-2 rounded-full uppercase tracking-[0.2em] relative z-10 shadow-lg">
                {selectedStatute.articulo}
              </span>
              <button onClick={() => setSelectedStatute(null)} className="text-white/60 hover:text-white transition-all bg-white/10 p-3 rounded-full hover:bg-white/20 relative z-10">
                <X size={24} />
              </button>
            </div>
            <div className="p-12 overflow-y-auto flex-1 custom-scrollbar">
              <h2 className="text-5xl font-black text-gray-900 mb-8 tracking-tighter uppercase italic leading-none border-l-[12px] border-[#137228] pl-8">{selectedStatute.titulo}</h2>
              <div className="prose prose-xl prose-green max-w-none text-gray-700 leading-relaxed font-medium">
                <p className="whitespace-pre-wrap">{selectedStatute.contenido}</p>
              </div>
            </div>
            <div className="px-12 py-8 border-t border-gray-100 bg-gray-50 flex justify-end flex-shrink-0">
              <button onClick={() => setSelectedStatute(null)} className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-[#137228] transition-all uppercase tracking-widest text-xs shadow-xl shadow-gray-900/10">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
            .animate-spin-slow {
                animation: spin 8s linear infinite;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            @keyframes pulse-slow {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
            .animate-pulse-slow {
                animation: pulse-slow 3s ease-in-out infinite;
            }
        `}</style>
    </div>
  );
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

function DocumentItem({ name, date, size, url }: { name: string, date: string, size: string, url?: string }) {
  const handleClick = () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      alert("Debes iniciar sesión para descargar documentos oficiales.");
      window.location.href = "/login";
      return;
    }
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center justify-between p-5 bg-white border border-gray-100 hover:border-[#137228]/30 hover:shadow-xl hover:shadow-green-900/5 rounded-2xl transition-all group cursor-pointer"
    >
      <div className="flex items-center space-x-5 overflow-hidden">
        <div className="bg-gray-50 p-3 rounded-xl text-gray-400 group-hover:bg-[#137228]/10 group-hover:text-[#137228] transition-colors shadow-inner flex-shrink-0">
          <FileText size={20} strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-gray-900 truncate group-hover:text-[#137228] transition-colors uppercase tracking-tight">{name}</p>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{date} • {size}</p>
        </div>
      </div>
      <div className="text-gray-300 group-hover:text-[#137228] transition-all transform group-hover:translate-y-[-2px]">
        <Download size={20} strokeWidth={2.5} />
      </div>
    </div>
  )
}

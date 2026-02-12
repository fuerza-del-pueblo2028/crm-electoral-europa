"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, Settings, Trash2, X, Book, UserPlus, Users, LayoutDashboard, KeyRound, BarChart3, Eye, Vote, UserCheck, ShieldCheck, Trophy, PlusCircle, Search, EyeOff, RefreshCw, Play, Lock, Image as ImageIcon, FileSearch, CheckCircle2, Loader2, Link as LinkIcon, FolderOpen, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { dbInsert, dbUpdate, dbDelete } from "@/lib/dbWrite";

export default function AdminPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"docs" | "statutes" | "users" | "actas" | "elections">("docs");
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isStatuteModalOpen, setIsStatuteModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isActaModalOpen, setIsActaModalOpen] = useState(false);
    const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);
    const [isCandidatoModalOpen, setIsCandidatoModalOpen] = useState(false);
    const [isVoterModalOpen, setIsVoterModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [documents, setDocuments] = useState<any[]>([]);
    const [statutes, setStatutes] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [actas, setActas] = useState<any[]>([]);
    const [cargos, setCargos] = useState<any[]>([]);
    const [candidatos, setCandidatos] = useState<any[]>([]);
    const [padron, setPadron] = useState<any[]>([]);
    const [filterSeccional, setFilterSeccional] = useState("Todas"); // New filter state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [categoria, setCategoria] = useState("Manuales");
    const [statuteForm, setStatuteForm] = useState({ articulo: "", titulo: "", contenido: "" });
    const [editingStatute, setEditingStatute] = useState<any | null>(null);
    const [userForm, setUserForm] = useState({ nombre: "", cedula: "", password: "password123", rol: "operador", seccional: "Madrid" });
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [resettingUser, setResettingUser] = useState<any | null>(null);
    const [newPassword, setNewPassword] = useState("password123");
    const [actaForm, setActaForm] = useState({
        seccional: "Madrid",
        ciudad: "",
        recinto: "",
        colegio: "",
        votos_fp: 0,
        votos_prm: 0,
        votos_pld: 0,
        votos_otros: 0,
        votos_nulos: 0
    });
    const [editingActa, setEditingActa] = useState<any | null>(null);
    const [cargoForm, setCargoForm] = useState({ titulo: "", seccional: "Europa" });
    const [editingCargo, setEditingCargo] = useState<any | null>(null);
    const [candidatoForm, setCandidatoForm] = useState({ nombre: "", cargo_id: "" });
    const [editingCandidato, setEditingCandidato] = useState<any | null>(null);
    const [voterForm, setVoterForm] = useState({ cedula: "", fecha_nacimiento: "", email: "", nombre: "" });
    const [uploadMode, setUploadMode] = useState<"file" | "link">("file");
    const [externalUrl, setExternalUrl] = useState("");
    const [externalName, setExternalName] = useState("");

    // Bulk Upload States
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
    const [bulkUploadProgress, setBulkUploadProgress] = useState({ total: 0, processed: 0, successful: 0, failed: 0 });
    const [bulkUploadResults, setBulkUploadResults] = useState<Array<{ file: string; status: 'success' | 'error'; message: string }>>([]);
    const [processingBulk, setProcessingBulk] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const token = localStorage.getItem("auth_token");
        const role = localStorage.getItem("user_role");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        if (role !== "administrador") {
            alert("No tienes permisos para acceder a esta página");
            window.location.href = "/";
            return;
        }

        fetchDocuments();
        fetchStatutes();
        fetchUsers();
        fetchActas();
        fetchElectionData();
    }, []);

    const fetchElectionData = async () => {
        fetchCargos();
        fetchPadron();
    };

    const fetchCargos = async () => {
        const { data: cargosData } = await supabase
            .from('elecciones_cargos')
            .select('*, elecciones_candidatos(*)')
            .order('creado_at', { ascending: false });
        if (cargosData) setCargos(cargosData);
    };

    const fetchPadron = async () => {
        try {
            // 1. Fetch padron
            const { data: padronData, error: padronError } = await supabase
                .from('elecciones_padron')
                .select('*')
                .order('nombre', { ascending: true });

            if (padronError) throw padronError;
            if (!padronData || padronData.length === 0) {
                setPadron([]);
                return;
            }

            // 2. Fetch ALL afiliados info to guarantee matching regardless of format (dashes/no dashes)
            // Ideally we would do this in SQL, but for now client-side matching is most robust against dirty data.
            const { data: afiliadosData, error: affError } = await supabase
                .from('afiliados')
                .select('cedula, seccional');

            if (affError) console.error("Error fetching afiliados details:", affError);

            // 3. Merge data using normalized matching
            const mergedPadron = padronData.map(p => {
                // Normalize Padrón Cedula
                const padronCedulaClean = p.cedula.replace(/\D/g, ''); // Remove all non-digits

                // Find in Afiliados (normalizing there too)
                const afiliado = afiliadosData?.find(a => {
                    const afiliadoCedulaClean = a.cedula.replace(/\D/g, '');
                    return afiliadoCedulaClean === padronCedulaClean;
                });

                return {
                    ...p,
                    seccional: afiliado?.seccional || 'Sin definir'
                };
            });

            setPadron(mergedPadron);
        } catch (error) {
            console.error("Error loading padron:", error);
        }
    };

    const fetchActas = async () => {
        const { data } = await supabase
            .from('actas_electorales')
            .select('*')
            .order('creado_at', { ascending: false });
        if (data) setActas(data);
    };

    // Helper to get matching locations for "Choose or Create"
    const existingCiudades = actas
        ? [...new Set(actas.filter(a => a.seccional === actaForm.seccional).map(a => a.ciudad))].sort()
        : [];

    const existingRecintos = actas
        ? [...new Set(actas.filter(a => a.seccional === actaForm.seccional && a.ciudad === actaForm.ciudad).map(a => a.recinto))].sort()
        : [];

    const existingColegios = actas
        ? [...new Set(actas.filter(a => a.seccional === actaForm.seccional && a.ciudad === actaForm.ciudad && a.recinto === actaForm.recinto).map(a => a.colegio))].sort()
        : [];

    const fetchUsers = async () => {
        const { data } = await supabase
            .from('usuarios')
            .select('*')
            .order('nombre', { ascending: true });

        if (data) setUsuarios(data);
    };

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                const result = await dbUpdate('usuarios', {
                    nombre: userForm.nombre,
                    cedula: userForm.cedula,
                    rol: userForm.rol,
                    seccional: userForm.rol === 'administrador' ? null : userForm.seccional
                }, { id: editingUser.id });
                if (!result.success) throw new Error(result.error);
                alert("Usuario actualizado correctamente");
            } else {
                const result = await dbInsert('usuarios', userForm);
                if (!result.success) throw new Error(result.error);
                alert("Usuario creado correctamente");
            }
            setIsUserModalOpen(false);
            setEditingUser(null);
            setUserForm({ nombre: "", cedula: "", password: "password123", rol: "operador", seccional: "Madrid" });
            fetchUsers();
        } catch (error: any) {
            alert("Error: " + error.message);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;

        const result = await dbDelete('usuarios', { id });

        if (!result.success) alert("Error al eliminar: " + result.error);
        else {
            alert("Usuario eliminado");
            fetchUsers();
        }
    };

    const handleResetPassword = async (user: any) => {
        setResettingUser(user);
        setNewPassword("password123");
    };

    const confirmResetPassword = async () => {
        if (!resettingUser) return;

        if (newPassword.trim().length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        try {
            const result = await dbUpdate('usuarios', { password: newPassword }, { id: resettingUser.id });

            if (!result.success) throw new Error(result.error);
            alert(`Contraseña de ${resettingUser.nombre} actualizada correctamente.`);
            setResettingUser(null);
        } catch (error: any) {
            alert("Error al resetear: " + error.message);
        }
    };

    // --- ELECTION MANAGEMENT ---
    const handleCargoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let error;
            if (editingCargo) {
                const result = await dbUpdate('elecciones_cargos', cargoForm, { id: editingCargo.id });
                if (!result.success) error = { message: result.error };
            } else {
                const result = await dbInsert('elecciones_cargos', cargoForm);
                if (!result.success) error = { message: result.error };
            }
            if (error) throw error;

            alert(editingCargo ? "Cargo actualizado" : "Cargo creado");
            setIsCargoModalOpen(false);
            setCargoForm({ titulo: "", seccional: "Europa" });
            setEditingCargo(null);
            fetchCargos();
        } catch (error: any) {
            alert("Error: " + error.message);
        }
    };

    const handleDeleteCargo = async (id: string) => {
        if (!confirm("¿Eliminar este cargo y todos sus candidatos?")) return;
        await dbDelete('elecciones_cargos', { id });
        fetchCargos();
    };

    const toggleCargoStatus = async (id: string, currentStatus: string) => {
        let nextStatus = "pending";
        if (currentStatus === "pending") nextStatus = "active";
        else if (currentStatus === "active") nextStatus = "closed";
        else if (currentStatus === "closed") nextStatus = "active";

        await dbUpdate('elecciones_cargos', { estado: nextStatus }, { id });
        fetchCargos();
    };

    const toggleResultsVisibility = async (id: string, currentVisibility: boolean) => {
        await dbUpdate('elecciones_cargos', { resultados_visibles: !currentVisibility }, { id });
        fetchCargos();
    };

    const handleCandidatoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let error;
            if (editingCandidato) {
                const result = await dbUpdate('elecciones_candidatos', candidatoForm, { id: editingCandidato.id });
                if (!result.success) error = { message: result.error };
            } else {
                const result = await dbInsert('elecciones_candidatos', candidatoForm);
                if (!result.success) error = { message: result.error };
            }
            if (error) throw error;

            alert(editingCandidato ? "Candidato actualizado" : "Candidato agregado");
            setIsCandidatoModalOpen(false);
            setCandidatoForm({ nombre: "", cargo_id: "" });
            setEditingCandidato(null);
            fetchCargos();
        } catch (error: any) {
            alert("Error: " + error.message);
        }
    };

    const handleDeleteCandidato = async (id: string) => {
        if (!confirm("¿Eliminar este candidato?")) return;
        await dbDelete('elecciones_candidatos', { id });
        fetchCargos();
    };

    const handleVoterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Check for duplicates first
            const { data: existing } = await supabase
                .from('elecciones_padron')
                .select('id')
                .eq('email', voterForm.email)
                .single();

            if (existing) {
                alert("Error: Este correo electrónico ya está registrado en el padrón. No se permiten correos duplicados.");
                return;
            }

            const result = await dbInsert('elecciones_padron', voterForm);
            if (!result.success) throw new Error(result.error);
            alert("Votante agregado al padrón");
            setIsVoterModalOpen(false);
            setVoterForm({ cedula: "", fecha_nacimiento: "", email: "", nombre: "" });
            fetchPadron();
        } catch (error: any) {
            alert("Error: " + error.message);
        }
    };

    const handleDeleteVoter = async (id: string) => {
        if (!confirm("¿Eliminar este votante del padrón?")) return;
        await dbDelete('elecciones_padron', { id });
        fetchPadron();
    };

    const handleFileChange = async (file: File | null) => {
        setSelectedFile(file);
        if (file) {
            // Preview logic
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setFilePreview(reader.result as string);
                reader.readAsDataURL(file);
            } else {
                setFilePreview(null);
            }

            // PDF Recognition Logic
            // PDF Recognition Logic
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

            if (isPdf) {
                try {
                    // Visual feedback
                    setActaForm(prev => ({ ...prev, votos_fp: 0 })); // Reset while loading (visual cue)

                    const formData = new FormData();
                    formData.append("file", file);

                    // Add 15s timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000);

                    // Call our new API
                    const response = await fetch("/api/actas/parse", {
                        method: "POST",
                        body: formData,
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const data = await response.json();

                        // Check if we actually found data
                        const totalVotesFound = (data.results.votos_fp || 0) + (data.results.votos_prm || 0) + (data.results.votos_pld || 0);

                        if (totalVotesFound === 0) {
                            alert("El análisis terminó pero no encontré números de votos.\n\nTexto detectado (inicio):\n" + (data.text_snippet || "Nada legible"));
                            console.log("Texto completo PDF:", data.text_snippet);
                        } else {
                            setActaForm(prev => ({
                                ...prev,
                                votos_fp: data.results.votos_fp || 0,
                                votos_prm: data.results.votos_prm || 0,
                                votos_pld: data.results.votos_pld || 0,
                                votos_otros: data.results.votos_otros || 0,
                                votos_nulos: data.results.votos_nulos || 0
                            }));
                            alert(`¡Éxito! Datos extraídos.\nVerifica los campos.`);
                        }
                    } else {
                        // Try to parse error details
                        let errorMessage = response.statusText;
                        try {
                            const errorData = await response.json();
                            if (errorData.error) errorMessage = errorData.error;
                        } catch (e) { /* ignore json parse error */ }

                        throw new Error(errorMessage);
                    }
                } catch (error: any) {
                    console.error("Error analizando PDF:", error);
                    if (error.name === 'AbortError') {
                        alert("El análisis tardó demasiado (>15s). Posiblemente sea una imagen muy pesada. Ingresa los datos manualmente.");
                    } else {
                        alert("Error del Servidor: " + error.message + "\n\nPor favor ingresa los datos manualmente.");
                    }
                    // Remove "Analizando..." message by forcing re-render or similar if needed, 
                    // though usually the user will just replace the file or type manually.
                }
            }
        } else {
            setFilePreview(null);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    // Helper for filename sanitization
    const sanitizeFileName = (name: string) => {
        return name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9._-]/g, "");
    };

    const handleActaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!actaForm.ciudad || !actaForm.recinto || !actaForm.colegio) {
            alert("Por favor, completa la ubicación (Ciudad, Recinto, Colegio).");
            return;
        }

        setUploading(true);
        try {
            let finalUrl = editingActa ? editingActa.archivo_url : "";

            // 1. Upload file only if selected
            if (selectedFile) {
                const safeName = sanitizeFileName(selectedFile.name);
                const fileName = `acta_${Date.now()}_${safeName}`;
                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, selectedFile);

                if (uploadError) {
                    console.error("Storage Error:", uploadError);
                    throw new Error("Error de Almacenamiento: " + uploadError.message);
                }

                const { data: urlData } = supabase.storage
                    .from('documents')
                    .getPublicUrl(fileName);

                finalUrl = urlData.publicUrl;
            } else if (!editingActa) {
                alert("Por favor, selecciona el archivo del acta.");
                setUploading(false);
                return;
            }

            // 2. Save or Update in DB
            if (editingActa) {
                const dbResult = await dbUpdate('actas_electorales', {
                    ...actaForm,
                    archivo_url: finalUrl
                }, { id: editingActa.id });

                if (!dbResult.success) throw new Error("Error de Base de Datos: " + dbResult.error);
                alert("Acta actualizada correctamente");
            } else {
                const dbResult = await dbInsert('actas_electorales', {
                    ...actaForm,
                    archivo_url: finalUrl
                });

                if (!dbResult.success) throw new Error("Error de Base de Datos: " + dbResult.error);
                alert("Acta subida correctamente");
            }

            setIsActaModalOpen(false);
            setEditingActa(null);
            setSelectedFile(null);
            setFilePreview(null);
            setActaForm({
                seccional: "Madrid",
                ciudad: "",
                recinto: "",
                colegio: "",
                votos_fp: 0,
                votos_prm: 0,
                votos_pld: 0,
                votos_otros: 0,
                votos_nulos: 0
            });
            fetchActas();
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteActa = async (id: string, url: string) => {
        if (!confirm("¿Eliminar esta acta?")) return;
        try {
            const fileName = url.split('/').pop();
            await supabase.storage.from('documents').remove([fileName!]);
            await dbDelete('actas_electorales', { id });
            fetchActas();
        } catch (error: any) {
            alert("Error: " + error.message);
        }
    };

    // --- BULK UPLOAD HANDLER ---
    const handleBulkFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const validSeccionales = ["Madrid", "Barcelona", "Milano", "Zurich", "Holanda", "Valencia", "Sevilla", "Bilbao", "Zaragoza"];
        const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

        setProcessingBulk(true);
        setBulkUploadProgress({ total: files.length, processed: 0, successful: 0, failed: 0 });
        setBulkUploadResults([]);

        const results: Array<{ file: string; status: 'success' | 'error'; message: string }> = [];
        let successful = 0;
        let failed = 0;

        // Helper to normalize strings for comparison (lowercase, no accents)
        const normalize = (s: string) => s ? s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const filePath = file.webkitRelativePath || file.name;

            try {
                // Parse folder structure (handle both / and \)
                const pathParts = filePath.split(/[/\\]/).filter(p => p.trim() !== '');

                // Find Seccional in path
                let seccionalIdx = -1;
                let detectedSeccional = "";

                for (let j = 0; j < pathParts.length; j++) {
                    const part = normalize(pathParts[j]);

                    // Direct match
                    let match = validSeccionales.find(s => normalize(s) === part);

                    // Aliases
                    if (!match) {
                        if (part === "milan") match = "Milano";
                        if (part === "paises bajos") match = "Holanda";
                        if (part === "italia") match = "Milano";
                        if (part === "suiza") match = "Zurich";
                    }

                    if (match) {
                        seccionalIdx = j;
                        detectedSeccional = match;
                        break;
                    }
                }

                if (seccionalIdx === -1) {
                    throw new Error(`No se encontró una seccional válida en la ruta. Debe incluir una de: ${validSeccionales.join(', ')}`);
                }

                // Extract hierarchical parts after Seccional
                const remainingParts = pathParts.slice(seccionalIdx + 1);
                const fileName = pathParts[pathParts.length - 1];

                let ciudad = "General";
                let recinto = "General";
                let colegio = "N/A";

                // Flexible Mapping based on depth after Seccional:
                // Case 4+ items after Seccional (Secc/Ciudad/Recinto/Colegio/File)
                if (remainingParts.length >= 4) {
                    ciudad = remainingParts[0];
                    recinto = remainingParts[1];
                    colegio = remainingParts[2];
                }
                // Case 3 items (Secc/Ciudad/Colegio/File)
                else if (remainingParts.length === 3) {
                    ciudad = remainingParts[0];
                    colegio = remainingParts[1];
                }
                // Case 2 items (Secc/Colegio/File)
                else if (remainingParts.length === 2) {
                    colegio = remainingParts[0];
                }
                // Case 1 item (Secc/File)
                else {
                    colegio = "General (" + fileName.split('.')[0] + ")";
                }

                // Validate file extension
                const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
                if (!validExtensions.includes(fileExt)) {
                    throw new Error(`Formato no permitido: ${fileExt}. Permitidos: ${validExtensions.join(', ')}`);
                }

                // Upload file to storage
                const safeName = sanitizeFileName(fileName);
                const storageFileName = `acta_${Date.now()}_${Math.random().toString(36).substring(7)}_${safeName}`;
                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(storageFileName, file);

                if (uploadError) {
                    throw new Error(`Error de storage: ${uploadError.message}`);
                }

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('documents')
                    .getPublicUrl(storageFileName);

                // Insert into database
                const dbResult = await dbInsert('actas_electorales', {
                    seccional: detectedSeccional,
                    ciudad,
                    recinto,
                    colegio,
                    archivo_url: urlData.publicUrl,
                    votos_fp: 0,
                    votos_prm: 0,
                    votos_pld: 0,
                    votos_otros: 0,
                    votos_nulos: 0
                });

                if (!dbResult.success) {
                    throw new Error(`Error DB: ${dbResult.error}`);
                }

                successful++;
                results.push({
                    file: filePath,
                    status: 'success',
                    message: `✓ ${detectedSeccional} > ${ciudad} > Col. ${colegio}`
                });

            } catch (error: any) {
                failed++;
                results.push({
                    file: filePath,
                    status: 'error',
                    message: `✗ ${error.message}`
                });
            }

            setBulkUploadProgress({
                total: files.length,
                processed: i + 1,
                successful,
                failed
            });
            setBulkUploadResults([...results]);
        }

        setProcessingBulk(false);
        await fetchActas();
    };



    const fetchStatutes = async () => {
        const { data } = await supabase
            .from('estatutos')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setStatutes(data);
    };

    const handleStatuteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingStatute) {
                // Update existing
                const result = await dbUpdate('estatutos', statuteForm, { id: editingStatute.id });
                if (!result.success) throw new Error(result.error);
                alert("Artículo actualizado");
            } else {
                // Insert new
                const result = await dbInsert('estatutos', statuteForm);
                if (!result.success) throw new Error(result.error);
                alert("Artículo agregado");
            }
            setIsStatuteModalOpen(false);
            setStatuteForm({ articulo: "", titulo: "", contenido: "" });
            setEditingStatute(null);
            fetchStatutes();
        } catch (error: any) {
            alert("Error: " + error.message);
        }
    };

    const handleDeleteStatute = async (id: string) => {
        if (!confirm("¿Eliminar este artículo?")) return;
        await dbDelete('estatutos', { id });
        fetchStatutes();
    };

    const fetchDocuments = async () => {
        const { data, error } = await supabase
            .from('documentos')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setDocuments(data);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (uploadMode === "file" && !selectedFile) return;
        if (uploadMode === "link" && (!externalUrl || !externalName)) return;

        setUploading(true);
        try {
            let finalUrl = "";
            let finalName = "";
            let finalSize = 0;
            let finalExt = "link";

            if (uploadMode === "file" && selectedFile) {
                // 1. Upload file to storage
                const fileExt = selectedFile.name.split('.').pop() || "unknown";
                const safeName = sanitizeFileName(selectedFile.name);
                const fileName = `${Date.now()}_${safeName}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, selectedFile);

                if (uploadError) throw uploadError;

                // 2. Get public URL
                const { data: urlData } = supabase.storage
                    .from('documents')
                    .getPublicUrl(fileName);

                finalUrl = urlData.publicUrl;
                finalName = selectedFile.name;
                finalSize = selectedFile.size;
                finalExt = fileExt;
            } else {
                // External Link
                finalUrl = externalUrl;
                finalName = externalName;
                finalSize = 0; // External links don't consume storage
                finalExt = "link";
            }

            // 3. Save metadata to database
            const dbResult = await dbInsert('documentos', {
                nombre: finalName,
                categoria: categoria,
                archivo_url: finalUrl,
                tamanio: finalSize,
                extension: finalExt
            });

            if (!dbResult.success) throw new Error(dbResult.error);

            alert(uploadMode === "file" ? "Documento subido correctamente" : "Enlace guardado correctamente");
            setIsUploadModalOpen(false);
            setSelectedFile(null);
            setExternalUrl("");
            setExternalName("");
            fetchDocuments();
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string, url: string) => {
        if (!confirm("¿Eliminar este documento?")) return;

        try {
            // Extract file path from URL
            const fileName = url.split('/').pop();

            // Delete from storage
            await supabase.storage.from('documents').remove([fileName!]);

            // Delete from database
            await dbDelete('documentos', { id });

            fetchDocuments();
        } catch (error: any) {
            alert("Error al eliminar: " + error.message);
        }
    };

    if (!isMounted) return null;

    return (

        <div className="p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#005c2b] flex items-center">
                        <Settings size={28} className="mr-3" /> Panel de Administración
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm md:text-base">Gestión de documentos y configuración del sistema</p>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="w-full md:w-auto bg-[#00843D] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#137228] transition-all flex items-center justify-center"
                >
                    <Upload size={20} className="mr-2" />
                    Subir Documento
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-2 border-b border-gray-200 overflow-x-auto pb-1 scrollbar-hide">
                <button
                    onClick={() => setActiveTab("docs")}
                    className={`px-4 md:px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === "docs" ? "border-[#00843D] text-[#00843D]" : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <FileText size={18} /> Documentos
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("statutes")}
                    className={`px-4 md:px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === "statutes" ? "border-[#00843D] text-[#00843D]" : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Book size={18} /> Estatutos
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("users")}
                    className={`px-4 md:px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === "users" ? "border-[#00843D] text-[#00843D]" : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Users size={18} /> Usuarios
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("actas")}
                    className={`px-4 md:px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === "actas" ? "border-[#00843D] text-[#00843D]" : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <BarChart3 size={18} /> Actas Electorales
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("elections")}
                    className={`px-4 md:px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === "elections" ? "border-[#00843D] text-[#00843D]" : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Vote size={18} /> Elecciones Internas
                    </div>
                </button>
            </div>

            {/* Content Sections */}
            {activeTab === "docs" && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-[#005c2b]">Documentos Subidos ({documents.length})</h2>
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="bg-[#00843D] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#137228] transition-all flex items-center"
                        >
                            <Upload size={16} className="mr-2" /> Subir
                        </button>
                    </div>

                    {documents.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FileText size={48} className="mx-auto mb-4 opacity-30" />
                            <p>No hay documentos registrados.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {documents.map(doc => (
                                <div key={doc.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="bg-blue-50 p-2 rounded-lg">
                                            <FileText size={24} className="text-blue-600" />
                                        </div>
                                        <button
                                            onClick={() => handleDelete(doc.id, doc.archivo_url)}
                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-[#005c2b] text-sm mb-2 line-clamp-2">{doc.nombre}</h3>
                                    <div className="flex justify-between items-center text-xs text-gray-400">
                                        <span className="bg-gray-50 px-2 py-1 rounded">{doc.categoria}</span>
                                        <span>{(doc.tamanio / 1024).toFixed(0)} KB</span>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <a
                                            href={doc.archivo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                            title="Visualizar"
                                        >
                                            <Eye size={16} className="mr-2" /> Ver
                                        </a>
                                        <a
                                            href={doc.archivo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download={doc.extension !== 'link'}
                                            className="flex-1 flex items-center justify-center bg-green-50 text-[#00843D] py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                                        >
                                            Descargar
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "statutes" && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-[#005c2b]">Artículos de Estatutos ({statutes.length})</h2>
                        <button
                            onClick={() => {
                                setEditingStatute(null);
                                setStatuteForm({ articulo: "", titulo: "", contenido: "" });
                                setIsStatuteModalOpen(true);
                            }}
                            className="text-sm bg-[#00843D] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#137228] transition-colors"
                        >
                            + Agregar Artículo
                        </button>
                    </div>

                    {statutes.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Book size={48} className="mx-auto mb-4 opacity-30" />
                            <p>No hay artículos de estatutos registrados.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {statutes.map(stat => (
                                <div key={stat.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                {stat.articulo}
                                            </span>
                                            <h3 className="font-bold text-gray-800">{stat.titulo}</h3>
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-1">{stat.contenido}</p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => {
                                                setEditingStatute(stat);
                                                setStatuteForm({ articulo: stat.articulo, titulo: stat.titulo, contenido: stat.contenido });
                                                setIsStatuteModalOpen(true);
                                            }}
                                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                        >
                                            <Settings size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteStatute(stat.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "users" && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-[#005c2b]">Gestión de Personal ({usuarios.length})</h2>
                        <button
                            onClick={() => {
                                setEditingUser(null);
                                setUserForm({ nombre: "", cedula: "", password: "password123", rol: "operador", seccional: "Madrid" });
                                setIsUserModalOpen(true);
                            }}
                            className="text-sm bg-[#00843D] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#137228] transition-colors flex items-center"
                        >
                            <UserPlus size={16} className="mr-2" /> Agregar Usuario
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Nombre</th>
                                    <th className="px-6 py-4 font-bold">Cédula</th>
                                    <th className="px-6 py-4 font-bold">Rol</th>
                                    <th className="px-6 py-4 font-bold">Seccional</th>
                                    <th className="px-6 py-4 font-bold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {usuarios.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800">{user.nombre}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.cedula}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.rol === 'administrador' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                                }`}>
                                                {user.rol}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {user.seccional || "Toda Europa (Admin)"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleResetPassword(user)}
                                                    className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
                                                    title="Resetear Contraseña"
                                                >
                                                    <KeyRound size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingUser(user);
                                                        setUserForm({ ...user });
                                                        setIsUserModalOpen(true);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                >
                                                    <Settings size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "actas" && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-[#005c2b]">Actas de Escrutinio ({actas.length})</h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsBulkUploadModalOpen(true)}
                                className="text-sm bg-[#f1f5f9] text-slate-800 border border-slate-200 px-4 py-2 rounded-lg font-bold hover:bg-slate-200 transition-colors flex items-center"
                            >
                                <FolderOpen size={16} className="mr-2" /> Carga Masiva por Carpeta
                            </button>
                            <button
                                onClick={() => {
                                    setActaForm({
                                        seccional: "Madrid",
                                        ciudad: "",
                                        recinto: "",
                                        colegio: "",
                                        votos_fp: 0,
                                        votos_prm: 0,
                                        votos_pld: 0,
                                        votos_otros: 0,
                                        votos_nulos: 0
                                    });
                                    setEditingActa(null);
                                    setIsActaModalOpen(true);
                                    setSelectedFile(null);
                                }}
                                className="text-sm bg-[#00843D] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#137228] transition-colors flex items-center"
                            >
                                <Upload size={16} className="mr-2" /> Subir Acta
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Ubicación</th>
                                    <th className="px-4 py-4 font-bold text-center">FP</th>
                                    <th className="px-4 py-4 font-bold text-center">PRM</th>
                                    <th className="px-4 py-4 font-bold text-center">PLD</th>
                                    <th className="px-4 py-4 font-bold text-center">Otros</th>
                                    <th className="px-4 py-4 font-bold text-center">Nulos</th>
                                    <th className="px-6 py-4 font-bold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {actas.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                            No hay actas registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    actas.map(acta => (
                                        <tr key={acta.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm">
                                                <div className="font-bold text-gray-800">{acta.recinto}</div>
                                                <div className="text-[10px] text-gray-500 uppercase">{acta.seccional} - {acta.ciudad} - Colegio {acta.colegio}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-green-600">{acta.votos_fp}</td>
                                            <td className="px-4 py-4 text-center font-bold text-blue-600">{acta.votos_prm}</td>
                                            <td className="px-4 py-4 text-center font-bold text-purple-600">{acta.votos_pld}</td>
                                            <td className="px-4 py-4 text-center text-gray-600">{acta.votos_otros}</td>
                                            <td className="px-4 py-4 text-center text-red-500">{acta.votos_nulos}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <a
                                                        href={acta.archivo_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-gray-400 hover:text-[#00843D] transition-colors"
                                                        title="Ver PDF"
                                                    >
                                                        <Eye size={18} />
                                                    </a>
                                                    <button
                                                        onClick={() => {
                                                            setEditingActa(acta);
                                                            setActaForm({ ...acta });
                                                            setIsActaModalOpen(true);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                        title="Editar Datos"
                                                    >
                                                        <Settings size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteActa(acta.id, acta.archivo_url)}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "elections" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Management Header */}
                    <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold text-[#005c2b] flex items-center">
                            <Trophy className="mr-2 text-yellow-600" /> Control de Elecciones
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setVoterForm({ cedula: "", fecha_nacimiento: "", email: "", nombre: "" });
                                    setIsVoterModalOpen(true);
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center"
                            >
                                <UserPlus size={16} className="mr-2" /> Padrón
                            </button>
                            <button
                                onClick={() => {
                                    setCargoForm({ titulo: "", seccional: "Europa" });
                                    setEditingCargo(null);
                                    setIsCargoModalOpen(true);
                                }}
                                className="bg-[#00843D] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#137228] transition-colors flex items-center"
                            >
                                <PlusCircle size={16} className="mr-2" /> Nuevo Cargo
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Cargos y Candidatos */}
                        <div className="space-y-6">
                            <h3 className="font-bold text-gray-700 uppercase text-xs tracking-widest px-2">Cargos en Disputa</h3>
                            {cargos.length === 0 ? (
                                <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center text-gray-400">
                                    <ShieldCheck size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>No hay cargos configurados</p>
                                </div>
                            ) : (
                                cargos.map(cargo => (
                                    <div key={cargo.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-l-4" style={{ borderLeftColor: cargo.estado === 'active' ? '#00843D' : '#e5e7eb' }}>
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-lg text-gray-800 uppercase italic">{cargo.titulo}</h4>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${cargo.estado === 'active' ? 'bg-green-100 text-green-700' : cargo.estado === 'closed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                                            {cargo.estado === 'active' ? 'Mesa Abierta' : cargo.estado === 'closed' ? 'Mesa Cerrada' : 'Pendiente'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 font-bold">Total Votos: {cargo.elecciones_candidatos?.reduce((acc: number, curr: any) => acc + (curr.votos_count || 0), 0) || 0}</p>
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <button
                                                        onClick={() => toggleCargoStatus(cargo.id, cargo.estado)}
                                                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${cargo.estado === 'pending' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                                            cargo.estado === 'active' ? 'bg-red-600 text-white hover:bg-red-700' :
                                                                'bg-gray-100 text-gray-400'
                                                            }`}
                                                    >
                                                        {cargo.estado === 'pending' ? <><Play size={12} /> ABRIR MESA</> :
                                                            cargo.estado === 'active' ? <><Lock size={12} /> CERRAR MESA</> :
                                                                'MESA CERRADA'}
                                                    </button>
                                                    <button onClick={() => toggleResultsVisibility(cargo.id, cargo.resultados_visibles)} className={`p-2 transition-colors ${cargo.resultados_visibles ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`} title="Visibilidad Resultados">
                                                        {cargo.resultados_visibles ? <Eye size={18} /> : <EyeOff size={18} />}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingCargo(cargo);
                                                            setCargoForm({ titulo: cargo.titulo, seccional: cargo.seccional || "Europa" });
                                                            setIsCargoModalOpen(true);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                        title="Editar Cargo"
                                                    >
                                                        <Settings size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setFilterSeccional(cargo.seccional || "Todas")}
                                                        className={`p-2 transition-colors ${filterSeccional === (cargo.seccional || "Todas") ? 'text-green-600 bg-green-100 rounded-lg' : 'text-gray-400 hover:text-green-600'}`}
                                                        title={`Ver Padrón de ${cargo.seccional || "Europa"}`}
                                                    >
                                                        <Users size={18} />
                                                    </button>
                                                    <button onClick={() => handleDeleteCargo(cargo.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Candidates List */}
                                            <div className="space-y-2 mt-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Candidatos</p>
                                                    <button
                                                        onClick={() => {
                                                            setCandidatoForm({ nombre: "", cargo_id: cargo.id });
                                                            setIsCandidatoModalOpen(true);
                                                        }}
                                                        className="text-[10px] font-bold text-[#00843D] hover:underline"
                                                    >
                                                        + AGREGAR
                                                    </button>
                                                </div>
                                                {cargo.elecciones_candidatos?.length === 0 ? (
                                                    <p className="text-xs text-gray-300 italic text-center py-2">Sin candidatos registrados</p>
                                                ) : (
                                                    cargo.elecciones_candidatos?.map((cand: any) => (
                                                        <div key={cand.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-[#00843D] text-xs">
                                                                    {cand.nombre.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-700 uppercase tracking-tight">{cand.nombre}</p>
                                                                    <p className="text-[10px] text-[#00843D] font-bold">{cand.votos_count || 0} Votos</p>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => handleDeleteCandidato(cand.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all">
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Padrón Electoral */}
                        <div className="space-y-6">
                            <h3 className="font-bold text-gray-700 uppercase text-xs tracking-widest px-2">Padrón de Votantes ({padron.length})</h3>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-[600px] flex flex-col">
                                <div className="p-4 border-b border-gray-50 flex gap-2">
                                    <div className="flex-1 flex gap-2">
                                        <select
                                            value={filterSeccional}
                                            onChange={(e) => setFilterSeccional(e.target.value)}
                                            className="text-xs p-2 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#00843D] bg-gray-50 font-bold text-gray-700 w-1/3"
                                        >
                                            <option value="Todas">Todas las Seccionales</option>
                                            <option value="Madrid">Madrid</option>
                                            <option value="Barcelona">Barcelona</option>
                                            <option value="Milano">Milano</option>
                                            <option value="Zurich">Zurich</option>
                                            <option value="Holanda">Holanda</option>
                                            <option value="Valencia">Valencia</option>
                                            <option value="Sevilla">Sevilla</option>
                                            <option value="Bilbao">Bilbao</option>
                                            <option value="Zaragoza">Zaragoza</option>
                                        </select>
                                        <input type="text" placeholder="Buscar por cédula..." className="flex-1 text-xs p-2 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#00843D]" />
                                    </div>
                                    <button className="bg-gray-50 p-2 rounded-lg text-gray-400"><Search size={16} /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {padron.filter(v => filterSeccional === "Todas" || v.seccional === filterSeccional).length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                            <UserCheck size={32} className="opacity-10 mb-2" />
                                            <p className="text-sm">No hay votantes en esta seccional</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left">
                                            <thead className="sticky top-0 bg-white border-b border-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Cédula</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Nombre</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Seccional</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {padron
                                                    .filter(v => filterSeccional === "Todas" || v.seccional === filterSeccional)
                                                    .map(v => (
                                                        <tr key={v.id} className="hover:bg-gray-50 text-xs">
                                                            <td className="px-4 py-3 font-mono font-bold text-gray-600">{v.cedula}</td>
                                                            <td className="px-4 py-3 text-gray-500 font-medium truncate max-w-[120px]">{v.nombre}</td>
                                                            <td className="px-4 py-3 text-gray-400">{v.seccional}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <button onClick={() => handleDeleteVoter(v.id)} className="p-1 text-gray-300 hover:text-red-500">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-[#137228] px-6 py-4 flex justify-between items-center">
                            <h2 className="text-white text-xl font-bold">Subir Documento</h2>
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-white/80 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="px-6 pt-4">
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setUploadMode("file")}
                                    className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${uploadMode === "file" ? "bg-white text-[#137228] shadow-sm" : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    Archivo Local
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadMode("link")}
                                    className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${uploadMode === "link" ? "bg-white text-[#137228] shadow-sm" : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    Enlace Externo
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleUpload} className="p-6 space-y-4">
                            {uploadMode === "file" ? (
                                <div>
                                    <label className="block text-sm font-bold text-[#005c2b] mb-2">Archivo</label>
                                    <input
                                        type="file"
                                        required={uploadMode === "file"}
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00843D]"
                                        accept=".pdf,.doc,.docx,.xlsx,.xls,.zip"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX, XLSX, ZIP (máx. 50MB - Plan Free)</p>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-[#005c2b] mb-2">Nombre del Documento</label>
                                        <input
                                            type="text"
                                            required={uploadMode === "link"}
                                            value={externalName}
                                            onChange={(e) => setExternalName(e.target.value)}
                                            placeholder="Ej: Ley 20-23 Régimen Electoral"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00843D]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#005c2b] mb-2">URL del Documento</label>
                                        <input
                                            type="url"
                                            required={uploadMode === "link"}
                                            value={externalUrl}
                                            onChange={(e) => setExternalUrl(e.target.value)}
                                            placeholder="https://google.drive..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00843D]"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Enlace directo a Google Drive, Dropbox, etc.</p>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-[#005c2b] mb-2">Categoría</label>
                                <select
                                    value={categoria}
                                    onChange={(e) => setCategoria(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00843D] bg-white text-[#005c2b]"
                                >
                                    <option>Manuales</option>
                                    <option>Actas Históricas</option>
                                    <option>Línea Gráfica</option>
                                    <option>Padrones</option>
                                    <option>Estatutos</option>
                                    <option>Otros</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || (uploadMode === "file" ? !selectedFile : (!externalUrl || !externalName))}
                                className="w-full bg-[#00843D] text-white py-3 rounded-xl font-bold hover:bg-[#137228] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {uploading ? "Procesando..." : <>
                                    {uploadMode === "file" ? <Upload size={18} className="mr-2" /> : <LinkIcon size={18} className="mr-2" />}
                                    {uploadMode === "file" ? "Subir Documento" : "Guardar Enlace"}
                                </>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Acta Modal */}
            {isActaModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#137228] px-6 py-4 flex justify-between items-center">
                            <h2 className="text-white text-xl font-bold font-mono tracking-tighter">
                                {editingActa ? "EDITAR RESULTADOS ACTA" : "SUBIR ACTA DE ESCRUTINIO"}
                            </h2>
                            <button onClick={() => {
                                setIsActaModalOpen(false);
                                setEditingActa(null);
                                setFilePreview(null);
                                setSelectedFile(null);
                            }} className="text-white/80 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleActaSubmit} noValidate className="p-0 flex flex-col max-h-[85vh]">
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar">
                                {/* Sección de Ubicación */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                        <div className="bg-green-100 text-[#137228] p-1.5 rounded-lg">
                                            <LayoutDashboard size={16} />
                                        </div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Ubicación del Colegio</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Seccional</label>
                                            <select
                                                value={actaForm.seccional}
                                                onChange={(e) => setActaForm({ ...actaForm, seccional: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#137228] outline-none text-gray-900 font-bold transition-all"
                                            >
                                                <option value="Madrid">Madrid</option>
                                                <option value="Barcelona">Barcelona</option>
                                                <option value="Milano">Milano</option>
                                                <option value="Zurich">Zurich</option>
                                                <option value="Holanda">Holanda</option>
                                                <option value="Valencia">Valencia</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Ciudad / Municipio</label>
                                            <input
                                                type="text"
                                                required
                                                list="ciudades-list"
                                                value={actaForm.ciudad}
                                                onChange={(e) => setActaForm({ ...actaForm, ciudad: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#137228] outline-none text-gray-900 font-bold transition-all"
                                                placeholder="Ej: Madrid Centro"
                                            />
                                            <datalist id="ciudades-list">
                                                {existingCiudades.map(c => <option key={c} value={c} />)}
                                            </datalist>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Recinto Electoral</label>
                                            <input
                                                type="text"
                                                required
                                                list="recintos-list"
                                                value={actaForm.recinto}
                                                onChange={(e) => setActaForm({ ...actaForm, recinto: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#137228] outline-none text-gray-900 font-bold transition-all"
                                                placeholder="Nombre del recinto"
                                            />
                                            <datalist id="recintos-list">
                                                {existingRecintos.map(r => <option key={r} value={r} />)}
                                            </datalist>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Número de Colegio</label>
                                            <input
                                                type="text"
                                                required
                                                list="colegios-list"
                                                value={actaForm.colegio}
                                                onChange={(e) => setActaForm({ ...actaForm, colegio: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#137228] outline-none text-gray-900 font-bold tracking-widest transition-all"
                                                placeholder="0001A"
                                            />
                                            <datalist id="colegios-list">
                                                {existingColegios.map(col => <option key={col} value={col} />)}
                                            </datalist>
                                        </div>
                                    </div>
                                </div>

                                {/* Resultados por Partido */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                        <div className="bg-yellow-100 text-yellow-700 p-1.5 rounded-lg">
                                            <BarChart3 size={16} />
                                        </div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Resultados del Escrutinio</h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {/* FP Card */}
                                        <div className="bg-[#137228]/5 border-2 border-[#137228]/20 p-3 rounded-2xl flex flex-col items-center transition-all hover:border-[#137228]">
                                            <span className="text-[10px] font-black text-[#137228] uppercase mb-2">FP</span>
                                            <input
                                                type="number"
                                                className="w-full text-center bg-white rounded-lg border-none py-2 text-xl font-black text-[#137228] focus:ring-2 focus:ring-[#137228] shadow-sm"
                                                value={actaForm.votos_fp}
                                                onChange={(e) => setActaForm({ ...actaForm, votos_fp: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        {/* PRM Card */}
                                        <div className="bg-blue-50 border-2 border-blue-200 p-3 rounded-2xl flex flex-col items-center transition-all hover:border-blue-400">
                                            <span className="text-[10px] font-black text-blue-700 uppercase mb-2">PRM</span>
                                            <input
                                                type="number"
                                                className="w-full text-center bg-white rounded-lg border-none py-2 text-xl font-black text-blue-700 focus:ring-2 focus:ring-blue-500 shadow-sm"
                                                value={actaForm.votos_prm}
                                                onChange={(e) => setActaForm({ ...actaForm, votos_prm: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        {/* PLD Card */}
                                        <div className="bg-purple-50 border-2 border-purple-200 p-3 rounded-2xl flex flex-col items-center transition-all hover:border-purple-400">
                                            <span className="text-[10px] font-black text-purple-700 uppercase mb-2">PLD</span>
                                            <input
                                                type="number"
                                                className="w-full text-center bg-white rounded-lg border-none py-2 text-xl font-black text-purple-700 focus:ring-2 focus:ring-purple-500 shadow-sm"
                                                value={actaForm.votos_pld}
                                                onChange={(e) => setActaForm({ ...actaForm, votos_pld: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        {/* Otros Card */}
                                        <div className="bg-gray-50 border-2 border-gray-200 p-3 rounded-2xl flex flex-col items-center transition-all hover:border-gray-400">
                                            <span className="text-[10px] font-black text-gray-500 uppercase mb-2">Otros</span>
                                            <input
                                                type="number"
                                                className="w-full text-center bg-white rounded-lg border-none py-2 text-xl font-black text-gray-600 focus:ring-2 focus:ring-gray-400 shadow-sm"
                                                value={actaForm.votos_otros}
                                                onChange={(e) => setActaForm({ ...actaForm, votos_otros: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        {/* Nulos Card */}
                                        <div className="bg-red-50 border-2 border-red-200 p-3 rounded-2xl flex flex-col items-center transition-all hover:border-red-400">
                                            <span className="text-[10px] font-black text-red-700 uppercase mb-2">Nulos</span>
                                            <input
                                                type="number"
                                                className="w-full text-center bg-white rounded-lg border-none py-2 text-xl font-black text-red-700 focus:ring-2 focus:ring-red-500 shadow-sm"
                                                value={actaForm.votos_nulos}
                                                onChange={(e) => setActaForm({ ...actaForm, votos_nulos: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Drag & Drop Acta Image */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                        <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                                            <ImageIcon size={16} />
                                        </div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Imagen del Acta Original</h3>
                                    </div>

                                    <div
                                        className={`relative border-2 border-dashed rounded-3xl p-8 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden ${dragActive ? 'border-[#137228] bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                                            }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => document.getElementById('acta-file')?.click()}
                                    >
                                        <input
                                            id="acta-file"
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                                            accept=".pdf,image/*"
                                        />

                                        {filePreview ? (
                                            <div className="relative group animate-in zoom-in-95">
                                                <img src={filePreview} alt="Acta Preview" className="max-h-48 rounded-xl shadow-lg border border-gray-200 transition-transform group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                                    <span className="text-white text-xs font-bold uppercase tracking-widest">Cambiar Imagen</span>
                                                </div>
                                            </div>
                                        ) : selectedFile?.name.toLowerCase().endsWith('.pdf') ? (
                                            <div className="text-center animate-in zoom-in-95">
                                                <div className="bg-red-100 text-red-600 p-6 rounded-3xl mb-4 inline-block shadow-md">
                                                    <FileSearch size={48} />
                                                </div>
                                                <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">{selectedFile.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Archivo PDF Detectado</p>
                                                <p className="text-[10px] text-[#137228] font-bold uppercase mt-2 animate-pulse bg-green-50 px-2 py-1 rounded-full">
                                                    Analizando datos...
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 mx-auto text-gray-400 group-hover:text-[#137228] transition-colors">
                                                    <Upload size={32} />
                                                </div>
                                                <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">Arrastra el acta o haz clic aquí</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Soporta JPG, PNG y PDF</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
                                <button
                                    type="submit"
                                    disabled={uploading || !selectedFile}
                                    className="w-full bg-[#00843D] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#137228] transition-all disabled:opacity-50 flex items-center justify-center shadow-xl shadow-green-900/20 active:scale-[0.98]"
                                >
                                    {uploading ? (
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="animate-spin" size={20} />
                                            <span>Sincronizando con Supabase...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={20} className="mr-2" />
                                            Finalizar y Guardar Acta
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Statute Modal */}
            {isStatuteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="bg-[#137228] px-6 py-4 flex justify-between items-center">
                            <h2 className="text-white text-xl font-bold">
                                {editingStatute ? "Editar Artículo" : "Nuevo Artículo"}
                            </h2>
                            <button onClick={() => setIsStatuteModalOpen(false)} className="text-white/80 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleStatuteSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#005c2b] mb-2">Artículo (ej: ART. 01)</label>
                                    <input
                                        type="text"
                                        required
                                        value={statuteForm.articulo}
                                        onChange={(e) => setStatuteForm({ ...statuteForm, articulo: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00843D]"
                                        placeholder="ART. 001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#005c2b] mb-2">Título</label>
                                    <input
                                        type="text"
                                        required
                                        value={statuteForm.titulo}
                                        onChange={(e) => setStatuteForm({ ...statuteForm, titulo: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00843D]"
                                        placeholder="Nombre del artículo"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#005c2b] mb-2">Contenido</label>
                                <textarea
                                    required
                                    rows={8}
                                    value={statuteForm.contenido}
                                    onChange={(e) => setStatuteForm({ ...statuteForm, contenido: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00843D] text-sm"
                                    placeholder="Escribe el contenido del artículo aquí..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsStatuteModalOpen(false)}
                                    className="px-6 py-2 text-gray-500 font-medium hover:text-gray-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-[#00843D] text-white px-8 py-2 rounded-xl font-bold hover:bg-[#137228] transition-colors"
                                >
                                    {editingStatute ? "Guardar Cambios" : "Agregar Artículo"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* User Modal */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#137228] px-6 py-4 flex justify-between items-center">
                            <h2 className="text-white text-xl font-bold">
                                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                            </h2>
                            <button onClick={() => setIsUserModalOpen(false)} className="text-white/80 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[#005c2b] mb-2">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={userForm.nombre}
                                    onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00843D]"
                                    placeholder="Juan Pérez"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#005c2b] mb-2">Cédula</label>
                                <input
                                    type="text"
                                    required
                                    value={userForm.cedula}
                                    onChange={(e) => setUserForm({ ...userForm, cedula: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00843D]"
                                    placeholder="001-0000000-0"
                                />
                            </div>

                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-bold text-[#005c2b] mb-2">Contraseña Inicial</label>
                                    <input
                                        type="text"
                                        required
                                        value={userForm.password}
                                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00843D]"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">El usuario podrá cambiarla después.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#005c2b] mb-2">Rol</label>
                                    <select
                                        value={userForm.rol}
                                        onChange={(e) => setUserForm({ ...userForm, rol: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00843D] bg-white"
                                    >
                                        <option value="operador">Operador</option>
                                        <option value="administrador">Administrador</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#005c2b] mb-2">Seccional</label>
                                    <select
                                        disabled={userForm.rol === 'administrador'}
                                        value={userForm.seccional}
                                        onChange={(e) => setUserForm({ ...userForm, seccional: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00843D] bg-white disabled:bg-gray-50"
                                    >
                                        <option value="Madrid">Madrid</option>
                                        <option value="Barcelona">Barcelona</option>
                                        <option value="Milano">Milano</option>
                                        <option value="Zurich">Zurich</option>
                                        <option value="Holanda">Holanda</option>
                                        <option value="Valencia">Valencia</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#00843D] text-white py-3 rounded-xl font-bold hover:bg-[#137228] transition-colors flex items-center justify-center mt-6"
                            >
                                {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Reset Password Modal */}
            {resettingUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-orange-500 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-white text-lg font-bold flex items-center">
                                <KeyRound size={20} className="mr-2" /> Resetear Clave
                            </h2>
                            <button onClick={() => setResettingUser(null)} className="text-white/80 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">
                                Estás reseteando la contraseña de <span className="font-bold text-gray-800">{resettingUser.nombre}</span>.
                            </p>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nueva Contraseña</label>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setResettingUser(null)}
                                    className="flex-1 px-4 py-2 text-gray-500 font-medium hover:text-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmResetPassword}
                                    className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md active:scale-95"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Election Modals */}
            {isCargoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#137228] px-6 py-4 flex justify-between items-center">
                            <h2 className="text-white text-lg font-bold">
                                {editingCargo ? "Editar Cargo" : "Nuevo Cargo Electoral"}
                            </h2>
                            <button onClick={() => setIsCargoModalOpen(false)} className="text-white/80 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCargoSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Título del Cargo</label>
                                <input
                                    type="text"
                                    required
                                    value={cargoForm.titulo}
                                    onChange={(e) => setCargoForm({ ...cargoForm, titulo: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00843D] outline-none"
                                    placeholder="Ej: Presidente Seccional"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Circunscripción / Seccional</label>
                                <select
                                    value={cargoForm.seccional}
                                    onChange={(e) => setCargoForm({ ...cargoForm, seccional: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00843D] outline-none bg-white"
                                >
                                    <option value="Europa">Toda Europa (General)</option>
                                    <optgroup label="Seccionales Específicas">
                                        <option value="Madrid">Madrid</option>
                                        <option value="Barcelona">Barcelona</option>
                                        <option value="Milano">Milano</option>
                                        <option value="Zurich">Zurich</option>
                                        <option value="Holanda">Holanda</option>
                                        <option value="Valencia">Valencia</option>
                                        <option value="Sevilla">Sevilla</option>
                                        <option value="Bilbao">Bilbao</option>
                                        <option value="Zaragoza">Zaragoza</option>
                                    </optgroup>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-[#00843D] text-white py-3 rounded-xl font-bold hover:bg-[#137228] transition-colors">
                                {editingCargo ? "Guardar Cambios" : "Crear Cargo"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isCandidatoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-white text-lg font-bold">Agregar Candidato</h2>
                            <button onClick={() => setIsCandidatoModalOpen(false)} className="text-white/80 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCandidatoSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={candidatoForm.nombre}
                                    onChange={(e) => setCandidatoForm({ ...candidatoForm, nombre: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                                Guardar Candidato
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isVoterModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#f1f5f9] px-6 py-4 flex justify-between items-center border-b border-gray-200">
                            <h2 className="text-slate-800 text-lg font-bold font-mono">AGREGAR AL PADRÓN</h2>
                            <button onClick={() => setIsVoterModalOpen(false)} className="text-slate-500 hover:text-slate-800">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleVoterSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Número de Cédula</label>
                                <input
                                    type="text"
                                    required
                                    value={voterForm.cedula}
                                    onChange={(e) => setVoterForm({ ...voterForm, cedula: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cbd5e1] outline-none"
                                    placeholder="000-0000000-0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={voterForm.nombre}
                                    onChange={(e) => setVoterForm({ ...voterForm, nombre: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cbd5e1] outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Fecha Nacimiento</label>
                                    <input
                                        type="date"
                                        required
                                        value={voterForm.fecha_nacimiento}
                                        onChange={(e) => setVoterForm({ ...voterForm, fecha_nacimiento: e.target.value })}
                                        className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cbd5e1] outline-none text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email (OTP)</label>
                                    <input
                                        type="email"
                                        required
                                        value={voterForm.email}
                                        onChange={(e) => setVoterForm({ ...voterForm, email: e.target.value })}
                                        className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cbd5e1] outline-none text-xs"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-[#f1f5f9] text-slate-800 border border-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors uppercase tracking-widest text-xs mt-4 shadow-sm">
                                Autorizar Votante
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Upload Modal */}
            {isBulkUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#f1f5f9] px-6 py-4 flex justify-between items-center border-b border-gray-200">
                            <h2 className="text-slate-800 text-lg font-bold flex items-center">
                                <FolderOpen size={24} className="mr-2" /> Carga Masiva por Carpeta
                            </h2>
                            <button
                                onClick={() => {
                                    if (!processingBulk) {
                                        setIsBulkUploadModalOpen(false);
                                        setBulkUploadProgress({ total: 0, processed: 0, successful: 0, failed: 0 });
                                        setBulkUploadResults([]);
                                    }
                                }}
                                className="text-slate-500 hover:text-slate-800 disabled:opacity-50"
                                disabled={processingBulk}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                            {/* Instructions */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <h3 className="font-bold text-blue-900 mb-2 flex items-center">
                                    <AlertTriangle size={18} className="mr-2" /> Estructura Requerida
                                </h3>
                                <p className="text-sm text-blue-800 mb-3">
                                    Organiza tus archivos en carpetas siguiendo esta jerarquía exacta:
                                </p>
                                <div className="bg-white rounded-lg p-3 font-mono text-xs text-gray-700 border border-blue-100">
                                    <div>📁 Carpeta Raíz/</div>
                                    <div className="ml-4">📁 Madrid/ <span className="text-gray-400">← Seccional</span></div>
                                    <div className="ml-8">📁 Madrid Centro/ <span className="text-gray-400">← Ciudad</span></div>
                                    <div className="ml-12">📁 Recinto 1/ <span className="text-gray-400">← Recinto</span></div>
                                    <div className="ml-16">📁 Colegio A/ <span className="text-gray-400">← Colegio</span></div>
                                    <div className="ml-20">📄 acta.pdf <span className="text-gray-400">← Archivo</span></div>
                                </div>
                                <div className="mt-3 text-xs text-blue-700">
                                    <strong>Seccionales válidas:</strong> Madrid, Barcelona, Milano, Zurich, Holanda, Valencia, Sevilla, Bilbao, Zaragoza
                                    <br />
                                    <strong>Nota:</strong> El sistema ahora detecta automáticamente la seccional en cualquier nivel de la ruta y es flexible con la estructura de subcarpetas.
                                    <br />
                                    <strong>Formatos permitidos:</strong> PDF, JPG, JPEG, PNG
                                </div>
                            </div>

                            {/* File Input */}
                            {!processingBulk && bulkUploadProgress.total === 0 && (
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
                                    <FolderOpen size={48} className="mx-auto text-purple-600 mb-4" />
                                    <label className="cursor-pointer">
                                        <span className="bg-[#f1f5f9] text-slate-800 border border-slate-300 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors inline-block">
                                            Seleccionar Carpeta
                                        </span>
                                        <input
                                            type="file"
                                            onChange={handleBulkFolderUpload}
                                            className="hidden"
                                            {...({ webkitdirectory: "", directory: "" } as any)}
                                            multiple
                                        />
                                    </label>
                                    <p className="text-sm text-gray-500 mt-3">
                                        Haz clic para seleccionar la carpeta raíz con las actas organizadas
                                    </p>
                                </div>
                            )}

                            {/* Progress Bar */}
                            {bulkUploadProgress.total > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold text-gray-700">
                                            Progreso: {bulkUploadProgress.processed} / {bulkUploadProgress.total}
                                        </span>
                                        <div className="flex gap-4">
                                            <span className="text-green-600 font-bold flex items-center">
                                                <CheckCircle2 size={16} className="mr-1" /> {bulkUploadProgress.successful} exitosos
                                            </span>
                                            {bulkUploadProgress.failed > 0 && (
                                                <span className="text-red-600 font-bold flex items-center">
                                                    <AlertTriangle size={16} className="mr-1" /> {bulkUploadProgress.failed} fallidos
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-slate-400 h-full transition-all duration-300 flex items-center justify-end pr-2"
                                            style={{ width: `${(bulkUploadProgress.processed / bulkUploadProgress.total) * 100}%` }}
                                        >
                                            {processingBulk && (
                                                <Loader2 size={12} className="text-white animate-spin" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Results Table */}
                            {bulkUploadResults.length > 0 && (
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2 font-bold text-sm text-gray-700 border-b border-gray-200">
                                        Resultados de Carga ({bulkUploadResults.length})
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {bulkUploadResults.map((result, idx) => (
                                            <div
                                                key={idx}
                                                className={`px-4 py-3 border-b border-gray-100 ${result.status === 'success' ? 'bg-green-50/50' : 'bg-red-50/50'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {result.status === 'success' ? (
                                                        <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                                                    ) : (
                                                        <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-mono text-gray-600 truncate" title={result.file}>
                                                            {result.file}
                                                        </p>
                                                        <p className={`text-sm font-medium mt-1 ${result.status === 'success' ? 'text-green-700' : 'text-red-700'
                                                            }`}>
                                                            {result.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {!processingBulk && bulkUploadProgress.total > 0 && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setIsBulkUploadModalOpen(false);
                                            setBulkUploadProgress({ total: 0, processed: 0, successful: 0, failed: 0 });
                                            setBulkUploadResults([]);
                                        }}
                                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setBulkUploadProgress({ total: 0, processed: 0, successful: 0, failed: 0 });
                                            setBulkUploadResults([]);
                                        }}
                                        className="flex-1 bg-[#f1f5f9] text-slate-800 border border-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center"
                                    >
                                        <RefreshCw size={18} className="mr-2" /> Cargar Otra Carpeta
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { signToken } from '@/lib/token';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { cedula, password } = await request.json();

        if (!cedula) {
            return NextResponse.json({ error: 'Cédula requerida' }, { status: 400 });
        }

        const cleanCedula = cedula.replace(/-/g, "").trim();
        // Formatear cédula para buscar en ambos formatos
        let formattedCedula = cleanCedula;
        if (cleanCedula.length === 11) {
            formattedCedula = `${cleanCedula.substring(0, 3)}-${cleanCedula.substring(3, 10)}-${cleanCedula.substring(10)}`;
        }

        // 1. Buscar usuario en tabla 'usuarios' (Admin/Operadores)
        const { data: userData, error: userError } = await supabaseAdmin
            .from('usuarios')
            .select('*')
            .or(`cedula.eq."${cleanCedula}",cedula.eq."${formattedCedula}"`)
            .maybeSingle();

        if (userError) {
            console.error("Error DB (usuarios):", userError);
            return NextResponse.json({ error: 'Error interno de base de datos' }, { status: 500 });
        }

        let authenticatedUser = null;
        let requiresPasswordChange = false;

        // 1. Verificar si es Usuario (Admin/Operador)
        if (userData) {
            let isValid = false;

            if (userData.password_hash) {
                // Si ya tiene hash, verificar con bcrypt
                isValid = await bcrypt.compare(password, userData.password_hash);
            } else if (userData.password === password) {
                // Migración transparente: si la clave en texto plano coincide, generamos el hash y lo guardamos
                isValid = true;
                const newHash = await bcrypt.hash(password, 10);
                // Si es el primer login tras la migración, le obligamos a cambiarla por seguridad (opcional)
                requiresPasswordChange = true;

                await supabaseAdmin
                    .from('usuarios')
                    .update({
                        password_hash: newHash,
                        must_change_password: true
                    })
                    .eq('id', userData.id);
            }

            if (isValid) {
                authenticatedUser = {
                    id: userData.id,
                    cedula: userData.cedula,
                    nombre: userData.nombre,
                    rol: userData.rol,
                    seccional: userData.seccional,
                    activo: userData.activo
                };
                if (userData.must_change_password !== undefined) {
                    requiresPasswordChange = userData.must_change_password || requiresPasswordChange;
                }
            }
        }

        // 2. Si no es usuario, buscar en 'afiliados'
        if (!authenticatedUser) {
            const { data: affiliateData, error: affError } = await supabaseAdmin
                .from('afiliados')
                .select('*')
                .or(`cedula.eq."${cleanCedula}",cedula.eq."${formattedCedula}"`)
                .maybeSingle();

            if (affError) {
                console.error("Error DB (afiliados):", affError);
            }

            if (affiliateData) {
                let isValid = false;

                if (affiliateData.password_hash) {
                    // Verificación segura con bcrypt
                    isValid = await bcrypt.compare(password, affiliateData.password_hash);
                } else {
                    // Lógica heredada: últimos 6 dígitos de la cédula
                    const dbCedulaClean = affiliateData.cedula.replace(/-/g, "").trim();
                    const expectedPassword = dbCedulaClean.substring(Math.max(0, dbCedulaClean.length - 6));

                    if (password === expectedPassword) {
                        isValid = true;
                        // Migración transparente: generar hash del password genérico
                        const newHash = await bcrypt.hash(password, 10);

                        await supabaseAdmin
                            .from('afiliados')
                            .update({
                                password_hash: newHash,
                                must_change_password: true
                            })
                            .eq('id', affiliateData.id);

                        requiresPasswordChange = true;
                    }
                }

                if (isValid) {
                    authenticatedUser = {
                        id: affiliateData.id,
                        cedula: affiliateData.cedula,
                        nombre: `${affiliateData.nombre} ${affiliateData.apellidos}`,
                        rol: 'afiliado', // Rol por defecto
                        seccional: affiliateData.seccional,
                        activo: true
                    };
                    // Si ya tenía el flag en BD, respetarlo
                    if (affiliateData.must_change_password !== undefined && affiliateData.password_hash) {
                        requiresPasswordChange = affiliateData.must_change_password;
                    }
                }
            }
        }

        if (!authenticatedUser) {
            return NextResponse.json({ error: 'Cédula o contraseña incorrecta' }, { status: 401 });
        }

        // 4. Crear respuesta (sin cookie si requiere cambio forzado de password)
        if (requiresPasswordChange) {
            return NextResponse.json({
                success: true,
                requirePasswordChange: true,
                tempUserId: authenticatedUser.id,
                tempUserRole: authenticatedUser.rol // Para saber en qué tabla actualizar
            });
        }

        // Si NO requiere cambio, procedemos a dar el token JWT real
        const token = await signToken(authenticatedUser);

        const response = NextResponse.json({
            success: true,
            user: authenticatedUser
        });

        // Configurar cookie segura (No accesible por JS del cliente)
        response.cookies.set({
            name: 'auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/', // Disponible en toda la app
            maxAge: 60 * 60 * 24 // 24 horas
        });

        return response;

    } catch (error: any) {
        console.error("Login Server Error:", error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

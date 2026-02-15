import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // Usamos admin para verificar credenciales de forma segura
import { signToken } from '@/lib/token';

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

        // Verificar contraseña de Usuario Admin/Operador
        // NOTA: Idealmente las contraseñas deberían estar hasheadas.
        // Como paso temporal, verificamos texto plano según lógica actual.
        if (userData && userData.password === password) {
            authenticatedUser = {
                id: userData.id,
                cedula: userData.cedula,
                nombre: userData.nombre,
                rol: userData.rol,
                seccional: userData.seccional,
                activo: userData.activo // Include active status
            };
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
                // Lógica de contraseña para afiliado: últimos 6 dígitos de la cédula
                const dbCedulaClean = affiliateData.cedula.replace(/-/g, "").trim();
                const expectedPassword = dbCedulaClean.substring(Math.max(0, dbCedulaClean.length - 6));

                if (password === expectedPassword) {
                    authenticatedUser = {
                        id: affiliateData.id,
                        cedula: affiliateData.cedula,
                        nombre: `${affiliateData.nombre} ${affiliateData.apellidos}`,
                        rol: 'afiliado', // Rol por defecto

                        seccional: affiliateData.seccional,
                        activo: true // Affiliates are active by default if they can login
                    };
                }
            }
        }

        if (!authenticatedUser) {
            return NextResponse.json({ error: 'Cédula o contraseña incorrecta' }, { status: 401 });
        }

        // 3. Generar Token Seguro (JWT)
        const token = await signToken(authenticatedUser);

        // 4. Crear respuesta con Cookie HTTP-Only
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

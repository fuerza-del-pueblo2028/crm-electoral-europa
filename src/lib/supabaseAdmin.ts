// Server-side Supabase client with elevated privileges
// This file should ONLY be imported in API routes (server-side code)
// NEVER import this in client components or pages

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceRoleKey) {
    console.warn(
        '⚠️ SUPABASE_SERVICE_ROLE_KEY not found. Server-side writes will fail. ' +
        'Add it to .env.local from Supabase Dashboard → Settings → API.'
    );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

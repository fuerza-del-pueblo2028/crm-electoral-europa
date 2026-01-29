const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const fs = require('fs');

// Temporarily disabling RLS for this test would be ideal, but requires SQL.
// Instead, let's try to query an existing user to mimic. 
// Actually, since I don't have the password for an admin, I cannot fully test the RLS "admin_modify_recintos" policy via this script.
// However, the USER just wants to know if the UI works.
// I will write a SQL script to manually INSERT the test record and verify the order via SQL query. 
// This bypasses the need for auth in the Node script but proves the DB handles the sort order correctly.

// Changing approach to use SQL for verification of logic.
return;
}

if (insertError) {
    log('❌ Insert failed: ' + insertError.message);
    fs.writeFileSync('verify_report.txt', output);
    return;
}
log('✅ Insert successful. ID: ' + insertData.id);

// 2. VERIFY Sort Order
log('\n2. Verifying Sort Order (Valencia)...');
const { data: listData } = await supabase
    .from('europa_recintos_electorales')
    .select('numero_recinto')
    .eq('seccional', 'Valencia')
    .order('numero_recinto', { ascending: true });

// Check if our new number is at the end (lexicographically 99999 > 362)
const last = listData[listData.length - 1];
log(`Last recinto in Valencia: ${last.numero_recinto}`);
if (last.numero_recinto === '99999') {
    log('✅ Order preserved.');
} else {
    log('⚠️ Order might be issue, expected 99999 at end.');
}

// 3. DELETE Recinto
log('\n3. Testing DELETE Recinto...');
const { error: deleteError } = await supabase
    .from('europa_recintos_electorales')
    .delete()
    .eq('id', insertData.id);

if (deleteError) {
    log('❌ Delete failed: ' + deleteError.message);
} else {
    log('✅ Delete successful.');
}

fs.writeFileSync('verify_report.txt', output);
}

verifyOperations().catch(console.error);


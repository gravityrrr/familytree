import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  console.log('Profiles:', profiles, pErr);

  const { data: trees, error: tErr } = await supabase.from('trees').select('*');
  console.log('Trees:', trees, tErr);
}
main();

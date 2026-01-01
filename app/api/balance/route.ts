
import { createClient } from '@/utils/supabase/server'; // Use the project's own helper
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Service Role Client (For reading profiles bypassing RLS)
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: any) {
    try {
        let user = null;

        // 1. Try Cookie Auth via @supabase/ssr helper
        try {
            const supabase = await createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                user = session.user;
            }
        } catch (err) {
            // Ignore cookie error, fall through
        }

        // 2. Fallback to Header Auth (if Cookie fail)
        if (!user) {
            const authHeader = req.headers.get('Authorization');
            if (authHeader) {
                const token = authHeader.replace('Bearer ', '');
                const { data: { user: headerUser } } = await supabaseAdmin.auth.getUser(token);
                user = headerUser;
            }
        }

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 3. Fetch Profile Balance using Service Role Key
        const { data: profile, error: dbError } = await supabaseAdmin
            .from('profiles')
            .select('balance')
            .eq('id', user.id)
            .single();

        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ balance: Number(profile.balance) });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

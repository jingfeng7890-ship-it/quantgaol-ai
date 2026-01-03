import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Anon key for public reads
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('governance_proposals')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Service role for writing votes (or use User JWT via RLS)
        // Ideally we use shared client to validate user auth properly
        // But for now let's fix the build error by initializing here.
        // ACTUALLY: The original code used `supabase.auth.getUser`. 
        // We should use `createClient` with the user's token or use Service Role but verify token manually. 
        // Original code: `await supabase.auth.getUser(...)`. This implies `supabase` was initialized with a key that allows verification. 
        // Anon key can verify tokens. Service role key can too.

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: { user } } = await supabase.auth.getUser(req.headers.get('Authorization')?.split(' ')[1] || '');
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { proposal_id, vote_type, power } = body;

        // Call RPC
        const { error } = await supabase.rpc('cast_governance_vote', {
            p_user_id: user.id,
            p_proposal_id: proposal_id,
            p_vote_type: vote_type,
            p_power: power
        });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

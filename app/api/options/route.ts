import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const createAdminClient = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
    try {
        const supabase = createAdminClient();
        const { data: { user } } = await supabase.auth.getUser(req.headers.get('Authorization')?.split(' ')[1] || '');

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data, error } = await supabase
            .from('black_swan_options')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient();
        const body = await req.json();
        const { data: { user } } = await supabase.auth.getUser(req.headers.get('Authorization')?.split(' ')[1] || '');

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Deduct premium from profile balance
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', user.id)
            .single();

        if (profileErr || profile.balance < body.premium) {
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
        }

        // Create Option
        const { data, error } = await supabase
            .from('black_swan_options')
            .insert({
                user_id: user.id,
                model_id: body.model_id,
                match_id: body.match_id,
                premium: body.premium,
                strike_confidence: body.strike_confidence,
                payout_multiplier: body.payout_multiplier || 2.0
            })
            .select()
            .single();

        if (error) throw error;

        // Deduct balance
        await supabase.rpc('increment_profile_balance', { usr_id: user.id, amt: -body.premium });

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

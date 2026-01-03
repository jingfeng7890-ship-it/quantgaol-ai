import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { guildId, amount } = await req.json();

        if (!guildId || !amount) {
            return NextResponse.json({ error: "Missing guildId or amount" }, { status: 400 });
        }

        // Call the join_guild RPC
        const { error } = await supabase.rpc('join_guild', {
            p_user_id: user.id,
            p_guild_id: guildId,
            p_amount: amount
        });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

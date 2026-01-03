import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: guilds, error } = await supabase
            .from('guilds')
            .select('*')
            .order('roi_7d', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ guilds });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

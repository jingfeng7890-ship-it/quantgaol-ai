import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Use Anon key for public access
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('ai_achievements')
            .select('*')
            .order('earned_at', { ascending: false });

        if (error) throw error;
        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error fetching achievements:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

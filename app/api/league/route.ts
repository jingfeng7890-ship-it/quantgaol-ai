import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use Service Role to ensure we can always get the leaderboard data
const createAdminClient = (url: string, key: string) => createClient(url, key);

export async function GET(req: NextRequest) {
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
        }

        const supabase = createAdminClient(url, key);

        // 1. Fetch Models Metadata
        const { data: models, error: modelsError } = await supabase
            .from('ai_models')
            .select('*');

        if (modelsError) throw modelsError;

        // 2. Fetch Latest Stats for each model
        // We want the most recent row per model
        const { data: allStats, error: statsError } = await supabase
            .from('ai_league_stats')
            .select('*')
            .order('date', { ascending: false });

        if (statsError) throw statsError;

        // 3. Fetch Latest News
        const { data: news, error: newsError } = await supabase
            .from('ai_league_news')
            .select('*')
            .order('date', { ascending: false })
            .limit(1)
            .single();

        // Reconstruct the JSON structure
        const formattedModels: any = {};

        models.forEach(model => {
            const modelStats = allStats?.filter(s => s.model_id === model.model_id) || [];
            const latest = modelStats[0] || { wallet_balance: 10000, roi: 0, core_pnl: 0, challenge_pnl: 0, high_yield_pnl: 0 };

            formattedModels[model.name] = {
                id: model.model_id,
                name: model.name,
                style: model.style,
                capability_radar: model.capability_radar,
                latest_wallets: {
                    core: 10000 + (modelStats.reduce((acc, s) => acc + Number(s.core_pnl), 0)),
                    challenge: 0 + (modelStats.reduce((acc, s) => acc + Number(s.challenge_pnl), 0)),
                    high_yield: 0 + (modelStats.reduce((acc, s) => acc + Number(s.high_yield_pnl), 0)),
                },
                stats: {
                    roi: latest.roi,
                    total_pnl: latest.wallet_balance - 10000,
                    win_rate: 0, // Placeholder
                    max_drawdown: 0, // Placeholder
                    sharpe_ratio: 0 // Placeholder
                },
                history: modelStats.map(s => ({
                    date: s.date,
                    bets_placed: s.bets_count,
                    core_pnl: s.core_pnl,
                    challenge_pnl: s.challenge_pnl,
                    high_yield_pnl: s.high_yield_pnl,
                    total_pnl: s.total_day_pnl,
                    wallet_balance: s.wallet_balance
                }))
            };
        });

        return NextResponse.json({
            models: formattedModels,
            news: news || null
        });

    } catch (error: any) {
        console.error("League API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

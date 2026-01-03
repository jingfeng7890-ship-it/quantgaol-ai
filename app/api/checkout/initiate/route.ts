import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const PACKAGES: Record<string, { credits: number, isSubscription: boolean }> = {
    'starter': { credits: 1000, isSubscription: false },
    'governor': { credits: 5000, isSubscription: false },
    'institutional': { credits: 15000, isSubscription: false },
    'subscription_pro': { credits: 2000, isSubscription: true },
};

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { packageId } = await req.json();
        const pkg = PACKAGES[packageId];

        if (!pkg) {
            return NextResponse.json({ error: "Invalid package" }, { status: 400 });
        }

        // SIMULATED TRANSACTION LOGIC
        // 1. Call the topup_user_credits RPC
        const { error: topupError } = await supabase.rpc('topup_user_credits', {
            p_user_id: user.id,
            p_amount: pkg.credits,
            p_type: pkg.isSubscription ? 'SUBSCRIPTION' : 'PURCHASE',
            p_desc: `Acquired ${packageId} package`,
            p_ref: `MOCK_TX_${Date.now()}`
        });

        if (topupError) throw topupError;

        // 2. If it's a subscription, update pro status
        if (pkg.isSubscription) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    is_pro: true,
                    pro_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                })
                .eq('id', user.id);

            if (profileError) throw profileError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

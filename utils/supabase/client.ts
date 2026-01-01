
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Safety Check for Build Time (or missing envs)
    if (!url || !key) {
        console.warn('Supabase URL or Key missing. Using Mock Client for Build.');
        // Return a dummy object that mimics the Supabase Client structure needed for initial render
        return {
            auth: {
                getSession: async () => ({ data: { session: null } }),
                onAuthStateChange: (callback: any) => ({ data: { subscription: { unsubscribe: () => { } } } }),
                signInWithOAuth: async () => ({ error: { message: 'Missing Envs' } }),
                signInWithPassword: async () => ({ error: { message: 'Missing Envs' } }),
                signUp: async () => ({ error: { message: 'Missing Envs' } }),
                signOut: async () => ({ error: null }),
            },
            from: () => ({
                select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
                insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) })
            })
        } as any;
    }

    return createBrowserClient(url, key);
}


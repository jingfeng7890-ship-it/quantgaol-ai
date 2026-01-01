'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '../utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isPro: boolean;
    loginWithGoogle: () => Promise<void>;
    loginWithApple: () => Promise<void>;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    registerWithEmail: (email: string, pass: string) => Promise<void>;
    loginWithDemo: () => void;
    logout: () => Promise<void>;
    upgradeToPro: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPro, setIsPro] = useState(false);
    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
            if (session?.user) {
                checkProStatus(session.user.id);
            }
        };

        fetchSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            if (!isDemo) {
                setUser(session?.user ?? null);
                if (session?.user) {
                    checkProStatus(session.user.id);
                } else {
                    setIsPro(false);
                }
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [isDemo]);

    const checkProStatus = async (userId: string) => {
        // Placeholder for pro status check
        // In the future, query 'profiles' or 'subscriptions' table
        setIsPro(false);
    };

    const loginWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: { prompt: 'select_account' },
            },
        });
        if (error) console.error('Google login error:', error);
    };

    const loginWithApple = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) console.error('Apple login error:', error);
    };

    const loginWithEmail = async (email: string, pass: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: pass
        });
        if (error) throw error;
        router.refresh();
    };

    const registerWithEmail = async (email: string, pass: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password: pass
        });
        if (error) throw error;
        router.refresh();
    };

    const loginWithDemo = () => {
        setIsDemo(true);
        setIsPro(true); // Demo gets Pro features
        const mockUser: any = {
            id: 'demo-user-001',
            email: 'demo@quantgoal.ai',
            user_metadata: { full_name: 'Demo Trader' },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
        };
        setUser(mockUser);
        router.push('/dashboard');
        router.refresh();
    };

    const logout = async () => {
        if (isDemo) {
            setIsDemo(false);
            setUser(null);
            setIsPro(false);
        } else {
            await supabase.auth.signOut();
            setUser(null);
            setIsPro(false);
        }
        router.push('/login');
        router.refresh();
    };

    const upgradeToPro = async () => {
        console.log('Upgrade to Pro requested');
    };

    return (
        <AuthContext.Provider value={{ user, loading, isPro, loginWithGoogle, loginWithApple, loginWithEmail, registerWithEmail, loginWithDemo, logout, upgradeToPro }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

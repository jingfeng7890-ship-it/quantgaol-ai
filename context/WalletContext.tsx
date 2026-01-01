'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';

const STORAGE_KEY = 'quantgoal_wallet_balance';
const TRANSACTIONS_KEY = 'quantgoal_wallet_txs';
const SETTLED_IDS_KEY = 'quantgoal_settled_ids';

interface Transaction {
    desc: string;
    amount: number;
    date: string;
}

interface WalletContextType {
    balance: number;
    transactions: Transaction[];
    spend: (amount: number, description: string) => boolean;
    earn: (amount: number, description: string) => void;
    reset: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
    const supabase = createClient();
    const [balance, setBalance] = useState(1000);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initial Load & Server Sync
    useEffect(() => {
        const syncWallet = async () => {
            // Dual Strategy: Cookie First, then Header Fallback
            let serverBalance = null;

            // Strategy A: Cookie Auto-Auth
            try {
                const res = await fetch('/api/balance');
                if (res.ok) {
                    const data = await res.json();
                    if (typeof data.balance === 'number') {
                        serverBalance = data.balance;
                        setBalance(serverBalance);
                    }
                }
            } catch (err) {
                console.error("Cookie sync failed", err);
            }

            // Strategy B: Header Auth (Fallback)
            if (serverBalance === null) {
                // Try to get session token
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    try {
                        const res = await fetch('/api/balance', {
                            headers: { 'Authorization': `Bearer ${session.access_token}` }
                        });
                        if (res.ok) {
                            const data = await res.json();
                            if (typeof data.balance === 'number') {
                                serverBalance = data.balance;
                                setBalance(serverBalance);
                            }
                        }
                    } catch (err) {
                        console.error("Header sync failed", err);
                    }
                }
            }

            // Fallback to LocalStorage ONLY IF server sync failed entirely
            if (serverBalance === null) {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved && !isNaN(parseInt(saved))) {
                    setBalance(parseInt(saved));
                }
            }

            // Load Transactions from LocalStorage
            const savedTxs = localStorage.getItem(TRANSACTIONS_KEY);
            if (savedTxs) {
                try {
                    setTransactions(JSON.parse(savedTxs));
                } catch (e) {
                    console.error("Failed to parse transactions", e);
                }
            }
            setIsInitialized(true);
        };

        syncWallet();
    }, []);

    // Persistence Effect (Client-side Cache)
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem(STORAGE_KEY, balance.toString());
            localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
        }
    }, [balance, transactions, isInitialized]);

    const spend = (amount: number, description: string) => {
        if (balance < amount) return false;
        setBalance(prev => prev - amount);
        setTransactions(prev => [{ desc: description, amount: -amount, date: new Date().toISOString() }, ...prev]);
        return true;
    };

    const earn = (amount: number, description: string) => {
        setBalance(prev => prev + amount);
        setTransactions(prev => [{ desc: description, amount: amount, date: new Date().toISOString() }, ...prev]);
    };

    const reset = () => {
        setBalance(5000);
        setTransactions([]);
    };

    return (
        <WalletContext.Provider value={{ balance, transactions, spend, earn, reset }}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}

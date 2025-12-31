import { useState, useEffect } from 'react';

const STORAGE_KEY = 'quantgoal_wallet_balance';
const TRANSACTIONS_KEY = 'quantgoal_wallet_txs';

export function useWallet() {
    const [balance, setBalance] = useState(1000);
    const [transactions, setTransactions] = useState<{ desc: string, amount: number, date: string }[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initial Load
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && !isNaN(parseInt(saved))) {
            setBalance(parseInt(saved));
        }

        const savedTxs = localStorage.getItem(TRANSACTIONS_KEY);
        if (savedTxs) {
            try {
                setTransactions(JSON.parse(savedTxs));
            } catch (e) {
                console.error("Failed to parse transactions", e);
            }
        }
        setIsInitialized(true);
    }, []);

    // Persistence Effect
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem(STORAGE_KEY, balance.toString());
            localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
        }
    }, [balance, transactions, isInitialized]);

    // Auto-Settlement Logic
    useEffect(() => {
        if (!isInitialized) return;

        const checkSettlement = async () => {
            try {
                const res = await fetch('/parlay_history.json');
                if (!res.ok) return;
                const history = await res.json();

                const settledIdsRaw = localStorage.getItem('quantgoal_settled_ids');
                let settledIds = settledIdsRaw ? JSON.parse(settledIdsRaw) : [];
                let hasNewWins = false;

                // We need to calculate total earnings first to avoid multiple state updates
                let totalWin = 0;
                const newTxs: { desc: string, amount: number, date: string }[] = [];

                history.forEach((bet: any) => {
                    if (bet.status === 'WON' && !settledIds.includes(bet.id)) {
                        const winAmount = bet.stake * (parseFloat(bet.odds) || 1);
                        totalWin += winAmount;
                        newTxs.push({ desc: `Win Settlement: ${bet.id}`, amount: winAmount, date: new Date().toISOString() });
                        settledIds.push(bet.id);
                        hasNewWins = true;
                    }
                });

                if (hasNewWins && totalWin > 0) {
                    setBalance(prev => prev + totalWin);
                    setTransactions(prev => [...newTxs, ...prev]);
                    localStorage.setItem('quantgoal_settled_ids', JSON.stringify(settledIds));
                }
            } catch (err) {
                console.error("Settlement check failed", err);
            }
        };

        checkSettlement();
    }, [isInitialized]); // Run once after initialization


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
        return true;
    };

    return { balance, transactions, spend, earn, reset };
}

'use client';

import { useBettingSlip } from '../../context/BettingSlipContext';
import { useWallet } from '../../context/WalletContext';
import { X, Trash2, ChevronUp, ChevronDown, DollarSign, CheckCircle } from 'lucide-react';
import { useState } from 'react';





export function BettingSlipWidget() {
    const { items, removeFromSlip, clearSlip, isOpen, setIsOpen } = useBettingSlip();
    const wallet = useWallet(); // Direct Context Usage
    const [stake, setStake] = useState('100');
    const [statusMsg, setStatusMsg] = useState<string | null>(null);

    if (items.length === 0) return null;

    const totalOdds = items.reduce((acc, item) => acc * item.odds, 1);
    const potentialReturn = (parseFloat(stake || '0') * totalOdds).toFixed(2);

    const handlePlaceBet = async () => {
        if (!wallet) return;
        setStatusMsg(null);

        const amount = parseFloat(stake) || 0;
        if (amount <= 0) return;

        // Create description
        const desc = `Custom Parlay (${items.length} legs): ${items.map(i => i.selection).join(', ')} @ ${totalOdds.toFixed(2)}`;

        if (wallet.spend(amount, desc)) {
            // Record to History Ledger
            try {
                // Non-blocking fetch
                fetch('/api/history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        odds: totalOdds.toFixed(2),
                        potentialReturn: potentialReturn,
                        stake: amount,
                        legs: items.map(l => ({
                            fullMatch: l.matchInfo,
                            team: l.selection,
                            market: l.market,
                            odds: l.odds.toFixed(2)
                        }))
                    })
                }).catch(e => console.error("History API Error:", e));

                // Success Feedback (Non-blocking)
                setStatusMsg(`Parlay Placed! Potential Return: $${potentialReturn}`);

                // Delay clearing slip slightly to let user see success message
                setTimeout(() => {
                    clearSlip();
                    setStatusMsg(null);
                }, 2000);

            } catch (err) {
                console.error("Failed to record custom parlay to ledger", err);
            }
        } else {
            setStatusMsg("Insufficient Funds");
            setTimeout(() => setStatusMsg(null), 2000);
        }
    };

    if (!isOpen) {
        return (
            <div
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-[9990] bg-[var(--brand)] text-black font-bold px-4 py-3 rounded-full shadow-lg shadow-emerald-500/20 cursor-pointer hover:scale-105 transition-transform flex items-center gap-2 animate-bounce-subtle"
            >
                <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {items.length}
                </span>
                <span>My Parlay Slip</span>
                <ChevronUp size={16} />
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-[9990] w-80 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
            {/* Header */}
            <div className="bg-zinc-900/80 backdrop-blur p-3 flex justify-between items-center border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
                    <span className="font-bold text-white text-sm">Betting Slip ({items.length})</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                        <ChevronDown size={16} />
                    </button>
                </div>
            </div>

            {/* Status Feedback Overlay */}
            {statusMsg && (
                <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-center p-4 animate-fade-in">
                    <CheckCircle className="text-emerald-500 mb-2" size={32} />
                    <p className="text-emerald-400 font-bold text-sm">{statusMsg}</p>
                </div>
            )}

            {/* Items */}
            <div className="max-h-[300px] overflow-y-auto p-2 space-y-2 bg-zinc-950">
                {items.map((item) => (
                    <div key={item.id} className="bg-zinc-900/50 p-2 rounded border border-zinc-800/50 relative group">
                        <button
                            onClick={() => removeFromSlip(item.id)}
                            className="absolute top-1 right-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={14} />
                        </button>
                        <div className="text-[10px] text-zinc-500 truncate pr-4">{item.matchInfo}</div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-emerald-400 text-sm">{item.selection}</span>
                            <span className="font-mono text-zinc-300 text-xs">@{item.odds.toFixed(2)}</span>
                        </div>
                        <div className="text-[9px] text-zinc-600 uppercase mt-0.5">{item.market}</div>
                    </div>
                ))}
            </div>

            {/* Footer / Summary */}
            <div className="p-3 bg-zinc-900 border-t border-zinc-800 space-y-3">
                <div className="flex justify-between text-xs text-zinc-400">
                    <span>Total Odds</span>
                    <span className="text-amber-400 font-mono font-bold">@{totalOdds.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2 bg-zinc-950 rounded border border-zinc-800 px-2 py-1.5 focus-within:border-zinc-600 transition-colors">
                    <span className="text-zinc-500 text-xs">$</span>
                    <input
                        type="number"
                        value={stake}
                        onChange={(e) => setStake(e.target.value)}
                        className="bg-transparent text-white font-mono text-sm w-full outline-none"
                    />
                </div>

                <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Est. Return:</span>
                    <span className="text-white font-bold">${potentialReturn}</span>
                </div>

                <button
                    onClick={handlePlaceBet}
                    disabled={items.length < 2}
                    className={`w-full py-2 rounded font-black uppercase tracking-wider text-xs transition-colors
            ${items.length < 2 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-[var(--brand)] text-black hover:bg-emerald-400'}
          `}
                >
                    {items.length < 2 ? 'Select at least 2' : 'Place Parlay'}
                </button>

                <div className="text-center">
                    <button onClick={clearSlip} className="text-[10px] text-zinc-600 hover:text-red-500 flex items-center gap-1 mx-auto">
                        <Trash2 size={10} /> Clear Slip
                    </button>
                </div>
            </div>
        </div>
    );
}

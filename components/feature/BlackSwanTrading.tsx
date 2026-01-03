'use client';

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, TrendingDown, Info, Zap, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function BlackSwanTrading() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSignal, setSelectedSignal] = useState<any>(null);
    const [premium, setPremium] = useState(100);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        // Fetch matches and profile balance
        const fetchData = async () => {
            try {
                // Fetch matches with high confidence signals
                const mRes = await fetch('/api/league');
                const mData = await mRes.json();

                // For simulation/trading, we fetch the underlying matches
                const sRes = await fetch('/api/history'); // Or a specific signals API
                const sData = await sRes.json();

                // Fetch user balance
                const bRes = await fetch('/api/balance');
                const bData = await bRes.json();
                setBalance(bData.balance);

                // Filter for high confidence signals (>75%) from the raw matching data if possible
                // Mocking for now since we need a good signals API
                const highConf = [
                    { id: 'm1', home: 'Man City', away: 'Chelsea', market: 'Moneyline', selection: 'Man City', odds: 1.45, confidence: 88, model: 'DeepSeek V3' },
                    { id: 'm2', home: 'Real Madrid', away: 'Getafe', market: 'Moneyline', selection: 'Real Madrid', odds: 1.30, confidence: 92, model: 'Claude Opus 4.5' },
                    { id: 'm3', home: 'Inter', away: 'Lazio', market: 'Moneyline', selection: 'Inter', odds: 1.65, confidence: 79, model: 'GPT-5 Preview' }
                ];
                setMatches(highConf);
                setLoading(false);
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleBuyOption = async () => {
        if (!selectedSignal) return;

        try {
            const res = await fetch('/api/options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_id: selectedSignal.model.toLowerCase().replace(' ', '_'),
                    match_id: selectedSignal.id,
                    premium: premium,
                    strike_confidence: selectedSignal.confidence,
                    payout_multiplier: 2.5
                })
            });

            if (res.ok) {
                alert("Black Swan Hedge Activated! Your shield is ready.");
                // Refresh balance
                const bRes = await fetch('/api/balance');
                const bData = await bRes.json();
                setBalance(bData.balance);
                setSelectedSignal(null);
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-12 text-center font-mono text-zinc-500 animate-pulse">BOOTING BLACK SWAN PROTOCOL...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <Shield className="text-orange-500" size={32} />
                        BLACK SWAN <span className="text-zinc-500">TERMINAL</span>
                    </h2>
                    <p className="text-zinc-400 mt-1">Hedge against AI failure. Profit from the unexpected.</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg">
                    <Zap className="text-yellow-500" size={16} />
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Available Credits:</span>
                    <span className="text-xl font-mono font-black text-white">{balance.toLocaleString()} CR</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Available Hedges */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-orange-500" />
                        High-Confidence Risk Exposures
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {matches.map((m) => (
                            <Card
                                key={m.id}
                                onClick={() => setSelectedSignal(m)}
                                className={`p-6 border-zinc-800 bg-zinc-900/40 hover:border-orange-500/50 transition-all cursor-pointer group relative overflow-hidden ${selectedSignal?.id === m.id ? 'border-orange-500 ring-1 ring-orange-500/20' : ''}`}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Shield size={64} className="text-orange-500" />
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-black uppercase text-zinc-500 bg-black/40 px-2 py-0.5 rounded border border-zinc-800">
                                        {m.model}
                                    </span>
                                    <div className="text-orange-500 flex items-center gap-1 font-mono font-bold">
                                        {m.confidence}% <Info size={12} />
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-white mb-1">{m.home} vs {m.away}</div>
                                <div className="text-xs text-zinc-400 mb-4">{m.market}: {m.selection} @ {m.odds}</div>
                                <div className="flex justify-between items-end">
                                    <div className="text-[10px] text-zinc-500 font-bold uppercase">Exposure Level: <span className="text-red-500">CRITICAL</span></div>
                                    <ChevronRight className={`text-orange-500 transition-transform ${selectedSignal?.id === m.id ? 'translate-x-1' : 'group-hover:translate-x-1'}`} />
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Trading Portal */}
                <div className="lg:col-span-1">
                    <Card className="p-8 border-zinc-800 bg-black/40 sticky top-24">
                        <h3 className="text-xl font-black text-white mb-6 uppercase italic tracking-tighter">Hedge Configuration</h3>

                        {selectedSignal ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block tracking-widest">Hedge Premium (Stake)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={premium}
                                            onChange={(e) => setPremium(Number(e.target.value))}
                                            className="w-full bg-zinc-900 border border-zinc-700 p-4 rounded-xl text-2xl font-black text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all font-mono"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-zinc-600 font-mono">CR</div>
                                    </div>
                                    <div className="flex justify-between mt-2 px-1">
                                        <button onClick={() => setPremium(100)} className="text-[10px] text-zinc-500 hover:text-white transition-colors">MIN</button>
                                        <button onClick={() => setPremium(500)} className="text-[10px] text-zinc-500 hover:text-white transition-colors">MID</button>
                                        <button onClick={() => setPremium(1000)} className="text-[10px] text-zinc-500 hover:text-white transition-colors">MAX</button>
                                    </div>
                                </div>

                                <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl space-y-3">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                        <span className="text-zinc-500">Strike Confidence:</span>
                                        <span className="text-orange-500">{selectedSignal.confidence}%</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                        <span className="text-zinc-500">Payout Multiplier:</span>
                                        <span className="text-emerald-500">2.5x</span>
                                    </div>
                                    <div className="h-px bg-zinc-800 my-2" />
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-sm font-black text-white uppercase tracking-tighter">Potential Payout:</span>
                                        <span className="text-2xl font-black text-emerald-400 font-mono">{(premium * 2.5).toLocaleString()}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleBuyOption}
                                    className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest rounded-xl shadow-xl shadow-orange-950/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <Shield size={20} />
                                    ACTIVATE HEDGE
                                </button>
                                <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
                                    Payout triggers ONLY if the selected model prediction fails.
                                    Premium is non-refundable. All trades settled in QuantGoal Credits.
                                </p>
                            </div>
                        ) : (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-700">
                                    <TrendingDown size={32} />
                                </div>
                                <p className="text-zinc-500 text-sm italic">Select a high-confidence signal from the terminal to configure your hedge.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Disclaimer Footer */}
            <div className="pt-12 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-full border border-zinc-800 text-[10px] text-zinc-500 font-mono">
                    <span className="text-orange-500 font-bold">STRIKE PROTOCOL V1.0:</span>
                    HEAVY TAIL PROTECTION ACTIVE • NO SETTLEMENT DELAY
                </div>
            </div>
        </div>
    );
}

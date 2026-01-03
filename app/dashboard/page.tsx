'use client';

import { Card } from '@/components/ui/Card';
import { ArrowUpRight, ArrowDownRight, Activity, DollarSign, Target, Clock, TrendingUp, Banknote, Trophy, Brain, History } from 'lucide-react';
import { SignalTable } from '@/components/dashboard/SignalTable';

import { ParlayLab } from '@/components/dashboard/ParlayLab';

import { useSearchParams } from 'next/navigation';
import { CheckCircle, Zap, Medal, Star, ShieldCheck, Crown } from 'lucide-react';
import { useState, useEffect } from 'react';

// Fallback data for Consensus if not found in JSON or if named differently
import { useWallet } from '@/hooks/useWallet';  // Added import
import { BankrollModal } from '@/components/dashboard/BankrollModal';


const FALLBACK_CONSENSUS = {
    name: "QuantGoal Consensus",
    roi_monthly: 14.5,
    strike_rate: 68,
    risk: "Low"
};

export default function DashboardPage() {
    const searchParams = useSearchParams();
    const clonedModel = searchParams.get('cloned_model');

    // Shadow Portfolio Simulation State
    const [livePnL, setLivePnL] = useState(0);
    const [modelStats, setModelStats] = useState<any>(null);
    const [userHistory, setUserHistory] = useState<any[]>([]);
    const [achievements, setAchievements] = useState<any[]>([]);

    useEffect(() => {
        if (clonedModel) {
            // Handle special mapping for the Chinese name used in screenshots or Consensus
            if (clonedModel.includes("共识") || clonedModel.includes("Consensus")) {
                setModelStats(FALLBACK_CONSENSUS);
                const baseDaily = (FALLBACK_CONSENSUS.roi_monthly / 30 / 100) * 1000;
                setLivePnL(baseDaily + (Math.random() * 2));
                return;
            }

            fetch('/api/league')
                .then(res => res.json())
                .then(data => {
                    // Extract models from dictionary
                    const modelsArray = Object.values(data.models || {});
                    const model = modelsArray.find((m: any) => m.name === clonedModel || clonedModel.includes(m.name)) as any;
                    if (model) {
                        setModelStats(model);
                        // Initial simulated P&L
                        const baseDaily = (Number(model.stats?.roi || 0) / 30 / 100) * 1000;
                        setLivePnL(baseDaily + (Math.random() * 2));
                    }
                })
                .catch(err => console.error("Failed to fetch model stats", err));
        }
    }, [clonedModel]);

    useEffect(() => {
        if (modelStats) {
            const interval = setInterval(() => {
                setLivePnL(prev => {
                    // Drift
                    const trend = modelStats.roi_monthly > 0 ? 0.05 : -0.05;
                    // Volatility
                    const volatility = (Math.random() * 1.5) - 0.5;
                    return prev + trend + volatility;
                });
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [modelStats]);

    // Fetch user betting history and achievements
    useEffect(() => {
        Promise.all([
            fetch('/api/history').then(res => res.json()),
            fetch('/api/user-achievements').then(res => res.json())
        ]).then(([historyData, archiveData]) => {
            setUserHistory(historyData.history || []);
            setAchievements(archiveData || []);
        }).catch(e => console.error("Failed to load dashboard data", e));
    }, []);



    // ... inside component

    // Modal State
    const [isBankrollOpen, setIsBankrollOpen] = useState(false);

    // Wallet Hook
    const wallet = useWallet();

    return (
        <div className="space-y-8 pb-20 relative">
            <BankrollModal isOpen={isBankrollOpen} onClose={() => setIsBankrollOpen(false)} wallet={wallet} />


            <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
                {/* Left: Live Market Pulse */}
                <section className="space-y-8">
                    {/* Parlay Lab Module */}
                    <ParlayLab wallet={wallet} />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Activity className="text-[var(--brand)]" size={20} />
                                Live Betting Market (Single Bets)
                            </h2>
                        </div>
                        <Card className="border-zinc-800 bg-zinc-950/50 overflow-hidden">
                            <SignalTable wallet={wallet} />
                        </Card>
                    </div>
                </section>
                {/* ... Right Section (Unchanged, just nested) ... */}
                <section className="space-y-4">
                    {clonedModel ? (
                        <>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Zap className="text-yellow-400 fill-current animate-pulse" size={20} />
                                Shadow Portfolio
                            </h2>
                            <Card className="p-6 border-yellow-500/30 bg-gradient-to-br from-yellow-900/10 to-black relative overflow-hidden">
                                <div className="absolute top-0 right-0 px-2 py-1 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest">
                                    Active Clone
                                </div>
                                <div className="text-zinc-400 text-xs uppercase tracking-wider font-medium mb-1">Mirroring Strategy</div>
                                <div className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    {decodeURIComponent(clonedModel)}
                                    <CheckCircle size={16} className="text-green-500" />
                                </div>

                                <div className="space-y-3 pt-4 border-t border-white/10">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Allocated Capital</span>
                                        <span className="text-white font-mono font-bold">$1,000.00</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Live P&L (Sim)</span>
                                        <span className={`font-mono font-bold ${livePnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {livePnL >= 0 ? '+' : ''}${livePnL.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 text-xs text-yellow-500/80 bg-yellow-500/10 p-2 rounded border border-yellow-500/20 text-center animate-pulse">
                                    Tracking Live Positions • {modelStats ? `ROI: ${modelStats.roi_monthly}%/mo` : 'Syncing...'}
                                </div>
                            </Card>
                        </>
                    ) : (
                        <>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Banknote className="text-emerald-400" size={20} />
                                Your Portfolio
                            </h2>
                            <Card className="p-6 border-zinc-800 bg-gradient-to-br from-zinc-900 to-black">
                                <div className="text-zinc-400 text-xs uppercase tracking-wider font-medium mb-1">Starting Bankroll</div>
                                <div className="text-3xl font-mono font-bold text-white mb-4">${wallet.balance.toFixed(2)}</div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Active Risk</span>
                                        <span className="text-yellow-400 font-mono">$0.00</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">History</span>
                                        <span className="text-zinc-400 font-mono">{wallet.transactions.length} txs</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsBankrollOpen(true)}
                                    className="w-full mt-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm font-bold transition-colors"
                                >
                                    Manage Bankroll
                                </button>
                            </Card>

                            {/* User Performance Stats */}
                            <Card className="p-6 border-zinc-800 bg-gradient-to-br from-zinc-900 to-black relative overflow-hidden mt-4">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Target size={48} className="text-emerald-400" />
                                </div>
                                <div className="text-xs font-mono text-zinc-500 uppercase mb-2">Performance Stats</div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Total Bets Placed</span>
                                        <span className="text-white font-mono">{userHistory.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Total P&L</span>
                                        <span className={`font-mono font-bold ${userHistory.reduce((sum, h) => sum + (h.total_pnl || 0), 0) >= 0
                                            ? 'text-emerald-400'
                                            : 'text-red-400'
                                            }`}>
                                            ${userHistory.reduce((sum, h) => sum + (h.total_pnl || 0), 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </Card>

                            {/* Daily Settlement Ledger */}
                            <Card className="p-6 bg-zinc-900/20 border-zinc-800 mt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        <History size={14} /> Daily Settlement Ledger
                                    </h4>
                                    <span className="text-[10px] font-mono text-zinc-500">REALIZED P&L</span>
                                </div>
                                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                                    {userHistory.map((day: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center p-2 rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-mono text-zinc-500">{day.date}</span>
                                                <span className="text-xs text-zinc-300">{day.bets_placed} bets</span>
                                            </div>
                                            <span className={`text-xs font-mono font-bold ${day.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {day.total_pnl >= 0 ? '+' : ''}${day.total_pnl.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                    {userHistory.length === 0 && (
                                        <div className="text-center py-8 text-zinc-600 text-xs italic">
                                            No settled positions found. Place bets to start tracking.
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </>
                    )}

                    {/* Governor Medals */}
                    {achievements.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Medal size={16} className="text-blue-500" />
                                Constitutional Medals
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                {achievements.map((ach, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl group hover:border-blue-500/50 transition-all">
                                        <div className="h-10 w-10 flex items-center justify-center bg-blue-500/10 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
                                            {ach.achievement_type === 'The Oracle' ? <Star size={20} /> :
                                                ach.achievement_type === 'Master Lobbyist' ? <ShieldCheck size={20} /> :
                                                    <Crown size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white">{ach.achievement_type}</p>
                                            <p className="text-[9px] text-zinc-500 font-bold uppercase">{new Date(ach.earned_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Insight Snippet */}
                    <Card className="p-4 border-zinc-800 bg-blue-900/10 border-l-2 border-l-blue-500">
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-900/20 flex items-center justify-center text-blue-400 shrink-0">
                                <Brain size={16} />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-100 text-sm">DeepSeek Insight</h4>
                                <p className="text-xs text-blue-200/70 mt-1 leading-relaxed">
                                    "I'm seeing a 14% edge on Draw in the Real Madrid game. Recommend small hedge."
                                </p>
                            </div>
                        </div>
                    </Card>
                </section>
            </div>
        </div>
    );
}

function KPICard({ title, value, change, trend, subtitle, icon: Icon }: any) {
    return (
        <Card className="p-6 border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-zinc-400">{title}</span>
                <div className="h-8 w-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <Icon size={16} />
                </div>
            </div>
            <div className="space-y-1">
                <div className="text-2xl font-bold text-white">{value}</div>
                {subtitle && <div className="text-xs text-zinc-500">{subtitle}</div>}
                {!subtitle && (
                    <div className={`flex items-center text-xs font-medium ${trend === 'up' ? 'text-green-400' :
                        trend === 'down' ? 'text-red-400' : 'text-zinc-500'
                        }`}>
                        {trend === 'up' && <ArrowUpRight size={14} className="mr-1" />}
                        {trend === 'down' && <ArrowDownRight size={14} className="mr-1" />}
                        {change}
                    </div>
                )}
            </div>
        </Card>
    );
}

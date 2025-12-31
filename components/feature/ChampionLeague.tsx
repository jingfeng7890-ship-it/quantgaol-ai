import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, TrendingUp, Shield, Zap, Target, X, History, Lock, Bell, Check, Activity, Medal, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { RadarChart } from './RadarChart';
import { WarRoomChat } from './WarRoomChat';
import { useWallet } from '../../hooks/useWallet';

// Mock Data
const MOCK_MATCHES = [
    { home: 'Arsenal', away: 'Liverpool', time: '12:30', league: 'EPL', prediction: 'Arsenal 2-1', confidence: 78, reason: 'High xG at home vs High Line.' },
    { home: 'Real Madrid', away: 'Barcelona', time: '20:00', league: 'La Liga', prediction: 'Draw 2-2', confidence: 65, reason: 'El Clasico always volatile.' },
];

export function ChampionLeague() {
    const wallet = useWallet();
    const [leagueData, setLeagueData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState<any>(null);
    const [consensus, setConsensus] = useState<any>(null);
    const [warRoomMatch, setWarRoomMatch] = useState<any>(null);
    const [userHistory, setUserHistory] = useState<any[]>([]);
    const [statsSummary, setStatsSummary] = useState<any>(null);
    const [dailyPicks, setDailyPicks] = useState<any[]>([]);
    const [picksSummary, setPicksSummary] = useState<any>(null);

    // Phase 4: Access Control & user Interaction
    const [hasAccess, setHasAccess] = useState(false);
    const [following, setFollowing] = useState<string[]>([]);
    const [toasts, setToasts] = useState<{ id: number, message: string, type: 'success' | 'info' }[]>([]);

    useEffect(() => {
        const access = localStorage.getItem('alpha_league_access');
        if (access === 'granted') setHasAccess(true);

        const savedFollowing = localStorage.getItem('alpha_league_following');
        if (savedFollowing) {
            try {
                setFollowing(JSON.parse(savedFollowing));
            } catch (e) {
                console.error("Failed to parse following list");
            }
        }

        fetch('/champion_league_data.json')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load league data');
                return res.json();
            })
            .then(data => {
                if (!data || !data.models) {
                    throw new Error('Invalid league data format');
                }
                setLeagueData(data);

                try {
                    // Calculate Consensus
                    const models = Object.values(data.models);
                    const count = models.length;

                    if (count === 0) throw new Error('No models found');

                    const totalBalance = models.reduce((acc: number, m: any) => acc + ((m.wallets?.core || 0) + (m.wallets?.challenge || 0) + (m.wallets?.high_yield || 0)), 0);
                    const avgBalance = totalBalance / count;
                    const totalROI = models.reduce((acc: number, m: any) => acc + (m.stats?.roi || 0), 0);

                    // Detailed Consensus Calculation
                    const avgWallets = models.reduce((acc: any, m: any) => ({
                        core: (acc.core as number) + ((m.wallets?.core || 0) as number),
                        challenge: (acc.challenge as number) + ((m.wallets?.challenge || 0) as number),
                        high_yield: (acc.high_yield as number) + ((m.wallets?.high_yield || 0) as number)
                    }), { core: 0, challenge: 0, high_yield: 0 });

                    const coreAvg = (avgWallets as any).core / count;
                    const challengeAvg = (avgWallets as any).challenge / count;
                    const highYieldAvg = (avgWallets as any).high_yield / count;
                    const avgTotalBalance = coreAvg + challengeAvg + highYieldAvg;

                    // Aggregate History (Average Daily PnL)
                    const referenceHistory = (models[0] as any).history || [];
                    const consensusHistory = referenceHistory.map((day: any, idx: number) => {
                        const dailyTotalPnL = models.reduce((sum: number, m: any) => sum + (((m.history?.[idx] as any)?.total_pnl as number) || 0), 0);
                        const dailyBets = models.reduce((sum: number, m: any) => sum + (((m.history?.[idx] as any)?.bets_placed as number) || 0), 0);
                        return {
                            date: day.date,
                            bets_placed: Math.round(dailyBets / count),
                            total_pnl: parseFloat((dailyTotalPnL / count).toFixed(2))
                        };
                    });

                    const consensusModel = {
                        id: "consensus",
                        name: "QuantGoal Consensus",
                        style: "Weighted Average",
                        stats: {
                            roi: parseFloat((totalROI / count).toFixed(2)),
                            total_pnl: parseFloat((avgTotalBalance - 10000).toFixed(2)),
                            risk: 4, alpha: 7, accuracy: 8, recovery: 9, consist: 10
                        },
                        wallets: {
                            total: avgTotalBalance,
                            core: coreAvg,
                            challenge: challengeAvg,
                            high_yield: highYieldAvg
                        },
                        history: consensusHistory,
                        breakdown: { Core: 92, Advanced: 88, Stability: 95 }
                    };

                    setConsensus(consensusModel);
                } catch (err) {
                    console.error("Error calculating consensus:", err);
                }

                setLoading(false);

                // Fetch User History for Module 3
                fetch('/parlay_history.json')
                    .then(res => res.json())
                    .then(history => {
                        if (!Array.isArray(history)) return;

                        const dailyStats: any = {};
                        history.forEach((bet: any) => {
                            const date = bet.date ? bet.date.split(' ')[0] : 'Unknown';
                            if (!dailyStats[date]) dailyStats[date] = { date, bets_placed: 0, total_pnl: 0, won_count: 0 };
                            dailyStats[date].bets_placed += 1;
                            dailyStats[date].total_pnl += bet.pnl || 0;
                            if (bet.status === 'WON') dailyStats[date].won_count += 1;
                        });
                        setUserHistory(Object.values(dailyStats).sort((a: any, b: any) => b.date.localeCompare(a.date)));

                        // Calculate Summaries
                        const totalBets = history.length;
                        const wonBets = history.filter((b: any) => b.status === 'WON').length;
                        const totalPnl = history.reduce((acc: number, b: any) => acc + (b.pnl || 0), 0);
                        const totalStake = history.reduce((acc: number, b: any) => acc + (b.stake || 0), 0);

                        setStatsSummary({
                            user: {
                                roi: totalStake > 0 ? (totalPnl / totalStake * 100).toFixed(1) : '0',
                                winRate: totalBets > 0 ? (wonBets / totalBets * 100).toFixed(1) : '0',
                                pnl: totalPnl.toFixed(2)
                            },
                            system: {
                                roi: consensus ? consensus.stats.roi : 0, // Fallback if consensus failed
                                winRate: consensus ? consensus.stats.accuracy * 10 : 80
                            }
                        });
                    })
                    .catch(e => console.error("User history load failed", e));

                // Fetch Daily Top Picks
                fetch('/daily_top_picks.json')
                    .then(res => res.json())
                    .then(data => {
                        const picks = Array.isArray(data) ? data : [];
                        setDailyPicks(picks);
                        const total = picks.length;
                        const won = picks.filter((p: any) => p.status === 'WON').length;
                        const pnl = picks.reduce((acc: number, p: any) => acc + (p.pnl || 0), 0);
                        setPicksSummary({
                            winRate: total > 0 ? (won / total * 100).toFixed(1) : '0',
                            roi: total > 0 ? (pnl / (total * 100) * 100).toFixed(1) : '0',
                            pnl: pnl.toFixed(2),
                            total
                        });
                    })
                    .catch(e => console.error("Daily picks load failed", e));
            })
            .catch(err => {
                console.error("Failed to load league data:", err);
                setLoading(false);
                // Consider setting an error state to display a fallback UI
            });
    }, []);

    const addToast = (message: string, type: 'success' | 'info' = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const handleGrantAccess = () => {
        setHasAccess(true);
        localStorage.setItem('alpha_league_access', 'granted');
        addToast("Welcome to the Arena. Capital at Risk.", "success");
    };

    const toggleFollow = (e: React.MouseEvent, modelId: string) => {
        e.stopPropagation();
        setFollowing(prev => {
            const isFollowing = prev.includes(modelId);
            const newFollowing = isFollowing ? prev.filter(id => id !== modelId) : [...prev, modelId];

            localStorage.setItem('alpha_league_following', JSON.stringify(newFollowing));

            if (!isFollowing) {
                addToast(`Now Following: ${modelId === 'consensus' ? 'QuantGoal Consensus' : modelId} `, "success");
            } else {
                addToast(`Unfollowed: ${modelId === 'consensus' ? 'QuantGoal Consensus' : modelId} `, "info");
            }

            return newFollowing;
        });
    };

    if (loading || !leagueData) {
        return <div className="p-12 text-center text-zinc-500 font-mono animate-pulse">
            INITIALIZING MULTI-DIMENSIONAL ENGINE...
        </div>;
    }

    // Sort models by ROI
    const sortedModels = Object.values(leagueData.models).sort((a: any, b: any) => b.stats.roi - a.stats.roi);
    const tier1 = sortedModels.slice(0, 3);
    const tier2 = sortedModels.slice(3, 6);

    return (
        <>
            <div className="space-y-12 relative min-h-[800px]">
                {/* LEAGUE PASS GATE */}
                {!hasAccess && (
                    <div className="absolute inset-0 z-50 backdrop-blur-md bg-black/80 flex items-center justify-center p-4 rounded-xl border border-zinc-900">
                        <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl max-w-md text-center shadow-2xl space-y-6">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse">
                                <Lock size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase italic">League Pass Required</h3>
                                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                                    You are entering the <strong>Champion Model League</strong>.
                                    <br />
                                    This zone contains real-time AI Sports Prediction simulations.
                                    <br />
                                    <span className="text-red-400 font-bold">High Variance. Sports Betting Analytics.</span>
                                </p>
                            </div>
                            <button
                                onClick={handleGrantAccess}
                                className="w-full py-3 bg-white text-black font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors rounded-lg flex items-center justify-center gap-2"
                            >
                                <Target size={18} />
                                Enter Analytical Zone
                            </button>
                        </div>
                    </div>
                )}

                <div className={`transition-all duration-700 ${!hasAccess ? 'filter blur-lg opacity-50' : ''}`}>

                    {/* 0. HEADER SECTION (Legacy Style) */}
                    <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
                        {/* Wallet Widget */}
                        <div className="flex justify-center mb-4">
                            <div className="bg-zinc-900 border border-zinc-700/50 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-xl backdrop-blur-md">
                                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                                <span className="text-zinc-400 text-xs font-bold tracking-wider">BALANCE:</span>
                                <span className="text-yellow-400 font-mono font-black text-sm flex items-center gap-1">
                                    <Wallet size={12} /> {wallet.balance.toLocaleString()} CR
                                </span>
                            </div>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                            The <span className="text-yellow-500">$10k Bankroll</span> Challenge
                        </h2>
                        <p className="text-zinc-400 text-lg flex items-center justify-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Starting Bankroll: $10,000 • Live Yield Tracking
                        </p>

                        {/* News Ticker (Integrated cleanly) */}
                        {leagueData.news && (
                            <div className="inline-flex items-center gap-2 bg-zinc-900/80 px-4 py-1.5 rounded-full border border-zinc-800 text-xs text-zinc-300 font-mono mt-4 animate-fade-in">
                                <span className="text-red-500 font-bold uppercase tracking-wider">Live Report:</span>
                                "{leagueData.news.headline}"
                            </div>
                        )}

                        {/* Module Selection / Summary Tabs */}
                        <div className="grid grid-cols-3 gap-4 mt-8">
                            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-left">
                                <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Module 1: LLM Personas</div>
                                <div className="text-xl font-bold text-white">#1 Claude</div>
                                <div className="text-xs text-green-400 font-mono">+15% ROI</div>
                            </div>
                            <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30 text-left">
                                <div className="text-[10px] text-yellow-500/70 uppercase font-bold mb-1">Module 2: System Algo</div>
                                <div className="text-xl font-bold text-white">{statsSummary?.system.roi}% ROI</div>
                                <div className="text-xs text-yellow-500/70 font-mono">Consensus Rank: Top</div>
                            </div>
                            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30 text-left">
                                <div className="text-[10px] text-blue-400/70 uppercase font-bold mb-1">Module 3: Your Portfolio</div>
                                <div className={`text-xl font-bold ${parseFloat(statsSummary?.user.pnl) >= 0 ? 'text-white' : 'text-red-400'}`}>
                                    ${statsSummary?.user.pnl || '0.00'}
                                </div>
                                <div className="text-xs text-blue-400/70 font-mono">{statsSummary?.user.winRate}% Win Rate</div>
                            </div>
                        </div>
                    </div>


                    {/* 1. CONSENSUS CARD (THE GOLD MASTER - Single Large) */}
                    {consensus && (
                        <div className="flex justify-center mb-12">
                            <Card
                                onClick={() => setSelectedModel(consensus)}
                                className="relative w-full max-w-lg p-8 border-2 border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_50px_rgba(234,179,8,0.1)] overflow-hidden group hover:scale-105 transition-transform duration-500 cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent opacity-50" />
                                <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-500 blur-[80px] rounded-full" />

                                {/* Follow Button */}
                                <div className="absolute top-4 right-4 z-20">
                                    <button
                                        onClick={(e) => toggleFollow(e, consensus.id)}
                                        className={`p-2 rounded-full transition-all ${following.includes(consensus.id) ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' : 'text-yellow-500/40 hover:text-yellow-500 hover:bg-yellow-500/10'}`}
                                    >
                                        <Bell size={18} />
                                    </button>
                                </div>

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="mb-4 relative">
                                        <div className="absolute -inset-4 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
                                        <Shield size={48} className="text-yellow-400 relative z-10 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight">QuantGoal Consensus</h3>

                                    <div className="text-yellow-500 font-bold tracking-widest text-xs uppercase mb-6 flex items-center gap-2">
                                        <span className="w-8 h-px bg-yellow-500/50" />
                                        BENCHMARK
                                        <span className="w-8 h-px bg-yellow-500/50" />
                                    </div>

                                    <div className="text-6xl font-black text-white tracking-tighter mb-2 drop-shadow-xl flex items-baseline gap-2">
                                        ${consensus.wallets.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>

                                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                                        <div className={`text-sm font-mono font-bold flex items-center gap-1 px-3 py-1 rounded border ${consensus.stats.roi > 0 ? "bg-green-900/20 text-green-400 border-green-500/20" : "bg-red-900/20 text-red-400 border-red-500/20"}`}>
                                            <TrendingUp size={14} />
                                            {consensus.stats.roi > 0 ? '+' : ''}${Math.abs(consensus.stats.total_pnl).toLocaleString()} ({consensus.stats.roi}%)
                                        </div>
                                        <div className="text-sm text-red-400 font-mono font-bold flex items-center gap-1 bg-red-900/10 px-3 py-1 rounded border border-red-500/10">
                                            Max DD: <span className="opacity-50">%</span>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-4 w-full border-t border-yellow-500/20 pt-4">
                                        <div>
                                            <div className="text-xs text-yellow-500/70 font-bold uppercase">1X2</div>
                                            <div className="text-xl font-bold text-white">85</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-yellow-500/70 font-bold uppercase">HCP</div>
                                            <div className="text-xl font-bold text-white">90</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-yellow-500/70 font-bold uppercase">O/U</div>
                                            <div className="text-xl font-bold text-white">92</div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* 2. TIER 1 MODELS (Grid of 3) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {tier1.map((model: any, idx: number) => {
                            const isFollowing = following.includes(model.id);
                            const totalFunds = model.wallets.core + model.wallets.challenge + model.wallets.high_yield;

                            return (
                                <Card
                                    key={model.id}
                                    onClick={() => setSelectedModel(model)}
                                    className={`cursor-pointer border-zinc-800 hover:border-zinc-600 transition-all p-6 group relative overflow-hidden ${idx === 0 ? 'bg-gradient-to-br from-zinc-900/80 to-yellow-900/20 border-yellow-500/30' : 'bg-zinc-900/40'}`}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <span className="text-6xl font-black text-white">{idx + 1}</span>
                                    </div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`text - 4xl font - black ${idx === 0 ? 'text-yellow-500' : 'text-zinc-700/50'} `}>0{idx + 1}</div>
                                            {idx === 0 && <Trophy size={24} className="text-yellow-500 animate-pulse" />}
                                        </div>
                                        <TrendingUp className={model.stats.roi > 0 ? "text-emerald-500" : "text-red-500"} />
                                    </div>

                                    <h3 className="text-lg font-bold text-white mb-2">{model.name}</h3>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase rounded border border-zinc-700">{model.style}</span>
                                    </div>

                                    <div className="text-3xl font-black text-white mb-1">
                                        ${totalFunds.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                    <div className={`text - sm font - mono mb - 4 ${model.stats.roi > 0 ? "text-emerald-400" : "text-red-400"} `}>
                                        {model.stats.roi > 0 ? '+' : ''}${model.stats.total_pnl.toLocaleString()} ({model.stats.roi}%)
                                    </div>

                                    <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
                                        <div className="text-[10px] text-zinc-500 uppercase">
                                            RATING: <span className="text-white">{(50 + model.stats.roi / 2).toFixed(1)}</span>
                                            <span className="mx-1">•</span>
                                            TIER: <span className="text-white">AMATEUR</span>
                                        </div>
                                        <button
                                            onClick={(e) => toggleFollow(e, model.id)}
                                            className={`p - 1.5 rounded transition - colors ${isFollowing ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 hover:bg-zinc-800'} `}
                                        >
                                            <Bell size={14} />
                                        </button>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>

                    {/* 3. TIER 2 MODELS (Grid of 3 - Darker/Smaller) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-75 hover:opacity-100 transition-opacity">
                        {tier2.map((model: any, idx: number) => {
                            const totalFunds = model.wallets.core + model.wallets.challenge + model.wallets.high_yield;
                            const isFollowing = following.includes(model.id);

                            return (
                                <Card
                                    key={model.id}
                                    onClick={() => setSelectedModel(model)}
                                    className="cursor-pointer bg-black/40 border-zinc-800/50 hover:border-zinc-700 transition-all p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono text-zinc-700 text-sm">0{idx + 4}</span>
                                        <div>
                                            <div className="text-sm font-bold text-zinc-400">{model.name}</div>
                                            <div className={`text - [10px] ${model.stats.roi > 0 ? 'text-emerald-500' : 'text-red-500'} `}>
                                                {model.stats.roi}%
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div className="font-mono font-bold text-white">${totalFunds.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                        <button
                                            onClick={(e) => toggleFollow(e, model.id)}
                                            className={`p - 1.5 rounded transition - colors ${isFollowing ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-600 hover:text-zinc-400'} `}
                                        >
                                            <Bell size={14} />
                                        </button>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>


                </div>


                {/* Model Profile Modal */}
                <ModelProfileModal
                    model={selectedModel}
                    isOpen={!!selectedModel}
                    onClose={() => setSelectedModel(null)}
                    wallet={wallet}
                    onOpenWarRoom={setWarRoomMatch}
                />

                {/* Toast Container */}
                <div className="fixed bottom-6 right-6 z-[10001] space-y-2 pointer-events-none">
                    {toasts.map(toast => (
                        <div
                            key={toast.id}
                            className={`px - 4 py - 3 rounded - lg shadow - lg border backdrop - blur - md flex items - center gap - 3 animate - fade -in -up transition - all ${toast.type === 'success'
                                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
                                : 'bg-zinc-900/80 border-zinc-700 text-zinc-300'
                                } `}
                        >
                            {toast.type === 'success' ? <Check size={16} className="text-emerald-400" /> : <Bell size={16} />}
                            <span className="text-sm font-medium">{toast.message}</span>
                        </div>
                    ))}
                </div>
            </div>
            <WarRoomChat
                isOpen={!!warRoomMatch}
                match={warRoomMatch}
                onClose={() => setWarRoomMatch(null)}
            />
        </>
    );
}

// ... COPY EXISTING MODAL CODE ...
function ModelProfileModal({ model, isOpen, onClose, wallet, onOpenWarRoom }: { model: any, isOpen: boolean, onClose: () => void, wallet: any, onOpenWarRoom: (match: any) => void }) {
    const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'ledger'>('overview');
    const [unlockedPredictions, setUnlockedPredictions] = useState<number[]>([]);
    const [modelLedger, setModelLedger] = useState<any[]>([]);

    const handleUnlock = (id: number, cost: number) => {
        if (wallet.spend(cost, `Unlock ${model.name} Prediction`)) {
            setUnlockedPredictions(prev => [...prev, id]);
        } else {
            // Shake effect later?
            alert("Insufficient Credits! Follow more models to earn airdrops.");
        }
    };


    useEffect(() => {
        if (isOpen && model) {
            setActiveTab('overview');
            // Fetch daily top picks (supports both legacy array and new per-model dict)
            fetch('/daily_top_picks.json')
                .then(res => res.json())
                .then(data => {
                    let picks = [];
                    if (Array.isArray(data)) {
                        // Legacy global consensus
                        picks = data;
                    } else if (data && typeof data === 'object') {
                        // New per-model competition format
                        // Try to find picks for this specific model
                        // Note: Keys in JSON must match model.name (e.g. "DeepSeek V3")
                        picks = data[model.name] || data["Consensus"] || [];
                    }
                    setModelLedger(picks);
                })
                .catch(e => console.error("Failed to load model ledger", e));
        }
    }, [isOpen, model?.name]);

    if (!isOpen || !model) return null;

    // Derived Attributes for Radar (Mock-ish but based on style)
    const isAggro = model.style.includes('Aggressive') || model.style.includes('Volatile') || model.style.includes('Growth');
    const isSafe = model.style.includes('Conservative') || model.style.includes('Value');

    // Scale 1-10
    const risk = isAggro ? 9 : isSafe ? 2 : 5;
    const alpha = isAggro ? 8 : isSafe ? 4 : 6;
    const accuracy = isSafe ? 8 : 6;
    const recovery = 7;
    const consist = isSafe ? 9 : 4;

    // Team Color Helper
    const getTeamColor = (team: string) => {
        const colors: any = {
            'Man City': '#6CABDD', 'Arsenal': '#EF0107', 'Liverpool': '#C8102E',
            'Real Madrid': '#FEBE10', 'Barcelona': '#A50044', 'Bayern': '#DC052D',
            'Dortmund': '#FDE100', 'Inter': '#010E80', 'Juventus': '#000000',
            'PSG': '#004171', 'Marseille': '#009DFF'
        };
        return colors[team] || '#52525b';
    };

    // Mock Live Sports Predictions Strategy
    const generateMatchPredictions = (modelName: string, style: string) => {
        const leagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Champions League'];
        const teams = [
            { home: 'Man City', away: 'Arsenal', league: 'Premier League', h2h: 'City 3-1 Arsenal', form: { h: 'WWWDW', a: 'WWWDL' } },
            { home: 'Real Madrid', away: 'Barcelona', league: 'La Liga', h2h: 'Real 1-2 Barca', form: { h: 'WWWWW', a: 'WWDDW' } },
            { home: 'Liverpool', away: 'Chelsea', league: 'Premier League', h2h: 'Liv 4-1 Che', form: { h: 'LWWWW', a: 'DLLLW' } },
            { home: 'Bayern', away: 'Dortmund', league: 'Bundesliga', h2h: 'Bay 2-2 Dor', form: { h: 'WWLWW', a: 'WWWWW' } }
        ];

        // Randomly pick 3 matches
        const len = modelName.length;
        const selectedMatches = [
            teams[len % teams.length],
            teams[(len + 1) % teams.length],
            teams[(len + 2) % teams.length]
        ];

        const predictionTypes = ['Home Win', 'Draw', 'Away Win', 'Over 2.5 Goals', 'Both Teams to Score'];

        return selectedMatches.map((match, i) => {
            const isHighRisk = model.style.includes('Aggressive');
            const odds = isHighRisk ? (2.5 + Math.random() * 2).toFixed(2) : (1.5 + Math.random() * 0.8).toFixed(2);

            return {
                id: i,
                league: match.league,
                match: `${match.home} vs ${match.away} `,
                home: match.home,
                away: match.away,
                form: match.form,
                h2h: match.h2h,
                prediction: predictionTypes[(len + i) % predictionTypes.length],
                odds: odds,
                confidence: (60 + Math.random() * 30).toFixed(0),
                status: 'PENDING',
                time: 'Today 20:45',
                insight: isHighRisk ? `Model sees huge value in this contrarian play.` : `Safe bet aligned with historical trends.`,
            };
        });
    };

    const activePredictions = generateMatchPredictions(model.name, model.style);

    return createPortal(
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4" onClick={onClose}>
            <div className="w-full h-full md:h-auto max-w-4xl bg-zinc-950 border-x-0 border-y-0 md:border md:border-zinc-800 md:rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row md:max-h-[90vh]" onClick={e => e.stopPropagation()}>

                {/* Left Panel: Profile & Radar */}
                <div className="w-full md:w-[400px] border-b md:border-b-0 md:border-r border-zinc-900 bg-zinc-900/30 p-6 flex flex-col shrink-0">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="text-xs font-mono text-zinc-500 uppercase">AI Sports Analyst</div>
                            <h2 className="text-2xl font-black text-white">{model.name}</h2>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded border border-zinc-700">
                                {model.style}
                            </span>
                        </div>
                    </div>

                    <div className="flex space-x-2 mb-6 border-b border-zinc-800 pb-2">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex - 1 pb - 2 text - sm font - bold transition - colors ${activeTab === 'overview' ? 'text-white border-b-2 border-yellow-500' : 'text-zinc-500 hover:text-zinc-300'} `}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('signals')}
                            className={`flex - 1 pb - 2 text - sm font - bold transition - colors flex items - center justify - center gap - 2 ${activeTab === 'signals' ? 'text-white border-b-2 border-yellow-500' : 'text-zinc-500 hover:text-zinc-300'} `}
                        >
                            <Zap size={14} /> Today's Picks
                        </button>
                        <button
                            onClick={() => setActiveTab('ledger')}
                            className={`flex - 1 pb - 2 text - sm font - bold transition - colors flex items - center justify - center gap - 2 ${activeTab === 'ledger' ? 'text-white border-b-2 border-yellow-500' : 'text-zinc-500 hover:text-zinc-300'} `}
                        >
                            <Medal size={14} /> 结算单
                        </button>
                    </div>

                    {activeTab === 'overview' ? (
                        <>
                            {/* Radar Chart Area */}
                            <div className="flex-1 flex items-center justify-center min-h-[250px] relative">
                                <RadarChart stats={{ risk, alpha, accuracy, recovery, consist }} />
                            </div>

                            {/* Key Stats */}
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="p-3 bg-zinc-900/50 rounded border border-zinc-800">
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Winning Yield</div>
                                    <div className={`text - xl font - mono font - bold ${model.stats.roi > 0 ? "text-emerald-400" : "text-red-400"} `}>
                                        {model.stats.roi}%
                                    </div>
                                </div>
                                <div className="p-3 bg-zinc-900/50 rounded border border-zinc-800">
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Net Profit</div>
                                    <div className={`text - xl font - mono font - bold ${model.stats.total_pnl > 0 ? "text-emerald-400" : "text-red-400"} `}>
                                        ${model.stats.total_pnl}
                                    </div>
                                </div>
                                <div className="p-3 bg-zinc-900/50 rounded border border-zinc-800 col-span-2">
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Strategy Allocation</div>
                                    <div className="flex h-2 rounded-full overflow-hidden">
                                        {model.wallets ? (
                                            <>
                                                <div className="bg-emerald-500" style={{ width: `${(model.wallets.core / (model.wallets.core + model.wallets.challenge + model.wallets.high_yield)) * 100}% ` }} />
                                                <div className="bg-blue-500" style={{ width: `${(model.wallets.challenge / (model.wallets.core + model.wallets.challenge + model.wallets.high_yield)) * 100}% ` }} />
                                                <div className="bg-purple-500" style={{ width: `${(model.wallets.high_yield / (model.wallets.core + model.wallets.challenge + model.wallets.high_yield)) * 100}% ` }} />
                                            </>
                                        ) : (
                                            <div className="bg-zinc-800 w-full" />
                                        )}
                                    </div>
                                    <div className="flex justify-between mt-1 text-[9px] text-zinc-500 font-mono">
                                        <span>Safe (1X2)</span>
                                        <span>Handicap</span>
                                        <span>Correct Score</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : activeTab === 'signals' ? (
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-2">
                                <h4 className="text-yellow-500 text-xs font-bold uppercase mb-1 flex items-center gap-2"><Lock size={12} /> Premium Tips</h4>
                                <p className="text-zinc-400 text-[10px]">Real-time match predictions generated by {model.name}. Verified by Blockchain.</p>
                            </div>

                            {activePredictions.map((pred, i) => {
                                const isPremium = i % 2 === 0; // Simulate every other pick as Premium
                                const isLocked = isPremium && !unlockedPredictions.includes(pred.id);
                                const unlockCost = 10;

                                return (
                                    <div key={i} className="relative bg-white text-black rounded-sm overflow-hidden shadow-lg transform transition-transform hover:-translate-y-1">
                                        {/* Ticket Top: Perforation Effect */}
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900/50" style={{ backgroundImage: 'radial-gradient(circle, #09090b 2px, transparent 2.5px)', backgroundSize: '8px 8px' }}></div>

                                        {/* LOCKED OVERLAY */}
                                        {isLocked && (
                                            <div className="absolute inset-0 z-20 bg-zinc-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                                                <Lock size={32} className="text-yellow-500 mb-3" />
                                                <h4 className="text-white font-black uppercase tracking-wider text-lg mb-1">Premium Alpha</h4>
                                                <p className="text-zinc-500 text-xs mb-4">High Confidence Play detected by {model.name}.</p>
                                                <button
                                                    onClick={() => handleUnlock(pred.id, unlockCost)}
                                                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-6 rounded-full flex items-center gap-2 transition-transform active:scale-95"
                                                >
                                                    <Wallet size={14} /> UNLOCK ({unlockCost} CR)
                                                </button>
                                            </div>
                                        )}

                                        {/* Match Header with Team Colors */}
                                        <div className={`flex h-12 ${isLocked ? 'blur-sm grayscale' : ''}`}>
                                            <div className="flex-1 flex items-center justify-center font-black text-white text-sm uppercase tracking-wider relative overflow-hidden" style={{ backgroundColor: getTeamColor(pred.home) }}>
                                                <div className="relative z-10">{pred.home}</div>
                                                <div className="absolute inset-0 bg-black/10"></div>
                                            </div>
                                            <div className="w-8 flex items-center justify-center bg-zinc-200 text-zinc-900 font-bold text-xs">VS</div>
                                            <div className="flex-1 flex items-center justify-center font-black text-white text-sm uppercase tracking-wider relative overflow-hidden" style={{ backgroundColor: getTeamColor(pred.away) }}>
                                                <div className="relative z-10">{pred.away}</div>
                                                <div className="absolute inset-0 bg-black/10"></div>
                                            </div>
                                        </div>

                                        {/* Ticket Body */}
                                        <div className={`p-4 bg-zinc-100 ${isLocked ? 'blur-sm' : ''}`}>
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{pred.league}</span>
                                                <span className="text-[10px] font-mono text-zinc-500">{pred.time}</span>
                                            </div>

                                            <div className="bg-white border-2 border-dashed border-zinc-300 p-3 mb-3">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-xs font-bold uppercase text-zinc-500">Selection</span>
                                                    <span className="text-2xl font-black text-zinc-900">{pred.prediction.toUpperCase()}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-mono text-zinc-400">MARKET: FULL TIME RESULT</span>
                                                    <div className="bg-black text-white px-2 py-0.5 text-sm font-bold font-mono">@{pred.odds}</div>
                                                </div>
                                            </div>

                                            {/* Deep Data: Form & Insight */}
                                            <div className="grid grid-cols-2 gap-2 mb-3 text-[10px] font-mono">
                                                <div className="bg-zinc-200 p-2 rounded-sm">
                                                    <div className="text-zinc-500 mb-0.5">FORM (Last 5)</div>
                                                    <div className="flex justify-between">
                                                        <span>H: <span className="font-bold">{pred.form.h}</span></span>
                                                        <span>A: <span className="font-bold">{pred.form.a}</span></span>
                                                    </div>
                                                </div>
                                                <div className="bg-zinc-200 p-2 rounded-sm">
                                                    <div className="text-zinc-500 mb-0.5">HEAD TO HEAD</div>
                                                    <div className="font-bold truncate">{pred.h2h}</div>
                                                </div>
                                            </div>

                                            <div className="mb-3 text-[10px] text-zinc-600 italic bg-zinc-200/50 p-2 border-l-2 border-yellow-500">
                                                "{pred.insight}"
                                            </div>

                                            <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
                                                <div className="flex items-center gap-1">
                                                    <Shield size={12} className="text-zinc-400" />
                                                    <span className="text-[10px] font-bold text-zinc-500">CONFIDENCE: {pred.confidence}%</span>
                                                </div>
                                                {/* Fake Barcode & War Room Button */}
                                                <div className="flex items-center gap-2">
                                                    <div className="h-4 w-12 bg-zinc-900 opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, transparent 50%, #000 50%)', backgroundSize: '4px 100%' }}></div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onOpenWarRoom(pred); }}
                                                        className="bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded shadow hover:bg-red-500 flex items-center gap-1"
                                                    >
                                                        <Activity size={10} className="animate-pulse" /> WAR ROOM
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : activeTab === 'ledger' ? (
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-2">
                                <h4 className="text-emerald-500 text-xs font-bold uppercase mb-1 flex items-center gap-2"><Medal size={12} /> 每日钻石 4 - 共识精选</h4>
                                <p className="text-zinc-400 text-[10px]">AI 加权共识推荐的每日 4 笔最优选单。自动结算。</p>
                            </div>
                            {modelLedger.length === 0 && (
                                <div className="py-12 text-center text-zinc-600 italic text-xs">暂无结算记录...</div>
                            )}
                            {modelLedger.map((pick: any, i: number) => (
                                <div key={i} className="p-3 bg-zinc-900/20 border border-zinc-800/50 rounded flex flex-col gap-2 hover:bg-zinc-900/40 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-mono text-zinc-500 uppercase">{pick.category}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${pick.status === 'WON' ? 'bg-emerald-500/20 text-emerald-400' : pick.status === 'LOST' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                            {pick.status}
                                        </span>
                                    </div>
                                    <div className="text-sm font-bold text-white truncate">{pick.match}</div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-400">选项: <span className="text-white font-mono">{pick.selection}</span></span>
                                        <span className="text-zinc-400">赔率: <span className="text-blue-400 font-mono">@{pick.odds}</span></span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-t border-zinc-800 pt-2 mt-1">
                                        <span className="text-zinc-500">{pick.date}</span>
                                        <span className={`font-mono font-bold ${(pick.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {(pick.pnl || 0) >= 0 ? '+' : ''}${(pick.pnl || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>

                {/* Right Panel: History Log */}
                <div className="flex-1 flex flex-col bg-zinc-950 p-6 min-h-[400px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <History size={16} /> Decision Log
                        </h3>
                        <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-500">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {model.history && model.history.map((day: any, i: number) => (
                            <div key={i} className="p-3 bg-zinc-900/20 border border-zinc-800/50 rounded flex items-center justify-between hover:bg-zinc-900/40 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="text-xs font-mono text-zinc-500 w-24 text-center bg-zinc-900 rounded py-1">
                                        {day.date}
                                    </div>
                                    <div className="text-sm text-zinc-300">
                                        <span className="font-bold text-white">{day.bets_placed}</span> bets placed
                                    </div>
                                </div>
                                <div className={`font - mono font - bold text - sm ${day.total_pnl > 0 ? "text-emerald-400" : "text-red-400"} `}>
                                    {day.total_pnl > 0 ? '+' : ''}${day.total_pnl}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
}



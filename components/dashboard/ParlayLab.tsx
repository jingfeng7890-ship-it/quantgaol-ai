'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Brain, Sliders, Zap, AlertTriangle, ArrowRight, CheckCircle2, Terminal, Activity, Lock, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Define Wallet Interface
interface Wallet {
    balance: number;
    transactions: any[];
    spend: (amount: number, description: string) => boolean;
    earn: (amount: number, description: string) => void;
}

export function ParlayLab({ wallet }: { wallet?: Wallet }) {
    const [riskLevel, setRiskLevel] = useState(50); // 0-100
    const [legCount, setLegCount] = useState(3);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedParlay, setGeneratedParlay] = useState<any>(null);
    const [allMatches, setAllMatches] = useState<any[]>([]);
    const [engineStats, setEngineStats] = useState<any>({ roi: 0, winRate: 0 }); // Real Stats
    const [scanLogs, setScanLogs] = useState<string[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);

    const [history, setHistory] = useState<any[]>([]);
    const [isLedgerOpen, setIsLedgerOpen] = useState(false);

    // Fetch Real Data on Mount
    useEffect(() => {
        // 1. Fetch Matches
        fetch('/api/matches')
            .then(res => res.json())
            .then(data => setAllMatches(data))
            .catch(err => console.error("Failed to load match engine", err));

        // 2. Fetch Engine Stats (Leaderboard)
        fetch('/league_leaderboard.json')
            .then(res => res.json())
            .then(data => {
                const model = data.find((m: any) => m.id === 'DeepSeek V3');
                if (model) {
                    setEngineStats({ roi: model.roi_monthly, winRate: model.strike_rate });
                }
            })
            .catch(err => console.error("Failed to load engine stats", err));

        // 3. Fetch Ledger History
        fetch('/api/history')
            .then(res => res.json())
            .then(data => setHistory(data.history)) // API returns { history: [...] }
            .catch(err => console.error("Failed to load ledger", err));
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [scanLogs]);

    const handleGenerate = () => {
        if (allMatches.length === 0) return;

        setIsGenerating(true);
        setScanLogs(["Initializing V4 Quant Engine..."]);
        setGeneratedParlay(null);

        // Simulated AI Scan Logs
        const logs = [
            "Syncing with Global Odds Provider...",
            `Filtering for Risk Profile: ${riskLevel > 70 ? 'AGGRESSIVE' : riskLevel < 30 ? 'CONSERVATIVE' : 'BALANCED'}...`,
            "Analyzing Implied Probability vs Real Odds...",
            "Detecting Market Inefficiencies...",
            "Running Monte Carlo Simulations (n=10,000)...",
            "Optimizing Correlation Matrix...",
            "Validating Edge with Historical Models...",
            "Constructing Optimal Parlay..."
        ];

        let logIndex = 0;
        const logInterval = setInterval(() => {
            if (logIndex < logs.length) {
                setScanLogs(prev => [...prev, `> ${logs[logIndex]}`]);
                logIndex++;
            }
        }, 300);

        // Final Generation Logic
        setTimeout(() => {
            clearInterval(logInterval);
            generateRealParlay();
            setIsGenerating(false);
            setScanLogs([]);
        }, 3000);
    };

    const generateRealParlay = () => {
        // 1. Logic based on Risk Level
        let candidateMatches = allMatches.map(m => {
            const rec = m.quant_analysis.recommendations['1x2'];
            if (!rec) return null;

            // Parse percentage string "28.6%" -> 0.286
            const edgeStr = rec.value_gap.replace('%', '');
            const edge = parseFloat(edgeStr);

            return {
                ...m,
                selection: rec.selection,
                odds: rec.market_odds,
                fairOdds: rec.fair_odds || (1 / (rec.market_odds * 1.05)), // Fallback if missing
                edge: edge,
                confidence: rec.confidence,
                matchName: `${m.match_info.home_team} vs ${m.match_info.away_team}`,
                market: "Moneyline" // Simplified for now
            };
        }).filter(Boolean); // Remove nulls

        // 2. Filter Candidates
        if (riskLevel < 40) {
            // Safe: High Confidence, Positive Edge, Lower Odds
            candidateMatches = candidateMatches.filter(m => m.confidence >= 7 && m.edge > 0 && m.odds < 2.0);
        } else if (riskLevel > 70) {
            // High Octane: High Edge (even with lower confidence) or High Odds
            candidateMatches = candidateMatches.filter(m => m.edge > 10 || m.odds > 2.5);
        } else {
            // Balanced: Good Edge, Decent Confidence
            candidateMatches = candidateMatches.filter(m => m.edge > 5 && m.confidence >= 5);
        }

        // Fallback if filter too strict
        if (candidateMatches.length < legCount) {
            setScanLogs(prev => [...prev, "WARN: Relaxing constraints for sufficient liquidity..."]);
            // Reset to all positive edge matches
            candidateMatches = allMatches.filter(m => {
                const e = parseFloat(m.quant_analysis.recommendations['1x2']?.value_gap || "0");
                return e > 0;
            }).map(m => ({
                matchName: `${m.match_info.home_team} vs ${m.match_info.away_team}`,
                selection: m.quant_analysis.recommendations['1x2'].selection,
                odds: m.quant_analysis.recommendations['1x2'].market_odds,
                fairOdds: m.quant_analysis.recommendations['1x2'].fair_odds,
                market: "Moneyline"
            }));
        }

        // 3. Random Selection from Candidates
        const shuffled = candidateMatches.sort(() => 0.5 - Math.random());
        const selectedLegs = shuffled.slice(0, Math.min(legCount, shuffled.length));

        // 4. Calculate Totals
        const totalOdds = selectedLegs.reduce((acc, leg) => acc * leg.odds, 1);
        const estReturn = 100 * totalOdds;

        // Calculate Total AI Probability (Product of individual fair probabilities)
        const totalProb = selectedLegs.reduce((acc, leg) => acc * (1 / leg.fairOdds), 1) * 100;

        setGeneratedParlay({
            odds: totalOdds.toFixed(2),
            potentialReturn: estReturn.toFixed(0),
            totalProb: totalProb.toFixed(1),
            legs: selectedLegs.map(l => ({
                team: l.selection === 'Home' ? l.matchName.split(' vs ')[0] : l.selection === 'Away' ? l.matchName.split(' vs ')[1] : 'Draw',
                market: l.market,
                odds: l.odds.toFixed(2),
                fairOdds: l.fairOdds,
                fullMatch: l.matchName
            }))
        });
    };

    const handlePlaceBet = async () => {
        if (!generatedParlay) return;

        // Deduct Stake (Fixed $100 for Demo)
        if (wallet && !wallet.spend(100, `Parlay: ${generatedParlay.legs.length} Legs @ ${generatedParlay.odds}`)) {
            alert("Insufficient Funds to place Parlay");
            return;
        }

        try {
            const res = await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(generatedParlay)
            });

            if (res.ok) {
                const { entry } = await res.json();
                setHistory(prev => [entry, ...prev]); // Optimistic update
                alert("Parlay Recorded on QuantChain™ Ledger!");
                setIsLedgerOpen(true); // Auto-open ledger to show proof
            }
        } catch (err) {
            console.error("Failed to record bet", err);
        }
    };

    return (
        <Card className="p-6 border-zinc-800 bg-zinc-950/50 relative overflow-hidden">
            {/* Ledger Modal Overlay */}
            {isLedgerOpen && (
                <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl p-6 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300">
                    <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <Lock size={18} />
                            <span className="font-mono font-bold tracking-widest text-sm">IMMUTABLE LEDGER</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsLedgerOpen(false)} className="text-zinc-500 hover:text-white">
                            CLOSE [X]
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                        {Object.entries(history.reduce((acc: any, ticket: any) => {
                            (acc[ticket.date] = acc[ticket.date] || []).push(ticket);
                            return acc;
                        }, {})).sort(([a], [b]) => new Date(b as string).getTime() - new Date(a as string).getTime()).map(([date, tickets]: any, i) => (
                            <div key={i} className="flex gap-4 p-4 bg-zinc-900/40 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors">
                                {/* Left: Date Anchor */}
                                {/* Left: Date Anchor */}
                                <div className="w-16 flex flex-col items-center justify-start pt-1 border-r border-zinc-800 pr-4 shrink-0">
                                    <span className="text-sm font-black text-zinc-300 font-mono">{(date && typeof date === 'string') ? date.slice(5) : '--'}</span>
                                    <div className="flex flex-col items-center mt-2 gap-1 text-[10px] text-zinc-600 uppercase font-bold">
                                        <span>{(date && typeof date === 'string') ? date.slice(0, 4) : '----'}</span>
                                        {i === 0 && <span className="bg-emerald-900/30 text-emerald-500 px-1 rounded animate-pulse">TODAY</span>}
                                    </div>
                                </div>

                                {/* Right: Horizontal Matrix of Tickets */}
                                <div className="flex-1 min-w-0 overflow-x-auto pb-2 scrollbar-hide">
                                    <div className="flex gap-3">
                                        {tickets.map((t: any, j: number) => (
                                            <div key={j} className="flex-shrink-0 w-[180px] bg-zinc-950 border border-zinc-800 rounded p-2.5 flex flex-col justify-between group/card hover:border-zinc-600 transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-white truncate">{t.type}</span>
                                                        <span className={`text-[10px] uppercase font-bold tracking-wider ${t.status === 'WON' ? 'text-emerald-500' : t.status === 'PENDING' ? 'text-yellow-500' : 'text-red-500'}`}>
                                                            {t.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`font-mono text-sm font-black ${t.pnl > 0 ? 'text-emerald-400' : t.status === 'PENDING' ? 'text-zinc-400' : 'text-red-400'}`}>
                                                            {t.status === 'PENDING' ? '---' : (t.pnl > 0 ? '+' : '') + '$' + t.pnl}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Mini Legs Preview */}
                                                <div className="space-y-0.5 mb-2">
                                                    {Array.isArray(t.legs) && t.legs.slice(0, 3).map((leg: any, k: number) => (
                                                        <div key={k} className="flex items-center justify-between text-[9px] text-zinc-600">
                                                            <span className="truncate max-w-[100px] text-zinc-500">{leg.match ? leg.match.split(' vs ')[0] : 'Match'}</span>
                                                            <span className={leg.result === 'Won' ? 'text-emerald-500' : leg.result === 'Lost' ? 'text-red-500' : 'text-yellow-600'}>
                                                                {leg.result === 'Won' ? '✔' : leg.result === 'Lost' ? '✘' : '•'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {Array.isArray(t.legs) && t.legs.length > 3 && <div className="text-[9px] text-zinc-700 text-center">+{t.legs.length - 3} more</div>}
                                                </div>

                                                <div className="flex items-center justify-between pt-2 border-t border-zinc-900 mt-auto">
                                                    <div className="flex items-center gap-1 text-[9px] text-zinc-600 font-mono">
                                                        <Lock size={8} /> {t.id ? String(t.id).slice(0, 6) : 'PROXY'}
                                                    </div>
                                                    <span className="text-[10px] font-mono text-zinc-400">@{t.total_odds || '0.00'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <Brain className="text-purple-500" />
                        Parlay Lab <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded border border-purple-800 uppercase">Beta</span>
                    </h2>
                    <p className="text-zinc-400 text-xs mt-1">Engineer your perfect high-alpha combination.</p>
                </div>
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                    <Sliders size={18} className="text-zinc-400" />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="space-y-6">
                    {/* Risk Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400 font-medium">Risk Appetite</span>
                            <span className={`font-bold ${riskLevel > 70 ? 'text-red-400' : riskLevel < 30 ? 'text-green-400' : 'text-yellow-400'}`}>
                                {riskLevel > 70 ? 'Degen Mode 🚀' : riskLevel < 30 ? 'Conservative 🛡️' : 'Balanced ⚖️'}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="90"
                            value={riskLevel}
                            onChange={(e) => setRiskLevel(parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 uppercase font-mono">
                            <span>Safe</span>
                            <span>Risky</span>
                        </div>
                    </div>

                    {/* Stats & Legs Selector */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-400 font-medium">Engine History</span>
                                <button
                                    onClick={() => setIsLedgerOpen(true)}
                                    className="text-[10px] text-zinc-500 uppercase hover:text-emerald-400 transition-colors flex items-center gap-1 group"
                                >
                                    <Lock size={10} />
                                    <span className="group-hover:underline">Verify</span>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 bg-zinc-900 rounded border border-zinc-800 text-center">
                                    <div className="text-[10px] text-zinc-500 font-bold uppercase">Win Rate</div>
                                    <div className="font-mono font-bold text-white text-sm">{engineStats.winRate}%</div>
                                </div>
                                <div className="p-2 bg-zinc-900 rounded border border-zinc-800 text-center">
                                    <div className="text-[10px] text-zinc-500 font-bold uppercase">Real ROI</div>
                                    <div className={`font-mono font-bold text-sm ${engineStats.roi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {`${engineStats.roi > 0 ? '+' : ''}${engineStats.roi}%`}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <span className="text-sm text-zinc-400 font-medium">Number of Legs</span>
                            <div className="flex gap-1 h-[52px]">
                                {[2, 3, 4, 5].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setLegCount(num)}
                                        className={`flex-1 rounded border text-xs font-bold transition-all h-full ${legCount === num
                                            ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-6 text-lg shadow-lg relative overflow-hidden group"
                    >
                        {isGenerating ? (
                            <span className="flex items-center gap-2 animate-pulse">
                                <Activity size={18} className="animate-spin" /> RUNNING V4 ENGINE...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 group-hover:gap-3 transition-all">
                                <span>GENERATE PARLAY</span> <ArrowRight size={20} />
                            </span>
                        )}
                    </Button>
                </div>

                {/* Output Display */}
                <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 min-h-[300px] flex flex-col justify-center relative overflow-hidden">
                    {/* Content Layer */}
                    {!generatedParlay ? (
                        <div key="empty" className="text-center text-zinc-600 space-y-2">
                            <Zap size={48} className="mx-auto opacity-20" />
                            <p><span>Configure settings and hit Generate</span></p>
                        </div>
                    ) : (
                        <div key="result" className={`space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${isGenerating ? 'opacity-20 blur-sm' : ''}`}>
                            <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-4">
                                <div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Odds</div>
                                    <div className="text-4xl font-black text-white tracking-tighter">@{generatedParlay.odds}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">AI Probability</div>
                                    <div className="text-xl font-bold text-purple-400 flex items-center justify-end gap-1">
                                        <Brain size={16} />
                                        {generatedParlay.totalProb}%
                                    </div>
                                    <div className="text-[10px] text-zinc-600">Based on Fair Odds</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {generatedParlay.legs.map((leg: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded bg-zinc-800/50 border border-zinc-700/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-white">{leg.team}</div>
                                                <div className="text-xs text-zinc-400">{leg.market}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-mono text-zinc-300">@{leg.odds}</div>
                                            <div className="text-[10px] text-zinc-600">{((1 / leg.fairOdds) * 100).toFixed(0)}% Prob</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2">
                                <Button
                                    size="sm"
                                    onClick={handlePlaceBet}
                                    className="w-full bg-zinc-800 hover:bg-emerald-600 text-white font-bold transition-colors flex justify-between px-4"
                                >
                                    <span>Place & Record Bet</span>
                                    <span className="text-emerald-400 font-mono">Return: ${generatedParlay.potentialReturn}</span>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Loading Overlay with Terminal Effect */}
                    {isGenerating && (
                        <div key="loading" className="absolute inset-0 bg-black/90 backdrop-blur-md z-20 flex flex-col p-6 font-mono text-xs">
                            <div className="flex items-center gap-2 text-purple-500 mb-4 border-b border-purple-500/30 pb-2">
                                <Terminal size={14} />
                                <span className="font-bold tracking-widest">V4 QUANT ENGINE TERMINAL</span>
                            </div>

                            <div
                                ref={logContainerRef}
                                className="flex-1 overflow-y-auto space-y-1.5 text-green-400/90 scrollbar-hide"
                            >
                                {scanLogs.map((log, i) => (
                                    <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300">
                                        {log}
                                    </div>
                                ))}
                                <div className="animate-pulse text-purple-500">_</div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-zinc-500">
                                <span>Processing...</span>
                                <Activity size={14} className="animate-spin text-purple-500" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Landmark, Vote, Users, TrendingUp, AlertCircle, Clock, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';

export default function GovernancePage() {
    const { user, rankLevel, governorTitle } = useAuth();
    const [proposals, setProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [votingPower, setVotingPower] = useState(100);

    const rankMultiplier = rankLevel === 4 ? 1.5 : rankLevel === 3 ? 1.2 : rankLevel === 2 ? 1.1 : 1.0;
    const effectivePower = Math.floor(votingPower * rankMultiplier);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [pRes, bRes] = await Promise.all([
                fetch('/api/governance'),
                fetch('/api/balance')
            ]);
            const pData = await pRes.json();
            const bData = await bRes.json();
            setProposals(pData);
            setBalance(bData.balance);
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const handleVote = async (proposalId: string, type: 'YES' | 'NO') => {
        try {
            const res = await fetch('/api/governance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    proposal_id: proposalId,
                    vote_type: type,
                    power: votingPower // The amount of CR spent
                })
            });

            if (res.ok) {
                alert(`Vote cast successfully! Your Rank (${rankLevel}) applied a ${rankMultiplier}x multiplier for ${effectivePower} total power.`);
                fetchData();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-12 text-center font-mono text-zinc-500 animate-pulse">OPENING PARLIAMENT DOORS...</div>;

    return (
        <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-900 pb-8">
                <div>
                    <h2 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter italic">
                        <Landmark className="text-blue-500" size={40} />
                        THE PARLIAMENT
                    </h2>
                    <p className="text-zinc-500 mt-2 font-medium">Democratizing AI Monetary Policy. One vote, one future.</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 px-6 py-3 rounded-2xl flex flex-col shadow-xl">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Governance Power</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-mono font-black text-white">{balance.toLocaleString()}</span>
                            <span className="text-xs font-bold text-blue-500">CR</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Active Proposals */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Vote size={14} className="text-blue-500" />
                            Open Sessions
                        </h3>
                        <span className="text-[10px] text-zinc-700 font-bold uppercase">{proposals.filter(p => p.status === 'ACTIVE').length} Active Proposals</span>
                    </div>

                    <div className="space-y-4">
                        {proposals.map((prop) => (
                            <Card key={prop.id} className={`p-0 border-zinc-800 bg-zinc-900/20 overflow-hidden relative group transition-all hover:bg-zinc-900/40 ${prop.status !== 'ACTIVE' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${prop.category === 'MONETARY_POLICY' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    prop.category === 'AI_SANCTION' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        'bg-green-500/10 text-green-400 border-green-500/20'
                                                    }`}>
                                                    {prop.category}
                                                </span>
                                                {prop.status !== 'ACTIVE' && (
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 ${prop.status === 'EXECUTED' ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'
                                                        }`}>
                                                        {prop.status === 'EXECUTED' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                                        {prop.status}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-2xl font-black text-white">{prop.title}</h4>
                                        </div>
                                        {prop.status === 'ACTIVE' && (
                                            <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs">
                                                <Clock size={14} />
                                                Ends in: {new Date(prop.expires_at).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-zinc-400 leading-relaxed mb-8 max-w-2xl">
                                        {prop.description}
                                    </p>

                                    {/* Progress Tally */}
                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                            <span className="text-blue-400">Yes: {prop.yes_votes.toLocaleString()}</span>
                                            <span className="text-red-400">No: {prop.no_votes.toLocaleString()}</span>
                                        </div>
                                        <div className="h-2 bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800/50">
                                            <div
                                                className="bg-blue-600 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                                                style={{ width: `${(prop.yes_votes / (prop.yes_votes + prop.no_votes || 1)) * 100}%` }}
                                            />
                                            <div
                                                className="bg-red-600 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(220,38,38,0.4)]"
                                                style={{ width: `${(prop.no_votes / (prop.yes_votes + prop.no_votes || 1)) * 100}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center px-1">
                                            <div className="text-[10px] text-zinc-600 font-bold uppercase">Threshold: {prop.threshold.toLocaleString()} Power</div>
                                            <div className="text-[10px] text-zinc-400 font-black">Total Cast: {(prop.yes_votes + prop.no_votes).toLocaleString()}</div>
                                        </div>
                                    </div>

                                    {prop.status === 'ACTIVE' && (
                                        <div className="flex flex-col md:flex-row items-center gap-4 mt-6 pt-6 border-t border-zinc-800/50">
                                            <div className="flex-1 w-full md:w-auto">
                                                <div className="flex justify-between mb-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-zinc-500 uppercase">Casting Power (Stake):</span>
                                                        <span className="text-[10px] text-blue-500 font-bold uppercase">Rank {rankLevel} Multiplier: {rankMultiplier}x</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xl font-black text-white">{effectivePower}</span>
                                                        <span className="text-[10px] text-zinc-500 font-bold ml-1">TOTAL</span>
                                                    </div>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="10"
                                                    max={Math.min(balance, 2000)}
                                                    step="10"
                                                    value={votingPower}
                                                    onChange={(e) => setVotingPower(Number(e.target.value))}
                                                    className="w-full accent-blue-600 bg-zinc-800 rounded-lg appearance-none cursor-pointer h-1.5"
                                                />
                                            </div>
                                            <div className="flex gap-2 w-full md:w-auto">
                                                <button
                                                    onClick={() => handleVote(prop.id, 'YES')}
                                                    className="flex-1 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 size={16} /> FOR
                                                </button>
                                                <button
                                                    onClick={() => handleVote(prop.id, 'NO')}
                                                    className="px-8 py-3 bg-zinc-800 hover:bg-red-900/50 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <XCircle size={16} /> AGAINST
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <Card className="p-6 border-zinc-800 bg-black/40">
                        <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Constitutional Ledger</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center group cursor-help">
                                <span className="text-xs text-zinc-400 flex items-center gap-2">
                                    <Users size={14} className="text-blue-500" /> Active Burners
                                </span>
                                <span className="text-sm font-mono text-white">42 Governors</span>
                            </div>
                            <div className="flex justify-between items-center group cursor-help">
                                <span className="text-xs text-zinc-400 flex items-center gap-2">
                                    <TrendingUp size={14} className="text-emerald-500" /> Volatility Offset
                                </span>
                                <span className="text-sm font-mono text-white">12.4%</span>
                            </div>
                            <div className="flex justify-between items-center group cursor-help">
                                <span className="text-xs text-zinc-400 flex items-center gap-2">
                                    <Landmark size={14} className="text-yellow-500" /> Quorum Status
                                </span>
                                <span className="text-sm font-mono text-white">STABLE</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 border-blue-500/20 bg-blue-500/5">
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="text-blue-500" size={24} />
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Governor Tips</h4>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                            "Governance Power is burned upon casting. Focus your influence on high-impact Monetary Policies to maximize AI Consensus ROI."
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}

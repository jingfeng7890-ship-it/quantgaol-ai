'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, TrendingUp, ShieldCheck, Crown, ExternalLink } from 'lucide-react';

interface Guild {
    id: string;
    name: string;
    strategy: string;
    aum: string;
    members: number;
    perf_7d: string;
    min_entry: string;
    risk_level: string;
}

export default function GuildsPage() {
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [loading, setLoading] = useState(true);
    const [joinedGuilds, setJoinedGuilds] = useState<string[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [gRes, mRes] = await Promise.all([
                fetch('/api/guilds'),
                fetch('/api/guilds/memberships')
            ]);

            const gData = await gRes.json();
            const mData = await mRes.json();

            if (gData.guilds) {
                const mappedGuilds = gData.guilds.map((g: any) => ({
                    id: g.id,
                    name: g.name,
                    strategy: g.strategy,
                    aum: `$${(Number(g.total_capital) / 1000).toFixed(1)}k`,
                    members: 0, // We could count this but let's keep it simple for now or fetch member count
                    perf_7d: `${Number(g.roi_7d).toFixed(1)}%`,
                    min_entry: `$${g.min_entry}`,
                    risk_level: g.risk_level
                }));
                setGuilds(mappedGuilds);
            }

            if (mData.memberships) {
                setJoinedGuilds(mData.memberships.map((m: any) => m.guild_id));
            }
        } catch (e) {
            console.error("Failed to fetch guilds", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGuild = () => {
        alert("Feature Coming Soon: Create your own syndicate with Pro status!");
    };

    const handleJoinGuild = async (id: string, name: string, minEntry: string) => {
        const amount = parseInt(minEntry.replace('$', ''));
        if (confirm(`Confirm staking ${amount} CR to join ${name}?`)) {
            try {
                const res = await fetch('/api/guilds/join', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ guildId: id, amount })
                });

                if (res.ok) {
                    alert(`Successfully joined ${name}!`);
                    fetchData();
                } else {
                    const err = await res.json();
                    alert(`Error joining guild: ${err.error}`);
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Crown className="text-amber-500" /> Fund Guilds
                    </h1>
                    <p className="text-zinc-400">Join high-performance betting syndicates managed by AI & Pro Cappers.</p>
                </div>
                <Button variant="accent" className="gap-2" onClick={handleCreateGuild}>
                    <Users size={16} /> Create Guild
                </Button>
            </div>

            {/* Guilds Grid */}
            {loading ? (
                <div className="text-zinc-500">Loading Guild Data...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {guilds.map((guild) => {
                        const isJoined = joinedGuilds.includes(guild.id);
                        return (
                            <Card key={guild.id} className="group relative overflow-hidden border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-all duration-300">
                                {/* Decorative Background */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--brand)]/10 to-transparent rounded-bl-full -mr-10 -mt-10 pointer-events-none" />

                                <div className="p-6 relative z-10 space-y-6">
                                    {/* Guild Header */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                                {guild.strategy}
                                            </div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-[var(--brand)] transition-colors">
                                                {guild.name}
                                            </h3>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border ${guild.risk_level === 'Low Risk' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' :
                                            guild.risk_level === 'High Risk' ? 'bg-red-900/30 text-red-400 border-red-800' :
                                                'bg-blue-900/30 text-blue-400 border-blue-800'
                                            }`}>
                                            {guild.risk_level}
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-zinc-800/50">
                                        <div>
                                            <div className="text-xs text-zinc-500 mb-1">7D Performance</div>
                                            <div className="text-2xl font-mono font-bold text-emerald-400">
                                                {guild.perf_7d}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-zinc-500 mb-1">Assets (AUM)</div>
                                            <div className="text-lg font-mono font-bold text-white">
                                                {guild.aum}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-zinc-500 mb-1">Members</div>
                                            <div className="flex items-center gap-1 font-mono text-zinc-300">
                                                <Users size={12} /> {guild.members}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-zinc-500 mb-1">Min Entry</div>
                                            <div className="font-mono text-zinc-300">{guild.min_entry}</div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => handleJoinGuild(guild.id, guild.name, guild.min_entry)}
                                            disabled={isJoined}
                                            className={`flex-1 font-bold border-0 ${isJoined ? 'bg-emerald-600 text-white hover:bg-emerald-600 cursor-default' : 'bg-white text-black hover:bg-zinc-200'}`}
                                        >
                                            {isJoined ? 'Joined' : 'Join Guild'}
                                        </Button>
                                        <Button variant="outline" className="px-3 border-zinc-700 text-zinc-400 hover:text-white">
                                            <ExternalLink size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Info Section */}
            <div className="mt-12 p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/50 flex items-start gap-4">
                <ShieldCheck className="text-emerald-500 shrink-0 mt-1" size={24} />
                <div className="space-y-2">
                    <h3 className="font-bold text-white">Verified Smart Contracts</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        All guild funds are held in non-custodial smart contracts.
                        Performance fees are automatically executed via the Decision Ledger.
                        QuantGoal does not hold user funds directly.
                    </p>
                </div>
            </div>
        </div>
    );
}

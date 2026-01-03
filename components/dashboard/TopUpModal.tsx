'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { X, CreditCard, Zap, Sparkles, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface TopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PACKAGES = [
    { id: 'starter', name: 'Starter Pack', credits: 1000, price: 9.99, popular: false },
    { id: 'governor', name: "Governor's Stash", credits: 5000, price: 39.99, popular: true },
    { id: 'institutional', name: 'Institutional Vault', credits: 15000, price: 99.99, popular: false },
];

export function TopUpModal({ isOpen, onClose }: TopUpModalProps) {
    const { refreshProfile, isPro } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);

    const handlePurchase = async (pkgId: string) => {
        setLoading(pkgId);
        try {
            // Mocking the checkout process
            // In product, this would call /api/checkout/initiate
            const res = await fetch('/api/checkout/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packageId: pkgId })
            });

            if (res.ok) {
                alert("Simulated Purchase Successful! Your vault has been topped up.");
                await refreshProfile();
                onClose();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors z-20"
                >
                    <X size={24} />
                </button>

                <div className="grid md:grid-cols-[1.5fr_1fr]">
                    {/* Left: Packages */}
                    <div className="p-8 md:p-12 space-y-8">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                                <CreditCard className="text-blue-500" />
                                The Treasury
                            </h2>
                            <p className="text-zinc-500 mt-2 font-medium">Refuel your Central Bank credits to maintain global influence.</p>
                        </div>

                        <div className="grid gap-4">
                            {PACKAGES.map((pkg) => (
                                <div
                                    key={pkg.id}
                                    onClick={() => handlePurchase(pkg.id)}
                                    className={`group relative p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${pkg.popular
                                            ? 'bg-blue-600/10 border-blue-500/50 hover:bg-blue-600/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                            : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                                        }`}
                                >
                                    {pkg.popular && (
                                        <span className="absolute -top-3 left-6 px-3 py-1 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                            Most Popular
                                        </span>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${pkg.popular ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                            <Zap size={24} fill={pkg.popular ? "white" : "none"} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-white">{pkg.name}</h4>
                                            <p className="text-xs text-zinc-500 font-bold">{pkg.credits.toLocaleString()} Credits</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-mono font-black text-white">${pkg.price}</div>
                                        <div className="text-[10px] text-zinc-500 font-bold">ONE-TIME</div>
                                    </div>

                                    {loading === pkg.id && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Subscription / Perks */}
                    <div className="bg-zinc-900/40 border-l border-zinc-800 p-8 md:p-12 flex flex-col justify-between">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-black text-white flex items-center gap-2">
                                    <Sparkles size={20} className="text-yellow-500" />
                                    QUANTGOAL PRO
                                </h3>
                                <p className="text-xs text-zinc-500 mt-1 uppercase font-bold tracking-widest">Digital Asset Seniority</p>
                            </div>

                            <ul className="space-y-4">
                                {[
                                    '1.2x Governance Power',
                                    'Early access to Alpha Signals',
                                    'Unlimited Black Swan hedges',
                                    'Exclusive "Prime" Title & Badge',
                                    '2,000 Monthly Credit Drop'
                                ].map((perk, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                                        <div className="h-5 w-5 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        {perk}
                                    </li>
                                ))}
                            </ul>

                            <Card className="p-6 border-zinc-800 bg-zinc-950/50">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <div className="text-2xl font-black text-white tracking-tight">$29<span className="text-sm font-medium text-zinc-500 italic">.00</span></div>
                                        <div className="text-[10px] text-zinc-500 font-bold">PER MONTH</div>
                                    </div>
                                    <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black rounded uppercase">
                                        Saves 40%
                                    </div>
                                </div>
                                <button
                                    onClick={() => handlePurchase('subscription_pro')}
                                    disabled={isPro}
                                    className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPro ? 'ALREADY PRO' : 'UPGRADE NOW'}
                                    {!isPro && <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />}
                                </button>
                            </Card>
                        </div>

                        <p className="text-[10px] text-zinc-600 text-center mt-8">
                            Secure transactions powered by QuantGoal Ledger.
                            <br /> No financial data is stored on our servers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

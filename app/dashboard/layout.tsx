'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
    Terminal,
    Fingerprint,
    LayoutDashboard,
    LineChart,
    Wallet,
    Settings,
    LogOut,
    Bell,
    Search,
    Menu,
    Users,
    X
} from 'lucide-react';
import { cn } from '@/components/ui/Button';
import { BettingSlipProvider } from '@/context/BettingSlipContext';
import { BettingSlipWidget } from '@/components/dashboard/BettingSlipWidget';

// Sidebar Item Component
function SidebarItem({ icon: Icon, label, active = false, href }: { icon: any, label: string, active?: boolean, href: string }) {
    return (
        <Link href={href} className="block">
            <div className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group",
                active
                    ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}>
                <Icon size={18} className={cn(active && "text-[var(--brand)]")} />
                <span className="text-sm font-medium">{label}</span>
            </div>
        </Link>
    );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { user, loading, logout, isPro } = useAuth();
    // Wallet is now handled internally by BettingSlipWidget via context

    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);

    // Protect Route
    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-black text-zinc-500">Initializing Terminal...</div>;
    if (!user) return null;

    return (
        <BettingSlipProvider>
            <div className="min-h-screen bg-black flex">
                {/* Sidebar */}
                <aside className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
                    !sidebarOpen && "-translate-x-full lg:hidden"
                )}>
                    <div className="h-full flex flex-col">
                        {/* Logo Area */}
                        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--brand)] text-black">
                                    <Terminal size={14} className="font-bold" />
                                </div>
                                <span className="font-bold text-white tracking-tight">QuantGoal</span>
                                {isPro && <span className="text-[10px] bg-[var(--brand)] text-black px-1.5 py-0.5 rounded font-bold">PRO</span>}
                            </Link>
                        </div>

                        {/* Nav Items */}
                        <nav className="flex-1 px-4 py-6 space-y-1">
                            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-3">Main Terminal</div>
                            <SidebarItem icon={LayoutDashboard} label="Overview" href="/dashboard" active={pathname === '/dashboard'} />
                            <SidebarItem icon={LineChart} label="Live Signals" href="/dashboard/signals" active={pathname === '/dashboard/signals'} />
                            <SidebarItem icon={Wallet} label="Bankroll Manager" href="/dashboard/bankroll" active={pathname === '/dashboard/bankroll'} />
                            <SidebarItem icon={Users} label="Fund Guilds" href="/dashboard/guilds" active={pathname === '/dashboard/guilds'} />

                            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-8 mb-4 px-3">System</div>
                            <SidebarItem icon={Fingerprint} label="Immutable Ledger" href="/dashboard/ledger" active={pathname === '/dashboard/ledger'} />
                            <SidebarItem icon={Settings} label="Settings" href="/dashboard/settings" active={pathname === '/dashboard/settings'} />
                        </nav>

                        {/* User Section */}
                        <div className="p-4 border-t border-zinc-800">
                            <div className="flex items-center gap-3 px-3 py-3 rounded-md bg-zinc-900/50 border border-zinc-800">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center text-xs font-bold text-white">
                                    {user.email?.[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{user.email?.split('@')[0]}</p>
                                    <p className="text-xs text-zinc-400 truncate">Pro Member</p>
                                </div>
                                <button onClick={() => logout()} className="text-zinc-500 hover:text-white transition-colors">
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0 bg-black">
                    {/* Top Bar */}
                    <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-zinc-800 bg-black/50 backdrop-blur-sm sticky top-0 z-40">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-zinc-400 hover:text-white">
                                <Menu size={24} />
                            </button>
                            <h1 className="text-lg font-semibold text-white hidden sm:block">Dashboard</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative hidden md:block">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Search assets..."
                                    className="bg-zinc-900/50 border border-zinc-800 rounded-md py-1.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-zinc-700 w-64 placeholder:text-zinc-600"
                                />
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className={cn("text-zinc-400 hover:text-white relative transition-colors", showNotifications && "text-white")}
                                >
                                    <Bell size={20} />
                                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-[var(--brand)] rounded-full border-2 border-black animate-pulse"></span>
                                </button>

                                {/* Notification Dropdown */}
                                {showNotifications && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                                        <div className="absolute right-0 top-full mt-4 w-80 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                                            <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                                                <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                                                <span className="text-[10px] text-zinc-500 cursor-pointer hover:text-white">Mark all read</span>
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto">
                                                {[
                                                    { title: "Alpha Alert: Arsenal", time: "2m ago", type: "signal" },
                                                    { title: "Bankroll: Stop Loss", time: "1h ago", type: "alert" },
                                                    { title: "System Update v2.4", time: "5h ago", type: "info" },
                                                ].map((n, i) => (
                                                    <div key={i} className="p-3 hover:bg-zinc-900 transition-colors border-b border-zinc-800/50 last:border-0 cursor-pointer group">
                                                        <div className="flex items-start gap-3">
                                                            <div className={cn(
                                                                "w-2 h-2 mt-1.5 rounded-full shrink-0",
                                                                n.type === 'signal' ? "bg-green-500" : n.type === 'alert' ? "bg-red-500" : "bg-blue-500"
                                                            )} />
                                                            <div>
                                                                <div className="text-sm text-zinc-300 font-medium group-hover:text-white">{n.title}</div>
                                                                <div className="text-[10px] text-zinc-500">{n.time}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-2 border-t border-zinc-800 bg-zinc-900/50 text-center">
                                                <Link href="/dashboard/settings" className="text-[10px] text-zinc-500 hover:text-white">Manage Alerts</Link>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
                        {children}
                    </div>
                </main>
            </div>
            {/* 
              Pass wallet from context to BettingSlipWidget. 
              Ideally BettingSlipWidget should consume context internally, 
              but to avoid modifying it right now, we pass it.
            */}
            <BettingSlipWidget />
        </BettingSlipProvider>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardContent>
            {children}
        </DashboardContent>
    );
}

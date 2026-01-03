'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, TrendingUp, Award, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
    link?: string;
}

export function NotificationCenter() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (data.notifications) {
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter((n: Notification) => !n.is_read).length);
            }
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id })
            });
            fetchNotifications();
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [user]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'FINANCIAL': return <DollarSign size={16} className="text-emerald-500" />;
            case 'RANK': return <Award size={16} className="text-blue-500" />;
            case 'GOVERNANCE': return <TrendingUp size={16} className="text-purple-500" />;
            default: return <Bell size={16} className="text-zinc-500" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                        <h3 className="font-black text-white text-sm uppercase tracking-wider">Ledger Pulse</h3>
                        <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-zinc-600 text-xs">
                                No notifications yet. Start trading to receive updates!
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => markAsRead(notif.id)}
                                    className={`p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-blue-950/10' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5">{getIcon(notif.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                                                {!notif.is_read && (
                                                    <span className="h-2 w-2 bg-blue-500 rounded-full shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-[11px] text-zinc-400 leading-relaxed">{notif.message}</p>
                                            <span className="text-[9px] text-zinc-600 mt-1 block">
                                                {new Date(notif.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 bg-zinc-950 border-t border-zinc-800">
                            <button
                                onClick={() => {
                                    notifications.forEach(n => !n.is_read && markAsRead(n.id));
                                }}
                                className="w-full text-[10px] text-zinc-500 hover:text-white font-bold uppercase tracking-widest transition-colors"
                            >
                                Mark All as Read
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

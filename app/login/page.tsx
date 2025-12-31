
import { login, signup, oAuthLogin } from './actions'
import { Shield, Lock, Activity, Globe } from 'lucide-react'

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-purple-900/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-indigo-900/40 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl relative z-10 overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-zinc-800 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            <Activity className="text-black" size={28} strokeWidth={2.5} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight mb-2">ACCESS TERMINAL</h1>
                    <p className="text-zinc-400 text-sm">Enter your credentials to access the QuantGoal AI Central Bank.</p>
                </div>

                {/* Social Auth */}
                <div className="px-8 pt-8 space-y-3">
                    <form className="grid grid-cols-2 gap-3">
                        <button formAction={oAuthLogin.bind(null, 'google')} className="flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-white py-2.5 rounded-lg transition-colors text-sm font-bold">
                            Google
                        </button>
                        <button formAction={oAuthLogin.bind(null, 'apple')} className="flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-white py-2.5 rounded-lg transition-colors text-sm font-bold">
                            Apple
                        </button>
                    </form>
                    <div className="flex items-center gap-4 py-2">
                        <div className="h-px bg-zinc-800 flex-1" />
                        <span className="text-[10px] text-zinc-600 font-mono uppercase">Or verify via Email</span>
                        <div className="h-px bg-zinc-800 flex-1" />
                    </div>
                </div>

                {/* Form */}
                <div className="p-8 space-y-6">
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Email Identity</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3 text-zinc-600" size={18} />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-zinc-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm"
                                    placeholder="name@quant.capital"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Secure Key</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-zinc-600" size={18} />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-zinc-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button formAction={login} className="flex-1 bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                                <Shield size={16} /> LOGIN
                            </button>
                            <button formAction={signup} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg transition-colors border border-zinc-700">
                                SIGN UP
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-950/30 text-center">
                    <p className="text-[10px] text-zinc-600 font-mono flex items-center justify-center gap-2">
                        <Lock size={10} /> SECURED BY QUANTCHAIN™ LEDGER
                    </p>
                </div>
            </div>
        </div>
    )
}

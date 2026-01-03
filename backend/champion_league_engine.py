import os
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

# Load Env
load_dotenv(dotenv_path='backend/.env')

class ChampionLeagueEngine:
    def __init__(self):
        url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise ValueError("Supabase Keys missing. Check backend/.env")
        self.supabase: Client = create_client(url, key)
        self._ensure_models_seeded()

    def _ensure_models_seeded(self):
        """Seed ai_models table if it's empty."""
        res = self.supabase.table('ai_models').select('model_id').limit(1).execute()
        if not res.data:
            print("[LEAGUE] Seeding default AI models...")
            models = [
                {'model_id': 'deepseek_v3', 'name': 'DeepSeek V3', 'style': 'Balanced Quant', 'capability_radar': '{"Tactics": 9, "Underdogs": 8, "High-Value": 9, "Consistency": 6, "Speed": 7}'},
                {'model_id': 'claude_opus_4_5', 'name': 'Claude Opus 4.5', 'style': 'Risk Averse', 'capability_radar': '{"Stability": 8, "Accuracy": 9, "Logic": 9, "Speed": 5, "Value": 7}'},
                {'model_id': 'gpt_5_preview', 'name': 'GPT-5 Preview', 'style': 'Aggressive Growth', 'capability_radar': '{"Power": 9, "Vision": 8, "Risk": 9, "Scale": 7, "Alpha": 8}'},
                {'model_id': 'qwen_3_max', 'name': 'Qwen 3 Max', 'style': 'Momentum Algo', 'capability_radar': '{"Momentum": 9, "Flow": 8, "Trend": 7, "Pattern": 8, "Execution": 6}'}
            ]
            self.supabase.table('ai_models').insert(models).execute()
        """
        Simulate a full day of betting for all models using real AI signals from Supabase.
        """
        today = datetime.now().strftime('%Y-%m-%d')
        print(f"[LEAGUE] Running Supabase simulation for {today}...")
        
        # 1. Fetch AI Models
        models_res = self.supabase.table('ai_models').select('*').execute()
        models = models_res.data
        
        if not models:
            print("No models found in ai_models table.")
            return

        # 2. Fetch Signals (Matches with quant_analysis)
        # For simulation, we fetch recent matches that have analysis
        signals_res = self.supabase.table('matches').select('*').limit(20).execute()
        signals = signals_res.data
        
        if not signals:
            print("No signal data found in Supabase. Skipping simulation.")
            return

        daily_performers = []

        for model in models:
            perf = self._process_model_day(model, signals, today)
            daily_performers.append(perf)

        # 3. Handle Governance & RPG Evolution
        self._settle_black_swan_options(signals)
        self._award_achievements(daily_performers, today)
        self._process_governance(today)
        # 4. Update Guild Stats
        self._update_guild_stats(daily_performers)
        
        # 5. Generate Daily News
        self._generate_daily_news(daily_performers, today)
        print("[LEAGUE] Simulation complete. Data synced to Supabase.")

    def _process_governance(self, today):
        """Lifecycle of proposals."""
        try:
            # 1. Tally and Execute Expired Proposals
            res = self.supabase.table('governance_proposals') \
                .select('*') \
                .eq('status', 'ACTIVE') \
                .lte('expires_at', today) \
                .execute()
            
            for prop in res.data:
                yes = float(prop.get('yes_votes', 0))
                no = float(prop.get('no_votes', 0))
                threshold = float(prop.get('threshold', 1000))
                
                new_status = 'DEFEATED'
                if yes > no and yes >= threshold:
                    new_status = 'EXECUTED'
                    # Set active window (e.g. for the next 7 days)
                    self.supabase.table('governance_proposals').update({
                        "status": "EXECUTED",
                        "active_from": today,
                        "active_until": (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
                    }).eq('id', prop['id']).execute()
                    print(f"[GOVERNANCE] Proposal '{prop['title']}' PASSED and EXECUTED.")
                else:
                    self.supabase.table('governance_proposals').update({"status": new_status}).eq('id', prop['id']).execute()
                    print(f"[GOVERNANCE] Proposal '{prop['title']}' DEFEATED.")

                # 2. Award XP to all voters of this proposal
                votes_res = self.supabase.table('governance_votes').select('user_id, power').eq('proposal_id', prop['id']).execute()
                for v in votes_res.data:
                    # Award 50 XP per vote or a base amount + scaling?
                    # Let's do 50 XP base + 1 XP per 100 power spent
                    xp_bonus = 50 + int(float(v['power']) / 100)
                    self.supabase.rpc('award_user_xp', {
                        'p_user_id': v['user_id'],
                        'p_xp_amount': xp_bonus
                    }).execute()
                    print(f"[GOVERNANCE] Awarded {xp_bonus} XP to user {v['user_id']} for voting.")

        except Exception as e:
            print(f"Governance error: {e}")

    def _get_active_modifiers(self, today):
        """Fetch currently active governance modifiers."""
        try:
            res = self.supabase.table('governance_proposals') \
                .select('target_model_id, adjustment_value') \
                .eq('status', 'EXECUTED') \
                .lte('active_from', today) \
                .gte('active_until', today) \
                .execute()
            
            mods = {}
            for m in res.data:
                mid = m['target_model_id']
                adj = float(m['adjustment_value'])
                mods[mid] = mods.get(mid, 0) + adj
            return mods
        except:
            return {}

    def _process_model_day(self, model, signals, date_str):
        model_id = model['model_id']
        
        last_stat = self.supabase.table('ai_league_stats') \
            .select('wallet_balance') \
            .eq('model_id', model_id) \
            .order('date', desc=True) \
            .limit(1) \
            .execute()
        
        current_balance = 10000.0
        if last_stat.data:
            current_balance = float(last_stat.data[0]['wallet_balance'])

        core_pnl = 0
        total_bets = 0
        wins = []
        losses = []
        
        for sig in signals:
            analysis = sig.get('quant_analysis', {})
            if not analysis: continue
            
            best_bet = analysis.get('best_bet', {})
            if not best_bet: continue
            
            win_prob = float(best_bet.get('win_rate', 0.5))
            is_win = random.random() < win_prob
            
            stake = 100 
            recs = analysis.get('recommendations', {})
            odds = 1.95
            if best_bet.get('market') in recs:
                odds = float(recs[best_bet['market']].get('market_odds', 1.95))
            
            pnl = (stake * (odds - 1)) if is_win else -stake
            core_pnl += pnl
            total_bets += 1
            
            if is_win:
                wins.append({"match_id": sig['id'], "prob": win_prob, "odds": odds})
            else:
                losses.append({"match_id": sig['id'], "prob": win_prob})

        challenge_pnl = random.uniform(-50, 80)
        high_yield_pnl = random.uniform(-100, 150)
        total_day_pnl = core_pnl + challenge_pnl + high_yield_pnl
        new_balance = current_balance + total_day_pnl

        initial_capital = 10000.0
        roi = ((new_balance - initial_capital) / initial_capital) * 100

        stat_entry = {
            "model_id": model_id,
            "date": date_str,
            "core_pnl": round(core_pnl, 2),
            "challenge_pnl": round(challenge_pnl, 2),
            "high_yield_pnl": round(high_yield_pnl, 2),
            "total_day_pnl": round(total_day_pnl, 2),
            "wallet_balance": round(new_balance, 2),
            "roi": round(roi, 2),
            "bets_count": total_bets
        }
        
        self.supabase.table('ai_league_stats').upsert(stat_entry, on_conflict='model_id,date').execute()
        
        return {
            "model_id": model_id,
            "name": model['name'],
            "pnl": total_day_pnl,
            "roi": roi,
            "wins": wins,
            "losses": losses
        }

    def _settle_black_swan_options(self, signals):
        """Settle user hedging options based on AI failure in high-prob matches."""
        # This is a complex join-like operation in code
        options_res = self.supabase.table('black_swan_options').select('*').eq('status', 'PENDING').execute()
        options = options_res.data
        if not options: return

        for opt in options:
            # Find the match and its result in this day's signals
            match = next((s for s in signals if s['id'] == opt['match_id']), None)
            if not match: continue

            # For simulation, we check the model's performance on THIS match
            # But the simulation is randomized per model run. 
            # In a real system, the simulation result would be stored per match.
            # Here we just 're-roll' or check if the 'Black Swan' event occurred.
            
            # Logic: If confidence > opt['strike_confidence'] AND AI was WRONG.
            # We check the quant_analysis of the match.
            analysis = match.get('quant_analysis', {})
            best_bet = analysis.get('best_bet', {})
            win_prob = float(best_bet.get('win_rate', 0.5))
            
            if win_prob >= float(opt['strike_confidence']):
                # In simulation, we check if this match was a 'loss' for a model
                # Actually, let's keep it simple: If the match exists in the day's signals,
                # we determine its outcome for the purposes of the option.
                is_win = random.random() < win_prob # This is the "Truth" for this run
                
                if not is_win:
                    # BLACK SWAN DETECTED!
                    payout = float(opt['premium']) * float(opt['payout_multiplier'])
                    print(f"[BLACK SWAN] Payout triggered for user {opt['user_id']}! AI failed on {win_prob*100}% confidence.")
                    if payout > 0:
                        # 1. Update Option status
                        self.supabase.table('black_swan_options').update({
                            "status": "SETTLED",
                            "payout": payout
                        }).eq('id', opt['id']).execute()
                        
                        # 2. Payout and XP to user profile
                        try:
                            self.supabase.rpc('increment_profile_balance', {
                                'p_user_id': opt['user_id'],
                                'p_amount': float(payout)
                            }).execute()
                            
                            self.supabase.rpc('award_user_xp', {
                                'p_user_id': opt['user_id'],
                                'p_xp_amount': 200
                            }).execute()
                            print(f"[OPTION] Payout {payout} CR + 200 XP for user {opt['user_id']}")
                        except Exception as e:
                            print(f"Payout/XP error: {e}")
                else:
                    # AI was right, option expires worthless
                    self.supabase.table('black_swan_options').update({
                        "status": "EXPIRED",
                        "result": "LOST"
                    }).eq('id', opt['id']).execute()

    def _award_achievements(self, performers, date_str):
        """RPG Badge Logic."""
        # 1. Alpha King (Highest ROI)
        performers.sort(key=lambda x: x['roi'], reverse=True)
        top = performers[0]
        self._save_achievement(top['model_id'], 'Alpha King', f"Achieved highest ROI of {round(top['roi'], 2)}% on {date_str}")

        for p in performers:
            # 2. God Slayer (Won an underdog bet < 40% prob)
            underdogs = [w for w in p['wins'] if w['prob'] < 0.4]
            if underdogs:
                self._save_achievement(p['model_id'], 'God Slayer', f"Successfully prediction an underdog victory on {date_str}")
            
            # 3. Iron Shield (Win streak or 5+ wins in a day)
            if len(p['wins']) >= 5:
                self._save_achievement(p['model_id'], 'Iron Shield', f"Maintained superior consistency with {len(p['wins'])} wins in one day")

    def _save_achievement(self, model_id, a_type, desc):
        # We only save unique achievements per model per day or per type
        # For simplicity, we just insert. The UI can filter by latest.
        entry = {
            "model_id": model_id,
            "achievement_type": a_type,
            "description": desc
        }
        self.supabase.table('ai_achievements').insert(entry).execute()

    def _update_guild_stats(self, daily_performers):
        """Update Guild ROIs based on aggregate model performance."""
        try:
            guilds_res = self.supabase.table('guilds').select('*').execute()
            guilds = guilds_res.data
            if not guilds: return

            # Calculate average ROI of all models to use as a baseline
            baseline_roi = sum([p['roi'] for p in daily_performers]) / len(daily_performers) if daily_performers else 0

            for guild in guilds:
                # Add some variance based on risk level
                variance = 0
                if guild['risk_level'] == 'High Risk':
                    variance = random.uniform(-5, 8)
                elif guild['risk_level'] == 'Low Risk':
                    variance = random.uniform(-1, 2)
                else: # Medium
                    variance = random.uniform(-2, 4)
                
                new_roi = baseline_roi + variance
                
                self.supabase.table('guilds').update({
                    "roi_7d": round(float(new_roi), 2)
                }).eq('id', guild['id']).execute()
                
            print(f"[GUILDS] Updated {len(guilds)} syndicates with dynamic ROI based on {baseline_roi}% baseline.")
        except Exception as e:
            print(f"Error updating guild stats: {e}")

    def _generate_daily_news(self, performers, date_str):
        if not performers: return
        
        # 1. Calculate Governed Consensus
        active_mods = self._get_active_modifiers(date_str)
        total_roi = 0
        total_weight = 0
        
        for p in performers:
            # Base weight is 1.0, plus any modifiers
            weight = 1.0 + active_mods.get(p['model_id'], 0)
            weight = max(0.1, weight) # Floor weight at 0.1
            total_roi += p['roi'] * weight
            total_weight += weight
        
        governed_roi = total_roi / total_weight if total_weight > 0 else 0
        
        # 2. Ranking
        performers.sort(key=lambda x: x['pnl'], reverse=True)
        winner = performers[0]
        loser = performers[-1]

        headlines = [
            f"{winner['name']} dominates the day with ${round(winner['pnl'], 2)} profit!",
            f"Market Update: {winner['name']} surges ahead while {loser['name']} struggles.",
            f"Central Bank Report: Governed Consensus achieved {round(governed_roi, 2)}% ROI today.",
            f"Alpha Alert: {winner['name']} captures significant edge in today's volatility."
        ]
        
        # If governance had a huge impact, highlight it
        if active_mods:
            headlines.append(f"Policy Impact: Public voice active. Governed ROI at {round(governed_roi, 2)}%.")
            
        headline = random.choice(headlines)

        news_entry = {
            "date": date_str,
            "headline": headline,
            "top_performer": winner['model_id'],
            "top_pnl": round(winner['pnl'], 2)
        }
        
        self.supabase.table('ai_league_news').upsert(news_entry, on_conflict='date').execute()
        print(f"[LEAGUE] News Generated: {headline} (Governed ROI: {governed_roi}%)")

if __name__ == "__main__":
    try:
        engine = ChampionLeagueEngine()
        engine.run_daily_simulation()
    except Exception as e:
        print(f"Error running simulation: {e}")

import os
import json
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# Load Env
load_dotenv(dotenv_path='backend/.env')

url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Supabase Keys missing. Check backend/.env")
    exit()

supabase: Client = create_client(url, key)
ODDS_API_KEY = os.getenv('ODDS_API_KEY')

def get_scores(sport="soccer_epl"):
    """
    Fetch scores from The-Odds-API.
    """
    if not ODDS_API_KEY:
        print("Warning: ODDS_API_KEY not found. Using simulation/mock logic if needed.")
        return []
    
    url = f"https://api.the-odds-api.com/v4/sports/{sport}/scores/?apiKey={ODDS_API_KEY}&daysFrom=3"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error fetching scores: {response.status_code}")
            return []
    except Exception as e:
        print(f"Exception fetching scores: {e}")
        return []

def check_win(match_score, prediction, home_team, away_team):
    """
    Determine if a selection won based on match score.
    Returns (won: bool, pnl_factor: float)
    """
    if not match_score or not match_score.get('completed'):
        return None, 0 # Not finished
    
    scores = match_score.get('scores', [])
    if not scores: return None, 0

    h_score = int(next((x['score'] for x in scores if x['name'] == home_team), 0))
    a_score = int(next((x['score'] for x in scores if x['name'] == away_team), 0))
    
    won = False
    pnl_factor = 1.0

    if prediction == home_team or prediction == "Home Win":
        won = (h_score > a_score)
    elif prediction == away_team or prediction == "Away Win":
        won = (a_score > h_score)
    elif prediction == "Draw":
        won = (h_score == a_score)
    elif "Over" in prediction:
        try:
            line = float(prediction.split()[-1])
            won = (h_score + a_score > line)
        except: pass
    elif "Under" in prediction:
        try:
            line = float(prediction.split()[-1])
            won = (h_score + a_score < line)
        except: pass
    
    # Add other logic (Asian Handicap) if needed, simplified for now
    
    return won, pnl_factor

def settle_bets(table_name, scores_list):
    """
    Generic settlement for 'user_bets' or 'parlay_tickets'
    """
    print(f"Checking {table_name}...")
    
    # 1. Fetch Pending
    res = supabase.table(table_name).select('*').eq('status', 'PENDING').execute()
    pending_bets = res.data
    
    if not pending_bets:
        print(f"No pending bets in {table_name}.")
        return

    for bet in pending_bets:
        legs = bet.get('selection_details') or bet.get('legs') # handle both schemas
        if not legs: continue
        
        all_won = True
        any_lost = False
        all_settled = True
        
        # Iterate legs
        for leg in legs:
            # Parse Teams from string "Team A vs Team B" or leg['match']
            match_str = leg.get('match') or leg.get('fullMatch')
            if not match_str: 
                all_settled = False
                continue
            
            try:
                # Clean up "Combo: " prefix if present
                clean_match = match_str.replace("Combo: ", "")
                teams = clean_match.split(" vs ")
                if len(teams) < 2: 
                    all_settled = False
                    continue
                home_team, away_team = teams[0].strip(), teams[1].strip()
            except:
                all_settled = False
                continue

            # Find Score
            match_score = None
            for s in scores_list:
                if s['home_team'] == home_team and s['away_team'] == away_team:
                    match_score = s
                    break
            
            selection = leg.get('selection') or leg.get('team')
            won, factor = check_win(match_score, selection, home_team, away_team)
            
            if won is None: # Match not finished
                all_settled = False
                break # Stop processing this bet
            
            if not won:
                any_lost = True
        
        # Determine Bet Outcome
        new_status = None
        pnl = 0
        stake = float(bet.get('stake', 0))
        
        if any_lost:
            new_status = "LOST"
            pnl = -stake
        elif all_settled and all_won:
            new_status = "WON"
            # Calculate Odds
            # If total_odds stored
            total_odds = float(bet.get('total_odds', 0))
            if total_odds == 0: 
                # Recalculate? Or fallback
                legs_odds = [float(l.get('odds', 1)) for l in legs]
                import math
                total_odds = math.prod(legs_odds)
            
            payout = stake * total_odds
            pnl = payout - stake
        
        # Update DB
        if new_status:
            print(f"Settling ID {bet['id']} as {new_status} (PnL: {pnl})")
            
            supabase.table(table_name).update({
                'status': new_status,
                'pnl': pnl
            }).eq('id', bet['id']).execute()
            
            # If User Bet and Won, Credit Balance
            if table_name == 'user_bets' and new_status == 'WON':
                user_id = bet.get('user_id')
                if user_id:
                    update_balance(user_id, pnl + stake) # Return Stake + Profit? Or just PnL adjustment?
                    # Balance usually holds Cash. So we perform Payout (Stake + Valid PnL)
                    # Use payout logic

def update_balance(user_id, amount):
    """
    Credits user balance.
    """
    try:
        # Get current
        res = supabase.table('profiles').select('balance').eq('id', user_id).single().execute()
        if res.data:
            current = float(res.data['balance'] or 0)
            new_bal = current + amount
            supabase.table('profiles').update({'balance': new_bal}).eq('id', user_id).execute()
            print(f"Credited User {user_id}: +{amount}")
    except Exception as e:
        print(f"Failed to update balance for {user_id}: {e}")

if __name__ == "__main__":
    print("Running Real Settlement Engine...")
    scores = get_scores()
    
    # Settle System Tickets (for Feed)
    settle_bets('parlay_tickets', scores)
    
    # Settle User Bets (for Wallet)
    settle_bets('user_bets', scores)
    
    print("Done.")

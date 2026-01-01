
import os
import json
import asyncio
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('backend/.env')

supabase = create_client(
    os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

def force_settle():
    print("--- 1. Fetching Orphaned Ticket ---")
    tickets = supabase.table('parlay_tickets').select('*').order('created_at', desc=True).limit(1).execute()
    if not tickets.data:
        print("No tickets found.")
        return
    
    ticket = tickets.data[0]
    print(f"Found Ticket: {ticket['ticket_id']} (Status: {ticket['status']})")

    print("\n--- 2. Fetching User ---")
    # In dev, we just grab the first user
    users = supabase.auth.admin.list_users()
    if not users:
        print("No users found in Auth.")
        return
    
    user_id = users[0].id
    print(f"Linking to User ID: {user_id}")

    print("\n--- 3. Linking Bet ---")
    # Check if already linked
    existing = supabase.table('user_bets').select('*').eq('ticket_id', ticket['id']).execute()
    if not existing.data:
        data = {
            "user_id": user_id,
            "ticket_id": ticket['id'],
            "stake": ticket['stake'],
            "status": 'PENDING',
            "pnl": 0,
            "selection_details": ticket['legs'] # Copy legs for easier reference
        }
        res = supabase.table('user_bets').insert(data).execute()
        print("Bet Linked Successfully!")
    else:
        print("Bet already linked (skipping insert).")

    print("\n--- 4. Rigging Match Result ---")
    legs = ticket['legs']
    # Example leg: {"fullMatch": "Man Utd vs...", "selection": "Home", ...}
    # Note: Structure depends on what ParlayLab saved.
    
    # We will just verify the structure
    print(f"Legs Data: {json.dumps(legs, indent=2)}")
    
    # Assuming standard structure, let's just FORCE WIN the ticket directly for demo
    # Bypassing the match table rig if complex, but let's try to do it right if we can find match_id
    # But usually legs here just have names.
    
    # Alternative: Just update the ticket status to HIT and run payout.
    # But settle_results.py calculates it.
    
    # Let's mock the settle_results logic here directly to ensure it works
    print("\n--- 5. Executing Settlement (Simulated) ---")
    
    # Calculate Payout
    total_odds = float(ticket['total_odds'])
    stake = float(ticket['stake'])
    payout = stake * total_odds
    profit = payout - stake
    
    print(f"Simulating Win: payout=${payout:.2f}, profit=${profit:.2f}")
    
    # Update Ticket
    supabase.table('parlay_tickets').update({
        'status': 'WON', 
        'pnl': profit,
        'verified_on': 'Simulated Settle'
    }).eq('id', ticket['id']).execute()
    
    # Update User Bet
    supabase.table('user_bets').update({
        'status': 'WON',
        'pnl': profit
    }).eq('ticket_id', ticket['id']).execute()
    
    # Update Balance
    # First get current balance
    print(f"Checking profile for user {user_id}...")
    profile = supabase.table('profiles').select('balance').eq('id', user_id).execute()
    
    current_bal = 0.0
    if not profile.data:
        print("Profile not found. Creating profile...")
        supabase.table('profiles').insert({'id': user_id, 'balance': 1000, 'username': 'DemoUser'}).execute()
        current_bal = 1000.0
    else:
        current_bal = float(profile.data[0]['balance'])
    
    new_bal = current_bal + payout
    
    supabase.table('profiles').update({'balance': new_bal}).eq('id', user_id).execute()
    
    print(f"User Balance Updated: ${current_bal} -> ${new_bal}")
    print("\n--- SUCCESS: Settlement Complete ---")

if __name__ == "__main__":
    force_settle()

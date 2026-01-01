
import os
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('backend/.env')

supabase = create_client(
    os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

print("\n--- Latest User Bet ---")
response = supabase.table('user_bets').select('*, parlay_tickets(*)').order('created_at', desc=True).limit(1).execute()

if response.data:
    bet = response.data[0]
    print(f"Bet ID: {bet['id']}")
    print(f"Status: {bet['status']}")
    print(f"Ticket ID: {bet['ticket_id']}")
    
    ticket = bet.get('parlay_tickets')
    if ticket:
        print(f"Details: {ticket.get('legs')}")
    else:
        print("No linked ticket found (Orphaned bet?)")
else:
    print("No bets found.")

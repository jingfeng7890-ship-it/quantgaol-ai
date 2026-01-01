
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(url, key)

def credit_all_users():
    print("Fetching all profiles...")
    
    # 1. Get all profiles
    response = supabase.from_("profiles").select("*").execute()
    profiles = response.data
    
    if not profiles:
        print("No profiles found.")
        return

    print(f"Found {len(profiles)} profiles. Updating balance to $1554.00...")

    # 2. Update each
    for profile in profiles:
        user_id = profile['id']
        try:
            supabase.from_("profiles").update({"balance": 1554.00}).eq("id", user_id).execute()
            print(f"Updated user {user_id} -> $1554.00")
        except Exception as e:
            print(f"Failed to update {user_id}: {e}")
            
    # 3. Double Check
    verify = supabase.from_("profiles").select("id, balance").execute()
    for p in verify.data:
        print(f"User {p['id']} Balance: {p['balance']}")

if __name__ == "__main__":
    credit_all_users()

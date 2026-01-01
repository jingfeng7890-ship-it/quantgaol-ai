
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

def sync_and_credit():
    print("Fetching ALL Auth Users...")
    
    # 1. Get all users from Auth (using Admin API)
    # Note: supabase-py admin.list_users() might be paginated, simplified here for demo
    try:
        users_response = supabase.auth.admin.list_users()
        users = users_response.items if hasattr(users_response, 'items') else users_response
        
        if not users:
            # Fallback if list_users structure differs by version
            print("No users returned from admin.list_users(), or empty.")
            print(f"Response: {users_response}")
            return
            
        print(f"Found {len(users)} Auth Users. Checking profiles...")
        
        for user in users:
            uid = user.id
            email = user.email
            
            # 2. Check Profile
            profile_res = supabase.from_("profiles").select("*").eq("id", uid).execute()
            
            if not profile_res.data:
                print(f"[MISSING PROFILE] User {email} ({uid}) has no profile. Creating...")
                try:
                    supabase.from_("profiles").insert({
                        "id": uid,
                        "full_name": email.split("@")[0] if email else "Trader",
                        "avatar_url": "",
                        "balance": 1554.00,
                        "updated_at": "now()"
                    }).execute()
                    print(f" -> Created & Credited $1554.00")
                except Exception as e:
                    print(f" -> FAILED to create profile: {e}")
            else:
                # 3. Update existing
                print(f"[EXISTING] User {email} ({uid}). Updating balance...")
                try:
                    supabase.from_("profiles").update({"balance": 1554.00}).eq("id", uid).execute()
                    print(f" -> Updated to $1554.00")
                except Exception as e:
                    print(f" -> FAILED to update: {e}")

    except Exception as e:
        print(f"Fatal Error: {e}")

if __name__ == "__main__":
    sync_and_credit()

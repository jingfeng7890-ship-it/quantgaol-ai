import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(dotenv_path='backend/.env')

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

models = ['grok_3_beta', 'gemini_2_flash']

print("Checking stats for new models...")
for m in models:
    res = supabase.table('ai_league_stats').select('*').eq('model_id', m).execute()
    if res.data:
        print(f"✅ Stats found for {m}: {len(res.data)} rows.")
    else:
        print(f"❌ No stats found for {m}.")

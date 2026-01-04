import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(dotenv_path='backend/.env')

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ Missing keys.")
    exit()

supabase = create_client(url, key)

new_models = [
    {'model_id': 'grok_3_beta', 'name': 'Grok 3 Beta', 'style': 'Contrarian Tech', 'capability_radar': '{"Rebellion": 10, "Speed": 9, "Logic": 7, "Chaos": 8, "Meme": 9}'},
    {'model_id': 'gemini_2_flash', 'name': 'Gemini 2.0 Flash', 'style': 'Speed Trader', 'capability_radar': '{"Speed": 10, "Volume": 9, "Latency": 10, "Data": 8, "Alpha": 7}'}
]

print("Injecting missing models...")
for model in new_models:
    try:
        supabase.table('ai_models').upsert(model, on_conflict='model_id').execute()
        print(f"✅ Inserted/Updated: {model['name']}")
    except Exception as e:
        print(f"❌ Error inserting {model['name']}: {e}")

print("Done. Please run the simulation engine to generate stats for them.")

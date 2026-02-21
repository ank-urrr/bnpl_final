import os
import requests
from dotenv import load_dotenv

load_dotenv()

gemini_key = os.getenv("GEMINI_API_KEY")
print(f"Key loaded: {bool(gemini_key)}")

try:
    models_resp = requests.get("https://generativelanguage.googleapis.com/v1beta/models", params={"key": gemini_key})
    models_resp.raise_for_status()
    models = models_resp.json().get('models', [])
    for m in models:
        print(m['name'])
except Exception as e:
    print(f"Error fetching models: {e}")
    if hasattr(e, 'response') and e.response: print(e.response.text)


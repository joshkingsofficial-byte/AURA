#!/usr/bin/env python3
"""
Run this once to authenticate AURA with your Microsoft/Outlook account.
After success, the token is saved and the backend refreshes it silently.
"""
import os, sys
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import msal

CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID", "")
if not CLIENT_ID:
    print("ERROR: Add MICROSOFT_CLIENT_ID=<your-app-id> to your .env file first.")
    sys.exit(1)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
TOKEN_CACHE_FILE = os.path.join(DATA_DIR, "outlook_token_cache.json")
os.makedirs(DATA_DIR, exist_ok=True)

AUTHORITY = "https://login.microsoftonline.com/consumers"
SCOPES = ["Mail.Read", "Calendars.ReadWrite", "Contacts.Read", "Tasks.ReadWrite", "Mail.Send"]

cache = msal.SerializableTokenCache()
if os.path.exists(TOKEN_CACHE_FILE):
    cache.deserialize(open(TOKEN_CACHE_FILE).read())

app = msal.PublicClientApplication(CLIENT_ID, authority=AUTHORITY, token_cache=cache)

# Try silent first (if re-running)
accounts = app.get_accounts()
if accounts:
    result = app.acquire_token_silent(SCOPES, account=accounts[0])
    if result and "access_token" in result:
        print(f"[✓] Already authenticated as {accounts[0]['username']}")
        sys.exit(0)

# Device code flow — works on any device, no browser redirect needed
flow = app.initiate_device_flow(scopes=SCOPES)
if "user_code" not in flow:
    print("ERROR:", flow.get("error_description", flow))
    sys.exit(1)

print("\n" + "=" * 60)
print(flow["message"])
print("=" * 60 + "\n")

result = app.acquire_token_by_device_flow(flow)

if "access_token" in result:
    open(TOKEN_CACHE_FILE, "w").write(cache.serialize())
    print(f"\n[✓] Authenticated successfully. Token saved to {TOKEN_CACHE_FILE}")
    print("You can now start the AURA backend — it will stay logged in.")
else:
    print(f"\nERROR: {result.get('error_description', result)}")
    sys.exit(1)

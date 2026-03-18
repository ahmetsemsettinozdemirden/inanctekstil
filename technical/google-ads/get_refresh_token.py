#!/usr/bin/env python3
"""Generate Google Ads API refresh token."""

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/adwords"]
CREDENTIALS_FILE = "client_secret_299326854062-1obpe741dj0ag5ip1q3dulufbdis7raa.apps.googleusercontent.com.json"

flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, scopes=SCOPES)
credentials = flow.run_local_server(port=9090, prompt="consent", access_type="offline")

print("\n✅ Refresh token oluşturuldu!")
print(f"\nrefresh_token: {credentials.refresh_token}")
print(f"client_id:     {credentials.client_id}")
print(f"client_secret: {credentials.client_secret}")

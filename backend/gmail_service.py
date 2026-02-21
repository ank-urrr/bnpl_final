import os
import base64
import json
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from flask import session, redirect, request
from google.oauth2.credentials import Credentials

CLIENT_SECRETS_FILE = "client_secret.json"

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

def create_flow():
    """
    Create an OAuth2 Flow.
    Priority:
      1. Use GMAIL_CLIENT_SECRETS from env (full JSON credentials)
      2. Use GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from env
      3. Fallback to client_secret.json if present (local development)

    Redirect URI is determined from BACKEND_URL env var if set, otherwise from the current request.url_root.
    """
    # Determine redirect URI
    backend_base = os.getenv("BACKEND_URL")
    if not backend_base:
        # request.url_root will include a trailing slash
        try:
            from flask import request
            backend_base = request.url_root.rstrip("/")
        except Exception:
            backend_base = "http://localhost:5000"

    redirect_uri = f"{backend_base}/auth/callback"

    # Priority 1: Try to use GMAIL_CLIENT_SECRETS (full JSON from env)
    gmail_secrets_json = os.getenv("GMAIL_CLIENT_SECRETS")
    if gmail_secrets_json:
        try:
            client_config = json.loads(gmail_secrets_json)
            # Ensure redirect_uris is set correctly
            if "web" in client_config:
                client_config["web"]["redirect_uris"] = [redirect_uri]
            return Flow.from_client_config(client_config, scopes=SCOPES, redirect_uri=redirect_uri)
        except json.JSONDecodeError as e:
            print(f"Error parsing GMAIL_CLIENT_SECRETS: {e}")
            # Fall through to next option

    # Priority 2: Use individual env vars
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")

    if client_id and client_secret:
        client_config = {
            "web": {
                "client_id": client_id,
                "project_id": os.getenv("GOOGLE_PROJECT_ID", "bnpl-guardian"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_secret": client_secret,
                "redirect_uris": [redirect_uri]
            }
        }

        return Flow.from_client_config(client_config, scopes=SCOPES, redirect_uri=redirect_uri)

    # Priority 3: Fallback to client_secret.json for local dev
    if os.path.exists(CLIENT_SECRETS_FILE):
        return Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, redirect_uri=redirect_uri)
    
    raise FileNotFoundError(
        f"Gmail credentials not found. Please set GMAIL_CLIENT_SECRETS environment variable or place {CLIENT_SECRETS_FILE} in the app root."
    )


def get_gmail_service(credentials):
    return build("gmail", "v1", credentials=credentials)

def get_credentials_from_session(session):
    if "credentials" not in session:
        return None

    creds = Credentials(
        token=session["credentials"]["token"],
        refresh_token=session["credentials"]["refresh_token"],
        token_uri=session["credentials"]["token_uri"],
        client_id=session["credentials"]["client_id"],
        client_secret=session["credentials"]["client_secret"],
        scopes=session["credentials"]["scopes"]
    )

    return creds

def fetch_gmail_messages(creds, max_results=50):
    """
    Fetch Gmail messages that might contain BNPL information.
    Returns tuple: (success, messages, error_message)
    """
    try:
        service = build("gmail", "v1", credentials=creds)

        # Query for BNPL-related emails
        query = '(EMI OR installment OR "pay later" OR BNPL OR "due date" OR "monthly payment" OR statement OR repayment) -spam'

        print(f"[Gmail API] Fetching messages with query: {query}")
        
        results = service.users().messages().list(
            userId="me",
            q=query,
            maxResults=max_results
        ).execute()

        messages = results.get("messages", [])
        print(f"[Gmail API] Found {len(messages)} messages")
        
        if not messages:
            return (True, [], None)
        
        parsed_messages = []
        
        for idx, msg in enumerate(messages):
            try:
                print(f"[Gmail API] Fetching message {idx + 1}/{len(messages)}")
                msg_data = service.users().messages().get(
                    userId="me",
                    id=msg["id"],
                    format="full"
                ).execute()
                
                # Extract headers
                headers = msg_data.get("payload", {}).get("headers", [])
                
                # Extract sender (From header)
                sender = next(
                    (h["value"] for h in headers if h["name"].lower() == "from"),
                    "Unknown"
                )
                
                # Extract subject
                subject = next(
                    (h["value"] for h in headers if h["name"].lower() == "subject"),
                    "No Subject"
                )
                
                # Extract body
                body = extract_email_body(msg_data.get("payload", {}))
                
                parsed_messages.append({
                    "id": msg["id"],
                    "sender": sender,
                    "subject": subject,
                    "body": body
                })
            except Exception as msg_error:
                print(f"[Gmail API] Error parsing message {msg['id']}: {msg_error}")
                continue
        
        print(f"[Gmail API] Successfully parsed {len(parsed_messages)} messages")
        return (True, parsed_messages, None)
    
    except Exception as e:
        error_msg = str(e)
        print(f"[Gmail API] ERROR: {error_msg}")
        return (False, [], error_msg)

def extract_email_body(payload):
    """
    Extract text body from email payload.
    """
    body = ""
    
    try:
        if "parts" in payload:
            for part in payload["parts"]:
                mime_type = part.get("mimeType", "")
                part_body = part.get("body", {})
                
                if mime_type == "text/plain" and "data" in part_body:
                    body = base64.urlsafe_b64decode(part_body["data"]).decode("utf-8", errors="ignore")
                    break
                elif mime_type == "text/html" and not body and "data" in part_body:
                    body = base64.urlsafe_b64decode(part_body["data"]).decode("utf-8", errors="ignore")
                elif "parts" in part:
                    # Recursive for nested parts
                    body = extract_email_body(part)
                    if body:
                        break
        else:
            payload_body = payload.get("body", {})
            if "data" in payload_body:
                body = base64.urlsafe_b64decode(payload_body["data"]).decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"[Gmail API] Error extracting body: {e}")
        body = ""
    
    return body[:5000]  # Limit body size

def get_user_email(creds):
    """
    Get the authenticated user's email address.
    """
    try:
        service = build("gmail", "v1", credentials=creds)
        profile = service.users().getProfile(userId="me").execute()
        return profile.get("emailAddress")
    except Exception as e:
        print(f"Error getting user email: {e}")
        return None

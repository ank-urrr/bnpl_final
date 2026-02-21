import os
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from flask import session, redirect, request
from google.oauth2.credentials import Credentials

CLIENT_SECRETS_FILE = "client_secret.json"

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

def create_flow():
    return Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri="http://localhost:5000/auth/callback"
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

def fetch_bnpl_messages(creds, max_results=10):
    service = build("gmail", "v1", credentials=creds)

    query = 'subject:(("pay later") OR emi OR installment) -subject:(sale OR deal OR offer)'

    results = service.users().messages().list(
        userId="me",
        q=query,
        maxResults=max_results
    ).execute()

    messages = results.get("messages", [])

    return messages

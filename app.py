from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from backend.models import init_db
from backend.models import get_bnpl_records
from backend.finance import calculate_analysis
from backend.gmail_service import create_flow, get_gmail_service
from flask import redirect, session, request
from backend.gmail_service import get_credentials_from_session
from backend.gmail_service import fetch_bnpl_messages
import os


app = Flask(__name__)
CORS(app)
app.secret_key = "supersecret"
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/api/bnpl")
def get_bnpl():
    return jsonify(get_bnpl_records())

@app.route("/api/analysis")
def analysis():
    fake_profile = {"salary": 30000}
    records = get_bnpl_records()

    result = calculate_analysis(fake_profile, records)
    return jsonify(result)

@app.route("/auth/login")
def login():
    flow = create_flow()
    auth_url, state = flow.authorization_url(prompt="consent")

    session["state"] = state
    return redirect(auth_url)

@app.route("/auth/callback")
def callback():
    flow = create_flow()
    flow.fetch_token(authorization_response=request.url)

    credentials = flow.credentials

    session["credentials"] = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": credentials.scopes
    }

    return jsonify({"message": "Gmail connected successfully"})

@app.route("/api/fetch-emails")
def fetch_emails():
    creds = get_credentials_from_session(session)

    if not creds:
        return jsonify({"error": "Not authenticated"}), 401

    service = get_gmail_service(creds)

    results = service.users().messages().list(
        userId="me",
        maxResults=5
    ).execute()

    messages = results.get("messages", [])

    email_subjects = []

    for msg in messages:
        msg_data = service.users().messages().get(
            userId="me",
            id=msg["id"]
        ).execute()

        headers = msg_data["payload"]["headers"]

        subject = next(
            (h["value"] for h in headers if h["name"] == "Subject"),
            "No Subject"
        )

        email_subjects.append(subject)

    return jsonify({"emails": email_subjects})

@app.route("/api/fetch-bnpl")
def fetch_bnpl():
    creds = get_credentials_from_session(session)

    if not creds:
        return jsonify({"error": "Not authenticated"}), 401

    service = get_gmail_service(creds)

    query = 'subject:(("pay later") OR emi OR installment) -subject:(sale OR deal OR offer)'


    results = service.users().messages().list(
        userId="me",
        q=query,
        maxResults=10
    ).execute()

    messages = results.get("messages", [])

    matched_subjects = []

    for msg in messages:
        msg_data = service.users().messages().get(
            userId="me",
            id=msg["id"]
        ).execute()

        headers = msg_data["payload"]["headers"]

        subject = next(
            (h["value"] for h in headers if h["name"] == "Subject"),
            "No Subject"
        )

        matched_subjects.append(subject)

    return jsonify({
        "count": len(matched_subjects),
        "subjects": matched_subjects
    })



if __name__ == "__main__":
    app.run(debug=True)
    
app.config.from_object(Config)



init_db()



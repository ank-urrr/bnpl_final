from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from backend.models import init_db
from backend.models import get_bnpl_records, insert_bnpl_record, clear_bnpl_records, get_user_salary, update_user_salary, get_user_profile, update_user_profile, update_bnpl_status, get_bnpl_record_by_id, is_gmail_message_processed
from backend.finance import calculate_analysis, calculate_affordability
from backend.gmail_service import create_flow, get_gmail_service, fetch_gmail_messages, get_user_email
from flask import redirect, session, request
from backend.gmail_service import get_credentials_from_session
from backend.parser import parse_bnpl_email, is_bnpl_email
import os
from dotenv import load_dotenv
import jwt
import json
from datetime import datetime, timedelta
import uuid
import json

load_dotenv()

# Temporary storage for auth codes (maps code → credentials)
AUTH_CODE_STORE = {}

app = Flask(__name__)
# Configure CORS origins from environment (comma-separated) so production frontend can be allowed
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
CORS(app, supports_credentials=True, origins=cors_origins)

# Frontend URL for redirects (set in production to your GitHub Pages or deployed frontend)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.secret_key = os.getenv("SECRET_KEY", "default-secret-key-change-in-production")
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/api/user/email")
def get_current_user_email():
    """Get authenticated user's email"""
    creds = get_credentials_from_session(session)
    if not creds:
        return jsonify({"error": "Not authenticated"}), 401
    
    user_email = get_user_email(creds)
    if user_email:
        session["user_email"] = user_email
        return jsonify({"email": user_email})
    return jsonify({"error": "Could not fetch user email"}), 500

@app.route("/api/user/salary", methods=["GET", "POST"])
def user_salary():
    """Get or update user salary"""
    if "user_email" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    user_email = session["user_email"]
    
    if request.method == "POST":
        data = request.get_json()
        salary = data.get("salary", 30000)
        update_user_salary(user_email, salary)
        return jsonify({"message": "Salary updated", "salary": salary})
    
    salary = get_user_salary(user_email)
    return jsonify({"salary": salary})

@app.route("/api/user/profile", methods=["GET", "POST", "PUT"])
def user_profile():
    """Get or update user profile"""
    if "user_email" not in session:
        return jsonify({
            "success": False,
            "message": "Not authenticated"
        }), 401
    
    user_email = session["user_email"]
    
    if request.method in ["POST", "PUT"]:
        data = request.get_json()
        
        # Validate required fields
        if not data.get("full_name") or not data.get("salary"):
            return jsonify({
                "success": False,
                "message": "Full name and salary are required"
            }), 400
        
        try:
            update_user_profile(user_email, data)
            return jsonify({
                "success": True,
                "message": "Profile updated successfully",
                "data": data
            })
        except Exception as e:
            print(f"[Profile] ERROR: {e}")
            return jsonify({
                "success": False,
                "message": "Failed to update profile"
            }), 500
    
    # GET request
    profile = get_user_profile(user_email)
    if profile:
        return jsonify({
            "success": True,
            "data": profile
        })
    else:
        return jsonify({
            "success": True,
            "data": {
                "email": user_email,
                "salary": 30000,
                "full_name": None,
                "monthly_rent": 0,
                "other_expenses": 0,
                "city": None,
                "existing_loans": 0
            }
        })

@app.route("/api/emails/sync")
def sync_emails():
    """
    Fetch Gmail messages, parse BNPL data with STRICT filtering, and store in database.
    Now with idempotent syncing - prevents duplicate records from re-processed emails.
    """
    print("[Sync] Starting IDEMPOTENT email sync with STRICT filtering...")
    
    creds = get_credentials_from_session(session)
    
    if not creds:
        print("[Sync] ERROR: Not authenticated")
        return jsonify({
            "success": False,
            "message": "Not authenticated. Please login again.",
            "data": None
        }), 401
    
    # Get user email
    user_email = get_user_email(creds)
    if not user_email:
        print("[Sync] ERROR: Could not fetch user email")
        return jsonify({
            "success": False,
            "message": "Could not fetch user email. Please try again.",
            "data": None
        }), 500
    
    print(f"[Sync] User email: {user_email}")
    session["user_email"] = user_email
    
    # Fetch Gmail messages
    success, messages, error = fetch_gmail_messages(creds, max_results=50)
    
    if not success:
        print(f"[Sync] ERROR: Gmail API failed - {error}")
        return jsonify({
            "success": False,
            "message": f"Failed to fetch emails: {error}",
            "data": None
        }), 500
    
    if not messages:
        print("[Sync] No messages found")
        return jsonify({
            "success": True,
            "message": "No BNPL-related emails found in your inbox.",
            "data": {
                "synced_count": 0,
                "bnpl_count": 0,
                "filtered_count": 0,
                "skipped_count": 0
            }
        })
    
    print(f"[Sync] Processing {len(messages)} messages with IDEMPOTENT + STRICT filtering...")
    
    # Parse and store BNPL records with idempotent logic
    bnpl_count = 0
    filtered_count = 0
    skipped_count = 0
    
    for msg in messages:
        gmail_message_id = msg["id"]
        sender = msg["sender"]
        subject = msg["subject"]
        body = msg["body"]
        
        # IDEMPOTENT CHECK: Skip if already processed
        if is_gmail_message_processed(user_email, gmail_message_id):
            skipped_count += 1
            print(f"[Sync] SKIPPED (already processed): {subject[:50]}... (Gmail ID: {gmail_message_id[:10]}...)")
            continue
        
        # STRICT VALIDATION: Check if email is from valid financial sender
        if not is_bnpl_email(sender, subject, body):
            filtered_count += 1
            print(f"[Sync] FILTERED OUT: {subject[:50]}... (not from financial sender)")
            continue
        
        # Parse the email
        parsed = parse_bnpl_email(sender, subject, body)
        
        # Only store if we found amount (critical field)
        if parsed["amount"]:
            # Insert with Gmail message ID for idempotent sync
            success = insert_bnpl_record(
                user_email=user_email,
                gmail_message_id=gmail_message_id,
                vendor=parsed["vendor"],
                amount=parsed["amount"],
                installments=parsed["installments"] or 1,
                due_date=parsed["due_date"],
                email_subject=subject
            )
            
            if success:
                bnpl_count += 1
                print(f"[Sync] ✓ Stored: {parsed['vendor']} - ₹{parsed['amount']} ({parsed['installments']} EMI) Due: {parsed['due_date']} (Gmail ID: {gmail_message_id[:10]}...)")
            else:
                skipped_count += 1
                print(f"[Sync] SKIPPED (duplicate): {subject[:50]}... (Gmail ID: {gmail_message_id[:10]}...)")
        else:
            filtered_count += 1
            print(f"[Sync] FILTERED OUT: {subject[:50]}... (no valid amount found)")
    
    print(f"[Sync] Complete! Stored {bnpl_count} new BNPL records, skipped {skipped_count} already processed, filtered out {filtered_count} non-financial emails")
    
    return jsonify({
        "success": True,
        "message": f"Successfully synced {bnpl_count} new BNPL transactions from {len(messages)} emails. Skipped {skipped_count} already processed, filtered out {filtered_count} non-financial emails.",
        "data": {
            "synced_count": len(messages),
            "bnpl_count": bnpl_count,
            "filtered_count": filtered_count,
            "skipped_count": skipped_count
        }
    })

@app.route("/api/bnpl/records")
def bnpl_records():
    """
    Get all BNPL records for authenticated user.
    Query params:
    - status: 'active', 'paid', or None for all
    """
    if "user_email" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    user_email = session["user_email"]
    status_filter = request.args.get("status")  # Can be 'active', 'paid', or None
    
    records = get_bnpl_records(user_email, status_filter=status_filter)
    
    return jsonify({
        "records": records,
        "count": len(records)
    })

@app.route("/api/risk-score")
def risk_score():
    """
    Calculate and return risk analysis.
    """
    if "user_email" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    user_email = session["user_email"]
    
    # Get user salary
    salary = get_user_salary(user_email)
    
    # Get BNPL records
    records = get_bnpl_records(user_email)
    
    # Calculate analysis
    analysis = calculate_analysis(salary, records)
    
    return jsonify(analysis)

@app.route("/api/affordability")
def affordability():
    """
    Calculate affordability capacity for the user.
    """
    if "user_email" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    user_email = session["user_email"]
    
    # Get user profile
    profile = get_user_profile(user_email)
    if not profile:
        return jsonify({"error": "User profile not found"}), 404
    
    salary = profile.get("salary", 30000)
    rent = profile.get("monthly_rent", 0)
    other_expenses = profile.get("other_expenses", 0)
    
    # Get BNPL records (only active)
    records = get_bnpl_records(user_email, status_filter="active")
    
    # Calculate monthly obligation
    monthly_bnpl_obligation = 0
    for record in records:
        if record["amount"] and record["installments"] and record["installments"] > 0:
            monthly_bnpl_obligation += record["amount"] / record["installments"]
    
    # Calculate affordability
    affordability_data = calculate_affordability(salary, monthly_bnpl_obligation, rent, other_expenses)
    
    return jsonify(affordability_data)

@app.route("/api/bnpl/<int:record_id>/mark-paid", methods=["PUT"])
def mark_bnpl_paid(record_id):
    """
    Mark a BNPL record as paid and recalculate financial metrics.
    """
    if "user_email" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    user_email = session["user_email"]
    
    # Get the record
    record = get_bnpl_record_by_id(record_id)
    if not record:
        return jsonify({"error": "Record not found"}), 404
    
    # Verify ownership
    if record["user_email"] != user_email:
        return jsonify({"error": "Unauthorized"}), 403
    
    # Update status to paid
    try:
        update_bnpl_status(record_id, "paid")
        print(f"[Mark Paid] Record {record_id} marked as paid by {user_email}")
    except Exception as e:
        print(f"[Mark Paid] ERROR: {e}")
        return jsonify({"error": "Failed to update record"}), 500
    
    # Recalculate financial metrics
    profile = get_user_profile(user_email)
    salary = profile.get("salary", 30000)
    rent = profile.get("monthly_rent", 0)
    other_expenses = profile.get("other_expenses", 0)
    
    # Get updated BNPL records (only active)
    records = get_bnpl_records(user_email, status_filter="active")
    
    # Recalculate analysis
    analysis = calculate_analysis(salary, records)
    
    # Recalculate affordability
    monthly_bnpl_obligation = analysis["monthly_obligation"]
    affordability_data = calculate_affordability(salary, monthly_bnpl_obligation, rent, other_expenses)
    
    return jsonify({
        "success": True,
        "message": "Payment recorded successfully",
        "analysis": analysis,
        "affordability": affordability_data
    })

@app.route("/api/bnpl")
def get_bnpl():
    """Legacy endpoint - kept for backward compatibility"""
    return jsonify(get_bnpl_records())

@app.route("/api/analysis")
def analysis():
    """Legacy endpoint - kept for backward compatibility"""
    fake_profile = {"salary": 30000}
    records = get_bnpl_records()

    result = calculate_analysis(fake_profile.get("salary"), records)
    return jsonify(result)

@app.route("/auth/login")
def login():
    flow = create_flow()
    auth_url, state = flow.authorization_url(prompt="consent")

    session["state"] = state
    return redirect(auth_url)

@app.route("/auth/exchange-code")
def exchange_code():
    """Exchange temporary auth code for credentials"""
    code = request.args.get("code")
    print(f"[Auth] Exchange code request: {code}")
    print(f"[Auth] Available codes in store: {list(AUTH_CODE_STORE.keys())}")
    
    if not code or code not in AUTH_CODE_STORE:
        print(f"[Auth] Code not found in store: {code}")
        return jsonify({"authenticated": False, "error": "Invalid or expired code"}), 401
    
    auth_data = AUTH_CODE_STORE[code]
    
    # Check if code expired
    if auth_data["expires"] < datetime.utcnow():
        print(f"[Auth] Code expired: {code}")
        del AUTH_CODE_STORE[code]
        return jsonify({"authenticated": False, "error": "Code expired"}), 401
    
    # Create JWT token
    token = jwt.encode({
        "email": auth_data["email"],
        "exp": datetime.utcnow() + timedelta(days=30),
        "credentials": auth_data["credentials"]
    }, app.config.get("SECRET_KEY", os.getenv("SECRET_KEY", "default-secret")), algorithm="HS256")
    
    # Cleanup
    del AUTH_CODE_STORE[code]
    print(f"[Auth] Code exchanged successfully: {code}, email: {auth_data['email']}")
    
    return jsonify({
        "authenticated": True,
        "email": auth_data["email"],
        "token": token
    })

@app.route("/auth/status")
def auth_status():
    """Check if user is authenticated"""
    # Try to get JWT token from Authorization header or query param
    token = None
    if request.headers.get("Authorization"):
        token = request.headers.get("Authorization").split(" ")[-1]
    elif request.args.get("token"):
        token = request.args.get("token")
    
    if token:
        try:
            payload = jwt.decode(token, app.config.get("SECRET_KEY", os.getenv("SECRET_KEY", "default-secret")), algorithms=["HS256"])
            user_email = payload.get("email")
            
            # Store credentials in session from token
            if "credentials" in payload:
                session["credentials"] = payload["credentials"]
                session["user_email"] = user_email
            
            return jsonify({
                "authenticated": True,
                "email": user_email
            })
        except jwt.ExpiredSignatureError:
            return jsonify({"authenticated": False, "error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"authenticated": False, "error": "Invalid token"}), 401
    
    # Fall back to session-based auth
    creds = get_credentials_from_session(session)
    if creds:
        user_email = session.get("user_email")
        return jsonify({
            "authenticated": True,
            "email": user_email
        })
    return jsonify({"authenticated": False})

@app.route("/auth/logout")
def logout():
    """Logout user"""
    session.clear()
    return jsonify({"message": "Logged out successfully"})

@app.route("/auth/callback")
def callback():
    print("[Auth] Callback triggered")
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
    
    # Get and store user email
    user_email = get_user_email(credentials)
    print(f"[Auth] User email from Gmail: {user_email}")
    if user_email:
        session["user_email"] = user_email
        
        # Create a temporary auth code (short ID) to pass in URL
        auth_code = str(uuid.uuid4())[:8]
        AUTH_CODE_STORE[auth_code] = {
            "email": user_email,
            "credentials": {
                "token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_uri": credentials.token_uri,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
                "scopes": list(credentials.scopes) if credentials.scopes else []
            },
            "expires": datetime.utcnow() + timedelta(minutes=5)
        }
        print(f"[Auth] Code generated: {auth_code}, expires: {AUTH_CODE_STORE[auth_code]['expires']}")
        
        # Check if user has completed profile
        profile = get_user_profile(user_email)
        if profile and profile.get("full_name"):
            # Existing user - go to dashboard
            print(f"[Auth] User has profile, redirecting to dashboard")
            return redirect(f"{FRONTEND_URL.rstrip('/')}/dashboard?code={auth_code}")
        else:
            # New user - go to onboarding
            print(f"[Auth] New user, redirecting to onboarding")
            return redirect(f"{FRONTEND_URL.rstrip('/')}/onboarding?code={auth_code}")

    # Redirect to dashboard with error (fallback)
    print("[Auth] Failed to get user email")
    return redirect(f"{FRONTEND_URL.rstrip('/')}/dashboard?auth=failed")


@app.route("/api/fetch-emails")
def fetch_emails():
    """Legacy test endpoint"""
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
    """Legacy test endpoint"""
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
    app.config.from_object(Config)
    init_db()
    # Production: Gunicorn handles the server
    # Local development: debug=True for hot reload
    app.run(debug=os.getenv('FLASK_DEBUG', 'False') == 'True', 
            host='0.0.0.0', 
            port=int(os.getenv('PORT', 5000)))



# FinPilot

A full-stack fintech web application that helps users track their Buy Now Pay Later (BNPL) commitments by analyzing Gmail messages.

## Features

- 🔐 Secure Google OAuth authentication
- 📧 Automatic Gmail scanning for BNPL transactions
- 📊 Financial analysis and risk scoring
- 💰 Debt-to-income ratio calculation
- ⚠️ Risk assessment (Low/Medium/High)
- 📈 Dashboard with real-time metrics

## Tech Stack

### Backend
- Flask (Python)
- SQLite database
- Google Gmail API
- Session-based authentication

### Frontend
- React 18
- Vite
- React Router
- Axios

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- Google Cloud Project with Gmail API enabled

### Backend Setup

1. Clone the repository and navigate to the project root

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your secret key: `SECRET_KEY="your-secret-key-here"`

6. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Gmail API
   - Create OAuth 2.0 credentials (Web application)
   - Add authorized redirect URI: `http://localhost:5000/auth/callback`
   - Download credentials and save as `client_secret.json` in project root

7. Run the backend:
```bash
python app.py
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `GET /auth/login` - Initiate Google OAuth flow
- `GET /auth/callback` - OAuth callback handler
- `GET /auth/status` - Check authentication status
- `GET /auth/logout` - Logout user

### User Management
- `GET /api/user/email` - Get authenticated user's email
- `GET /api/user/salary` - Get user's salary
- `POST /api/user/salary` - Update user's salary

### BNPL Operations
- `GET /api/emails/sync` - Fetch and parse Gmail messages for BNPL data
- `GET /api/bnpl/records` - Get all BNPL records for user
- `GET /api/risk-score` - Calculate risk analysis

## How It Works

1. **Authentication**: User logs in with Google OAuth
2. **Email Sync**: System fetches last 50 Gmail messages
3. **Filtering**: Emails are filtered for BNPL-related keywords (EMI, installment, pay later, etc.)
4. **Parsing**: Email content is parsed using regex to extract:
   - Purchase amount
   - Number of installments
   - Due dates
   - Vendor name
5. **Storage**: Parsed data is stored in SQLite database
6. **Analysis**: System calculates:
   - Total outstanding amount
   - Monthly installment obligation
   - Debt-to-income ratio
   - Risk score (0-100)
7. **Display**: Dashboard shows all metrics and records

## Security Features

- Session-based authentication
- Credentials stored server-side only
- CORS configured for specific origins
- Secrets managed via environment variables
- OAuth tokens never exposed to frontend

## Risk Scoring Logic

- **Debt Ratio < 20%**: Low Risk (Score: 0-20)
- **Debt Ratio 20-40%**: Medium Risk (Score: 20-50)
- **Debt Ratio > 40%**: High Risk (Score: 50-100)

## Important Security Notes

- Never commit `.env` or `client_secret.json` files
- Keep your secrets secure and rotate them if exposed
- Use HTTPS in production
- Set secure session cookies in production

## Development

To run both backend and frontend simultaneously:

1. Terminal 1 (Backend):
```bash
python app.py
```

2. Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

## Production Deployment

1. Set `OAUTHLIB_INSECURE_TRANSPORT=0` in production
2. Use a production-grade secret key
3. Configure proper CORS origins
4. Use HTTPS for all endpoints
5. Set secure session cookie settings
6. Use a production database (PostgreSQL recommended)

## License

MIT

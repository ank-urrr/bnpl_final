# Backend Production Configuration

import os
from dotenv import load_dotenv

load_dotenv()

class ProductionConfig:
    """Production environment configuration"""
    DEBUG = False
    TESTING = False
    
    # Database
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///bnpl.db')
    
    # Security
    SECRET_KEY = os.getenv('SECRET_KEY', 'change-me-in-production')
    
    # CORS - Be explicit about allowed origins
    CORS_ORIGINS = os.getenv(
        'CORS_ORIGINS',
        'http://localhost:3000,http://localhost:5173'
    ).split(',')
    
    # Frontend URL for redirects
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    
    # Gmail OAuth
    GMAIL_CLIENT_SECRETS = os.getenv('GMAIL_CLIENT_SECRETS')
    
    # Session
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 3600

# Update this in app.py
config = ProductionConfig()

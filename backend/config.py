import os
import datetime
from pathlib import Path
from dotenv import load_dotenv

# Ensure robust .env loading relative to the config.py directory (essential for Gunicorn on Render)
base_dir = Path(__file__).resolve().parent
load_dotenv(dotenv_path=base_dir / '.env')

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    MONGO_URI = os.getenv('MONGO_URI')
    
    # Extend JWT token expiration to 30 days to prevent 401 errors during evaluations
    JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(days=30)


    # Email configuration (Strict rules for Google SMTP Port 587)
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True  # Force TLS encryption explicitly as a boolean
    MAIL_USE_SSL = False  # Force SSL to False (Google blocks SSL on port 587)

    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER')
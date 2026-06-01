import os
from dotenv import load_dotenv
from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from pathlib import Path

# Ensure robust .env loading relative to this script
base_dir = Path(__file__).resolve().parent
load_dotenv(dotenv_path=base_dir / '.env')

client = MongoClient(os.getenv('MONGO_URI'))
db = client.get_database()

# Delete existing admin users to prevent duplicates
db.users.delete_many({"role": "admin"})

admin_user = {
    "name": "System Admin",
    "email": "admin@mentorconnect.com",
    "password_hash": generate_password_hash("admin123"),
    "role": "admin",
    "created_at": None,
    "rating": 0,
    "reviews": 0,
    "bio": "Platform System Administrator",
    "expertise": None
}

db.users.insert_one(admin_user)
print("Seeded admin user successfully!")
print("Email: admin@mentorconnect.com")
print("Password: admin123")

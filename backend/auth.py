import random
import string
import threading  # Threading engine to run emails in the background
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Message
from extensions import mongo, mail
from flask_cors import CORS

auth_bp = Blueprint('auth', __name__)
CORS(auth_bp, resources={r"/*": {"origins": "*"}})


def generate_otp():
    return ''.join(random.choices(string.digits, k=6))


# Background thread worker function for emails
def send_async_email(app, msg):
    with app.app_context():
        try:
            mail.send(msg)
            print("[EMAIL] Background email sent successfully.")
        except Exception as e:
            print(f"[EMAIL] Background email failed: {e}")


def send_otp_email(email, otp):
    msg = Message(
        subject="Your OTP for MentorConnect Registration",
        recipients=[email],
        body=f"Hello,\n\nYour OTP for account verification is: {otp}\n\nThis OTP is valid for 10 minutes.\n\nBest regards,\nMentorConnect Team"
    )
    # Get the active Flask context object to pass into the new thread safely
    app = current_app._get_current_object()

    # Spin up an independent thread to send the email without blocking the server
    threading.Thread(target=send_async_email, args=(app, msg)).start()


def send_welcome_email(email, name, role):
    """Send a welcome email after account creation."""
    msg = Message(
        subject=f"Welcome to MentorConnect, {name}!",
        recipients=[email],
        sender="mentorconnect.project18@gmail.com",
        html=f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>Welcome</title></head>
        <body style="font-family: Arial, sans-serif;">
            <h2>Welcome to MentorConnect!</h2>
            <p>Hello <strong>{name}</strong>,</p>
            <p>Your account has been successfully created as a <strong>{role}</strong>.</p>
            <p>You can now log in and start your mentorship journey.</p>
            <p>Best regards,<br>MentorConnect Team</p>
        </body>
        </html>
        """
    )
    app = current_app._get_current_object()
    threading.Thread(target=send_async_email, args=(app, msg)).start()


@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json()
    email = data.get('email')
    name = data.get('name')
    password = data.get('password')
    role = data.get('role')
    company = data.get('company', '')
    title = data.get('title', '')
    experience_years = data.get('experience_years', None)
    profile_pic = data.get('profile_pic', '')

    if not all([email, name, password, role]):
        return jsonify({'error': 'All fields required'}), 400

    if mongo.db.users.find_one({'email': email}):
        return jsonify({'error': 'Email already registered'}), 400

    # Clean up previous entries
    mongo.db.email_verifications.delete_many({'email': email, 'is_verified': False})

    otp = generate_otp()

    # Triggers background email thread instantly
    send_otp_email(email, otp)

    hashed = generate_password_hash(password)
    verification_doc = {
        'email': email,
        'otp': otp,
        'name': name,
        'password_hash': hashed,
        'role': role,
        'company': company,
        'title': title,
        'experience_years': experience_years,
        'profile_pic': profile_pic,
        'created_at': datetime.utcnow(),
        'is_verified': False
    }
    mongo.db.email_verifications.insert_one(verification_doc)
    return jsonify({'message': 'OTP sent'}), 200


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')

    verification = mongo.db.email_verifications.find_one({
        'email': email,
        'otp': otp,
        'is_verified': False
    })
    if not verification:
        return jsonify({'error': 'Invalid OTP or email'}), 400

    if (datetime.utcnow() - verification['created_at']).total_seconds() > 600:
        mongo.db.email_verifications.delete_one({'_id': verification['_id']})
        return jsonify({'error': 'OTP expired'}), 400

    user_doc = {
        'email': verification['email'],
        'name': verification['name'],
        'password_hash': verification['password_hash'],
        'role': verification['role'],
        'company': verification.get('company'),
        'title': verification.get('title'),
        'experience_years': verification.get('experience_years'),
        'profile_pic': verification.get('profile_pic'),
        'created_at': datetime.utcnow(),
        'rating': 0,
        'reviews': 0,
        'bio': None,
        'expertise': None
    }
    result = mongo.db.users.insert_one(user_doc)
    mongo.db.email_verifications.update_one(
        {'_id': verification['_id']},
        {'$set': {'is_verified': True}}
    )

    # Triggers background welcome email thread instantly
    send_welcome_email(user_doc['email'], user_doc['name'], user_doc['role'])

    access_token = create_access_token(
        identity=str(result.inserted_id),
        additional_claims={'role': user_doc['role']}
    )
    return jsonify({
        'token': access_token,
        'user': {
            'id': str(result.inserted_id),
            'name': user_doc['name'],
            'email': user_doc['email'],
            'role': user_doc['role'],
            'company': user_doc.get('company'),
            'title': user_doc.get('title'),
            'experience_years': user_doc.get('experience_years'),
            'profile_pic': user_doc.get('profile_pic')
        }
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    user = mongo.db.users.find_one({'email': email})
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid credentials'}), 401

    access_token = create_access_token(
        identity=str(user['_id']),
        additional_claims={'role': user['role']}
    )
    return jsonify({
        'token': access_token,
        'user': {
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'role': user['role'],
            'company': user.get('company'),
            'title': user.get('title'),
            'experience_years': user.get('experience_years'),
            'profile_pic': user.get('profile_pic')
        }
    }), 200
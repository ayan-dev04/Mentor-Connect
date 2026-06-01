import os
import requests
from flask import current_app
from flask_mail import Message
from extensions import mail

def send_email(subject, recipients, body=None, html=None, sender=None):
    """
    Robust centralized email sending function.
    If BREVO_API_KEY is configured in the environment, sends via Brevo's HTTPS API
    (which allows sending up to 300 free emails per day to ANY recipient without a custom domain).
    If RESEND_API_KEY is configured in the environment, sends via Resend's HTTPS API.
    Otherwise, falls back to Flask-Mail SMTP.
    """
    brevo_key = os.getenv('BREVO_API_KEY')
    resend_key = os.getenv('RESEND_API_KEY')
    
    # Ensure recipients is a list of strings
    if isinstance(recipients, str):
        recipients_list = [recipients]
    else:
        recipients_list = list(recipients)

    # 1. Option A: Brevo HTTP API (Best for arbitrary recipients/free domains)
    if brevo_key:
        print(f"[EMAIL] Using Brevo HTTP API to send to {recipients_list}...")
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "api-key": brevo_key,
            "Content-Type": "application/json"
        }
        
        sender_email = sender or os.getenv('BREVO_SENDER_EMAIL') or "mentorconnect.project18@gmail.com"
        sender_name = os.getenv('BREVO_SENDER_NAME') or "MentorConnect Team"
        
        payload = {
            "sender": {"name": sender_name, "email": sender_email},
            "to": [{"email": r} for r in recipients_list],
            "subject": subject
        }
        if html:
            payload["htmlContent"] = html
        elif body:
            payload["textContent"] = body
            
        try:
            r = requests.post(url, json=payload, headers=headers, timeout=10)
            if r.status_code in [200, 201, 202]:
                print(f"[EMAIL] Brevo HTTP email sent successfully to {recipients_list}.")
                return True
            else:
                print(f"[EMAIL] Brevo HTTP API returned error {r.status_code}: {r.text}")
        except Exception as e:
            print(f"[EMAIL] Brevo HTTP request failed: {e}")

    # 2. Option B: Resend HTTP API
    elif resend_key:
        print(f"[EMAIL] Using Resend HTTP API to send to {recipients_list}...")
        # Free Resend tier requires "onboarding@resend.dev" as from address unless domain is verified
        from_email = os.getenv('RESEND_FROM_EMAIL') or "onboarding@resend.dev"
        
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {resend_key}",
            "Content-Type": "application/json"
        }
        
        # Resend accepts either single string or list of strings for 'to'
        payload = {
            "from": from_email,
            "to": recipients_list,
            "subject": subject
        }
        if html:
            payload["html"] = html
        elif body:
            payload["text"] = body
            
        try:
            r = requests.post(url, json=payload, headers=headers, timeout=10)
            if r.status_code in [200, 201]:
                print(f"[EMAIL] Resend HTTP email sent successfully to {recipients_list}.")
                return True
            else:
                print(f"[EMAIL] Resend HTTP API returned error {r.status_code}: {r.text}")
        except Exception as e:
            print(f"[EMAIL] Resend HTTP request failed: {e}")
            
    # Fallback to standard Flask-Mail SMTP
    print(f"[EMAIL] Using standard Flask-Mail SMTP to send to {recipients_list}...")
    from_email = sender or current_app.config.get('MAIL_DEFAULT_SENDER') or current_app.config.get('MAIL_USERNAME') or "mentorconnect.project18@gmail.com"
    msg = Message(
        subject=subject,
        recipients=recipients_list,
        sender=from_email,
        body=body,
        html=html
    )
    try:
        mail.send(msg)
        print(f"[EMAIL] SMTP email sent successfully to {recipients_list}.")
        return True
    except Exception as e:
        print(f"[EMAIL] SMTP email failed: {e}")
        return False


import threading

def send_email_in_background(app, subject, recipients, body, html, sender):
    with app.app_context():
        try:
            send_email(subject, recipients, body=body, html=html, sender=sender)
        except Exception as e:
            print(f"[EMAIL] Background send_email failed: {e}")

def send_email_async(subject, recipients, body=None, html=None, sender=None):
    """
    Spawns a background thread to send the email asynchronously.
    Guarantees that the main request returns instantly to prevent Gunicorn/CORS timeouts.
    """
    app = current_app._get_current_object()
    thread = threading.Thread(
        target=send_email_in_background,
        args=(app, subject, recipients, body, html, sender)
    )
    thread.daemon = True
    thread.start()
    print(f"[EMAIL] Background thread successfully started for {recipients}.")


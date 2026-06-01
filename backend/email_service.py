import os
import requests
from flask import current_app
from flask_mail import Message
from extensions import mail

def send_email(subject, recipients, body=None, html=None, sender=None):
    """
    Robust centralized email sending function.
    If RESEND_API_KEY is configured in the environment, sends via Resend's HTTPS API
    (which works on Render's free tier where SMTP port 587/465 is blocked).
    Otherwise, falls back to Flask-Mail SMTP.
    """
    resend_key = os.getenv('RESEND_API_KEY')
    
    # Ensure recipients is a list of strings
    if isinstance(recipients, str):
        recipients_list = [recipients]
    else:
        recipients_list = list(recipients)

    if resend_key:
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

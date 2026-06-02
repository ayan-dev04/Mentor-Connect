from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from bson.objectid import ObjectId
from datetime import datetime
from extensions import mongo
from email_service import send_email_async
from werkzeug.security import generate_password_hash

mentors_bp = Blueprint('mentors', __name__)
bookings_bp = Blueprint('bookings', __name__)
feedback_bp = Blueprint('feedback', __name__)
profile_bp = Blueprint('profile', __name__)
admin_bp = Blueprint('admin', __name__)
availability_bp = Blueprint('availability', __name__)


def send_booking_emails(student_email, student_name, mentor_email, mentor_name, slot_str):
    # Seeded mentor names list from seed_mentors.py
    seeded_mentor_names = {
        "Aarav Sharma", "Vihaan Verma", "Vivaan Gupta", "Ananya Singh", "Diya Patel",
        "Advik Kumar", "Sai Reddy", "Pari Joshi", "Rudra Menon", "Ishaan Iyer"
    }

    # If it is a seeded mentor, explicitly route their confirmation email to mentor.connect1mentors@gmail.com
    actual_mentor_email = mentor_email
    if mentor_name in seeded_mentor_names:
        actual_mentor_email = "mentor.connect1mentors@gmail.com"

    html_template = """
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Session Confirmation</title></head>
    <body style="font-family: Arial, sans-serif;">
        <h2>MentorConnect</h2>
        <p>Hello <strong>{name}</strong>,</p>
        <p>Your session with <strong>{other_name}</strong> has been booked for <strong>{slot}</strong>.</p>
        <p>You can manage your session from your dashboard.</p>
        <p>Best regards,<br>MentorConnect Team</p>
    </body>
    </html>
    """

    student_html = html_template.format(name=student_name, other_name=mentor_name, slot=slot_str)
    mentor_html = html_template.format(name=mentor_name, other_name=student_name, slot=slot_str)

    # Send student email
    send_email_async(
        subject=f"Session Confirmation with {mentor_name}",
        recipients=student_email,
        html=student_html
    )

    # Send mentor email if different
    if student_email != actual_mentor_email:
        send_email_async(
            subject=f"New Session: {student_name} booked with you",
            recipients=actual_mentor_email,
            html=mentor_html
        )



# ---------- MENTORS ----------
@mentors_bp.route('', methods=['GET'])
def get_mentors():
    mentors_cursor = mongo.db.users.find({"role": "mentor"})
    result = []
    for m in mentors_cursor:
        slots = list(mongo.db.availability_slots.find({"mentor_id": m["_id"], "is_booked": False}))
        result.append({
            "id": str(m["_id"]),
            "name": m["name"],
            "email": m.get("email"),
            "title": m.get("title"),
            "company": m.get("company"),
            "expertise": m.get("expertise", "").split(",") if m.get("expertise") else [],
            "rating": m.get("rating", 0),
            "reviews": m.get("reviews", 0),
            "bio": m.get("bio"),
            "profile_pic": m.get("profile_pic"),
            "availableSlots": [s["slot"].isoformat() for s in slots]
        })
    return jsonify(result)

@mentors_bp.route('/<mentor_id>', methods=['GET'])
def get_mentor(mentor_id):
    if not ObjectId.is_valid(mentor_id):
        return jsonify({"error": "Invalid mentor ID"}), 400
    mentor = mongo.db.users.find_one({"_id": ObjectId(mentor_id), "role": "mentor"})
    if not mentor:
        return jsonify({"error": "Mentor not found"}), 404
    slots = list(mongo.db.availability_slots.find({"mentor_id": ObjectId(mentor_id), "is_booked": False}))
    return jsonify({
        "id": str(mentor["_id"]),
        "name": mentor["name"],
        "email": mentor.get("email"),
        "title": mentor.get("title"),
        "company": mentor.get("company"),
        "expertise": mentor.get("expertise", "").split(",") if mentor.get("expertise") else [],
        "rating": mentor.get("rating", 0),
        "reviews": mentor.get("reviews", 0),
        "bio": mentor.get("bio"),
        "profile_pic": mentor.get("profile_pic"),
        "availableSlots": [{"id": str(s["_id"]), "slot": s["slot"].isoformat()} for s in slots]
    })

# ---------- BOOKINGS ----------
@bookings_bp.route('', methods=['POST'])
@jwt_required()
def create_booking():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        if not data:
            return jsonify({"error": "Empty request body"}), 400

        mentor_id = data.get('mentor_id')
        slot_id = data.get('slot_id')
        if not mentor_id or not slot_id:
            return jsonify({"error": "Missing mentor_id or slot_id"}), 400

        if not ObjectId.is_valid(mentor_id) or not ObjectId.is_valid(slot_id):
            return jsonify({"error": "Invalid ID format"}), 400

        avail = mongo.db.availability_slots.find_one({"_id": ObjectId(slot_id), "is_booked": False})
        if not avail:
            return jsonify({"error": "Slot not available"}), 400

        if str(avail["mentor_id"]) != mentor_id:
            return jsonify({"error": "Slot does not belong to this mentor"}), 400

        student = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})
        mentor = mongo.db.users.find_one({"_id": ObjectId(mentor_id)})
        if not student or not mentor:
            return jsonify({"error": "Student or mentor not found"}), 404

        booking = {
            "student_id": ObjectId(current_user_id),
            "mentor_id": ObjectId(mentor_id),
            "slot": avail["slot"],
            "status": "upcoming",
            "created_at": datetime.utcnow()
        }
        result = mongo.db.bookings.insert_one(booking)
        mongo.db.availability_slots.update_one({"_id": avail["_id"]}, {"$set": {"is_booked": True}})

        send_booking_emails(
            student_email=student['email'],
            student_name=student['name'],
            mentor_email=mentor['email'],
            mentor_name=mentor['name'],
            slot_str=avail["slot"].isoformat()
        )

        return jsonify({"message": "Booking created", "booking_id": str(result.inserted_id)}), 201

    except Exception as e:
        print(f"Booking error: {e}")
        return jsonify({"error": str(e)}), 500

@bookings_bp.route('/student', methods=['GET'])
@jwt_required()
def get_student_bookings():
    current_user_id = get_jwt_identity()
    bookings_cursor = mongo.db.bookings.find({"student_id": ObjectId(current_user_id)})
    return jsonify([{
        "id": str(b["_id"]),
        "mentor_id": str(b["mentor_id"]),
        "slot": b["slot"].isoformat(),
        "status": b["status"],
        "created_at": b["created_at"].isoformat()
    } for b in bookings_cursor])

@bookings_bp.route('/mentor', methods=['GET'])
@jwt_required()
def get_mentor_bookings():
    current_user_id = get_jwt_identity()
    bookings_cursor = mongo.db.bookings.find({"mentor_id": ObjectId(current_user_id)})
    return jsonify([{
        "id": str(b["_id"]),
        "student_id": str(b["student_id"]),
        "slot": b["slot"].isoformat(),
        "status": b["status"],
        "created_at": b["created_at"].isoformat()
    } for b in bookings_cursor])

@bookings_bp.route('/<booking_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_booking(booking_id):
    current_user_id = get_jwt_identity()
    booking = mongo.db.bookings.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        return jsonify({"error": "Booking not found"}), 404
    if str(booking["student_id"]) != current_user_id and str(booking["mentor_id"]) != current_user_id:
        if get_jwt().get('role') != 'admin':
            return jsonify({"error": "Unauthorized"}), 403
    mongo.db.bookings.update_one({"_id": ObjectId(booking_id)}, {"$set": {"status": "cancelled"}})
    mongo.db.availability_slots.update_one(
        {"mentor_id": booking["mentor_id"], "slot": booking["slot"]},
        {"$set": {"is_booked": False}}
    )
    return jsonify({"message": "Booking cancelled"})

@bookings_bp.route('/<booking_id>/complete', methods=['PUT'])
@jwt_required()
def complete_booking(booking_id):
    current_user_id = get_jwt_identity()
    booking = mongo.db.bookings.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        return jsonify({"error": "Booking not found"}), 404
    if str(booking["mentor_id"]) != current_user_id:
        if get_jwt().get('role') != 'admin':
            return jsonify({"error": "Unauthorized"}), 403
    if booking["status"] != "upcoming":
        return jsonify({"error": "Session already completed or cancelled"}), 400
    mongo.db.bookings.update_one({"_id": ObjectId(booking_id)}, {"$set": {"status": "completed"}})
    return jsonify({"message": "Session completed"})

# ---------- FEEDBACK ----------
@feedback_bp.route('', methods=['POST'])
@jwt_required()
def add_feedback():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    booking_id = data.get('booking_id')
    rating = data.get('rating')
    comment = data.get('comment', '')

    booking = mongo.db.bookings.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        return jsonify({"error": "Booking not found"}), 404
    if str(booking["student_id"]) != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403
    if booking["status"] != "completed":
        return jsonify({"error": "Session not completed yet"}), 400

    mongo.db.feedback.insert_one({
        "booking_id": ObjectId(booking_id),
        "rating": rating,
        "comment": comment,
        "created_at": datetime.utcnow()
    })

    mentor_id = booking["mentor_id"]
    all_feedback = list(mongo.db.feedback.aggregate([
        {"$lookup": {"from": "bookings", "localField": "booking_id", "foreignField": "_id", "as": "booking"}},
        {"$unwind": "$booking"},
        {"$match": {"booking.mentor_id": mentor_id}}
    ]))
    if all_feedback:
        avg = sum(f["rating"] for f in all_feedback) / len(all_feedback)
        mongo.db.users.update_one({"_id": mentor_id}, {"$set": {"rating": round(avg, 1), "reviews": len(all_feedback)}})

    return jsonify({"message": "Feedback added"})

# ---------- PROFILE ----------
@profile_bp.route('', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "profile_pic": user.get("profile_pic"),
        "bio": user.get("bio"),
        "expertise": user.get("expertise", "").split(",") if user.get("expertise") else [],
        "title": user.get("title"),
        "company": user.get("company"),
        "experience_years": user.get("experience_years")
    })

@profile_bp.route('', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    allowed_fields = ["name", "bio", "expertise", "title", "company"]
    update_data = {f: data[f] for f in allowed_fields if f in data}
    if update_data:
        mongo.db.users.update_one({"_id": ObjectId(current_user_id)}, {"$set": update_data})
    return jsonify({"message": "Profile updated"})

# ---------- ADMIN ----------
@admin_bp.route('/students', methods=['GET'])
@jwt_required()
def get_students():
    if get_jwt().get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    students_cursor = mongo.db.users.find({"role": "student"})
    return jsonify([{
        "id": str(s["_id"]),
        "name": s["name"],
        "email": s["email"],
        "role": s["role"],
        "profile_pic": s.get("profile_pic"),
        "bio": s.get("bio"),
        "expertise": s.get("expertise"),
        "title": s.get("title"),
        "company": s.get("company"),
        "experience_years": s.get("experience_years")
    } for s in students_cursor])

@admin_bp.route('/feedback', methods=['GET'])
@jwt_required()
def get_all_feedback():
    if get_jwt().get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    feedback_cursor = mongo.db.feedback.find()
    return jsonify([{
        "id": str(f["_id"]),
        "booking_id": str(f["booking_id"]),
        "rating": f["rating"],
        "comment": f["comment"],
        "created_at": f["created_at"].isoformat()
    } for f in feedback_cursor])

@admin_bp.route('/bookings', methods=['GET'])
@jwt_required()
def get_all_bookings():
    if get_jwt().get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    bookings_cursor = mongo.db.bookings.find()
    return jsonify([{
        "id": str(b["_id"]),
        "student_id": str(b["student_id"]),
        "mentor_id": str(b["mentor_id"]),
        "slot": b["slot"].isoformat(),
        "status": b["status"],
        "created_at": b["created_at"].isoformat()
    } for b in bookings_cursor])

@admin_bp.route('/users', methods=['POST'])
@jwt_required()
def admin_add_user():
    if get_jwt().get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    
    if not all([name, email, password, role]):
        return jsonify({"error": "Missing required fields"}), 400
    if role not in ['student', 'mentor']:
        return jsonify({"error": "Invalid role"}), 400
        
    if mongo.db.users.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 400
        
    user_doc = {
        "name": name,
        "email": email,
        "password_hash": generate_password_hash(password),
        "role": role,
        "company": data.get('company', ''),
        "title": data.get('title', ''),
        "experience_years": data.get('experience_years'),
        "profile_pic": data.get('profile_pic', ''),
        "bio": data.get('bio', ''),
        "expertise": data.get('expertise', ''),
        "rating": 0,
        "reviews": 0,
        "created_at": datetime.utcnow()
    }
    result = mongo.db.users.insert_one(user_doc)
    return jsonify({"message": f"{role.capitalize()} created successfully", "id": str(result.inserted_id)}), 201

@admin_bp.route('/users/<user_id>', methods=['PUT'])
@jwt_required()
def admin_update_user(user_id):
    if get_jwt().get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    if not ObjectId.is_valid(user_id):
        return jsonify({"error": "Invalid user ID"}), 400
        
    data = request.get_json()
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    allowed_fields = ["name", "email", "company", "title", "experience_years", "profile_pic", "bio", "expertise"]
    update_data = {f: data[f] for f in allowed_fields if f in data}
    
    if 'password' in data and data['password']:
        update_data['password_hash'] = generate_password_hash(data['password'])
        
    if update_data:
        mongo.db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
        
    return jsonify({"message": "User updated successfully"}), 200

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_user(user_id):
    if get_jwt().get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    if not ObjectId.is_valid(user_id):
        return jsonify({"error": "Invalid user ID"}), 400
        
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    # Remove user
    mongo.db.users.delete_one({"_id": ObjectId(user_id)})
    
    # Clean up user's bookings and availability slots
    if user["role"] == "mentor":
        mongo.db.availability_slots.delete_many({"mentor_id": ObjectId(user_id)})
        mongo.db.bookings.update_many({"mentor_id": ObjectId(user_id)}, {"$set": {"status": "cancelled"}})
    elif user["role"] == "student":
        bookings = list(mongo.db.bookings.find({"student_id": ObjectId(user_id)}))
        for b in bookings:
            mongo.db.availability_slots.update_one(
                {"mentor_id": b["mentor_id"], "slot": b["slot"]},
                {"$set": {"is_booked": False}}
            )
        mongo.db.bookings.update_many({"student_id": ObjectId(user_id)}, {"$set": {"status": "cancelled"}})
        
    return jsonify({"message": "User and associated records deleted/updated successfully"}), 200

@admin_bp.route('/availability', methods=['POST'])
@jwt_required()
def admin_add_availability():
    if get_jwt().get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    data = request.get_json()
    mentor_id = data.get('mentor_id')
    slot_str = data.get('slot')
    
    if not mentor_id or not slot_str:
        return jsonify({"error": "Missing mentor_id or slot"}), 400
    if not ObjectId.is_valid(mentor_id):
        return jsonify({"error": "Invalid mentor ID"}), 400
        
    try:
        slot = datetime.fromisoformat(slot_str)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid slot format"}), 400
        
    mentor = mongo.db.users.find_one({"_id": ObjectId(mentor_id), "role": "mentor"})
    if not mentor:
        return jsonify({"error": "Mentor not found"}), 404
        
    if mongo.db.availability_slots.find_one({"mentor_id": ObjectId(mentor_id), "slot": slot}):
        return jsonify({"error": "Slot already exists"}), 400
        
    mongo.db.availability_slots.insert_one({
        "mentor_id": ObjectId(mentor_id),
        "slot": slot,
        "is_booked": False
    })
    return jsonify({"message": "Availability slot added successfully"}), 201

@admin_bp.route('/availability/<slot_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_availability(slot_id):
    if get_jwt().get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    if not ObjectId.is_valid(slot_id):
        return jsonify({"error": "Invalid slot ID"}), 400
        
    slot = mongo.db.availability_slots.find_one({"_id": ObjectId(slot_id)})
    if not slot:
        return jsonify({"error": "Slot not found"}), 404
        
    if slot.get("is_booked"):
        booking = mongo.db.bookings.find_one({"mentor_id": slot["mentor_id"], "slot": slot["slot"], "status": "upcoming"})
        if booking:
            mongo.db.bookings.update_one({"_id": booking["_id"]}, {"$set": {"status": "cancelled"}})
            
    mongo.db.availability_slots.delete_one({"_id": ObjectId(slot_id)})
    return jsonify({"message": "Availability slot removed successfully"}), 200

@admin_bp.route('/bookings', methods=['POST'])
@jwt_required()
def admin_create_booking():
    if get_jwt().get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    data = request.get_json()
    student_id = data.get('student_id')
    mentor_id = data.get('mentor_id')
    slot_id = data.get('slot_id')
    
    if not all([student_id, mentor_id, slot_id]):
        return jsonify({"error": "Missing student_id, mentor_id, or slot_id"}), 400
        
    if not all(ObjectId.is_valid(i) for i in [student_id, mentor_id, slot_id]):
        return jsonify({"error": "Invalid ID format"}), 400
        
    avail = mongo.db.availability_slots.find_one({"_id": ObjectId(slot_id), "is_booked": False})
    if not avail:
        return jsonify({"error": "Slot not available"}), 400
        
    if str(avail["mentor_id"]) != mentor_id:
        return jsonify({"error": "Slot does not belong to this mentor"}), 400
        
    student = mongo.db.users.find_one({"_id": ObjectId(student_id), "role": "student"})
    mentor = mongo.db.users.find_one({"_id": ObjectId(mentor_id), "role": "mentor"})
    if not student or not mentor:
        return jsonify({"error": "Student or mentor not found"}), 404
        
    booking = {
        "student_id": ObjectId(student_id),
        "mentor_id": ObjectId(mentor_id),
        "slot": avail["slot"],
        "status": "upcoming",
        "created_at": datetime.utcnow()
    }
    result = mongo.db.bookings.insert_one(booking)
    mongo.db.availability_slots.update_one({"_id": avail["_id"]}, {"$set": {"is_booked": True}})
    
    try:
        send_booking_emails(
            student_email=student['email'],
            student_name=student['name'],
            mentor_email=mentor['email'],
            mentor_name=mentor['name'],
            slot_str=avail["slot"].isoformat()
        )
    except Exception as e:
        print(f"Error sending booking emails: {e}")
        
    return jsonify({"message": "Booking created successfully", "booking_id": str(result.inserted_id)}), 201

@admin_bp.route('/bookings/<booking_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_booking(booking_id):
    if get_jwt().get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    if not ObjectId.is_valid(booking_id):
        return jsonify({"error": "Invalid booking ID"}), 400
        
    booking = mongo.db.bookings.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        return jsonify({"error": "Booking not found"}), 404
        
    if booking["status"] == "upcoming":
        mongo.db.availability_slots.update_one(
            {"mentor_id": booking["mentor_id"], "slot": booking["slot"]},
            {"$set": {"is_booked": False}}
        )
        
    mongo.db.bookings.delete_one({"_id": ObjectId(booking_id)})
    return jsonify({"message": "Booking record deleted successfully"}), 200

@admin_bp.route('/mentors/<mentor_id>/availability', methods=['GET'])
@jwt_required()
def admin_get_mentor_availability(mentor_id):
    if get_jwt().get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    if not ObjectId.is_valid(mentor_id):
        return jsonify({"error": "Invalid mentor ID"}), 400
    slots = list(mongo.db.availability_slots.find({"mentor_id": ObjectId(mentor_id)}))
    return jsonify([{
        "id": str(s["_id"]),
        "slot": s["slot"].isoformat(),
        "is_booked": s.get("is_booked", False)
    } for s in slots])

# ---------- AVAILABILITY ----------
@availability_bp.route('', methods=['POST'])
@jwt_required()
def add_availability():
    if get_jwt().get('role') != 'mentor':
        return jsonify({"error": "Only mentors can add availability"}), 403
    data = request.get_json()
    try:
        slot = datetime.fromisoformat(data.get('slot'))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid slot format"}), 400

    if mongo.db.availability_slots.find_one({"mentor_id": ObjectId(get_jwt_identity()), "slot": slot}):
        return jsonify({"error": "Slot already exists"}), 400

    mongo.db.availability_slots.insert_one({
        "mentor_id": ObjectId(get_jwt_identity()),
        "slot": slot,
        "is_booked": False
    })
    return jsonify({"message": "Availability slot added"})

@availability_bp.route('/<path:slot_str>', methods=['DELETE'])
@jwt_required()
def remove_availability(slot_str):
    if get_jwt().get('role') != 'mentor':
        return jsonify({"error": "Only mentors can remove availability"}), 403
    try:
        slot = datetime.fromisoformat(slot_str)
    except ValueError:
        return jsonify({"error": "Invalid slot format"}), 400

    result = mongo.db.availability_slots.delete_one({
        "mentor_id": ObjectId(get_jwt_identity()),
        "slot": slot,
        "is_booked": False
    })
    if result.deleted_count == 0:
        return jsonify({"error": "Slot not found or already booked"}), 404
    return jsonify({"message": "Availability slot removed"})

import smtplib
@mentors_bp.route('/test-smtp', methods=['GET'])
def test_smtp():
    results = {}
    
    # Test 587 (TLS)
    try:
        s = smtplib.SMTP('smtp.gmail.com', 587, timeout=5)
        s.ehlo()
        s.starttls()
        s.ehlo()
        results['port_587'] = 'Connected and STARTTLS succeeded!'
        s.close()
    except Exception as e:
        results['port_587'] = f'Failed: {str(e)}'
        
    # Test 465 (SSL)
    try:
        s = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=5)
        s.ehlo()
        results['port_465'] = 'Connected and SSL succeeded!'
        s.close()
    except Exception as e:
        results['port_465'] = f'Failed: {str(e)}'
        
    return jsonify(results)
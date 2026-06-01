import os
import random
from dotenv import load_dotenv
from pymongo import MongoClient
from werkzeug.security import generate_password_hash

load_dotenv()
client = MongoClient(os.getenv('MONGO_URI'))
db = client.get_database()

# Delete all existing mentors
db.users.delete_many({"role": "mentor"})
print("Deleted old mentors.")

# names
names = [
    "Aarav Sharma", "Vihaan Verma", "Vivaan Gupta", "Ananya Singh", "Diya Patel",
    "Advik Kumar", "Sai Reddy", "Pari Joshi", "Rudra Menon", "Ishaan Iyer"
]
companies = ["Google", "Microsoft", "Amazon", "Meta", "Flipkart", "Zomato", "Razorpay", "Swiggy"]
titles = [
    "Senior Product Manager", "Full Stack Engineer", "Data Scientist", "UX Design Lead",
    "Marketing Director", "AI Research Scientist", "DevOps Engineer", "Cloud Architect"
]
expertise_list = ["React", "Node.js", "Python", "Machine Learning", "AWS", "UI/UX", "Product Strategy"]

REAL_EMAIL = "mentor.connect1mentors@gmail.com"

mentors = []
for name in names:
    password_hash = generate_password_hash("mentor123")
    company = random.choice(companies)
    title = random.choice(titles)
    expertise = random.sample(expertise_list, 3)
    profile_pic = f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=random&color=fff&size=128"
    bio = f"{title} with {random.randint(3, 15)} years of experience."
    rating = round(random.uniform(4.0, 5.0), 1)
    reviews = random.randint(20, 500)

    mentors.append({
        "name": name,
        "email": REAL_EMAIL,
        "password_hash": password_hash,
        "role": "mentor",
        "company": company,
        "title": title,
        "expertise": ",".join(expertise),
        "profile_pic": profile_pic,
        "bio": bio,
        "rating": rating,
        "reviews": reviews,
        "created_at": None,
        "experience_years": random.randint(3, 15)
    })

db.users.insert_many(mentors)
print(f"Inserted {len(mentors)} mentors with email: {REAL_EMAIL}")
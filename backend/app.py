from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from extensions import mongo, mail
from config import Config
from auth import auth_bp
from routes import mentors_bp, bookings_bp, feedback_bp, profile_bp, admin_bp, availability_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable global CORS to support standard dynamic HTTP request methods
    CORS(app, resources={r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }})

    JWTManager(app)
    mongo.init_app(app)
    mail.init_app(app)

    # Blueprint Registrations
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(mentors_bp, url_prefix='/api/mentors')
    app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
    app.register_blueprint(feedback_bp, url_prefix='/api/feedback')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(availability_bp, url_prefix='/api/availability')

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok'})

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
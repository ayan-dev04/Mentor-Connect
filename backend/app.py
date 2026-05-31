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

    CORS(app)

    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        return response

    @app.before_request
    def handle_options():
        from flask import request
        if request.method == 'OPTIONS':
            from flask import Response
            response = Response()
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            return response

    JWTManager(app)
    mongo.init_app(app)
    mail.init_app(app)

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
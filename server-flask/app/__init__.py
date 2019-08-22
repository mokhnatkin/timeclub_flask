
from flask import Flask, request, current_app
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

import os

db = SQLAlchemy()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    db.init_app(app)
    CORS(app)
    #cors = CORS(app, resources={r"/api/*": {"origins": "*"}})
    with app.app_context():
        from app.main import bp as main_bp
        app.register_blueprint(main_bp)
        from app.errors import bp as errors_bp
        app.register_blueprint(errors_bp)        
        from app.api import bp as api_bp
        app.register_blueprint(api_bp,url_prefix='/api')       
    return app


from app import models

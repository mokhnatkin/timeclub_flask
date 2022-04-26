
from flask import Flask, request, current_app
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import logging
from logging.handlers import SMTPHandler, RotatingFileHandler
import os

db = SQLAlchemy()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    db.init_app(app)
    CORS(app)
    with app.app_context():
        from app.main import bp as main_bp
        app.register_blueprint(main_bp)
        from app.errors import bp as errors_bp
        app.register_blueprint(errors_bp)        
        from app.api import bp as api_bp
        app.register_blueprint(api_bp,url_prefix='/api')

        if not app.debug and not app.testing:
            if not os.path.exists(app.config['LOGS_FOLDER']):
                os.mkdir(app.config['LOGS_FOLDER'])
            file_handler = RotatingFileHandler(os.path.join(app.config['LOGS_FOLDER'],'app_log.log'),
                                                maxBytes=20000, backupCount=10)
            file_handler.setFormatter(logging.Formatter(
                    '%(asctime)s %(levelname)s: %(message)s '
                    '[in %(pathname)s:%(lineno)d]'))
            file_handler.setLevel(logging.INFO)
            app.logger.addHandler(file_handler)

            app.logger.setLevel(logging.INFO)
            app.logger.info('Kaizen Soft startup')

    return app


from app import models

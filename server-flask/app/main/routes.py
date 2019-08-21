
#from flask import current_app, g
#from app import db
from app.main import bp


@bp.route('/')
@bp.route('/index')
def index():#index page 
    return 'Flask backend server started'

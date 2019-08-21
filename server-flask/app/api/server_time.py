from app.api import bp
from flask import jsonify
from datetime import datetime
from app.api.auth import token_auth


@bp.route('/time',methods=['GET'])#get server time
@token_auth.login_required
def get_server_time():
    t = datetime.utcnow()
    t_str = t.isoformat()+'Z'
    t_obj = {'currentDateTime':t_str}
    return jsonify(t_obj)
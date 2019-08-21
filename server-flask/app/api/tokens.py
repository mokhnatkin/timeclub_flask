from flask import jsonify, g
from app import db
from app.api import bp
from app.api.auth import basic_auth, token_auth


@bp.route('/tokens',methods=['POST'])
@basic_auth.login_required
def get_token():
    token = g.current_user.get_token()
    db.session.commit()
    current_user = {'id':g.current_user.id, 
                    'username':g.current_user.username,
                    'role':g.current_user.role,
                    'isAdmin': True if g.current_user.role=='admin' else False}
    return jsonify({'token':token,'current_user':current_user})


@bp.route('/tokens',methods=['DELETE'])
@token_auth.login_required
def revoke_token():
    g.current_user.revoke_token()
    db.session.commit()
    return '', 204
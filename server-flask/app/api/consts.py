from app.api import bp
from flask import jsonify, request
from app.models import Const
from app.api.errors import bad_request
from app import db
from app.api.auth import token_auth


@bp.route('/consts/<int:id>',methods=['GET'])#get the item
@token_auth.login_required
def get_const(id):
    return jsonify(Const.query.get_or_404(id).to_dict())


@bp.route('/consts',methods=['GET'])#get all items
@token_auth.login_required
def get_consts():
    data = Const.to_collection_dict(Const.query.all())    
    return jsonify(data)


@bp.route('/consts',methods=['POST'])#create item
@token_auth.login_required
def create_const():    
    data = request.get_json() or {}
    if 'name' not in data or 'value' not in data:
        return bad_request('name and value are required')
    if Const.query.filter(Const.name == data['name']).first():
        return bad_request('use a different name')
    item = Const()
    item.from_dict(data)
    db.session.add(item)
    db.session.commit()
    response = jsonify(item.to_dict())
    response.status_code = 201
    return response


@bp.route('/consts/<int:id>',methods=['PUT'])#update item
@token_auth.login_required
def update_const(id):
    item = Const.query.get_or_404(id)    
    data = request.get_json() or {}
    if 'name' not in data or 'value' not in data:
        return bad_request('name and value are required')
    if data['name'] != item.name:
        return bad_request('cannot update name')
    item.from_dict(data)
    db.session.commit()
    return jsonify(item.to_dict())



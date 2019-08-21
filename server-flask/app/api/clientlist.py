from app.api import bp
from flask import jsonify, request
from app.models import Clientlist
from app.api.errors import bad_request
from app import db
from app.api.auth import token_auth


@bp.route('/clientlist/<int:id>',methods=['GET'])#get the item
@token_auth.login_required
def get_clientlist(id):
    return jsonify(Clientlist.query.get_or_404(id).to_dict())


@bp.route('/clientlist',methods=['GET'])#get all items
@token_auth.login_required
def get_clientlists():
    data = Clientlist.to_collection_dict(Clientlist.query.all())
    return jsonify(data)


@bp.route('/clientlist',methods=['POST'])#create item
@token_auth.login_required
def create_clientlist():
    data = request.get_json() or {}
    if 'name' not in data or 'phone' not in data:
        return bad_request('name,phone are required')
    item = Clientlist()
    item.from_dict(data)
    db.session.add(item)
    db.session.commit()
    response = jsonify(item.to_dict())
    response.status_code = 201
    return response


@bp.route('/clientlist/<int:id>',methods=['PUT'])#update item
@token_auth.login_required
def update_clientlist(id):
    item = Clientlist.query.get_or_404(id)
    data = request.get_json() or {}
    item.from_dict(data)
    db.session.commit()
    return jsonify(item.to_dict())


@bp.route('/clientlist/<int:id>',methods=['DELETE'])#delete item
@token_auth.login_required
def delete_clientlist(id):
    item = Clientlist.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return '', 204


@bp.route('/client_by_phone/<phone>',methods=['GET'])#get the item
@token_auth.login_required
def get_client_by_phone(phone):
    if Clientlist.query.filter_by(phone=phone).first():
        res = True
    else:
        res = False
    return jsonify({'result':res})
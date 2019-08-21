from app.api import bp
from flask import jsonify, request
from app.models import Promotion
from app.api.errors import bad_request
from app import db
from app.api.auth import token_auth


@bp.route('/promotions/<int:id>',methods=['GET'])#get the item
@token_auth.login_required
def get_promo(id):
    return jsonify(Promotion.query.get_or_404(id).to_dict())


@bp.route('/promotions',methods=['GET'])#get all items
@token_auth.login_required
def get_promos():
    data = Promotion.to_collection_dict(Promotion.query.all())    
    return jsonify(data)


@bp.route('/promotions',methods=['POST'])#create item
@token_auth.login_required
def create_promo():    
    data = request.get_json() or {}
    if 'name' not in data or 'type' not in data or 'value' not in data or 'isActive' not in data:
        return bad_request('name,type,value and isActive are required')
    if Promotion.query.filter(Promotion.name == data['name']).first():
        return bad_request('use a different name')
    item = Promotion()
    item.from_dict(data)
    db.session.add(item)
    db.session.commit()
    response = jsonify(item.to_dict())
    response.status_code = 201
    return response


@bp.route('/promotions/<int:id>',methods=['PUT'])#update item
@token_auth.login_required
def update_promo(id):
    item = Promotion.query.get_or_404(id)    
    data = request.get_json() or {}
    if 'name' not in data or 'type' not in data or 'value' not in data or 'isActive' not in data:
        return bad_request('name,type,value and isActive are required')
    if data['name'] != item.name:
        return bad_request('cannot update name')
    item.from_dict(data)
    db.session.commit()
    return jsonify(item.to_dict())


@bp.route('/active_promotions',methods=['GET'])#get the item filtered by isActive
@token_auth.login_required
def get_active_promos():
    resources = Promotion.query.filter(Promotion.isActive == True).all()   
    data = Promotion.to_collection_dict(resources)
    return jsonify(data)
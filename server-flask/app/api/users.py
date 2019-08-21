from app.api import bp
from flask import jsonify, request
from app.models import User
from app.api.errors import bad_request
from app import db
from app.api.auth import token_auth


@bp.route('/users/<int:id>',methods=['GET'])#get the item
@token_auth.login_required
def get_user(id):
    return jsonify(User.query.get_or_404(id).to_dict())


@bp.route('/users',methods=['GET'])#get all items
@token_auth.login_required
def get_users():
    data = User.to_collection_dict(User.query.all())
    return jsonify(data)


@bp.route('/users',methods=['POST'])#create item
@token_auth.login_required
def create_user():
    data = request.get_json() or {}
    if 'username' not in data or 'email' not in data or 'password' not in data:
        return bad_request('username,email,password are required')
    if User.query.filter_by(username=data['username']).first():
        return bad_request('different username should be used')
    if User.query.filter_by(email=data['email']).first():
        return bad_request('different e-mail address should be used')
    item = User()
    item.from_dict(data,new_user=True)
    db.session.add(item)
    db.session.commit()
    response = jsonify(item.to_dict())
    response.status_code = 201
    return response


@bp.route('/users/<int:id>',methods=['PUT'])#update item
@token_auth.login_required
def update_user(id):
    item = User.query.get_or_404(id)
    data = request.get_json() or {}
    if 'username' in data and data['username'] != item.username and User.query.filter_by(username=data['username']).first():        
        return bad_request('different username should be used')
    if 'email' in data and data['email'] != item.email and User.query.filter_by(email=data['email']).first():        
        return bad_request('different e-mail address should be used')    
    item.from_dict(data,new_user=False)
    db.session.commit()
    return jsonify(item.to_dict())


@bp.route('/users/<int:id>',methods=['DELETE'])#delete item
@token_auth.login_required
def delete_user(id):
    item = User.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return '', 204



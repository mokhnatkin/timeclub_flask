from app.api import bp
from flask import jsonify, request
from app.models import Employee
from app.api.errors import bad_request
from app import db
from app.api.auth import token_auth


@bp.route('/employees/<int:id>',methods=['GET'])#get the item
@token_auth.login_required
def get_employee(id):
    return jsonify(Employee.query.get_or_404(id).to_dict())


@bp.route('/employees',methods=['GET'])#get all items
@token_auth.login_required
def get_employees():
    data = Employee.to_collection_dict(Employee.query.all())
    return jsonify(data)


@bp.route('/employees',methods=['POST'])#create item
@token_auth.login_required
def create_employee():
    data = request.get_json() or {}    
    if 'name' not in data:
        return bad_request('name is required')
    if Employee.query.filter_by(name=data['name']).first():
        return bad_request('use a different name')
    item = Employee()
    item.from_dict(data)
    db.session.add(item)
    db.session.commit()
    response = jsonify(item.to_dict())
    response.status_code = 201
    return response


@bp.route('/employees/<int:id>',methods=['PUT'])#update item
@token_auth.login_required
def update_employee(id):
    item = Employee.query.get_or_404(id)
    data = request.get_json() or {}
    if 'name' not in data or 'isDirector' not in data:
        return bad_request('name,isDirector are required')
    item.from_dict(data)
    db.session.commit()
    return jsonify(item.to_dict())


@bp.route('/employees/<int:id>',methods=['DELETE'])#delete item
@token_auth.login_required
def delete_employee(id):
    item = Employee.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return '', 204
from app.api import bp
from flask import jsonify, request
from app.models import Clients
from app.api.errors import bad_request
from app import db
import dateutil.parser
from datetime import datetime, timedelta
from app.api.auth import token_auth
from app.universal_routes import compute_amount_per_guest, compute_minutes_in_club
import pandas as pd


@bp.route('/clients/<int:id>',methods=['GET'])#get the item
@token_auth.login_required
def get_client(id):
    return jsonify(Clients.query.get_or_404(id).to_dict())


@bp.route('/clients',methods=['GET'])#get all items
@token_auth.login_required
def get_clients():
    resources = Clients.query.filter(Clients.isOpen == False).all()
    data = Clients.to_collection_dict(resources)
    return jsonify(data)


@bp.route('/clients',methods=['POST'])#create item
@token_auth.login_required
def create_client():
    data = request.get_json() or {}
    if 'name' not in data:
        return bad_request('name is required')
    item = Clients()
    item.from_dict(data)
    db.session.add(item)
    db.session.commit()
    response = jsonify(item.to_dict())
    response.status_code = 201
    return response


@bp.route('/clients/<int:id>',methods=['PUT'])#update item
@token_auth.login_required
def update_client(id):
    item = Clients.query.get_or_404(id)
    data = request.get_json() or {}
    item.from_dict(data)
    db.session.commit()
    return jsonify(item.to_dict())


@bp.route('/clients/<int:id>',methods=['DELETE'])#delete item
@token_auth.login_required
def delete_client(id):
    item = Clients.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return '', 204


@bp.route('/employees/<checkout_start>/<checkout_end>',methods=['GET'])
@token_auth.login_required
def get_clients_employees(checkout_start,checkout_end):
    #checkout_start and checkout_end received from API in ISO format like 2019-08-14T10:47:31Z
    _checkout_start = dateutil.parser.parse(checkout_start)
    _checkout_end = dateutil.parser.parse(checkout_end)
    
    resources = Clients.query.filter(Clients.checkoutTime.between(_checkout_start, _checkout_end)) \
                            .filter(Clients.isEmployee == True) \
                            .filter(Clients.isDirector == False) \
                            .filter(Clients.isOpen == False).all()
    data = Clients.to_collection_dict(resources)
    return jsonify(data)


@bp.route('/guests',methods=['GET'])#get the items filtered by isOpen
@token_auth.login_required
def get_guests():
    resources = Clients.query.filter(Clients.isOpen == True).all()
    for r in resources:
        r.timeInClub = compute_minutes_in_club(r.arrivalTime)
        r.amount = compute_amount_per_guest(r.arrivalTime,r.isFree,
                                        r.isEmployee,r.isEmployeeAtWork,
                                        r.isDirector,r.promotion)
    data = Clients.to_collection_dict(resources)
    return jsonify(data)


@bp.route('/clients_filtered_by_checkout/<checkout_start>/<checkout_end>',methods=['GET'])#get the items filtered by checkoutTime
@token_auth.login_required
def get_clients_checkout(checkout_start,checkout_end):
    #checkout_start and checkout_end received from client in ISO format like 2019-08-14T10:47:31Z
    _checkout_start = dateutil.parser.parse(checkout_start)
    _checkout_end = dateutil.parser.parse(checkout_end)
    resources = Clients.query.filter(Clients.checkoutTime.between(_checkout_start, _checkout_end)) \
                            .filter(Clients.isOpen == False).all()
    data = Clients.to_collection_dict(resources)
    return jsonify(data)


@bp.route('/guest_get_amount/<int:id>',methods=['GET'])#guest - compute amount and time in the club
@token_auth.login_required
def guest_get_amount(id):
    guest = Clients.query.get_or_404(id)
    guest.timeInClub = compute_minutes_in_club(guest.arrivalTime)
    guest.amount = compute_amount_per_guest(guest.arrivalTime,guest.isFree,
                                        guest.isEmployee,guest.isEmployeeAtWork,
                                        guest.isDirector,guest.promotion)
    return jsonify(guest.to_dict())


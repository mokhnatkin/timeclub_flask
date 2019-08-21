from app.api import bp
from flask import jsonify, request
from app.models import Booking
from app.api.errors import bad_request
from app import db
import dateutil.parser
from datetime import datetime, timedelta
from app.api.auth import token_auth


@bp.route('/bookings/<int:id>',methods=['GET'])#get the item
@token_auth.login_required
def get_booking(id):
    return jsonify(Booking.query.get_or_404(id).to_dict())


@bp.route('/bookings',methods=['GET'])#get all items
@token_auth.login_required
def get_bookings():
    data = Booking.to_collection_dict(Booking.query.all())
    return jsonify(data)


@bp.route('/bookings',methods=['POST'])#create item
@token_auth.login_required
def create_booking():
    data = request.get_json() or {}
    if 'name' not in data or 'date' not in data or 'phone' not in data:
        return bad_request('name,date,phone are required')
    item = Booking()
    item.from_dict(data)
    db.session.add(item)
    db.session.commit()
    response = jsonify(item.to_dict())
    response.status_code = 201
    return response


@bp.route('/bookings/<int:id>',methods=['PUT'])#update item
@token_auth.login_required
def update_booking(id):
    item = Booking.query.get_or_404(id)
    data = request.get_json() or {}
    item.from_dict(data)
    db.session.commit()
    return jsonify(item.to_dict())


@bp.route('/bookings/<int:id>',methods=['DELETE'])#delete item
@token_auth.login_required
def delete_booking(id):
    item = Booking.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return '', 204


@bp.route('/bookings_today',methods=['GET'])#get the items filtered by date
@token_auth.login_required
def get_bookings_today():
    start = datetime.utcnow().date() - timedelta(days=1)
    end = start + timedelta(days=2)
    resources = Booking.query.filter(Booking.date > start).filter(Booking.date < end).all()
    data = Booking.to_collection_dict(resources)
    return jsonify(data)


@bp.route('/bookings_today_future',methods=['GET'])#get the items filtered by date
@token_auth.login_required
def get_bookings_today_future():
    start = datetime.utcnow().date() - timedelta(days=1)    
    resources = Booking.query.filter(Booking.date > start).all()
    data = Booking.to_collection_dict(resources)
    return jsonify(data)


@bp.route('/bookings_last_year',methods=['GET'])#get the items filtered by date
@token_auth.login_required
def get_bookings_last_year():
    start = datetime.utcnow().date() - timedelta(days=365)
    end = start - timedelta(days=358)
    resources = Booking.query.filter(Booking.date > start).filter(Booking.date < end).all()
    data = Booking.to_collection_dict(resources)
    return jsonify(data)
    
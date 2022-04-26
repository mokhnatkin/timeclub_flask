from app.api import bp
from flask import jsonify, request
from app.models import Clients, Const, Promotion
from app.api.errors import bad_request
from app import db
import dateutil.parser
from datetime import datetime, timedelta
from app.api.auth import token_auth
import pandas as pd
from app.universal_routes import compute_amount_per_guest


@bp.route('/guests_stat',methods=['GET'])#get the items filtered by isOpen and stat
@token_auth.login_required
def get_guests_and_stat():
    _price_per_minute = Const.query.filter(Const.name == 'pricePerMinute').first() or 0
    price_per_minute = _price_per_minute.value#price per minute
    _max_amount = Const.query.filter(Const.name == 'maxAmount').first() or 0
    max_amount = _max_amount.value#max amount per guest
    now = datetime.utcnow()#current date time

    total_amount = 0#outputs
    total_people = 0
    total_employees = 0
    total_guests = 0
    paid_guests = 0
    free_guests = 0

    df = pd.read_sql(db.session.query(Clients)
                        .with_entities(Clients.id,
                                        Clients.arrivalTime,
                                        Clients.isFree,
                                        Clients.isEmployee,
                                        Clients.isEmployeeAtWork,
                                        Clients.isDirector,
                                        Clients.promotion)
                        .filter(Clients.isOpen == True)
                        .statement,db.session.bind)
    
    if not df.empty:
        _promos = Promotion.query \
                    .with_entities(Promotion.id,Promotion.type,Promotion.value).all()
        df['promotion'] = df['promotion'].fillna('not_set')
        df['amount'] = df.apply(lambda row: compute_amount_per_guest(row['arrivalTime'],row['isFree'],
                                                    row['isEmployee'],row['isEmployeeAtWork'],
                                                    row['isDirector'],row['promotion'],
                                                    price_per_minute,max_amount,now,_promos),axis=1)
        total_amount = df['amount'].sum()
        total_people = df['id'].count()
        total_employees = df.loc[df['isEmployee'] == True, 'id'].count()
        total_guests = total_people - total_employees
        free_guests = df.loc[(df['isEmployee'] != True) & (df['isFree'] == True), 'id'].count()
        paid_guests = total_guests - free_guests

    data = {"amount":int(total_amount),
            "total_people":int(total_people),
            "total_employees":int(total_employees),
            "total_guests":int(total_guests),
            "paid_guests":int(paid_guests),
            "free_guests":int(free_guests)}
    
    return jsonify(data)



@bp.route('/history_guests_stat/<checkout_start>/<checkout_end>',methods=['GET'])#get the items filtered by isOpen == False and stat
@token_auth.login_required
def get_history_guests_and_stat(checkout_start=None,checkout_end=None):
    #checkout_start and checkout_end received from API in ISO format like 2019-08-14T10:47:31Z
    _checkout_start = dateutil.parser.parse(checkout_start)
    _checkout_end = dateutil.parser.parse(checkout_end)

    total_amount = 0#outputs
    total_people = 0
    total_employees = 0
    total_guests = 0
    paid_guests = 0
    free_guests = 0

    df = pd.read_sql(db.session.query(Clients)
                        .with_entities(Clients.id,
                                        Clients.amount,
                                        Clients.isFree,
                                        Clients.isEmployee,
                                        Clients.promotion)
                        .filter(Clients.isOpen == False)
                        .filter(Clients.checkoutTime.between(_checkout_start, _checkout_end))
                        .statement,db.session.bind)
    
    if not df.empty:
        #_promos = Promotion.query \
                    #.with_entities(Promotion.id,Promotion.type,Promotion.value).all()
        total_amount = df['amount'].sum()
        total_people = df['id'].count()
        total_employees = df.loc[df['isEmployee'] == True, 'id'].count()
        total_guests = total_people - total_employees
        free_guests = df.loc[(df['isEmployee'] != True) & (df['isFree'] == True), 'id'].count()
        paid_guests = total_guests - free_guests

    data = {"amount":int(total_amount),
            "total_people":int(total_people),
            "total_employees":int(total_employees),
            "total_guests":int(total_guests),
            "paid_guests":int(paid_guests),
            "free_guests":int(free_guests)}
    
    return jsonify(data)
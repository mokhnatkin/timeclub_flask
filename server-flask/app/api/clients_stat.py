from app.api import bp
from flask import jsonify, request
from app.models import Clients, Promotion
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
        df['promotion'] = df['promotion'].fillna('not_set')
        df['amount'] = df.apply(lambda row: compute_amount_per_guest(row['arrivalTime'],row['isFree'],
                                                    row['isEmployee'],row['isEmployeeAtWork'],
                                                    row['isDirector'],row['promotion']),axis=1)
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


@bp.route('/history_guests_full_stat/<checkout_start>/<checkout_end>',methods=['GET'])#get the items filtered by isOpen == False and stat
@token_auth.login_required
def get_history_guests_full_stat(checkout_start=None,checkout_end=None):
    #checkout_start and checkout_end received from API in ISO format like 2019-08-14T10:47:31Z
    _checkout_start = dateutil.parser.parse(checkout_start)
    _checkout_end = dateutil.parser.parse(checkout_end)

    total_amount = 0#outputs
    total_people = 0
    mean_amount = 0
    data = []

    df = pd.read_sql(db.session.query(Clients)
                        .with_entities(Clients.id,
                                        Clients.amount,
                                        Clients.isFree,
                                        Clients.isEmployee,
                                        Clients.isEmployeeAtWork,
                                        Clients.promotion)
                        .filter(Clients.isOpen == False)
                        .filter(Clients.checkoutTime.between(_checkout_start, _checkout_end))
                        .statement,db.session.bind)
    
    if not df.empty:
        df['promotion'] = df['promotion'].fillna('not_set')

        total_amount = df['amount'].sum()#всего
        total_people = df['id'].count()
        try:
            mean_amount = round(total_amount/total_people)
        except:
            mean_amount = 0

        data_item = {"name":"Всего",
                "amount":int(total_amount),
                "total_people":int(total_people),
                "mean_amount":int(mean_amount)}
        data.append(data_item)

        total_employees_amount = 0#по сотрудникам
        total_employees_people = df.loc[df['isEmployee'] == True, 'id'].count()
        mean_employees_amount = 0
        data_item = {"name":"----Сотрудники",
                "amount":int(total_employees_amount),
                "total_people":int(total_employees_people),
                "mean_amount":int(mean_employees_amount)}
        data.append(data_item)

        total_employees_at_work_amount = 0#по сотрудникам в смене
        total_employees_at_work_people = df.loc[(df['isEmployee'] == True) & (df['isEmployeeAtWork'] == True), 'id'].count()
        mean_employees_at_work_amount = 0
        data_item = {"name":"------в смене",
                "amount":int(total_employees_at_work_amount),
                "total_people":int(total_employees_at_work_people),
                "mean_amount":int(mean_employees_at_work_amount)}
        data.append(data_item)

        total_employees_not_at_work_amount = 0#по сотрудникам не в смене
        total_employees_not_at_work_people = total_employees_people - total_employees_at_work_people
        mean_employees_not_at_work_amount = 0
        data_item = {"name":"------просто (не в смене)",
                "amount":int(total_employees_not_at_work_amount),
                "total_people":int(total_employees_not_at_work_people),
                "mean_amount":int(mean_employees_not_at_work_amount)}
        data.append(data_item)

        total_guests_amount = total_amount
        total_guests_people = total_people - total_employees_people
        try:
            mean_guests_amount = round(total_amount / total_guests_people)
        except:
            mean_guests_amount = 0
        data_item = {"name":"----Гости",
                "amount":int(total_guests_amount),
                "total_people":int(total_guests_people),
                "mean_amount":int(mean_guests_amount)}
        data.append(data_item)

        total_free_guests_amount = 0
        total_free_guests_people = df.loc[(df['isEmployee'] != True) & (df['isFree'] == True), 'id'].count()
        mean_free_guests_amount = 0
        data_item = {"name":"------бесплатные гости",
                "amount":int(total_free_guests_amount),
                "total_people":int(total_free_guests_people),
                "mean_amount":int(mean_free_guests_amount)}
        data.append(data_item)

        total_not_free_guests_amount = total_guests_amount
        total_not_free_guests_people = total_guests_people - total_free_guests_people
        try:
            mean_not_free_guests_amount = round(total_not_free_guests_amount / total_not_free_guests_people)
        except:
            mean_not_free_guests_amount = 0
        data_item = {"name":"------платные гости",
                "amount":int(total_not_free_guests_amount),
                "total_people":int(total_not_free_guests_people),
                "mean_amount":int(mean_not_free_guests_amount)}
        data.append(data_item)

        total_no_promo_amount = df.loc[(df['isEmployee'] != True) & (df['promotion'] == 'not_set'), 'amount'].sum()#всего стандартных (без акции)
        total_no_promo_people = df.loc[(df['isEmployee'] != True) & (df['isFree'] != True) & (df['promotion'] == 'not_set'), 'id'].count()
        try:
            mean_no_promo_amount = round(total_no_promo_amount / total_no_promo_people)
        except:
            mean_no_promo_amount = 0        
        data_item = {"name":"--------стандарт (не по акции)",
                "amount":int(total_no_promo_amount),
                "total_people":int(total_no_promo_people),
                "mean_amount":int(mean_no_promo_amount)}
        data.append(data_item)

        total_promo_amount = total_not_free_guests_amount - total_no_promo_amount
        total_promo_people = total_not_free_guests_people - total_no_promo_people
        try:
            mean_promo_amount = round(total_promo_amount / total_promo_people)
        except:
            mean_promo_amount = 0
        data_item = {"name":"--------акции",
                "amount":int(total_promo_amount),
                "total_people":int(total_promo_people),
                "mean_amount":int(mean_promo_amount)}
        data.append(data_item)

        promos = Promotion.query.with_entities(Promotion.id,Promotion.name).all()
        for promo in promos:#там, где выбрана акция
            promo_amount = df.loc[df['promotion'] == promo.id, 'amount'].sum()
            promo_people = df.loc[df['promotion'] == promo.id, 'id'].count()
            try:
                mean_promo_amount = round(promo_amount / promo_people)
            except:
                mean_promo_amount = 0
            data_item = {"name":"----------"+str(promo.name),
                    "amount":int(promo_amount),
                    "total_people":int(promo_people),
                    "mean_amount":int(mean_promo_amount)}
            data.append(data_item)
    
    return jsonify(data)
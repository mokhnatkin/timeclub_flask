import math
from datetime import datetime, timedelta
from app.models import Const, Promotion


def compute_minutes_in_club(arrivalTime):
    now = datetime.utcnow()#current date time
    time_diff = now - arrivalTime
    minutes_in_club = max(math.floor(time_diff.total_seconds() / 60),0)#no negative values
    return minutes_in_club


def compute_amount_per_guest(arrivalTime,isFree,isEmployee,isEmployeeAtWork,isDirector,promotion):#compute amount per guest
    amount = -100#initial not real amount
    _price_per_minute = Const.query.filter(Const.name == 'pricePerMinute').first() or 0
    price_per_minute = _price_per_minute.value#price per minute
    _max_amount = Const.query.filter(Const.name == 'maxAmount').first() or 0
    max_amount = _max_amount.value#max amount per guest
    _promos = Promotion.query \
                    .with_entities(Promotion.id,Promotion.type,Promotion.value).all()

    if isFree or isEmployee or isEmployeeAtWork or isDirector:
        amount = 0
    else:
        minutes_in_club = compute_minutes_in_club(arrivalTime)
        if promotion == 'not_set' or promotion is None:#standard guest
            amount = min(minutes_in_club * price_per_minute, max_amount)
        else:#promotion in place
            #let's find corresponding promo and it parameters
            found = False
            i = 0
            promo_type = 'not_found_yet'
            promo_value = 0
            while not found:
                _promo = _promos[i]
                if _promo.id == promotion:
                    promo_type = _promo.type
                    promo_value = _promo.value
                    found = True
                else:
                    i += 1
            if promo_type == 'fixDiscount':
                k = (1-promo_value/100)
                amount = min(minutes_in_club*price_per_minute*k,max_amount*k)
            elif promo_type == 'fixAmount':
                amount = promo_value
            else:#cannot determine promo type - apply standard rule
                amount = min(minutes_in_club * price_per_minute,max_amount)
        
    return round(amount)

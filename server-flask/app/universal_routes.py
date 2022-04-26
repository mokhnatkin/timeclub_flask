import math


def convert_string_to_bool(input_str):
    if input_str in ('True','true','1') or input_str == True or input_str == 1:
        res = True
    else:
        res = False
    return res



def compute_amount_per_guest(arrivalTime,isFree,isEmployee,isEmployeeAtWork,isDirector,promotion,
                            price_per_minute,max_amount,now,_promos):#compute amount per guest
    amount = -100#initial not real amount

    if isFree or isEmployee or isEmployeeAtWork or isDirector:
        amount = 0
    else:
        time_diff = now - arrivalTime
        minutes_in_club = math.floor(time_diff.total_seconds() / 60)

        if promotion == 'not_set':#standard guest
            amount = min(minutes_in_club * price_per_minute,max_amount)
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

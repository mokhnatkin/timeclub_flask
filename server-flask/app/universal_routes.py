
def convert_string_to_bool(input_str):
    if input_str in ('True','true','1') or input_str == True or input_str == 1:
        res = True
    else:
        res = False
    return res
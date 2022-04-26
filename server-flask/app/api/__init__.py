from flask import Blueprint

bp = Blueprint('api', __name__)

from app.api import tokens, errors, promotions, employees, clients, server_time, \
                    clientlist, bookings, users, tokens, auth, consts, clients_stat
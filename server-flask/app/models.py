from app import db
from datetime import datetime, timedelta
from time import time
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
#from flask_login import UserMixin
from flask import app
from app.universal_routes import convert_string_to_bool
import dateutil.parser
import base64
import os


class CollectionAPIMixin(object):#fetch all items from DB
    @staticmethod
    def to_collection_dict(resources):
        data = [item.to_dict() for item in resources]
        return data


class User(CollectionAPIMixin,db.Model):#user model
    id = db.Column(db.Integer,primary_key=True)
    username = db.Column(db.String(64),index=True,unique=True)
    email = db.Column(db.String(64),index=True,unique=True)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(20),default='user', nullable=False)
    isSelected = db.Column(db.Boolean)
    token = db.Column(db.String(32),index=True,unique=True)
    token_expiration = db.Column(db.DateTime)
    timestamp = db.Column(db.DateTime,default=datetime.utcnow)

    def to_dict(self):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'password_hash': self.password_hash,
            'role': self.role,
            'isSelected': self.isSelected
        }
        return data

    def from_dict(self,data,new_user=False):
        for field in data:
            if data[field] is not None:
                if field not in ['id','isSelected','password_hash','token','token_expiration']:#update all fields except for non-updatable
                    setattr(self,field,data[field])
                elif field == 'isSelected':#boolean fields
                    setattr(self,field,convert_string_to_bool(data[field]))                    
        if 'password' in data:#set password for a new user, or change for existing
            self.set_password(data['password'])

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash,password)

    def __repr__(self):
        return '<User {}>'.format(self.username)
    
    def get_token(self,expires_in=864000):#by default token is valid for 10 days
        now = datetime.utcnow()
        if self.token and self.token_expiration > now + timedelta(seconds=60):
            return self.token
        self.token = base64.b64encode(os.urandom(24)).decode('utf-8')
        self.token_expiration = now + timedelta(seconds=expires_in)
        db.session.add(self)
        return self.token

    def revoke_token(self):
        self.token_expiration = datetime.utcnow() - timedelta(seconds=1)

    @staticmethod
    def check_token(token):
        user = User.query.filter_by(token=token).first()
        if user is None or user.token_expiration < datetime.utcnow():
            return None
        return user
    
    def get_reset_password_token(self,expires_in=3600):
        return jwt.encode(
            {'reset_password': self.id, 'exp': time()+expires_in},
            app.config['SECRET_KEY'], algorithm='HS256').decode('utf-8')
    
    @staticmethod
    def verify_reset_password_token(token):
        try:
            id = jwt.decode(token,app.config['SECRET_KEY'],algorithms=['HS256'])['reset_password']
        except:
            return
        return User.query.get(id)


class Booking(CollectionAPIMixin,db.Model):#bookings
    id = db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String(50),index=True,nullable=False)
    date = db.Column(db.DateTime,index=True,nullable=False)
    numberOfPeople = db.Column(db.Integer)
    phone = db.Column(db.String(20),index=True,nullable=False)
    place = db.Column(db.String(500))
    isBirthday = db.Column(db.Boolean)
    prePayment = db.Column(db.Float)
    isSelected = db.Column(db.Boolean)
    status = db.Column(db.String(20),nullable=False,default='Новая')
    comment = db.Column(db.String(500))
    timestamp = db.Column(db.DateTime,default=datetime.utcnow)

    def to_dict(self):
        data = {
            'id': self.id,
            'name': self.name,
            'date': self.date.isoformat()+'Z' if self.date is not None else self.date,
            'numberOfPeople': self.numberOfPeople,
            'phone': self.phone,
            'place': self.place,
            'isBirthday': self.isBirthday,
            'prePayment': self.prePayment,
            'isSelected': self.isSelected,
            'status': self.status,
            'comment': self.comment,
            'timestamp': self.timestamp.isoformat()+'Z'
        }
        return data

    def from_dict(self,data):
        for field in data:
            if data[field] is not None:
                if field not in ['id','timestamp','isSelected','date']:#update all fields except for non-updatable
                    setattr(self,field,data[field])
                elif field in ['isSelected','isBirthday']:#boolean fields
                    setattr(self,field,convert_string_to_bool(data[field]))
                elif field == 'date':                    
                    date = dateutil.parser.parse(data[field])
                    setattr(self,field,date)

    def __repr__(self):
        return '<Booking {}>'.format(self.name)


class Clientlist(CollectionAPIMixin,db.Model):#list of clients
    id = db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String(50))
    phone = db.Column(db.String(20),index=True,nullable=False)
    timestamp = db.Column(db.DateTime,default=datetime.utcnow)
    birthdate = db.Column(db.DateTime)
    comment = db.Column(db.String(500))
    sysComment = db.Column(db.String(500))
    isSelected = db.Column(db.Boolean)

    def to_dict(self):
        data = {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'birthdate': self.birthdate.isoformat()+'Z' if self.birthdate is not None else self.birthdate,
            'comment': self.comment,
            'sysComment': self.sysComment,
            'isSelected': self.isSelected,           
            'timestamp': self.timestamp.isoformat()+'Z'
        }
        return data

    def from_dict(self,data):
        for field in data:
            if data[field] is not None:
                if field not in ['id','timestamp','isSelected','birthdate']:#update all fields except for non-updatable
                    setattr(self,field,data[field])
                elif field == 'isSelected':#boolean fields
                    setattr(self,field,convert_string_to_bool(data[field]))
                elif field == 'birthdate':                    
                    birthdate = dateutil.parser.parse(data[field])
                    setattr(self,field,birthdate)

    def __repr__(self):
        return '<Clientlist {}>'.format(self.name)


class Employee(CollectionAPIMixin,db.Model):#employee
    id = db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String(50),index=True,nullable=False)
    isSelected = db.Column(db.Boolean)
    isDirector = db.Column(db.Boolean,nullable=False,default=False)
    timestamp = db.Column(db.DateTime,default=datetime.utcnow)
    clients_by_item = db.relationship('Clients',backref='employee',lazy='dynamic')

    def to_dict(self):
        data = {
            'id': self.id,
            'name': self.name,
            'isSelected': self.isSelected,
            'isDirector': self.isDirector,
            'timestamp': self.timestamp.isoformat()+'Z'
        }
        return data

    def from_dict(self,data):
        for field in data:
            if data[field] is not None:
                if field not in ['id','timestamp','isSelected','isDirector']:#update all fields except for non-updatable
                    setattr(self,field,data[field])
                elif field in ['isSelected','isDirector']:#boolean fields
                    setattr(self,field,convert_string_to_bool(data[field]))

    def __repr__(self):
        return '<Employee {}>'.format(self.name)


class Promotion(CollectionAPIMixin,db.Model):#promo
    id = db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String(50),unique=True,nullable=False)
    type = db.Column(db.String(50),nullable=False)
    typeDesc = db.Column(db.String(50))
    value = db.Column(db.Float,nullable=False)
    isActive = db.Column(db.Boolean,nullable=False,default=True)
    isSelected = db.Column(db.Boolean)
    timestamp = db.Column(db.DateTime,default=datetime.utcnow)
    #clients_by_item = db.relationship('Clients',backref='promotion',lazy='dynamic')

    def to_dict(self):
        data = {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'typeDesc': self.typeDesc,
            'value': self.value,
            'isActive': self.isActive,
            'isSelected': self.isSelected,
            'timestamp': self.timestamp.isoformat()+'Z'
        }
        return data

    def from_dict(self,data):
        for field in data:
            if data[field] is not None:
                if field not in ['id','timestamp','isActive','isSelected']:#update all fields except for non-updatable
                    setattr(self,field,data[field])
                elif field in ['isActive','isSelected']:#boolean fields
                    setattr(self,field,convert_string_to_bool(data[field]))

    def __repr__(self):
        return '<Promotion {}>'.format(self.name)    


class Clients(CollectionAPIMixin,db.Model):#clients
    id = db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String(50),index=True,nullable=False)
    arrivalTime = db.Column(db.DateTime,nullable=False,default=datetime.utcnow)
    checkoutTime = db.Column(db.DateTime)
    amount = db.Column(db.Float,nullable=False,default=0)
    isFree = db.Column(db.Boolean)
    promotion = db.Column(db.Integer,db.ForeignKey('promotion.id'))
    comment = db.Column(db.String(500))
    isActive = db.Column(db.Boolean)
    isChecked = db.Column(db.Boolean)
    timeInClub = db.Column(db.Float)
    isEmployee = db.Column(db.Boolean)
    isEmployeeAtWork = db.Column(db.Boolean)
    emplID = db.Column(db.Integer,db.ForeignKey('employee.id'))
    companyN = db.Column(db.Integer)
    isDirector = db.Column(db.Boolean)
    isOpen = db.Column(db.Boolean,nullable=False,default=True)
    isCheckout = db.Column(db.Boolean)
    timestamp = db.Column(db.DateTime,default=datetime.utcnow)

    def to_dict(self):
        data = {
            'id': self.id,
            'name': self.name,
            'arrivalTime': self.arrivalTime.isoformat()+'Z' if self.arrivalTime is not None else self.arrivalTime,
            'checkoutTime': self.checkoutTime.isoformat()+'Z' if self.checkoutTime is not None else self.checkoutTime,
            'amount': self.amount,
            'isFree': self.isFree,
            'promotion': self.promotion,
            'comment': self.comment,
            'isActive': self.isActive,
            'isChecked': self.isChecked,
            'timeInClub': self.timeInClub,
            'isEmployee': self.isEmployee,
            'isEmployeeAtWork': self.isEmployeeAtWork,
            'emplID': self.emplID,
            'companyN': self.companyN,
            'isDirector': self.isDirector,
            'isOpen': self.isOpen,
            'isCheckout': self.isCheckout,
            'timestamp': self.timestamp.isoformat()+'Z'
        }
        return data

    def from_dict(self,data):
        for field in data:
            if data[field] is not None:
                if field not in ['id','timestamp','isActive','isChecked','isFree',
                                'isEmployee','isEmployeeAtWork','isDirector','isOpen','isCheckout',
                                'checkoutTime','arrivalTime']:#update all fields except for non-updatable
                    setattr(self,field,data[field])
                elif field in ['isActive','isChecked','isFree','isEmployee','isEmployeeAtWork','isDirector','isOpen','isCheckout']:#boolean fields
                    setattr(self,field,convert_string_to_bool(data[field]))
                elif field in ['checkoutTime','arrivalTime']:                
                    dTime = dateutil.parser.parse(data[field])
                    setattr(self,field,dTime)
            elif field in ['promotion','comment','companyN','checkoutTime','timeInClub','amount']:
                setattr(self,field,data[field])

    def __repr__(self):
        return '<Client {}>'.format(self.name)




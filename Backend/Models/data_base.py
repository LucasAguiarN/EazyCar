import os
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def iniciar_db(app):

    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://root:123@mysql:3306/aluguel_carros'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
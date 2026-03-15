import os
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def iniciar_db(app):

    user = os.getenv('db_user')
    password = os.getenv('db_password')
    host = os.getenv('db_host')
    port = os.getenv('db_port')
    database = os.getenv('db_name')
    uri = f'mysql+mysqlconnector://{user}:{password}@{host}:{port}/{database}'

    app.config['SQLALCHEMY_DATABASE_URI'] = uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
import os
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy

load_dotenv()

db = SQLAlchemy()

def iniciar_db(app):
    user     = os.getenv('DB_USER', 'root')
    password = os.getenv('DB_PASSWORD', '')
    host     = os.getenv('DB_HOST', 'mysql')
    port     = os.getenv('DB_PORT', '3306')
    name     = os.getenv('DB_NAME', 'aluguel_carros')

    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f'mysql+mysqlconnector://{user}:{password}@{host}:{port}/{name}'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
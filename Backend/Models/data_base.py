import os
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy

load_dotenv()

db = SQLAlchemy()

def iniciar_db(app):
    host = os.getenv('DB_HOST')
    usar_sqlite = os.getenv('USE_SQLITE', '').lower() == 'true' or not host

    if usar_sqlite:
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///eazycar_local.db'
    else:
        user     = os.getenv('DB_USER')
        password = os.getenv('DB_PASSWORD')
        port     = os.getenv('DB_PORT')
        name     = os.getenv('DB_NAME')
        ssl_ca   = os.getenv('DB_SSL_CA')

        app.config['SQLALCHEMY_DATABASE_URI'] = (
            f'mysql+mysqlconnector://{user}:{password}@{host}:{port}/{name}'
        )

        if ssl_ca:
            app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
                'connect_args': {
                    'ssl_ca': ssl_ca,
                    'ssl_verify_cert': True,
                }
            }

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)


def garantir_colunas_fidelidade():
    from sqlalchemy import inspect, text

    inspector = inspect(db.engine)
    tabelas = inspector.get_table_names()

    if "clientes" in tabelas:
        colunas = {c["name"] for c in inspector.get_columns("clientes")}
        if "pontos" not in colunas:
            db.session.execute(text("ALTER TABLE clientes ADD COLUMN pontos INT NOT NULL DEFAULT 0"))

    if "reservas" in tabelas:
        colunas = {c["name"] for c in inspector.get_columns("reservas")}
        if "pontos_ganhos" not in colunas:
            db.session.execute(text("ALTER TABLE reservas ADD COLUMN pontos_ganhos INT NULL"))


    if "tipo_reserva" not in colunas:
        db.session.execute(
        text(
            "ALTER TABLE reservas "
            "ADD COLUMN tipo_reserva VARCHAR(20) "
            "NOT NULL DEFAULT 'comum'"
        )
    )
    

    if "veiculos" in tabelas:
        colunas = {c["name"] for c in inspector.get_columns("veiculos")}
        if "imagem" not in colunas:
            db.session.execute(text("ALTER TABLE veiculos ADD COLUMN imagem VARCHAR(255) NULL"))

   
    db.session.commit()
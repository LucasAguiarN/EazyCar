import os
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
from Backend.Models.data_base import iniciar_db, db
from Backend.Models.veiculo import Veiculo  # noqa: F401
from Backend.Models.funcionario import Funcionario  # noqa: F401
from Backend.routes import configurar_rotas

load_dotenv()

def create_app():

    app = Flask(__name__)

    frontend_url = os.getenv("FRONTEND_URL", "*")
    CORS(app, origins=frontend_url)

    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    # Para ambiente de desenvolvimento: evita expirar o token em 15 minutos.
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)
    jwt = JWTManager(app)

    iniciar_db(app)
    
    with app.app_context():
        db.create_all()

    configurar_rotas(app)

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=os.getenv("FLASK_DEBUG", "false").lower() == "true")
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
from Backend.Models.data_base import iniciar_db, db
from Backend.Models.veiculo import Veiculo  # noqa: F401
from Backend.Models.funcionario import Funcionario  # noqa: F401
from Backend.routes import configurar_rotas

def create_app():

    app = Flask(__name__)
    
    CORS(app)

    app.config["JWT_SECRET_KEY"] = "qHE3VaIhX0UPH6OQHuVDBe38ktKxAFfYJzMYW2bPkr4txcXVvPvNpagPHfxKMgv7"
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
    app.run(debug=True)
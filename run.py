from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from Backend.Models.data_base import iniciar_db, db
from Backend.routes import configurar_rotas

def create_app():

    app = Flask(__name__)
    CORS(app)

    app.config["JWT_SECRET_KEY"] = "super-secret-key"
    jwt = JWTManager(app)

    iniciar_db(app)
    
    with app.app_context():
        db.create_all()

    configurar_rotas(app)

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
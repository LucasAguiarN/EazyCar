from flask import Flask, jsonify, make_response, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from Backend.Models.data_base import iniciar_db, db
from Backend.Controllers.cliente_controller import ClienteController

def create_app():

    app = Flask(__name__)
    CORS(app)

    app.config["JWT_SECRET_KEY"] = "super-secret-key"
    jwt = JWTManager(app)

    iniciar_db(app)
    
    with app.app_context():
        db.create_all()

    @app.route('/', methods=['GET'])
    def health():
        return make_response(jsonify({
            "mensagem": "API - OK; Docker - Up",
        }), 200)

    @app.route('/clientes', methods=['POST', 'OPTIONS'])
    def cadastrar_cliente():
        if request.method == 'OPTIONS':
            return ('', 204)
        return ClienteController.cadastar_cliente()

    @app.route('/clientes', methods=['GET'])
    def listar_clientes():
        return ClienteController.listar_clientes()

    @app.route('/clientes/<cpf>', methods=['GET'])
    def exibir_cliente(cpf):
        return ClienteController.exibir_cliente(cpf)

    @app.route('/clienteslogin', methods=['POST', 'OPTIONS'])
    def login_cliente():
        if request.method == 'OPTIONS':
            return ('', 204)
        dados = request.get_json(silent=True) or {}
        return ClienteController.login_cliente(dados.get('email'), dados.get('senha'))

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
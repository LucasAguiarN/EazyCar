from flask import jsonify, make_response, request
from Backend.Controllers.cliente_controller import ClienteController

def configurar_rotas(app):
    
    @app.route('/', methods=['GET'])
    def health():
        return make_response(jsonify({
            "mensagem": "API - OK; Docker - Up",
        }), 200)

    @app.route('/clientes', methods=['POST'])
    def cadastrar_cliente():
        return ClienteController.cadastar_cliente()

    @app.route('/clientes', methods=['GET'])
    def listar_clientes():
        return ClienteController.listar_clientes()

    @app.route('/clientes/<cpf>', methods=['GET'])
    def exibir_cliente(cpf):
        return ClienteController.exibir_cliente(cpf)
    
    @app.route('/clientes/login', methods=['POST'])
    def login_cliente():
        dados = request.get_json(silent=True) or {}
        return ClienteController.login_cliente(dados.get('email'), dados.get('senha'))
    
    @app.route('/clientes/conta', methods=['PUT'])
    def atualizar_cliente():
        return ClienteController.atualizar_cliente()
    
    @app.route('/clientes/conta', methods=['DELETE'])
    def deletar_cliente():
        return ClienteController.deletar_cliente()
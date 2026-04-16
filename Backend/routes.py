from flask import jsonify, make_response, request
from Backend.Controllers.cliente_controller import ClienteController
from Backend.Controllers.funcionario_controller import FuncionarioController
from Backend.Controllers.veiculo_controller import VeiculoController

def configurar_rotas(app):
    
    @app.route('/', methods=['GET'])
    def health():
        return make_response(jsonify({
            "mensagem": "API - OK; Docker - Up",
        }), 200)

    ## Cliente
    @app.route('/clientes', methods=['POST'])
    def cadastrar_cliente():
        return ClienteController.cadastar_cliente()

    @app.route('/clientes', methods=['GET'])
    def listar_clientes():
        return ClienteController.listar_clientes()
    
    @app.route('/veiculos/disponiveis', methods=['GET'])
    def listar_veiculos_disponiveis():
        return VeiculoController.listar_veiculos_disponiveis()

    @app.route('/clientes/login', methods=['POST'])
    def login_cliente():
        dados = request.get_json(silent=True) or {}
        return ClienteController.login_cliente(dados.get('email'), dados.get('senha'))
    
    @app.route('/clientes/conta', methods=['GET'])
    def exibir_cliente():
        return ClienteController.exibir_cliente()
    
    @app.route('/clientes/conta', methods=['PUT'])
    def atualizar_cliente():
        return ClienteController.atualizar_cliente()
    
    @app.route('/clientes/conta', methods=['DELETE'])
    def deletar_cliente():
        return ClienteController.deletar_cliente()
    
    ## Funcionário
    @app.route('/funcionarios', methods=['POST'])
    def cadastrar_funcionario():
        return FuncionarioController.cadastar_funcionario()

    @app.route('/funcionarios', methods=['GET'])
    def listar_funcionarios():
        return FuncionarioController.listar_funcionarios()
    
    @app.route('/funcionarios/login', methods=['POST'])
    def login_funcionario():
        dados = request.get_json(silent=True) or {}
        return FuncionarioController.login_funcionario(dados.get('email'), dados.get('senha'))

    @app.route('/funcionarios/conta', methods=['GET'])
    def exibir_funcionario():
        return FuncionarioController.exibir_funcionario()

    @app.route('/funcionarios/conta', methods=['PUT'])
    def atualizar_funcionario():
        return FuncionarioController.atualizar_funcionario()

    @app.route('/funcionarios/conta', methods=['DELETE'])
    def deletar_funcionario():
        return FuncionarioController.deletar_funcionario()

    ## Veículos (Empresa/Funcionário)
    @app.route('/veiculos', methods=['POST'])
    def cadastrar_veiculo():
        return VeiculoController.cadastrar_veiculo()

    @app.route('/veiculos', methods=['GET'])
    def listar_veiculos():
        return VeiculoController.listar_veiculos()

    @app.route('/veiculos/<int:veiculo_id>', methods=['GET'])
    def obter_veiculo(veiculo_id):
        return VeiculoController.obter_veiculo(veiculo_id)

    @app.route('/veiculos/<int:veiculo_id>', methods=['PUT'])
    def atualizar_veiculo(veiculo_id):
        return VeiculoController.atualizar_veiculo(veiculo_id)

    @app.route('/veiculos/<int:veiculo_id>', methods=['DELETE'])
    def deletar_veiculo(veiculo_id):
        return VeiculoController.deletar_veiculo(veiculo_id)
from flask import jsonify, make_response, request
from Backend.Controllers.cliente_controller import ClienteController
from Backend.Controllers.funcionario_controller import FuncionarioController
from Backend.Controllers.veiculo_controller import VeiculoController
from Backend.Controllers.reserva_controller import ReservaController
from Backend.Controllers.assinatura_controller import AssinaturaController
from Backend.Controllers.pontos_controller import PontosController
from Backend.Controllers.avaliacao_controller import AvaliacaoController

def configurar_rotas(app):
    
    @app.route('/', methods=['GET'])
    def health():
        return make_response(jsonify({
            "mensagem": "API - OK; Docker - Up",
        }), 200)

    ## Cliente
    @app.route('/clientes', methods=['POST'])
    def cadastrar_cliente():
        return ClienteController.cadastrar_cliente()

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

    ## Reservas
    @app.route('/reservas', methods=['POST'])
    def criar_reserva():
        return ReservaController.criar_reserva()

    @app.route('/reservas/minhas', methods=['GET'])
    def listar_minhas_reservas():
        return ReservaController.listar_minhas_reservas()

    @app.route('/reservas/<int:reserva_id>/check-in', methods=['POST'])
    def check_in_reserva(reserva_id):
        return ReservaController.check_in_reserva(reserva_id)

    @app.route('/reservas/<int:reserva_id>/check-out', methods=['POST'])
    def check_out_reserva(reserva_id):
        return ReservaController.check_out_reserva(reserva_id)

    ## Assinaturas
    @app.route('/assinaturas', methods=['POST'])
    def criar_assinatura():
        return AssinaturaController.criar_assinatura()

    @app.route('/assinaturas/minha', methods=['GET'])
    def minha_assinatura():
        return AssinaturaController.minha_assinatura()
    
    ## Relatórios
    @app.route('/relatorios/receitas', methods=['GET'])
    def relatorio_receitas():
        return ReservaController.relatorio_receitas()

    ## Avaliação pós-locação
    @app.route('/reservas/<int:reserva_id>/avaliacao', methods=['POST'])
    def criar_avaliacao(reserva_id):
        return AvaliacaoController.criar_avaliacao(reserva_id)

    @app.route('/veiculos/<int:veiculo_id>/avaliacoes', methods=['GET'])
    def listar_avaliacoes_veiculo(veiculo_id):
        return AvaliacaoController.listar_avaliacoes_veiculo(veiculo_id)

    ## Fidelidade
    @app.route('/fidelidade/regras', methods=['GET'])
    def regras_fidelidade():
        return PontosController.regras()

    @app.route('/clientes/pontos', methods=['GET'])
    def extrato_pontos():
        return PontosController.extrato()

    @app.route('/clientes/pontos/resgatar', methods=['POST'])
    def resgatar_pontos():
        return PontosController.resgatar()
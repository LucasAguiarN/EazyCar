from flask import jsonify, request
from sqlalchemy import or_
from werkzeug.security import check_password_hash, generate_password_hash
from Backend.Models.data_base import db
from Backend.Models.cliente import Cliente

class ClienteController:

    @staticmethod
    def cadastar_cliente():
        dados = request.get_json(silent=True) or {}

        nome = dados.get("nome")
        cpf = dados.get("cpf")
        email = dados.get("email")
        senha = dados.get("senha")
        celular = dados.get("celular")
        cep = dados.get("cep")
        endereco = dados.get("endereco")
        numero = dados.get("numero")
        complemento = dados.get("complemento")

        campos_obrigatorios = [nome, cpf, email, senha, celular, cep, endereco, numero]
        if any(c is None or (isinstance(c, str) and not c.strip()) for c in campos_obrigatorios):
            return jsonify({"mensagem": "Formulário incompleto!"}), 400

        cliente_existente = Cliente.query.filter(or_(Cliente.cpf == cpf, Cliente.email == email)).first()
        if cliente_existente:
            return jsonify({"mensagem": "CPF ou email já cadastrado!"}), 409

        try:
            novo_cliente = Cliente(
                nome=nome,
                cpf=cpf,
                email=email,
                senha=generate_password_hash(senha),
                celular=celular,
                cep=cep,
                endereco=endereco,
                numero=int(numero),
                complemento=complemento,
            )

            db.session.add(novo_cliente)
            db.session.commit()
        except Exception:
            db.session.rollback()
            return jsonify({"mensagem": "Erro ao cadastrar cliente."}), 500

        return jsonify({"mensagem": "Cadastro realizado com sucesso!"}), 201
    
    @staticmethod
    def exibir_cliente(cpf):
        cliente = Cliente.query.filter_by(cpf=cpf).first()
        if cliente:
            return jsonify(cliente.para_dicionario()), 200
        return jsonify({"mensagem": "CPF não encontrado!"}), 404

    @staticmethod
    def listar_clientes():
        clientes = Cliente.query.order_by(Cliente.id.desc()).all()
        return jsonify([c.para_dicionario() for c in clientes]), 200
        
    @staticmethod
    def login_cliente(email, senha):
        if email is None or senha is None:
            dados = request.get_json(silent=True) or {}
            email = dados.get("email")
            senha = dados.get("senha")

        if not email or not senha:
            return jsonify({"mensagem": "Email e senha são obrigatórios!"}), 400

        cliente = Cliente.query.filter_by(email=email).first()
        if cliente and (
            check_password_hash(cliente.senha, senha) if cliente.senha else False
        ):
            return jsonify({"mensagem": "Login realizado com sucesso!"}), 200

        # Compatibilidade temporária com registros antigos (senha em texto puro).
        if cliente and cliente.senha == senha:
            return jsonify({"mensagem": "Login realizado com sucesso!"}), 200

        return jsonify({"mensagem": "Email ou senha inválidos!"}), 401
        
    @staticmethod
    def deletar_cliente(email):
        cliente = Cliente.query.filter_by(email=email).first()
        if not cliente:
            return jsonify({"mensagem": "Email não cadastrado!"}), 404
        
        db.session.delete(cliente)
        db.session.commit()

        return jsonify({"mensagem": "Conta deletada com sucesso!"}), 200
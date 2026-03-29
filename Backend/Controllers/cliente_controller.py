from flask import jsonify, request, make_response
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy import or_
import bcrypt
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

        hashed_password = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt())
        try:
            novo_cliente = Cliente(
                nome=nome,
                cpf=cpf,
                email=email,
                senha=hashed_password,
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
        if cliente and bcrypt.checkpw(senha.encode('utf-8'), cliente.senha.encode('utf-8')):
            token = create_access_token(identity=str(cliente.id))
            return make_response(jsonify({
                "mensagem": "Login realizado com sucesso",
                "token": token
        }), 200)

        return jsonify({"mensagem": "Email ou senha inválidos!"}), 401

    @jwt_required()
    @staticmethod
    def atualizar_cliente():
        current_id = int(get_jwt_identity())
        cliente = Cliente.query.filter_by(id=current_id).first()
        if not cliente:
            return jsonify({"mensagem": "Cliente não encontrado!"}), 404

        dados = request.get_json(silent=True) or {}
        cliente.nome = dados.get('nome', cliente.nome)
        cliente.cpf = dados.get('cpf', cliente.cpf) 
        cliente.email = dados.get('email', cliente.email)
        cliente.celular = dados.get('celular', cliente.celular)
        cliente.cep = dados.get("cep", cliente.cep)
        cliente.endereco = dados.get("endereco", cliente.endereco)
        cliente.numero = dados.get("numero", cliente.numero)
        cliente.complemento = dados.get("complemento", cliente.complemento)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            return jsonify({"mensagem": "Erro ao atualizar cliente."}), 500

        return jsonify({"mensagem": "Cliente atualizado com sucesso!"}), 200

    @jwt_required()
    @staticmethod
    def deletar_cliente():
        current_id = int(get_jwt_identity())
        cliente = Cliente.query.filter_by(id=current_id).first()
        if not cliente:
            return jsonify({"mensagem": "Cliente não encontrado!"}), 404
        
        db.session.delete(cliente)
        db.session.commit()

        return jsonify({"mensagem": "Conta deletada com sucesso!"}), 200
from flask import jsonify, request, make_response
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy import or_
import bcrypt
from Backend.Models.data_base import db
from Backend.Models.funcionario import Funcionario

class FuncionarioController:

    @staticmethod
    def cadastar_funcionario():
        dados = request.get_json(silent=True) or {}

        nome = dados.get("nome")
        cpf = dados.get("cpf")
        email = dados.get("email")
        senha = dados.get("senha")
        celular = dados.get("celular")
        cargo = dados.get("cargo")

        campos_obrigatorios = [nome, cpf, email, senha, celular, cargo]
        if any(c is None or (isinstance(c, str) and not c.strip()) for c in campos_obrigatorios):
            return jsonify({"mensagem": "Formulário incompleto!"}), 400

        funcionario_existente = Funcionario.query.filter(or_(Funcionario.cpf == cpf, Funcionario.email == email)).first()
        if funcionario_existente:
            return jsonify({"mensagem": "CPF ou email já cadastrado!"}), 409

        hashed_password = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt())
        try:
            novo_funcionario = Funcionario(
                nome=nome,
                cpf=cpf,
                email=email,
                senha=hashed_password,
                celular=celular,
                cargo=cargo
            )

            db.session.add(novo_funcionario)
            db.session.commit()
        except Exception:
            db.session.rollback()
            return jsonify({"mensagem": "Erro ao cadastrar funcionário."}), 500

        return jsonify({"mensagem": "Cadastro realizado com sucesso!"}), 201
    
    @jwt_required()
    @staticmethod
    def exibir_funcionario():
        current_id = int(get_jwt_identity())
        funcionario = Funcionario.query.filter_by(id=current_id).first()
        if funcionario:
            return jsonify(funcionario.para_dicionario()), 200
        return jsonify({"mensagem": "Funcionário não encontrado!"}), 404

    @staticmethod
    def listar_funcionarios():
        funcionarios = Funcionario.query.order_by(Funcionario.id.desc()).all()
        return jsonify([f.para_dicionario() for f in funcionarios]), 200

    @staticmethod
    def login_funcionario(email, senha):
        if email is None or senha is None:
            dados = request.get_json(silent=True) or {}
            email = dados.get("email")
            senha = dados.get("senha")

        if not email or not senha:
            return jsonify({"mensagem": "Email e senha são obrigatórios!"}), 400

        funcionario = Funcionario.query.filter_by(email=email).first()
        if funcionario and bcrypt.checkpw(senha.encode('utf-8'), funcionario.senha.encode('utf-8')):
            token = create_access_token(identity=str(funcionario.id))
            return make_response(jsonify({
                "mensagem": "Login realizado com sucesso",
                "token": token
        }), 200)

        return jsonify({"mensagem": "Email ou senha inválidos!"}), 401

    @jwt_required()
    @staticmethod
    def atualizar_funcionario():
        current_id = int(get_jwt_identity())
        funcionario = Funcionario.query.filter_by(id=current_id).first()
        if not funcionario:
            return jsonify({"mensagem": "Funcionário não encontrado!"}), 404

        dados = request.get_json(silent=True) or {}
        funcionario.nome = dados.get('nome', funcionario.nome)
        funcionario.cpf = dados.get('cpf', funcionario.cpf) 
        funcionario.email = dados.get('email', funcionario.email)
        funcionario.celular = dados.get('celular', funcionario.celular)
        funcionario.cargo = dados.get('cargo', funcionario.cargo)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            return jsonify({"mensagem": "Erro ao atualizar funcionário."}), 500

        return jsonify({"mensagem": "Funcionário atualizado com sucesso!"}), 200

    @jwt_required()
    @staticmethod
    def deletar_funcionario():
        current_id = int(get_jwt_identity())
        funcionario = Funcionario.query.filter_by(id=current_id).first()
        if not funcionario:
            return jsonify({"mensagem": "Funcionário não encontrado!"}), 404
        
        db.session.delete(funcionario)
        db.session.commit()

        return jsonify({"mensagem": "Conta deletada com sucesso!"}), 200
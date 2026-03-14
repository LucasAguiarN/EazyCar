from flask import jsonify, request
from Models.data_base import db
from Models.cliente import Cliente

class ClienteController:

    @staticmethod
    def cadastar_cliente():
        dados = request.json

        nome = dados.get['nome']
        cpf = dados.get['cpf']
        email = dados.get['email']
        senha = dados.get['senha']
        celular = dados.get['celular']
        cep = dados.get['cep']
        endereco = dados.get['endereco']
        numero = dados.get['numero']
        complemento = dados.get['complemento']

        if not nome or not cpf or not email or not senha or not celular or not cep or not endereco or not numero:
            return jsonify({"error": "Formulário incompleto!"}), 400
        
        registro_clientes = Cliente.query.filter_by(cpf=cpf)
        if not registro_clientes:
            return jsonify({"erro": "CPF já Cadastrado!"}), 409
        
        novo_cliente = Cliente(
            nome = nome,
            cpf = cpf,
            email = email,
            senha = senha,
            celular = celular,
            cep = cep,
            endereco = endereco,
            numero = numero,
            complemento = complemento
        )

        db.session.add(novo_cliente)
        db.session.commit()

        return jsonify({"mensagem": "Cadastro realizado com Sucesso!"}), 201
    
    def exibir_cliente(email):
        cliente = Cliente.query.filter_by(cpf=cpf).first()
        if cliente:
            return jsonify(cliente.para_dicionario()), 200
        else:
            return jsonify({"erro": "CPF não encontrado!"})
        
    def login_cliente(email, senha):
        cliente = Cliente.query.filter_by(email=email).first()
        if cliente and cliente.senha == senha:
                return jsonify({"mensagem": "Login realizado com sucesso!"}), 200
        else:
            return jsonify({"erro": "Email ou senha inválidos!"}), 401
        
    def deletar_cliente(email):
        cliente = Cliente.query.filter_by(email=email).first()
        if not cliente:
            return jsonify({"erro": "Email não cadastrado!"}), 404
        
        db.session.delete(cliente)
        db.session.commit()

        return jsonify({"mensagem": "Conta deletada com sucesso!"}), 200
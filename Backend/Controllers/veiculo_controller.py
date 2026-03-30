from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from Backend.Models.data_base import db
from Backend.Models.veiculo import Veiculo


class VeiculoController:
    @jwt_required()
    @staticmethod
    def cadastrar_veiculo():
        funcionario_id = int(get_jwt_identity())
        dados = request.get_json(silent=True) or {}

        marca = (dados.get("marca") or "").strip()
        modelo = (dados.get("modelo") or "").strip()
        placa = (dados.get("placa") or "").strip().upper()
        status = (dados.get("status") or "Available").strip()
        ano = dados.get("ano")

        if not marca or not modelo or not placa or ano is None:
            return jsonify({"mensagem": "Formulário incompleto!"}), 400

        try:
            ano_int = int(ano)
        except Exception:
            return jsonify({"mensagem": "Ano inválido!"}), 400

        if ano_int < 1900 or ano_int > 2100:
            return jsonify({"mensagem": "Ano inválido!"}), 400

        status_validos = {"Available", "Rented", "Maintenance"}
        if status not in status_validos:
            return jsonify({"mensagem": "Status inválido!"}), 400

        existente = Veiculo.query.filter_by(placa=placa).first()
        if existente:
            return jsonify({"mensagem": "Placa já cadastrada!"}), 409

        try:
            veiculo = Veiculo(
                funcionario_id=funcionario_id,
                marca=marca,
                modelo=modelo,
                ano=ano_int,
                placa=placa,
                status=status,
            )
            db.session.add(veiculo)
            db.session.commit()
        except Exception:
            db.session.rollback()
            return jsonify({"mensagem": "Erro ao cadastrar veículo."}), 500

        return jsonify({"mensagem": "Veículo cadastrado com sucesso!", "veiculo": veiculo.para_dicionario()}), 201

    @jwt_required()
    @staticmethod
    def listar_veiculos():
        # Frota global: todos os funcionários enxergam todos os veículos.
        veiculos = Veiculo.query.order_by(Veiculo.id.desc()).all()
        return jsonify([v.para_dicionario() for v in veiculos]), 200

    @jwt_required()
    @staticmethod
    def obter_veiculo(veiculo_id: int):
        veiculo = Veiculo.query.filter_by(id=int(veiculo_id)).first()
        if not veiculo:
            return jsonify({"mensagem": "Veículo não encontrado!"}), 404
        return jsonify(veiculo.para_dicionario()), 200

    @jwt_required()
    @staticmethod
    def atualizar_veiculo(veiculo_id: int):
        veiculo = Veiculo.query.filter_by(id=int(veiculo_id)).first()
        if not veiculo:
            return jsonify({"mensagem": "Veículo não encontrado!"}), 404

        dados = request.get_json(silent=True) or {}

        if "marca" in dados and dados.get("marca") is not None:
            veiculo.marca = str(dados.get("marca")).strip()
        if "modelo" in dados and dados.get("modelo") is not None:
            veiculo.modelo = str(dados.get("modelo")).strip()
        if "ano" in dados and dados.get("ano") is not None:
            try:
                veiculo.ano = int(dados.get("ano"))
            except Exception:
                return jsonify({"mensagem": "Ano inválido!"}), 400
        if "placa" in dados and dados.get("placa") is not None:
            nova_placa = str(dados.get("placa")).strip().upper()
            if not nova_placa:
                return jsonify({"mensagem": "Placa inválida!"}), 400
            if nova_placa != veiculo.placa:
                existente = Veiculo.query.filter_by(placa=nova_placa).first()
                if existente:
                    return jsonify({"mensagem": "Placa já cadastrada!"}), 409
                veiculo.placa = nova_placa
        if "status" in dados and dados.get("status") is not None:
            status = str(dados.get("status")).strip()
            status_validos = {"Available", "Rented", "Maintenance"}
            if status not in status_validos:
                return jsonify({"mensagem": "Status inválido!"}), 400
            veiculo.status = status

        if not veiculo.marca or not veiculo.modelo or not veiculo.placa:
            return jsonify({"mensagem": "Formulário incompleto!"}), 400

        if veiculo.ano < 1900 or veiculo.ano > 2100:
            return jsonify({"mensagem": "Ano inválido!"}), 400

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            return jsonify({"mensagem": "Erro ao atualizar veículo."}), 500

        return jsonify({"mensagem": "Veículo atualizado com sucesso!", "veiculo": veiculo.para_dicionario()}), 200

    @jwt_required()
    @staticmethod
    def deletar_veiculo(veiculo_id: int):
        veiculo = Veiculo.query.filter_by(id=int(veiculo_id)).first()
        if not veiculo:
            return jsonify({"mensagem": "Veículo não encontrado!"}), 404

        try:
            db.session.delete(veiculo)
            db.session.commit()
        except Exception:
            db.session.rollback()
            return jsonify({"mensagem": "Erro ao deletar veículo."}), 500

        return jsonify({"mensagem": "Veículo deletado com sucesso!"}), 200


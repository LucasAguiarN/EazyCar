from flask import jsonify, request

from Backend.Models.data_base import db
from Backend.Models.veiculo import Veiculo
from Backend.decorators import funcionario_required


class VeiculoController:
    COMBUSTIVEIS_VALIDOS  = {"Gasolina", "Etanol", "Diesel", "Flex", "Elétrico"}
    TRANSMISSOES_VALIDAS  = {"Manual", "Automático"}
    CATEGORIAS_VALIDAS    = {"Econômico", "Executivo", "SUV", "Van"}

    @funcionario_required
    @staticmethod
    def cadastrar_veiculo():
        dados = request.get_json(silent=True) or {}

        marca   = (dados.get("marca")   or "").strip()
        modelo  = (dados.get("modelo")  or "").strip()
        placa   = (dados.get("placa")   or "").strip().upper()
        status  = (dados.get("status")  or "Available").strip()
        ano     = dados.get("ano")
        cor         = (dados.get("cor")        or "").strip() or None
        combustivel = (dados.get("combustivel") or "").strip() or None
        transmissao = (dados.get("transmissao") or "").strip() or None
        categoria   = (dados.get("categoria")   or "").strip() or None
        valor_diaria = dados.get("valor_diaria")

        if not marca or not modelo or not placa or ano is None or valor_diaria is None:
            return jsonify({"mensagem": "Formulário incompleto!"}), 400

        try:
            ano_int = int(ano)
        except Exception:
            return jsonify({"mensagem": "Ano inválido!"}), 400

        if ano_int < 1900 or ano_int > 2100:
            return jsonify({"mensagem": "Ano inválido!"}), 400

        try:
            valor_diaria = float(valor_diaria)
            if valor_diaria <= 0:
                raise ValueError
        except (ValueError, TypeError):
            return jsonify({"mensagem": "Valor da diária inválido!"}), 400

        if status not in {"Available", "Rented", "Maintenance"}:
            return jsonify({"mensagem": "Status inválido!"}), 400
        if combustivel and combustivel not in VeiculoController.COMBUSTIVEIS_VALIDOS:
            return jsonify({"mensagem": "Combustível inválido!"}), 400
        if transmissao and transmissao not in VeiculoController.TRANSMISSOES_VALIDAS:
            return jsonify({"mensagem": "Transmissão inválida!"}), 400
        if categoria and categoria not in VeiculoController.CATEGORIAS_VALIDAS:
            return jsonify({"mensagem": "Categoria inválida!"}), 400

        if Veiculo.query.filter_by(placa=placa).first():
            return jsonify({"mensagem": "Placa já cadastrada!"}), 409

        try:
            veiculo = Veiculo(
                marca=marca,
                modelo=modelo,
                ano=ano_int,
                placa=placa,
                cor=cor,
                combustivel=combustivel,
                transmissao=transmissao,
                categoria=categoria,
                valor_diaria=valor_diaria,
                status=status,
            )
            db.session.add(veiculo)
            db.session.commit()
        except Exception:
            db.session.rollback()
            return jsonify({"mensagem": "Erro ao cadastrar veículo."}), 500

        return jsonify({"mensagem": "Veículo cadastrado com sucesso!", "veiculo": veiculo.para_dicionario()}), 201

    @funcionario_required
    @staticmethod
    def listar_veiculos():
        veiculos = Veiculo.query.order_by(Veiculo.id.desc()).all()
        return jsonify([v.para_dicionario() for v in veiculos]), 200

    @funcionario_required
    @staticmethod
    def obter_veiculo(veiculo_id: int):
        veiculo = Veiculo.query.filter_by(id=int(veiculo_id)).first()
        if not veiculo:
            return jsonify({"mensagem": "Veículo não encontrado!"}), 404
        return jsonify(veiculo.para_dicionario()), 200

    @funcionario_required
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
            if status not in {"Available", "Rented", "Maintenance"}:
                return jsonify({"mensagem": "Status inválido!"}), 400
            veiculo.status = status

        if "cor" in dados:
            veiculo.cor = (dados.get("cor") or "").strip() or None
        if "combustivel" in dados and dados.get("combustivel") is not None:
            c = str(dados.get("combustivel")).strip()
            if c and c not in VeiculoController.COMBUSTIVEIS_VALIDOS:
                return jsonify({"mensagem": "Combustível inválido!"}), 400
            veiculo.combustivel = c or None
        if "transmissao" in dados and dados.get("transmissao") is not None:
            t = str(dados.get("transmissao")).strip()
            if t and t not in VeiculoController.TRANSMISSOES_VALIDAS:
                return jsonify({"mensagem": "Transmissão inválida!"}), 400
            veiculo.transmissao = t or None
        if "categoria" in dados and dados.get("categoria") is not None:
            cat = str(dados.get("categoria")).strip()
            if cat and cat not in VeiculoController.CATEGORIAS_VALIDAS:
                return jsonify({"mensagem": "Categoria inválida!"}), 400
            veiculo.categoria = cat or None
        if "valor_diaria" in dados and dados.get("valor_diaria") is not None:
            try:
                vd = float(dados.get("valor_diaria"))
                if vd <= 0:
                    raise ValueError
                veiculo.valor_diaria = vd
            except (ValueError, TypeError):
                return jsonify({"mensagem": "Valor da diária inválido!"}), 400

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

    @funcionario_required
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
    


    @staticmethod
    def listar_veiculos_disponiveis():
        veiculos = Veiculo.query.filter_by(status="Available").all()
        return jsonify([v.para_dicionario() for v in veiculos]), 200
    



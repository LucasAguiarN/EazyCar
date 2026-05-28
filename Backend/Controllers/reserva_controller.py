from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from datetime import datetime
from Backend.Models.data_base import db
from Backend.Models.reserva import Reserva
from Backend.Models.veiculo import Veiculo
from Backend.decorators import cliente_required

class ReservaController:
    @cliente_required
    @staticmethod
    def criar_reserva():
        cliente_id = int(get_jwt_identity())
        dados = request.get_json(silent=True) or {}

        veiculo_id = dados.get("veiculo_id")
        data_retirada_str = dados.get("data_retirada")
        data_devolucao_str = dados.get("data_devolucao")
        local_retirada = dados.get("local_retirada")
        local_devolucao = dados.get("local_devolucao")

        if not veiculo_id or not data_retirada_str or not data_devolucao_str or not local_retirada or not local_devolucao:
            return jsonify({"mensagem": "Dados incompletos!"}), 400

        try:
            data_retirada = datetime.strptime(data_retirada_str, "%Y-%m-%d").date()
            data_devolucao = datetime.strptime(data_devolucao_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"mensagem": "Formato de data inválido."}), 400

        dias = (data_devolucao - data_retirada).days
        if dias <= 0:
            return jsonify({"mensagem": "A devolução deve ser posterior à retirada."}), 400

        veiculo = Veiculo.query.filter_by(id=veiculo_id, status="Available").first()
        if not veiculo:
            return jsonify({"mensagem": "Veículo indisponível ou não encontrado."}), 404

        valor_diaria = 150.00 
        valor_total = dias * valor_diaria

        try:
            nova_reserva = Reserva(
                cliente_id=cliente_id,
                veiculo_id=veiculo_id,
                local_retirada=local_retirada,     
                local_devolucao=local_devolucao,  
                data_retirada=data_retirada,
                data_devolucao=data_devolucao,
                valor_total=valor_total
            )
            db.session.add(nova_reserva)
            veiculo.status = "Rented"
            db.session.commit()

            return jsonify({
                "mensagem": "Reserva realizada com sucesso!",
                "reserva": nova_reserva.to_dict()
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({"mensagem": "Erro interno ao processar reserva."}), 500

    @cliente_required
    @staticmethod
    def listar_minhas_reservas():
        cliente_id = int(get_jwt_identity())

        reservas = Reserva.query.filter_by(cliente_id=cliente_id).order_by(Reserva.id.desc()).all()
        
        resultado = []
        for r in reservas:
            veiculo = Veiculo.query.filter_by(id=r.veiculo_id).first()
            dados_reserva = r.to_dict()
            if veiculo:
                dados_reserva['veiculo_nome'] = f"{veiculo.marca} {veiculo.modelo}"
                dados_reserva['veiculo_placa'] = veiculo.placa
            else:
                dados_reserva['veiculo_nome'] = "Veículo Indisponível"
                dados_reserva['veiculo_placa'] = "---"
                
            resultado.append(dados_reserva)
            
        return jsonify(resultado), 200

    @cliente_required
    @staticmethod
    def check_in_reserva(reserva_id):
        """
        Realiza o check-in de uma reserva (retirada do veículo)
        """
        cliente_id = int(get_jwt_identity())
        try:
            reserva = Reserva.query.filter_by(id=reserva_id, cliente_id=cliente_id).first()
            if not reserva:
                return jsonify({"mensagem": "Reserva não encontrada ou acesso não autorizado."}), 404

            if reserva.status != "Active":
                return jsonify({"mensagem": f"Apenas reservas com status 'Active' podem fazer check-in. Status atual: {reserva.status}"}), 400

            reserva.data_hora_check_in = datetime.now()
            reserva.status = "Em Uso"

            db.session.commit()

            return jsonify({"mensagem": "Check-in realizado com sucesso!", "reserva": reserva.to_dict()}), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"mensagem": f"Erro ao realizar check-in: {str(e)}"}), 500

    @cliente_required
    @staticmethod
    def check_out_reserva(reserva_id):
        """
        Realiza o check-out de uma reserva (devolução do veículo)
        """
        cliente_id = int(get_jwt_identity())
        try:
            reserva = Reserva.query.filter_by(id=reserva_id, cliente_id=cliente_id).first()
            if not reserva:
                return jsonify({"mensagem": "Reserva não encontrada ou acesso não autorizado."}), 404

            if reserva.status != "Em Uso":
                return jsonify({"mensagem": f"Apenas reservas em uso podem fazer check-out. Status atual: {reserva.status}"}), 400

            reserva.data_hora_check_out = datetime.now()
            reserva.status = "Concluído"

            veiculo = Veiculo.query.filter_by(id=reserva.veiculo_id).first()
            if veiculo:
                veiculo.status = "Available"

            db.session.commit()

            return jsonify({"mensagem": "Check-out realizado com sucesso!", "reserva": reserva.to_dict()}), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"mensagem": f"Erro ao realizar check-out: {str(e)}"}), 500
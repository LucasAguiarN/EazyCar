from flask import request, jsonify, make_response
from flask_jwt_extended import get_jwt_identity
import uuid

from Backend.Models.data_base import db
from Backend.Models.pagamento import Pagamento
from Backend.Models.reserva import Reserva

from Backend.decorators import cliente_required 

class PagamentoController:
    
    @staticmethod
    @cliente_required
    def processar_pagamento_reserva(reserva_id):
        cliente_id = int(get_jwt_identity())
        dados = request.get_json(silent=True) or {}
        metodo_pagamento = dados.get('metodo_pagamento', 'CARTAO_CREDITO')
        
        reserva = Reserva.query.filter_by(id=reserva_id, cliente_id=cliente_id).first()
        if not reserva:
            return make_response(jsonify({"erro": "Reserva não encontrada."}), 404)

        if reserva.status != 'Inactive':
            return make_response(jsonify({"erro": f"Reserva não está aguardando pagamento. Status atual: {reserva.status}"}), 400)

        pagamento = Pagamento.query.filter_by(reserva_id=reserva.id, status='Pendente').first()
        if not pagamento:
            return make_response(jsonify({"erro": "Nenhum pagamento pendente encontrado para esta reserva."}), 404)

        try:
            pagamento.status = 'Aprovado'
            pagamento.metodo_pagamento = metodo_pagamento
            
            if metodo_pagamento == 'CARTAO_CREDITO':
                pagamento.codigo_pix = None
            else:
                pagamento.codigo_pix = f"00020126360014BR.GOV.BCB.PIX{uuid.uuid4().hex[:12].upper()}"
            reserva.status = 'Active'
            db.session.commit()
            
            return make_response(jsonify({
                "mensagem": "Pagamento aprovado com sucesso!",
                "reserva_id": reserva.id,
                "pagamento_id": pagamento.id,
                "valor_pago": pagamento.valor
            }), 200)
            
        except Exception as e:
            db.session.rollback()
            return make_response(jsonify({"erro": f"Erro ao processar pagamento: {str(e)}"}), 500)

    @staticmethod
    @cliente_required
    def listar_pagamentos():
        cliente_id = int(get_jwt_identity())
        pagamentos = db.session.query(Pagamento).join(Reserva).filter(Reserva.cliente_id == cliente_id).all()
        
        resultado = [{
            "id": p.id,
            "reserva_id": p.reserva_id,
            "valor": float(p.valor),
            "status": p.status,
            "metodo_pagamento": p.metodo_pagamento,
            "data_criacao": p.data_criacao.strftime('%Y-%m-%d %H:%M:%S') if p.data_criacao else None
        } for p in pagamentos]
        return make_response(jsonify(resultado), 200)
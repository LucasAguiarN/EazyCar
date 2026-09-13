from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from datetime import date, timedelta

from Backend.Models.data_base import db
from Backend.Models.assinatura import Assinatura
from Backend.decorators import cliente_required


class AssinaturaController:

    @cliente_required
    @staticmethod
    def criar_assinatura():
        cliente_id = int(get_jwt_identity())

        # Verifica se o cliente já possui uma assinatura ativa
        assinatura_existente = Assinatura.query.filter_by(
            cliente_id=cliente_id,
            status="Ativa"
        ).first()

        if assinatura_existente:
            return jsonify({
                "mensagem": "Cliente já possui uma assinatura ativa."
            }), 409

        data_inicio = date.today()
        data_fim = data_inicio + timedelta(days=30)

        nova_assinatura = Assinatura(
            cliente_id=cliente_id,
            plano="Mensal",
            valor_mensal=299.90,
            data_inicio=data_inicio,
            data_fim=data_fim,
            status="Ativa"
        )

        try:
            db.session.add(nova_assinatura)
            db.session.commit()

            return jsonify({
                "mensagem": "Assinatura realizada com sucesso!",
                "assinatura": nova_assinatura.to_dict()
            }), 201

        except Exception:
            db.session.rollback()

            return jsonify({
                "mensagem": "Erro interno ao criar assinatura."
            }), 500

    @cliente_required
    @staticmethod
    def minha_assinatura():
        cliente_id = int(get_jwt_identity())

        assinatura = Assinatura.query.filter_by(
            cliente_id=cliente_id,
            status="Ativa"
        ).order_by(
            Assinatura.id.desc()
        ).first()

        if not assinatura:
            return jsonify({
                "mensagem": "Cliente não possui assinatura ativa.",
                "assinatura": None
            }), 404

        # Verifica se a assinatura venceu
        if assinatura.data_fim and assinatura.data_fim < date.today():
            assinatura.status = "Expirada"
            db.session.commit()

            return jsonify({
                "mensagem": "A assinatura está expirada.",
                "assinatura": assinatura.to_dict()
            }), 200

        return jsonify({
            "assinatura": assinatura.to_dict()
        }), 200
    
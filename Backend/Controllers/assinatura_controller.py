from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from datetime import date, timedelta

from Backend.Models.data_base import db
from Backend.Models.assinatura import Assinatura
from Backend.decorators import cliente_required


PLANOS = {
    "Essencial": 299.90,
    "Plus": 499.90,
    "Premium": 799.90
}


def atualizar_vencimento(assinatura):
    hoje = date.today()

    if not assinatura.data_fim or assinatura.data_fim >= hoje:
        return

    if assinatura.renovacao_automatica:
        while assinatura.data_fim < hoje:
            assinatura.data_fim += timedelta(days=30)
        assinatura.status = "Ativa"
    else:
        assinatura.status = "Expirada"

    db.session.commit()


class AssinaturaController:

    @cliente_required
    @staticmethod
    def criar_assinatura():
        cliente_id = int(get_jwt_identity())
        dados = request.get_json(silent=True) or {}

        plano = dados.get("plano", "Essencial")
        if plano not in PLANOS:
            return jsonify({"mensagem": "Plano inválido."}), 400

        try:
            duracao_dias = int(dados.get("duracao_dias", 30))
        except (TypeError, ValueError):
            return jsonify({"mensagem": "A duração da assinatura deve ser um número inteiro."}), 400

        if duracao_dias < 30:
            return jsonify({"mensagem": "A assinatura deve ter duração mínima de 30 dias."}), 400

        assinatura_existente = Assinatura.query.filter_by(
            cliente_id=cliente_id,
            status="Ativa"
        ).order_by(Assinatura.id.desc()).first()

        if assinatura_existente:
            atualizar_vencimento(assinatura_existente)
            if assinatura_existente.status == "Ativa":
                return jsonify({"mensagem": "Cliente já possui uma assinatura ativa."}), 409

        data_inicio = date.today()
        nova_assinatura = Assinatura(
            cliente_id=cliente_id,
            plano=plano,
            valor_mensal=PLANOS[plano],
            data_inicio=data_inicio,
            data_fim=data_inicio + timedelta(days=duracao_dias),
            status="Ativa",
            renovacao_automatica=True
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
            return jsonify({"mensagem": "Erro interno ao criar assinatura."}), 500

    @cliente_required
    @staticmethod
    def minha_assinatura():
        cliente_id = int(get_jwt_identity())

        assinatura = Assinatura.query.filter_by(
            cliente_id=cliente_id,
            status="Ativa"
        ).order_by(Assinatura.id.desc()).first()

        if not assinatura:
            return jsonify({
                "mensagem": "Cliente não possui assinatura ativa.",
                "assinatura": None
            }), 404

        atualizar_vencimento(assinatura)

        if assinatura.status != "Ativa":
            return jsonify({
                "mensagem": "A assinatura está expirada.",
                "assinatura": assinatura.to_dict()
            }), 200

        return jsonify({"assinatura": assinatura.to_dict()}), 200

    @cliente_required
    @staticmethod
    def cancelar_renovacao():
        cliente_id = int(get_jwt_identity())

        assinatura = Assinatura.query.filter_by(
            cliente_id=cliente_id,
            status="Ativa"
        ).order_by(Assinatura.id.desc()).first()

        if not assinatura:
            return jsonify({"mensagem": "Cliente não possui assinatura ativa."}), 404

        atualizar_vencimento(assinatura)
        if assinatura.status != "Ativa":
            return jsonify({"mensagem": "A assinatura já está expirada."}), 400

        assinatura.renovacao_automatica = False
        db.session.commit()

        return jsonify({
            "mensagem": "Renovação automática cancelada. A assinatura continua ativa até o vencimento.",
            "assinatura": assinatura.to_dict()
        }), 200

from .data_base import db
from datetime import date


class Assinatura(db.Model):
    __tablename__ = "assinaturas"

    id = db.Column(db.Integer, primary_key=True)

    cliente_id = db.Column(
        db.Integer,
        db.ForeignKey("clientes.id"),
        nullable=False
    )

    plano = db.Column(
        db.String(50),
        nullable=False,
        default="Mensal"
    )

    valor_mensal = db.Column(
        db.Float,
        nullable=False,
        default=299.90
    )

    data_inicio = db.Column(
        db.Date,
        nullable=False,
        default=date.today
    )

    data_fim = db.Column(
        db.Date,
        nullable=True
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="Ativa"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "cliente_id": self.cliente_id,
            "plano": self.plano,
            "valor_mensal": self.valor_mensal,
            "data_inicio": self.data_inicio.strftime("%Y-%m-%d")
            if self.data_inicio else None,
            "data_fim": self.data_fim.strftime("%Y-%m-%d")
            if self.data_fim else None,
            "status": self.status
        }
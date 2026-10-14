from .data_base import db
from datetime import datetime

class Pagamento(db.Model):
    __tablename__ = 'pagamentos'

    id = db.Column(db.Integer, primary_key=True)
    reserva_id = db.Column(db.Integer, db.ForeignKey("reservas.id"), nullable=False)
    metodo_pagamento = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Pendente') 
    valor = db.Column(db.Numeric(10, 2), nullable=False) 
    codigo_pix = db.Column(db.String(255), nullable=True)
    data_criacao = db.Column(db.DateTime, nullable=False, default=datetime.now)
    data_expiracao = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "reserva_id": self.reserva_id,
            "metodo_pagamento": self.metodo_pagamento,
            "status": self.status,
            "valor": self.valor,
            "data_criacao": self.data_criacao
        }

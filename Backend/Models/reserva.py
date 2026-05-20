from .data_base import db
from datetime import datetime


class Reserva(db.Model):
    __tablename__ = 'reservas'

    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    veiculo_id = db.Column(db.Integer, db.ForeignKey('veiculos.id'), nullable=False)
    local_retirada = db.Column(db.String(150), nullable=False)
    local_devolucao = db.Column(db.String(150), nullable=False)
    data_retirada = db.Column(db.Date, nullable=False)
    data_devolucao = db.Column(db.Date, nullable=False)
    valor_total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="Active")
    data_hora_check_in = db.Column(db.DateTime, nullable=True)
    data_hora_check_out = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'veiculo_id': self.veiculo_id,
            'local_retirada': self.local_retirada,
            'local_devolucao': self.local_devolucao,
            'data_retirada': self.data_retirada.strftime('%Y-%m-%d'),
            'data_devolucao': self.data_devolucao.strftime('%Y-%m-%d'),
            'valor_total': self.valor_total,
            'status': self.status,
            'data_hora_check_in': self.data_hora_check_in.strftime('%Y-%m-%d %H:%M:%S') if self.data_hora_check_in else None,
            'data_hora_check_out': self.data_hora_check_out.strftime('%Y-%m-%d %H:%M:%S') if self.data_hora_check_out else None
        }
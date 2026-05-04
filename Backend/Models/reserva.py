from .data_base import db

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
            'status': self.status
        }
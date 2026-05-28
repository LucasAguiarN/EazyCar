from .data_base import db


class Veiculo(db.Model):
    __tablename__ = "veiculos"

    id = db.Column(db.Integer, primary_key=True)

    funcionario_id = db.Column(
        db.Integer,
        db.ForeignKey("funcionarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    marca        = db.Column(db.String(100), nullable=False)
    modelo       = db.Column(db.String(100), nullable=False)
    ano          = db.Column(db.Integer, nullable=False)
    placa        = db.Column(db.String(10), unique=True, nullable=False, index=True)
    cor          = db.Column(db.String(50), nullable=True)
    combustivel  = db.Column(db.String(20), nullable=True)
    transmissao  = db.Column(db.String(20), nullable=True)
    categoria    = db.Column(db.String(30), nullable=True)
    valor_diaria = db.Column(db.Float, nullable=False, default=150.0)
    status       = db.Column(db.String(20), nullable=False, default="Available")

    def para_dicionario(self):
        return {
            "id":            self.id,
            "funcionario_id": self.funcionario_id,
            "marca":         self.marca,
            "modelo":        self.modelo,
            "ano":           self.ano,
            "placa":         self.placa,
            "cor":           self.cor,
            "combustivel":   self.combustivel,
            "transmissao":   self.transmissao,
            "categoria":     self.categoria,
            "valor_diaria":  self.valor_diaria,
            "status":        self.status,
        }

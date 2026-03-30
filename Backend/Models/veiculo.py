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

    marca = db.Column(db.String(100), nullable=False)
    modelo = db.Column(db.String(100), nullable=False)
    ano = db.Column(db.Integer, nullable=False)
    placa = db.Column(db.String(10), unique=True, nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default="Available")

    def para_dicionario(self):
        return {
            "id": self.id,
            "funcionario_id": self.funcionario_id,
            "marca": self.marca,
            "modelo": self.modelo,
            "ano": self.ano,
            "placa": self.placa,
            "status": self.status,
        }

